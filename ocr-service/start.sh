#!/bin/bash
# Start the PaddleOCR microservice
# Usage: ./start.sh [port]

PORT="${1:-8765}"
cd "$(dirname "$0")"

# Check Python deps, install if missing
if ! python3 -c "import fastapi; import paddleocr" 2>/dev/null; then
    echo "Installing Python dependencies for OCR service..."
    pip3 install -r requirements.txt 2>&1 | tail -5
fi

echo "Starting PaddleOCR service on port $PORT..."
python3 main.py
