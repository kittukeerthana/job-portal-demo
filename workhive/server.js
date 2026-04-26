/**
 * WorkHive Job Portal — Node.js Server
 * No npm install needed. Uses only built-in Node.js modules.
 * Run: node server.js
 * Open: http://localhost:3000
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const PORT   = 3000;
const PUBLIC = path.join(__dirname, 'public');

// ── In-memory applications store ──────────────────────────
let applications = [];
let nextId = 1;

// ── MIME types ────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

// ── Helpers ───────────────────────────────────────────────
function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type':  'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end',  () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch(e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function serveStatic(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext  = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

// ── API Routes ────────────────────────────────────────────
function handleAPI(req, res, pathname) {
  // GET /api/applications
  if (req.method === 'GET' && pathname === '/api/applications') {
    return sendJSON(res, 200, applications);
  }

  // POST /api/applications
  if (req.method === 'POST' && pathname === '/api/applications') {
    readBody(req).then(body => {
      const { jobId, jobTitle, company, logo, logoColor, location, remote,
              name, email, phone, exp, link, cover } = body;

      if (!name || !email || !jobId || !exp || !cover) {
        return sendJSON(res, 400, { error: 'Missing required fields.' });
      }

      const app = {
        id:        nextId++,
        jobId:     parseInt(jobId),
        jobTitle, company, logo, logoColor, location, remote,
        name, email, phone: phone || '', exp,
        link: link || '', cover,
        status:    'pending',
        appliedAt: new Date().toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric'
        }),
      };

      applications.push(app);
      console.log(`[+] New application: ${name} → ${jobTitle} at ${company}`);
      return sendJSON(res, 201, app);
    }).catch(() => sendJSON(res, 400, { error: 'Invalid JSON.' }));
    return;
  }

  // DELETE /api/applications/:id
  const deleteMatch = pathname.match(/^\/api\/applications\/(\d+)$/);
  if (req.method === 'DELETE' && deleteMatch) {
    const id  = parseInt(deleteMatch[1]);
    const idx = applications.findIndex(a => a.id === id);
    if (idx === -1) return sendJSON(res, 404, { error: 'Application not found.' });
    const removed = applications.splice(idx, 1)[0];
    console.log(`[-] Withdrawn: ${removed.name} → ${removed.jobTitle}`);
    return sendJSON(res, 200, { success: true, removed });
  }

  // GET /api/jobs (returns static job list)
  if (req.method === 'GET' && pathname === '/api/jobs') {
    fs.readFile(path.join(PUBLIC, 'js', 'data.js'), 'utf8', (err, src) => {
      if (err) return sendJSON(res, 500, { error: 'Could not read jobs.' });
      // Extract the JOBS array from the JS file via eval in a safe sandbox
      const match = src.match(/const JOBS\s*=\s*(\[[\s\S]*?\]);/);
      if (!match) return sendJSON(res, 500, { error: 'Parse error.' });
      try {
        const jobs = eval(match[1]); // safe — our own static data file
        sendJSON(res, 200, jobs);
      } catch(e) {
        sendJSON(res, 500, { error: 'Eval error.' });
      }
    });
    return;
  }

  sendJSON(res, 404, { error: 'API route not found.' });
}

// ── Main request handler ──────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // API
  if (pathname.startsWith('/api/')) {
    return handleAPI(req, res, pathname);
  }

  // Static files
  let filePath = path.join(PUBLIC, pathname === '/' ? 'index.html' : pathname);

  // Prevent path traversal
  if (!filePath.startsWith(PUBLIC)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  // If directory, serve index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  serveStatic(res, filePath);
});

server.listen(PORT, () => {
  console.log('');
  console.log('  🐝  WorkHive Job Portal');
  console.log('  ─────────────────────────────────────');
  console.log(`  ✅  Server running at http://localhost:${PORT}`);
  console.log('  📁  Serving from: ./public');
  console.log('  🛑  Press Ctrl+C to stop');
  console.log('');
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  ❌  Port ${PORT} is already in use.`);
    console.error(`  👉  Try: node server.js  (after closing other servers)\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
