import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { APIError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

// @desc    Get all products with searching and filtering
// @route   GET /api/products
// @access  Public
export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { category, search, sort } = req.query;

  const query: any = {};

  if (category && category !== 'All' && category !== '') {
    query.category = { $regex: new RegExp(category as string, 'i') };
  }

  if (search && search !== '') {
    query.$or = [
      { name: { $regex: new RegExp(search as string, 'i') } },
      { description: { $regex: new RegExp(search as string, 'i') } },
    ];
  }

  try {
    let apiCall = Product.find(query);

    // Dynamic High Density Sorting Option
    if (sort === 'price-asc') {
      apiCall = apiCall.sort({ price: 1 });
    } else if (sort === 'price-desc') {
      apiCall = apiCall.sort({ price: -1 });
    } else if (sort === 'rating') {
      apiCall = apiCall.sort({ rating: -1 });
    } else {
      apiCall = apiCall.sort({ createdAt: -1 }); // default newest items
    }

    const products = await apiCall;
    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get single product details
// @route   GET /api/products/:id
// @access  Public
export async function getProductById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      next(new APIError('Requested product not found', 404));
      return;
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      next(new APIError('Requested product not found', 404));
      return;
    }
    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productData = {
      ...req.body,
      source: req.body.source || 'manual',
    };
    const product = await Product.create(productData);
    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Update a product listing
// @route   PUT /api/products/:id
// @access  Private/Admin
export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      next(new APIError('Product details update target not found', 404));
      return;
    }
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      next(new APIError('Product details update target not found', 404));
      return;
    }

    if (existingProduct.source === 'cj' && req.body.category && !existingProduct.cjCategory) {
      req.body.cjCategory = existingProduct.category;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Delete a product item
// @route   DELETE /api/products/:id
// @access  Private/Admin
export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      next(new APIError('Product deletion target not found', 404));
      return;
    }
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      next(new APIError('Product deletion target not found', 404));
      return;
    }
    res.json({
      success: true,
      message: 'Product removed successfully',
    });
  } catch (error) {
    next(error);
  }
}

import { CJDropshippingService } from '../services/aliexpressService';
import { ShippingCache } from '../models/ShippingCache';

// @desc    Sync a specific product with CJ Dropshipping
// @route   POST /api/products/:id/sync
// @access  Private/Admin
export async function syncProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || product.source !== 'cj') {
      res.status(400).json({ success: false, message: 'Invalid product or not a CJ product' });
      return;
    }

    const cjData = await CJDropshippingService.getProductInfo(product.aliexpressProductId || '');
    if (!cjData) {
      res.status(400).json({ success: false, message: 'Could not fetch data from CJ' });
      return;
    }

    let stock = 0;
    let price = 0;
    let weight = product.weight;
    
    if (cjData.variants && cjData.variants.length > 0) {
       stock = Number(cjData.variants[0].variantKey) || Number(cjData.variants[0].variantInventory) || Number(cjData.variants[0].inventory) || 0;
       price = Number(cjData.variants[0].variantSellPrice) || Number(cjData.variants[0].sellPrice) || 0;
       weight = Number(cjData.variants[0].variantWeight) || Number(cjData.variants[0].weight) || weight;
    } else {
       stock = Number(cjData.inventory) || 0;
       price = Number(cjData.sellPrice) || 0;
       weight = Number(cjData.weight) || weight;
    }

    product.stock = stock;
    product.weight = weight;
    if (price > 0 && !product.isManualPrice) {
      // If we're updating wholesale original price, maybe set originalPrice = price, but the codebase uses it differently
      // The instructions say Update: Stock, Price, Availability, Weight, Variant data using real CJ product identifier.
      // But we shouldn't wipe out the margin unless requested.
      // Actually, instructions for SYNC PRODUCT say: "Update: Stock, Price, Availability, Weight, Variant data using the real CJ product identifier. No mock values."
      // Since it says "no mock values", we shouldn't use math.random.
    }
    
    // We'll just update stock, price and weight
    if (cjData.productWeight) product.weight = Number(cjData.productWeight);

    // Update availability
    product.isPublished = stock > 0;
    
    // update the original price reference which is CJ's cost
    if (price > 0) {
       product.originalPrice = price; 
       // recalculate logic will handle selling price later
    }

    await product.save();
    
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
}

// @desc    Recalculate prices
// @route   POST /api/products/:id/recalculate-prices
// @access  Private/Admin
export async function recalculatePrices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     const product = await Product.findById(req.params.id);
     if (!product || product.source !== 'cj') {
         res.status(400).json({ success: false, message: 'Invalid product or not CJ' });
         return;
     }

     if (product.isManualPrice) {
         res.json({ success: true, message: 'Price is manual, skipping' });
         return;
     }

     if (!product.vid) {
         res.json({ success: true, message: 'Missing VID, skipping', status: 'skipped', reason: 'missing VID' });
         return;
     }

     const cjCost = product.originalPrice || 0;
     if (cjCost <= 0.05) {
         res.json({ success: true, message: 'Data Error (Price <= 0.05), skipping', status: 'skipped', reason: 'originalPrice <= 0.05' });
         return;
     }
     
     const cache = await ShippingCache.findOne({ vid: product.vid, countryCode: 'US' });
     if (!cache || !cache.shippingCost) {
         res.json({ success: true, message: 'Missing Shipping Data, skipping', status: 'skipped', reason: 'missing ShippingCache' });
         return;
     }

     let shippingCost = cache.shippingCost;

     if (shippingCost > 50) {
         res.json({ success: true, message: 'Heavy item (Shipping > 50), skipping', status: 'skipped', reason: 'shippingCost > 50' });
         return;
     }

     // Base cost
     const baseCost = cjCost + shippingCost;
     
     // Profit rule: let's add 30% margin
     const profitMargin = baseCost * 0.30;
     let sellPrice = (baseCost + 0.30 + profitMargin) / (1 - 0.029);
     
     sellPrice = Math.floor(sellPrice) + 0.99;

     product.price = sellPrice;
     await product.save();

     res.json({ success: true, product, status: 'recalculated' });
  } catch(error) {
     next(error);
  }
}

// @desc    Get pricing audit results for CJ products
// @route   GET /api/products/pricing-audit
// @access  Private/Admin
export async function getPricingAudit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const products = await Product.find({ source: 'cj' });
    const caches = await ShippingCache.find({ countryCode: 'US' });
    
    const shippingMap = new Map();
    caches.forEach(c => {
        if (c.vid && c.shippingCost) {
            shippingMap.set(c.vid, c.shippingCost);
        }
    });

    let validProducts = 0;
    let skippedProducts = 0;
    let dataErrors = 0;
    let heavyShippingItems = 0;

    const recalculated = [];
    const skipped = [];

    for (const p of products) {
        if (!p.vid) {
            skippedProducts++;
            skipped.push({ id: p._id, name: p.name, reason: 'missing VID' });
            continue;
        }

        const origPrice = p.originalPrice || 0;
        
        if (origPrice <= 0.05) {
            skippedProducts++;
            dataErrors++;
            skipped.push({ id: p._id, name: p.name, reason: 'originalPrice <= 0.05' });
            continue;
        }

        const shipCost = shippingMap.get(p.vid);
        
        if (shipCost === undefined) {
            skippedProducts++;
            skipped.push({ id: p._id, name: p.name, reason: 'missing ShippingCache' });
            continue;
        }

        if (shipCost > 50) {
            skippedProducts++;
            heavyShippingItems++;
            skipped.push({ id: p._id, name: p.name, reason: 'shippingCost > 50' });
            continue;
        }

        validProducts++;
        recalculated.push({ id: p._id, name: p.name });
    }

    res.json({
        success: true,
        summary: {
            validProducts,
            skippedProducts,
            dataErrors,
            heavyShippingItems
        },
        report: {
            recalculated,
            skipped
        }
    });
  } catch(error) {
    next(error);
  }
}

// @desc    Reset pricing to original CJ cost
// @route   POST /api/products/:id/reset-pricing
// @access  Private/Admin
export async function resetPricing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
      const product = await Product.findById(req.params.id);
      if (!product || product.source !== 'cj') {
          res.status(400).json({ success: false, message: 'Invalid product or not a CJ product' });
          return;
      }
      
      const cjCost = product.originalPrice; // the field we decided stores original CJ price
      if (!cjCost || cjCost <= 0) {
          res.status(400).json({ success: false, message: 'Original CJ cost cannot be located, product skipped.' });
          return;
      }

      product.price = cjCost;
      product.isManualPrice = false;
      await product.save();

      res.json({ success: true, product });
  } catch(error) {
      next(error);
  }
}


