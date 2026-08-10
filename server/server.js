const express = require('express');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const corsMiddleware = require('./src/config/cors');
const env = require('./src/config/env');
const logger = require('./src/config/logger');
const errorMiddleware = require('./src/middleware/errorMiddleware');
const { authLimiter, apiLimiter } = require('./src/middleware/rateLimiter');
const AppError = require('./src/utils/AppError');

const authRoutes = require('./src/routes/authRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const vendorRoutes = require('./src/routes/vendorRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const insightRoutes = require('./src/routes/insightRoutes');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (message) => logger.http(message.trim()) },
    })
  );
}

app.use('/uploads', express.static(path.resolve(__dirname, 'src/uploads')));

function dbCheck(req, res, next) {
  const dbStatus = require('./src/config/db').getConnectionStatus();
  if (!dbStatus && (req.path.startsWith('/api/invoices') || req.path.startsWith('/api/dashboard') || req.path === '/api/auth/register' || req.path === '/api/auth/login')) {
    return res.status(503).json({
      success: false,
      message: 'Database is not connected. Please wait for initialization or check your MONGODB_URI configuration.',
      errors: [],
    });
  }
  next();
}

app.use('/api', dbCheck);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/invoices', apiLimiter, invoiceRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/vendors', apiLimiter, vendorRoutes);
app.use('/api/ai', apiLimiter, aiRoutes);
app.use('/api/insights', apiLimiter, insightRoutes);

app.use('/api/health', async (_req, res) => {
  const dbConnected = require('./src/config/db').getConnectionStatus();

  // Check OCR service health
  let ocrStatus = 'unknown';
  try {
    const axios = require('axios');
    const ocrResp = await axios.get(`${env.OCR_SERVICE_URL}/health`, { timeout: 3000 });
    ocrStatus = ocrResp.data && ocrResp.data.status === 'ok' ? 'connected' : 'unhealthy';
  } catch {
    ocrStatus = 'disconnected';
  }

  const overallOk = dbConnected && ocrStatus === 'connected';

  res.status(overallOk ? 200 : 503).json({
    success: true,
    message: overallOk
      ? 'Invoice Extractor API is running'
      : 'Some services are unavailable',
    database: dbConnected ? 'connected' : 'disconnected',
    ocr: ocrStatus,
    timestamp: new Date().toISOString(),
  });
});

// Serve the built React frontend (client/dist) when present, so the same
// server can host both the API and the web app. API/upload paths bypass this.
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  if (fs.existsSync(path.join(clientDistPath, 'index.html'))) {
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  }
  next();
});

app.all('*', (req, _res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
});

app.use(errorMiddleware);

async function startServer() {
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });

  connectDB().then((connected) => {
    if (connected) {
      logger.info('Database is ready. API endpoints are fully operational.');
    } else {
      logger.warn('Database not reachable. Starting background retry...');
      const retryInterval = setInterval(async () => {
        const ok = await connectDB();
        if (ok) {
          logger.info('Database connected on retry. API endpoints now operational.');
          clearInterval(retryInterval);
        }
      }, 10000);
    }
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    server.close(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  return server;
}

startServer();

module.exports = app;
