import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3002;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the public/animations directory
app.use('/animations', express.static(path.join(__dirname, '../public/animations'), {
  setHeaders: (res) => {
    res.set('Content-Type', 'application/json');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  },
}));

// Start the server
app.listen(PORT, () => {
  console.log(`Animation server running at http://localhost:${PORT}`);
});
