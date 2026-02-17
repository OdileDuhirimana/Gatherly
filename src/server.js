const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Ensure storage directories exist
const ensureDir = (p) => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
};
ensureDir(path.join(process.cwd(), process.env.UPLOAD_DIR || 'storage/uploads'));
ensureDir(path.join(process.cwd(), process.env.TICKET_PDF_DIR || 'storage/tickets'));

const server = http.createServer(app);

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Gatherly API running on port ${PORT}`);
});
