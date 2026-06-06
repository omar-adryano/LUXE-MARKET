import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import http from 'http';
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

  // CORS configuration
  app.use(cors({
    origin: [
      process.env.FRONTEND_URL || '*',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    credentials: true,
  }));

  // Mount API Endpoints
  app.use('/api/aliexpress', aliexpressRoutes);
  
  // Auditing script route
  app.get('/api/admin/dev-category-audit', async (req, res) => {
    try {
      const { Product } = await import('./server/models/Product');
      const products = await Product.find({});
      let beforeCounts: Record<string, number> = {};
      let afterCounts: Record<string, number> = {};
      
      for(const p of products) {
        if(!beforeCounts[p.category]) beforeCounts[p.category] = 0;
        beforeCounts[p.category]++;
      }

      const report: string[] = [];
      let correctedCount = 0;
      let remainingCount = 0;

      for(const p of products) {
        const n = (p.name || '').toLowerCase();
        let currentCat = p.category;
        let newCat = currentCat;
        let confidence = 'LOW';
        let reason = '';

        if (n.includes('sneaker') || n.includes('shoe') || n.includes('boot') || n.includes('pump') || n.includes('sandal') || n.includes('shirt') || n.includes('dress') || n.includes('coat') || n.includes('suit') || n.includes('jacket') || n.includes('swimsuit')) {
          newCat = 'Apparel & Fashion';
          reason = 'Name indicates clothing/footwear (Apparel & Fashion)';
          confidence = 'HIGH';
        } else if (n.includes('headphone') || n.includes('earphone') || n.includes('earbud') || n.includes('speaker') || n.includes('microphone')) {
          newCat = 'Electronics';
          reason = 'Name indicates audio equipment (Electronics)';
          confidence = 'HIGH';
        } else if (n.includes('phone case') || n.includes('screen protector') || n.includes('phone holder')) {
          newCat = 'Phone Accessories';
          reason = 'Name indicates mobile accessory (Phone Accessories)';
          confidence = 'HIGH';
        } else if (n.includes('ring') || n.includes('necklace') || n.includes('bracelet') || n.includes('earring') || n.includes('jewelry') || (n.includes('watch') && !n.includes('smartwatch'))) {
          newCat = 'Jewelry & Watches';
          reason = 'Name indicates worn accessories/jewelry (Jewelry & Watches)';
          confidence = 'HIGH';
        } else if (n.includes('serum') || n.includes('cream') || n.includes('lotion') || n.includes('makeup') || n.includes('skincare') || n.includes('cleanser')) {
          newCat = 'Beauty & Skincare';
          reason = 'Name indicates beauty care product (Beauty & Skincare)';
          confidence = 'HIGH';
        } else if (n.includes('kitchen') || n.includes('cookware') || n.includes('mug') || n.includes('plate') || n.includes('bowl') || n.includes('cleaner') || n.includes('mop') || n.includes('vacuum') || n.includes('sofa') || n.includes('furniture') || n.includes('cup') || n.includes('pan')) {
          newCat = 'Home & Kitchen';
          reason = 'Name indicates household item or furniture (Home & Kitchen)';
          confidence = 'HIGH';
        } else if (n.includes('pet') || n.includes('dog') || n.includes('cat') || n.includes('leash')) {
          newCat = 'Pet Supplies';
          reason = 'Name indicates animal supply (Pet Supplies)';
          confidence = 'HIGH';
        } else if (n.includes('chair') || n.includes('table') || n.includes('lamp') || n.includes('throw')) {
          newCat = 'Home & Kitchen';
          reason = 'Name indicates household furniture (Home & Kitchen)';
          confidence = 'HIGH';
        } else if (n.includes('smart') && n.includes('watch')) {
          newCat = 'Smart Gadgets';
          reason = 'Name indicates smart watch (Smart Gadgets)';
          confidence = 'HIGH';
        } else if (n.includes('camera') || n.includes('drone')) {
          newCat = 'Electronics';
          reason = 'Name indicates electronics';
          confidence = 'HIGH';
        }

        if (currentCat !== newCat && confidence === 'HIGH') {
          report.push(`Product Name: ${p.name}\nCurrent Category: ${currentCat}\nRecommended Category: ${newCat}\nReason: ${reason}\n`);
          p.category = newCat;
          await p.save();
          correctedCount++;
        } else if (currentCat !== newCat) {
          report.push(`Product Name: ${p.name}\nCurrent Category: ${currentCat}\nRecommended Category: ${newCat}\nReason: ${reason} (LOW CONFIDENCE - SKIPPING)\n`);
          remainingCount++;
        }

        if(!afterCounts[p.category]) afterCounts[p.category] = 0;
        afterCounts[p.category]++;
      }
      
      res.json({
        totalAudited: products.length,
        correctedCount,
        remainingCount,
        beforeCounts,
        afterCounts,
        report
      });
    } catch(e: any) {
      res.status(500).json({error: e.message});
    }
  });

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
  const distPath = path.join(process.cwd(), 'dist');
  const isProductionBuild = process.env.NODE_ENV === 'production' || fs.existsSync(path.join(distPath, 'index.html'));


  const httpServer = http.createServer(app);

  if (!isProductionBuild) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { server: httpServer } 
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('💻 [Server] Mounted Vite Middleware in development.');
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('📦 [Server] Serving Compiled Front-End Assets in production.');
  }

  // Global Central Error Handler Catchment
  app.use(errorHandler);

  let retryCount = 0;
  const tryListen = () => {
    httpServer.listen(PORT, () => {
      console.log(`🚀 [Server] Luxe Market active at port ${PORT}`);
    }).on('error', (e: any) => {
      if (e.code === 'EADDRINUSE') {
        console.error(`💥 [Server] Port ${PORT} in use, retrying in 1s...`);
        retryCount++;
        if (retryCount < 10) {
          setTimeout(tryListen, 1000);
        } else {
          console.error(`💥 [Server] Port ${PORT} still in use after retries, forcing stop...`);
          process.exit(1);
        }
      } else {
        console.error(`💥 [Server] Failed to bind port:`, e);
      }
    });
  };
  
  tryListen();
}

startServer().catch((error) => {
  console.error('💥 [Server] Failed to launch server system:', error);
});
