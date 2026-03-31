// The "Operator" that connects your Website to the User's Cloud Unreal Instance
const express = require('express');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const server = http.createServer(app);

// This targets the Unreal Engine running on the user's remote cluster
const REMOTE_UNREAL_URL = process.env.USER_CLOUD_UE_URL || 'http://localhost:8888';

app.use('/', createProxyMiddleware({
  target: REMOTE_UNREAL_URL,
  ws: true, // Crucial for Pixel Streaming (WebSockets)
  changeOrigin: true
}));

server.listen(3002, () => {
  console.log('Unreal Signalling Bridge Manifested on Port 3002');
});
