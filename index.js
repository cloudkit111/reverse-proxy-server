import express from "express";
import path from "path";
import httpProxy from "http-proxy"

const app = express();
const PORT = 8000;

// ✅ MUST use S3 website endpoint (not REST)
const BASE_PATH = 'http://cloudkit-outputs.s3-website.ap-south-1.amazonaws.com/__outputs';

const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
});

// 🔥 Main middleware
app.use((req, res) => {
    try {
        const hostname = req.hostname;

        // 👉 Extract subdomain
        const subdomain = hostname.split('.')[0];

        // 👉 Example: abc.domain.com → /__outputs/abc
        const target = `${BASE_PATH}/${subdomain}`;

        // 👉 Detect if request is for a file (has extension)
        const ext = path.extname(req.url);

        if (!ext) {
            // ✅ SPA route → always serve index.html
            req.url = '/index.html';
        }

        proxy.web(req, res, { target });

    } catch (err) {
        console.error('Routing Error:', err);
        res.status(500).send('Internal Server Error');
    }
});

// ❌ Handle proxy errors properly
proxy.on('error', (err, req, res) => {
    console.error('Proxy Error:', err.message);

    if (!res.headersSent) {
        res.writeHead(502, {
            'Content-Type': 'text/plain',
        });
    }

    res.end('Bad Gateway: Unable to reach origin');
});

// 🟢 Health check (optional but useful)
app.get('/_health', (req, res) => {
    res.send('OK');
});

app.listen(PORT, () => {
    console.log(`🚀 Reverse Proxy running on http://localhost:${PORT}`);
});