import { Router, Request, Response, NextFunction } from 'express';
import { protect, admin } from '../middleware/auth';
import { CJDropshippingService } from '../services/aliexpressService';
import { Product } from '../models/Product';
import { APIError } from '../middleware/errorHandler';

const router = Router();

// GET /api/aliexpress/search
router.get('/search', protect, admin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categoryId = req.query.categoryId as string;
    const page = parseInt(req.query.page as string) || 1;

    if (!categoryId) {
      res.status(400).json({ success: false, message: 'categoryId query parameter is required' });
      return;
    }

    // Using categoryId as the keyword forCJ Dropshipping search
    const data = await CJDropshippingService.getProducts(categoryId, page);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/aliexpress/import/:productId
router.post('/import/:productId', protect, admin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;
    const product = await CJDropshippingService.importProductToDB(productId);
    
    res.status(201).json({
      success: true,
      message: `Product ${productId} imported successfully.`,
      product,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/aliexpress/sync-price/:productId
router.put('/sync-price/:productId', protect, admin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findOne({ aliexpressProductId: productId });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found in local database' });
      return;
    }

    const info = await CJDropshippingService.getProductInfo(productId);
    
    const getPrice = () => {
       if (info.sellPrice) return Number(info.sellPrice);
       if (info.variants && info.variants.length > 0) return Number(info.variants[0].variantSellPrice) || Number(info.variants[0].sellPrice) || 0;
       return null;
    };
    const newPrice = getPrice();

    if (newPrice === null) {
      res.status(400).json({ success: false, message: 'Invalid price returned from CJ api' });
      return;
    }

    product.price = newPrice;
    await product.save();

    res.json({
      success: true,
      message: 'Price synced successfully.',
      price: product.price,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
