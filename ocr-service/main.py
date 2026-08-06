import os
import tempfile
import logging
from pathlib import Path
from paddleocr import PaddleOCR
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s]: %(message)s",
)
logger = logging.getLogger("ocr-service")

app = FastAPI(title="PaddleOCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ocr_engine = None


def get_engine():
    global ocr_engine
    if ocr_engine is None:
        logger.info("Initializing PaddleOCR engine (first load downloads models)...")
        ocr_engine = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False, show_log=False)
        logger.info("PaddleOCR engine ready")
    return ocr_engine


def run_ocr(image_path):
    engine = get_engine()
    result = engine.ocr(image_path, cls=True)
    texts = []
    if result and result[0]:
        for line in result[0]:
            texts.append(line[1][0])
    return texts


@app.get("/health")
def health():
    return {"status": "ok", "engine": "paddleocr"}


@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(400, "No file provided")

    allowed = ["image/jpeg", "image/png", "application/pdf"]
    if file.content_type not in allowed:
        raise HTTPException(400, f"Unsupported type: {file.content_type}")

    contents = await file.read()
    if not contents:
        raise HTTPException(400, "Empty file")

    ext = Path(file.filename).suffix if file.filename else ".jpg"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    tmp.write(contents)
    tmp_path = tmp.name
    tmp.close()

    logger.info(f"Processing: {file.filename} ({len(contents)} bytes)")

    try:
        text_lines = []
        method = "paddleocr"

        if file.content_type == "application/pdf":
            try:
                import pdfplumber
                parts = []
                with pdfplumber.open(tmp_path) as pdf:
                    for p in pdf.pages:
                        t = p.extract_text()
                        if t:
                            parts.append(t)
                if parts and "\n".join(parts).strip():
                    os.unlink(tmp_path)
                    logger.info(f"PDF via pdfplumber: {sum(len(p) for p in parts)} chars")
                    return {"text": "\n".join(parts), "method": "pdfplumber"}
            except Exception as e:
                logger.warning(f"pdfplumber failed: {e}")

            try:
                import fitz
                doc = fitz.open(tmp_path)
                for pn in range(len(doc)):
                    pix = doc[pn].get_pixmap(dpi=300)
                    img = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
                    img.write(pix.tobytes("png"))
                    img.close()
                    text_lines.extend(run_ocr(img.name))
                    os.unlink(img.name)
                doc.close()
                method = "paddleocr_pdf"
            except ImportError:
                os.unlink(tmp_path)
                raise HTTPException(500, "PDF deps (PyMuPDF) not installed")
        else:
            text_lines = run_ocr(tmp_path)

        os.unlink(tmp_path)

        full_text = "\n".join(text_lines)
        logger.info(f"OCR complete: {len(full_text)} chars, {len(text_lines)} lines")
        return {"text": full_text, "method": method}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR error: {e}")
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
        raise HTTPException(500, f"OCR failed: {e}")


if __name__ == "__main__":
    port = int(os.environ.get("OCR_PORT", 8765))
    uvicorn.run(app, host="0.0.0.0", port=port)
