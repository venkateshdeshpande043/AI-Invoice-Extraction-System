const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const logger = require('../config/logger');
const env = require('../config/env');

async function callOcrService(filePath, fileType) {
  const url = `${env.OCR_SERVICE_URL}/ocr`;
  const fileName = path.basename(filePath);

  logger.info(`Calling PaddleOCR service at ${url} for ${fileName}`);

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), {
    filename: fileName,
    contentType: fileType,
  });

  try {
    const response = await axios.post(url, form, {
      headers: { ...form.getHeaders() },
      timeout: env.OCR_TIMEOUT,
    });

    if (response.data && response.data.text !== undefined) {
      logger.info(`PaddleOCR returned ${response.data.text.length} chars via ${response.data.method}`);
      return response.data.text;
    }

    throw new Error('Unexpected OCR response format');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error(
        'PaddleOCR service is not running. Start it with: cd ocr-service && python3 main.py'
      );
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('OCR request timed out');
    }
    throw new Error(`OCR service error: ${error.message}`);
  }
}

async function extractTextFromPDF(pdfPath) {
  try {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text || '';
  } catch (error) {
    logger.error(`PDF parsing error: ${error.message}`);
    return '';
  }
}

async function extractText(filePath, fileType) {
  logger.info(`Extracting text from: ${filePath} (${fileType})`);
  let pdfFallbackText = '';

  if (fileType === 'application/pdf') {
    try {
      pdfFallbackText = await extractTextFromPDF(filePath);
    } catch {
      // Ignore pdf-parse errors
    }
  }

  try {
    const paddleText = await callOcrService(filePath, fileType);
    if (paddleText && paddleText.trim().length > 0) {
      return paddleText;
    }
  } catch (error) {
    logger.warn(`PaddleOCR failed: ${error.message}`);
  }

  if (pdfFallbackText) {
    logger.info('Using pdf-parse fallback text');
    return pdfFallbackText;
  }

  throw new Error('All OCR methods failed to extract text');
}

module.exports = { extractText };
