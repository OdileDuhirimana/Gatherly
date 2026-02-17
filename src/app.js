const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { initDb } = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');

const app = express();

// Security & utils
app.use(helmet());
// Stripe webhook signature verification requires the exact raw request body.
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const origins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: origins.length ? origins : '*', credentials: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use('/api/auth', authLimiter);

// Static storage for uploads and ticket PDFs
app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || 'storage/uploads')));
app.use('/tickets', express.static(path.join(process.cwd(), process.env.TICKET_PDF_DIR || 'storage/tickets')));

// Health
app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' }));

// Swagger docs
try {
  const specPath = path.join(__dirname, 'docs', 'openapi.json');
  if (fs.existsSync(specPath)) {
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
  }
} catch (e) {
  // eslint-disable-next-line no-console
  if (process.env.NODE_ENV !== 'test') console.error('Swagger mount error', e);
}

// API routes
app.use('/api', routes);

// 404 and error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize DB (connections and associations) - skip during tests
if (process.env.NODE_ENV !== 'test') {
  initDb().catch((e) => {
    // eslint-disable-next-line no-console
    console.error('DB init error:', e);
  });
}

module.exports = app;
