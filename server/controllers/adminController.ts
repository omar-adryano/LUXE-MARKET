import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { AuthRequest } from '../middleware/auth';
import { CJDropshippingService } from '../services/aliexpressService';

/**
 * @desc    Get Admin Dashboard Statistics and analytical datasets
 * @route   GET /api/admin/dashboard-stats
 * @access  Private/Admin
 */
export async function getDashboardStats(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    
    // Total Revenue from orders (delivering real totals)
    const orders = await Order.find({});
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    // Recent orders (populated with corresponding guest details or user accounts)
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('user', 'name username email');

    // Recent users
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .select('-password');

    // Low stock products (stock less than 10 products)
    const lowStockProducts = await Product.find({ stock: { $lt: 25 } })
      .sort({ stock: 1 })
      .limit(5);

    // Sum of all individual products' stocks
    const allProducts = await Product.find({});
    const totalInventoryCount = allProducts.reduce((sum, prod) => sum + (prod.stock || 0), 0);

    // Real category count
    const totalCategories = await Category.countDocuments();

    // Chart Day Revenue Calculation for past 7 days
    const daysOfMin = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayLabel = daysOfMin[d.getDay()];
      
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);

      const ordersForDay = await Order.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      const dayValue = ordersForDay.reduce((sum, o) => sum + (o.total || 0), 0);
      chartData.push({
        label: dayLabel,
        value: Number(dayValue.toFixed(2)),
      });
    }

    const maxValue = Math.max(...chartData.map(cd => cd.value), 1);
    const revenueHistoryWeek = chartData.map(cd => ({
      label: cd.label,
      value: cd.value,
      scale: Math.max(Math.round((cd.value / maxValue) * 100), 5) // ensure at least a tiny vertical bar displays for aesthetic flow
    }));

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalOrders,
        totalProducts,
        totalRevenue,
        totalInventoryCount,
        totalCategories,
        recentOrders,
        recentUsers,
        lowStockProducts,
        revenueHistoryWeek
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    AliExpress Open Platform Product Import (Architecture Scaffold)
 * @route   POST /api/admin/aliexpress/import
 * @access  Private/Admin
 */
export async function importAliExpressProduct(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      res.status(400).json({ success: false, message: 'AliExpress Product ID is required.' });
      return;
    }

    // TODO: Implement actual 'aliexpress.postproduct.redefining.findaeproductbyidForDropShipper' API Call
    // Requires TopClient SDK & AliExpress AppKey, AppSecret, and dropshipper access token.
    
    res.status(501).json({
      success: false,
      message: 'AliExpress API connection is architected but awaits live Developer Account Credentials to authorize import capabilities.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    AliExpress Inventory Sync Architecture Scaffold
 * @route   POST /api/admin/aliexpress/sync-inventory
 * @access  Private/Admin
 */
export async function syncAliExpressInventory(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // TODO: Implement batch query to AliExpress dropship API to fetch live SKU inventory levels.
    res.status(501).json({
      success: false,
      message: 'Inventory Sync requires active AliExpress Dropshipping developer credentials array.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    AliExpress Price Sync Architecture Scaffold
 * @route   POST /api/admin/aliexpress/sync-prices
 * @access  Private/Admin
 */
export async function syncAliExpressPrices(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // TODO: Implement querying the AliExpress product bulk pricing API array.
    res.status(501).json({
      success: false,
      message: 'Pricing Sync requires active AliExpress Dropshipping developer credentials.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    AliExpress Auto-Fulfillment Architecture Scaffold
 * @route   POST /api/admin/aliexpress/sync-fulfillment
 * @access  Private/Admin
 */
export async function searchCJProducts(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const keyword = (req.query.keyword as string) || '';
    if (!keyword) {
      res.status(400).json({ success: false, message: 'Keyword is required' });
      return;
    }
    const data = await CJDropshippingService.getProducts(keyword, 1);
    res.json({ success: true, list: data?.list || [] });
  } catch (error) {
    next(error);
  }
}

export async function importCJProduct(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { productId } = req.body;
    if (!productId) {
      res.status(400).json({ success: false, message: 'Product ID is required' });
      return;
    }
    const product = await CJDropshippingService.importProductToDB(productId);
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
}

export async function syncAliExpressFulfillment(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const activeOrders = await Order.find({
      status: { $in: ['Processing', 'Shipped'] },
      cjOrderId: { $exists: true, $ne: null }
    });
    
    let updatedCount = 0;
    for (const order of activeOrders) {
      if (!order.cjOrderId) continue;
      const trackInfo = await CJDropshippingService.trackOrder(order.cjOrderId) as any;
      if (trackInfo && trackInfo.data) {
        const trackingData = trackInfo.data[0] || trackInfo.data;
        const status = trackingData.status;

        if (trackingData.trackingNumber && !order.trackingNumber) {
          order.trackingNumber = trackingData.trackingNumber;
          order.status = 'Shipped';
          order.trackingStep = 2;
          updatedCount++;
        }

        if (status === 'Delivered' || status === 'completed') {
           order.status = 'Delivered';
           order.trackingStep = 3;
           updatedCount++;
        }
        await order.save();
      }
    }

    res.json({
      success: true,
      message: `Fulfillment sync complete. Updated ${updatedCount} orders from CJ Dropshipping.`
    });
  } catch (error) {
    next(error);
  }
}

