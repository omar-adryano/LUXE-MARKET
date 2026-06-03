import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { APIError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Dynamic resolver to match static slug IDs or dynamic ObjectIds robustly
async function findProductByAnyId(id: string) {
  if (!id) return null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    const product = await Product.findById(id);
    if (product) return product;
  }

  const slugToNameMap: Record<string, string> = {
    'lounge-chair': 'Minimalist Lounge Chair',
    'headphones': 'Aural Luxe Wireless Headphones',
    'smartwatch': 'Chrono Minimalist Smartwatch',
    'desk-lamp': 'Lumina Architect Desk Lamp',
    'leather-tote': 'Artisan Cognac Leather Tote',
    'modular-sofa': 'The Cloud Modular Sofa',
    'red-footwear': 'Performance Footwear Classic',
    'skincare-organic': 'Organic Skincare Serum',
    'floor-lamp': 'Brass Arch Floor Lamp',
    'side-table': 'Walnut Side Table',
    'wool-throw': 'Geo Wool Throw',
    'canvas-print': 'Abstract Canvas Print',
    'sneakers-minimalist': 'Urban Minimalist Sneakers'
  };

  const name = slugToNameMap[id];
  if (name) {
    const productByName = await Product.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (productByName) return productByName;
  }

  const cleanId = id.replace(/[-_]+/g, ' ');
  const productMatched = await Product.findOne({
    $or: [
      { name: { $regex: new RegExp(`^${cleanId}$`, 'i') } },
      { name: { $regex: new RegExp(cleanId, 'i') } }
    ]
  });

  return productMatched;
}

// @desc    Create a new order (Works for Guest & Auth users)
// @route   POST /api/orders
// @access  Public
export async function createOrder(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const {
    items,
    shippingAddress,
    paymentMethod,
    subtotal,
    discountAmount,
    shippingCost,
    taxRate,
    total,
  } = req.body;

  try {
    // 1. Verify items match database prices/existence & deduct stock levels
    for (const item of items) {
      const dbProduct = await findProductByAnyId(item.product);
      if (!dbProduct) {
        next(new APIError(`Verification check failed: Product '${item.name || item.product}' not found in database records.`, 404));
        return;
      }
      
      if (dbProduct.stock < item.quantity) {
        next(new APIError(`Insufficient inventory matching line items for product: ${dbProduct.name}. Only ${dbProduct.stock} left.`, 400));
        return;
      }

      // Decrement stock in database
      dbProduct.stock -= item.quantity;
      await dbProduct.save();

      // Bind to actual ObjectId in database
      item.product = dbProduct._id;
    }

    // 2. Map items summary string
    const itemsSummary = items.map((itm: any) => `${itm.name} (x${itm.quantity})`).join(', ');

    // 3. Assemble order payload
    const orderPayload: any = {
      items,
      itemsCount: items.reduce((acc: number, itm: any) => acc + Number(itm.quantity), 0),
      itemsSummary,
      shippingAddress,
      paymentMethod: paymentMethod || 'Credit Card',
      subtotal,
      discountAmount: discountAmount || 0,
      shippingCost: shippingCost || 0,
      taxRate: taxRate || 0,
      total,
      status: 'Pending',
      trackingStep: 0,
    };

    // If request contains verified logged-in user, bind order
    if (req.user) {
      orderPayload.user = req.user._id;
    }

    const order = await Order.create(orderPayload);

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
export async function getMyOrders(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export async function getAllOrders(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Update order status or tracking steps
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export async function updateOrderStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { status, trackingStep } = req.body;

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      next(new APIError('Order not found', 404));
      return;
    }

    if (status) {
      if (!['Shipped', 'Processing', 'Delivered', 'Pending'].includes(status)) {
        next(new APIError('Invalid order status value offered', 400));
        return;
      }
      order.status = status;
    }

    if (trackingStep !== undefined) {
      const stepNum = Number(trackingStep);
      if (stepNum < 0 || stepNum > 3) {
        next(new APIError('Tracking step milestone must be between 0 and 3', 400));
        return;
      }
      order.trackingStep = stepNum;
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order milestone tracking records synchronized',
      order,
    });
  } catch (error) {
    next(error);
  }
}
