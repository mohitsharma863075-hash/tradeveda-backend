import http from 'http';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import apiRouter from './backend/src/routes/api';
import { duelService } from './backend/src/services/tradingEngine/duelService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(cors());
  app.use(express.json());

  // Mount backend API routes under /api
  app.use('/api', apiRouter);

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  // Create unified HTTP + WebSocket Server on the same port
  const server = http.createServer(app);

  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (message: string) => {
      try {
        const payload = JSON.parse(message.toString());
        if (payload.type === 'JOIN_ROOM' && payload.roomId) {
          duelService.registerClient(payload.roomId, ws);
          // Send initial state confirmation
          duelService.getRoom(payload.roomId).then(room => {
            if (room && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ROOM_UPDATE', roomId: payload.roomId, data: room }));
            }
          });
        }
      } catch (err) {
        // ignore malformed message
      }
    });

    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to TradeVeda Real-time Duel Server' }));
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`TradeVeda Paper Trading & Multiplayer Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start TradeVeda server:', err);
});
