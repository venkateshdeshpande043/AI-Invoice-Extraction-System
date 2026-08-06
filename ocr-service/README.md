# PaddleOCR Microservice

FastAPI-based OCR microservice using PaddleOCR for offline text extraction.

## Setup

```bash
pip install -r requirements.txt
```

## Usage

```bash
# Start on default port 8765
python main.py

# Or specify a port
OCR_PORT=8765 python main.py
```

## API

- `GET /health` - Health check
- `POST /ocr` - Upload file (multipart/form-data field: `file`), returns `{"text": "extracted text", "method": "paddleocr"}`

Supports: JPG, PNG, PDF
