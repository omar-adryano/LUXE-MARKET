import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { APIError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

let stripeClient: Stripe | null = null;

// Lazy initialization helper for Stripe client
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key, {
      apiVersion: '2023-10-16' as any, // Standard stable compliant Stripe API version
    });
  }
  return stripeClient;
}

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

// @desc    Create a Stripe Checkout Session
// @route   POST /api/stripe/create-checkout-session
// @access  Public (Optional Auth)
export async function createCheckoutSession(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const {
    items,
    shippingAddress,
    subtotal,
    discountAmount,
    shippingCost,
    taxRate,
    total,
    originUrl,
  } = req.body;

  try {
    const stripe = getStripe();

    if (!items || items.length === 0) {
      next(new APIError('No items provided for checkout', 400));
      return;
    }

    // 1. Verify items and check stock levels
    for (const item of items) {
      const dbProduct = await findProductByAnyId(item.product);
      if (!dbProduct) {
        next(new APIError(`Verification checks failed: Product '${item.name || item.product}' not found in database records.`, 404));
        return;
      }

      if (dbProduct.stock < item.quantity) {
        next(new APIError(`Insufficient inventory for product: ${dbProduct.name}. Only ${dbProduct.stock} left.`, 400));
        return;
      }
    }

    // 2. Pre-create the Pending order in MongoDB to reserve items/stock
    // Decrement stock during pre-creation
    for (const item of items) {
      const dbProduct = await findProductByAnyId(item.product);
      if (dbProduct) {
        dbProduct.stock -= item.quantity;
        await dbProduct.save();
        
        // Update item product reference to use the real database ObjectId
        item.product = dbProduct._id;
      }
    }

    const itemsSummary = items.map((itm: any) => `${itm.name} (x${itm.quantity})`).join(', ');

    const orderPayload: any = {
      items: items.map((itm: any) => ({
        product: itm.product,
        name: itm.name,
        quantity: itm.quantity,
        price: itm.price,
        selectedColor: itm.selectedColor || 'Default',
        selectedMaterial: itm.selectedMaterial || 'Default'
      })),
      itemsCount: items.reduce((acc: number, itm: any) => acc + Number(itm.quantity), 0),
      itemsSummary,
      shippingAddress,
      paymentMethod: 'Stripe Credit Card',
      subtotal,
      discountAmount: discountAmount || 0,
      shippingCost: shippingCost || 0,
      taxRate: taxRate || 0,
      total,
      status: 'Pending',
      trackingStep: 0,
    };

    if (req.user) {
      orderPayload.user = req.user._id;
    }

    const order = await Order.create(orderPayload);

    // 3. Formulate line items for Stripe. Needs to align integer amounts (cents)
    const lineItems = items.map((itm: any) => {
      // Divide overall discounts and extras proportionally, or just use native Stripe line_item unit_amount.
      // To keep simple, we can compute unit_amount and let Stripe handle total calculation.
      // Note: Math.round(price * 100) ensures cents accuracy
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: itm.name,
            images: itm.image ? [itm.image] : [],
          },
          unit_amount: Math.round(itm.price * 100),
        },
        quantity: itm.quantity,
      };
    });

    // Add delivery carriage line item if shipping fee exists
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Priority Courier Delivery Fees',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // Add tax line item if tax amount exists
    const discountFactor = subtotal > 0 ? (subtotal - (discountAmount || 0)) / subtotal : 1;
    const computedTax = (subtotal - (discountAmount || 0)) * (taxRate || 0);
    if (computedTax > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `State Duty VAT (${Math.round((taxRate || 0) * 100)}%)`,
          },
          unit_amount: Math.round(computedTax * 100),
        },
        quantity: 1,
      });
    }

    // Add professional voucher discount if discount exists
    if (discountAmount > 0) {
      // Stripe checkout sessions support dynamic discount coupons.
      // Alternatively, we deduct proportional discount from other items, or create a Stripe coupon.
      // However, creating a dynamic 1-off coupon or adding a custom negative unit-price line item is sometimes restricted.
      // Modern Stripe Checkout supports negative unit price line_items under standard integrations!
      // Let's create a negative line item for the discount, which is super reliable.
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Voucher Discount Applied (LUXE25)',
          },
          unit_amount: -Math.round(discountAmount * 100),
        },
        quantity: 1,
      });
    }

    // 4. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${originUrl || 'http://localhost:3000'}/?view=checkout-success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${originUrl || 'http://localhost:3000'}/?view=checkout-cancel`,
      metadata: {
        orderId: order._id.toString(),
      },
    });

    // 5. Update MongoDB pending order with active session ID
    order.stripeSessionId = session.id;
    await order.save();

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      orderId: order._id,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Verify Stripe Checkout Session & complete order
// @route   POST /api/stripe/verify-session
// @access  Public (Optional Auth)
export async function verifyCheckoutSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { sessionId } = req.body;

  try {
    const stripe = getStripe();

    if (!sessionId) {
      next(new APIError('Stripe checkout session ID is required for validation', 400));
      return;
    }

    // 1. Retrieve and expand Stripe Checkout Session to inspect payment intent
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    if (session.payment_status !== 'paid') {
      next(new APIError('Stripe transaction checks report unpaid status or pending flag', 400));
      return;
    }

    const paymentIntent = session.payment_intent as Stripe.PaymentIntent;
    const stripePaymentIntentId = paymentIntent?.id || '';
    
    // Retrieve Transaction ID (Charge ID)
    let stripeTransactionId = '';
    if (paymentIntent) {
      const chargeId = paymentIntent.latest_charge;
      if (typeof chargeId === 'string') {
        stripeTransactionId = chargeId;
      } else if (chargeId && typeof chargeId === 'object') {
        stripeTransactionId = (chargeId as any).id || '';
      } else if ((paymentIntent as any).charges?.data?.[0]?.id) {
        stripeTransactionId = (paymentIntent as any).charges.data[0].id;
      }
    }

    // 2. Locate matching order in DB
    const orderId = session.metadata?.orderId;
    let order = null;

    if (orderId) {
      order = await Order.findById(orderId);
    } else {
      order = await Order.findOne({ stripeSessionId: sessionId });
    }

    if (!order) {
      next(new APIError('Matching system order not detected for validation', 404));
      return;
    }

    // 3. Mark Order as paid and processable
    if (order.status === 'Pending') {
      order.status = 'Processing';
    }
    
    order.stripeSessionId = sessionId;
    order.stripePaymentIntentId = stripePaymentIntentId;
    order.stripeTransactionId = stripeTransactionId;
    
    await order.save();

    res.json({
      success: true,
      message: 'Secure payment transaction confirmed. Logistics carriage in execution.',
      order,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get Stripe Publishable key config
// @route   GET /api/stripe/config
// @access  Public
export async function getStripeConfig(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  });
}

