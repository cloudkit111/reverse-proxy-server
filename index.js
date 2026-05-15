import express from "express";
import path from "path";
import httpProxy from "http-proxy";

const app = express();
const PORT = process.env.PORT || 8000;

const BASE_PATH =
  "http://cloudkit-outputs.s3-website.ap-south-1.amazonaws.com/__outputs";

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
});

app.get("/_health", (req, res) => {
  res.send("OK");
});

app.use((req, res) => {
  try {
    const segments = req.path.split("/").filter(Boolean);
    const slug = segments[0];

    if (!slug) {
      return res.status(404).send("Project not found");
    }

    const target = `${BASE_PATH}/${slug}`;

    req.url = req.url.replace(`/${slug}`, "") || "/";

    const ext = path.extname(req.url);

    const acceptsHTML = req.headers.accept?.includes("text/html");

    if (!ext && acceptsHTML) {
      req.url = "/index.html";
    }

    proxy.web(req, res, {
      target,
    });
  } catch (err) {
    console.error("Routing Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

proxy.on("error", (err, req, res) => {
  console.error("Proxy Error:", err.message);

  if (!res.headersSent) {
    res.writeHead(502, {
      "Content-Type": "text/plain",
    });
  }

  res.end("Bad Gateway");
});

app.listen(PORT, () => {
  console.log(`🚀 Reverse Proxy running on port ${PORT}`);
});
