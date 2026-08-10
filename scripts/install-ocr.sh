#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Invoice Extractor — OCR microservice dependencies
#
# Installs the lightweight RapidOCR (ONNX Runtime) engine, which
# uses the same PaddleOCR PP-OCR models but avoids the very heavy
# paddlepaddle dependency. The service prefers paddleocr if it is
# installed and falls back to RapidOCR automatically.
#
# For the full PaddleOCR engine use:  pip install -r ocr-service/requirements.txt
# ─────────────────────────────────────────────────────────────
set -euo pipefail

echo "[install-ocr.sh] Installing OCR microservice dependencies…"
pip install --no-cache-dir \
  fastapi>=0.104.0 \
  "uvicorn>=0.24.0" \
  "python-multipart>=0.0.6" \
  "rapidocr-onnxruntime>=1.3.20" \
  "pdfplumber>=0.10.0" \
  "PyMuPDF>=1.23.0"

echo "[install-ocr.sh] Done. OCR service is ready: cd ocr-service && python3 main.py"
