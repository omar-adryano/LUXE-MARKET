import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB, lastConnectionError, getDBCleanErrorMessage } from './server/config/db';
import { seedDB } from './server/config/seed';
import apiRouter from './server/routes/api';
import aliexpressRoutes from './server/routes/aliexpressRoutes';
import { errorHandler } from './server/middleware/errorHandler';
import { startTrackingCron } from './server/cron/trackingSync';

// Load ecosystem variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Core Database Initialization with Retries (Await before registering routes)
  console.log('🔄 [Server] Initializing database subsystem...');
  await connectDB();
  await seedDB();

  // Parse incoming JSON and express URL-encoded blocks
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mount API Endpoints
  app.use('/api/aliexpress', aliexpressRoutes);
  app.use('/api', apiRouter);

  // Start Background Cron
  startTrackingCron();

  // Health endpoint checks
  app.get('/api/health', async (req, res) => {
    try {
      const mongooseModule = await import('mongoose');
      let isConnected = mongooseModule.default.connection.readyState === 1;

      if (req.query.reconnect === 'true') {
        console.log('🔄 [Server] Explicit manual reconnection requested by client.');
        // For the manual reconnect, we reset the connection state
        if (mongooseModule.default.connection.readyState !== 0) {
          console.log('🔌 [Database] Force-disconnecting current database state...');
          await mongooseModule.default.disconnect();
        }
        await connectDB();
        isConnected = mongooseModule.default.connection.readyState === 1;
        if (isConnected) {
          await seedDB();
        }
      }

      const errorDetails = lastConnectionError ? getDBCleanErrorMessage(lastConnectionError) : (
        !isConnected ? getDBCleanErrorMessage(new Error("Database disconnected or not yet initialized")) : null
      );

      res.json({
        status: 'ok',
        database: isConnected ? 'connected' : 'disconnected',
        error: errorDetails,
        timestamp: new Date()
      });
    } catch (err) {
      res.json({ 
        status: 'ok', 
        database: 'unknown', 
        error: lastConnectionError ? getDBCleanErrorMessage(lastConnectionError) : getDBCleanErrorMessage(err),
        timestamp: new Date() 
      });
    }
  });

  // Dual Environment Routing: Dev (Vite middleware) vs. Prod (Static Build serving)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('💻 [Server] Mounted Vite Middleware in development.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('📦 [Server] Serving Compiled Front-End Assets in production.');
  }

  // Global Central Error Handler Catchment
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Server] Luxe Market active at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('💥 [Server] Failed to launch server system:', error);
});
