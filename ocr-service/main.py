"""Invoice Extractor — OCR microservice.

FastAPI service that performs OCR on invoice images and PDFs.

Engine strategy (in order of preference):
  1. PaddleOCR (paddleocr) — the full framework, best accuracy.
  2. RapidOCR (rapidocr_onnxruntime) — the same PP-OCR models running
     on ONNX Runtime; much lighter to install, used as fallback.
  3. If neither engine is installed, /ocr returns a clear 503 error
     so the API can degrade gracefully.

PDF handling:
  - Text-based PDFs are extracted directly with pdfplumber.
  - Scanned PDFs are rendered to images with PyMuPDF and OCR'd page by page.

Endpoints:
  GET /health          → {"status": "ok", "engine": "..."}
  POST /ocr            → multipart file → {"text": "...", "method": "..."}
"""
import io
import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

app = FastAPI(title="Invoice OCR Microservice", version="1.0.0")

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf", ".webp", ".bmp", ".tif", ".tiff"}

# ── Lazy engine loading ─────────────────────────────────────
_engine = None
_engine_name = None


def _load_engine():
    """Load the best available OCR engine once (expensive import)."""
    global _engine, _engine_name
    if _engine is not None:
        return _engine, _engine_name

    try:
        from paddleocr import PaddleOCR

        _engine = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
        _engine_name = "paddleocr"
        return _engine, _engine_name
    except Exception:
        pass

    try:
        from rapidocr_onnxruntime import RapidOCR

        _engine = RapidOCR()
        _engine_name = "rapidocr"
        return _engine, _engine_name
    except Exception:
        pass

    _engine = None
    _engine_name = None
    return None, None


# ── OCR helpers ─────────────────────────────────────────────
def _run_engine(image_path: Path):
    engine, name = _load_engine()
    if engine is None:
        raise HTTPException(
            status_code=503,
            detail="No OCR engine available. Install with: pip install -r requirements.txt",
        )

    lines = []
    try:
        if name == "paddleocr":
            result = engine.ocr(str(image_path), cls=True)
            for page in result:
                if not page:
                    continue
                for box, (text, _conf) in page:
                    if text and text.strip():
                        lines.append(text.strip())
        else:  # rapidocr
            result, _elapse = engine(str(image_path))
            if result:
                for box, text, _score in result:
                    if text and text.strip():
                        lines.append(text.strip())
    except Exception as exc:  # pragma: no cover - engine-specific failures
        raise HTTPException(status_code=500, detail=f"OCR failed: {exc}") from exc

    return "\n".join(lines), name


def _extract_text_pdf(pdf_path: Path):
    """Extract text from a PDF: direct parse first, OCR fallback for scans."""
    text = ""
    try:
        import pdfplumber

        with pdfplumber.open(str(pdf_path)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"PDF parse failed: {exc}") from exc

    if text.strip():
        return text.strip(), "pdfplumber"

    # Scanned PDF → render pages and OCR them
    engine, name = _load_engine()
    if engine is None:
        raise HTTPException(
            status_code=503,
            detail="Scanned PDF detected but no OCR engine available.",
        )

    import fitz  # PyMuPDF

    extracted = []
    with fitz.open(str(pdf_path)) as doc:
        for page in doc:
            pix = page.get_pixmap(dpi=200)
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                tmp.write(pix.tobytes("png"))
                tmp_path = tmp.name
            try:
                page_text, _ = _run_engine(Path(tmp_path))
                if page_text:
                    extracted.append(page_text)
            finally:
                Path(tmp_path).unlink(missing_ok=True)

    return "\n".join(extracted), f"{name} (scanned pdf)"


# ── Routes ──────────────────────────────────────────────────
@app.get("/health")
def health():
    engine, name = _load_engine()
    return JSONResponse({"status": "ok", "engine": name or "none"})


@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    ext = Path(file.filename or "file").suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{ext}'. Supported: {sorted(SUPPORTED_EXTENSIONS)}",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    suffix = ".pdf" if ext == ".pdf" else ext
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        if ext == ".pdf":
            text, method = _extract_text_pdf(tmp_path)
        else:
            text, method = _run_engine(tmp_path)
    finally:
        tmp_path.unlink(missing_ok=True)

    return JSONResponse({"text": text, "method": method})


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("OCR_PORT", "8765"))
    uvicorn.run(app, host="0.0.0.0", port=port)
