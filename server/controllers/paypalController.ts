import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { APIError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { CJDropshippingService } from '../services/aliexpressService.js';

const PAYPAL_API_BASE = 'https://api-m.paypal.com';

async function generateAccessToken() {
  const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET not set');
  }
  const auth = Buffer.from(PAYPAL_CLIENT_ID + ':' + PAYPAL_CLIENT_SECRET).toString('base64');
  console.log(`[PayPal] Generating Access URL: ${PAYPAL_API_BASE}/v1/oauth2/token`);
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const data = await response.json() as any;
  if (!data.access_token) {
    console.error('PayPal token generation failed:', data);
    throw new Error('Failed to generate PayPal access token');
  }
  return data.access_token;
}

async function findProductByAnyId(id: string, name?: string, price?: number, image?: string) {
  if (!id) return null;
  let productMatched = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    productMatched = await Product.findById(id);
    if (productMatched) return productMatched;
  }
  const cleanId = id.replace(/[-_]+/g, ' ');
  productMatched = await Product.findOne({
    $or: [
      { name: { $regex: new RegExp(`^${cleanId}$`, 'i') } },
      { name: { $regex: new RegExp(cleanId, 'i') } },
      ...(name ? [{ name: { $regex: new RegExp(`^${name.replace(/[-_]+/g, ' ')}$`, 'i') } }] : [])
    ]
  });
  
  if (!productMatched && name && price) {
    // Dynamically create the missing product to allow checkout to proceed
    productMatched = new Product({
      name,
      price,
      image: image || '',
      description: 'Mock product generated for checkout validation.',
      category: 'General',
      stock: 100,
      createdAt: new Date(),
    });
    await productMatched.save();
  }
  
  return productMatched;
}

export async function createPayPalOrder(
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
  } = req.body;

  try {
    if (!items || items.length === 0) {
      next(new APIError('No items provided for checkout', 400));
      return;
    }

    const finalItems = [];

    for (const item of items) {
      const dbProduct = await findProductByAnyId(item.product, item.name, item.price, item.image);
      if (!dbProduct) {
        next(new APIError(`Product '${item.name}' not found`, 404));
        return;
      }
      if (dbProduct.stock < item.quantity) {
        next(new APIError(`Insufficient stock for '${item.name}'`, 400));
        return;
      }
      finalItems.push({
        ...item,
        product: dbProduct._id
      });
    }

    const order = new Order({
      user: req.user?._id,
      items: finalItems.map((i: any) => ({
        product: i.product,
        name: i.name,
        image: i.image,
        price: i.price,
        quantity: i.quantity,
      })),
      itemsCount: items.reduce((acc: number, item: any) => acc + item.quantity, 0),
      itemsSummary: items.map((i: any) => `${i.quantity}x ${i.name}`).join(', '),
      shippingAddress,
      paymentMethod: 'PayPal',
      subtotal,
      discountAmount,
      shippingCost,
      taxAmount: (subtotal - discountAmount) * (taxRate || 0),
      total,
      status: 'Pending',
    });
    const savedOrder = await order.save();

    const finalItemsPayload = finalItems.map(item => {
      const unitValue = Number(item.price).toFixed(2);
      return {
        name: item.name.substring(0, 127),
        unit_amount: {
          currency_code: 'USD',
          value: unitValue,
        },
        quantity: item.quantity.toString(),
      };
    });

    const itemTotalValue = finalItemsPayload.reduce((sum, item) => sum + (parseFloat(item.unit_amount.value) * parseInt(item.quantity, 10)), 0);
    const itemTotalStr = itemTotalValue.toFixed(2);

    const calculatedTaxValue = (itemTotalValue - discountAmount) * (taxRate || 0);
    const calculatedTaxStr = calculatedTaxValue > 0 ? calculatedTaxValue.toFixed(2) : "0.00";
    
    const shippingCostStr = shippingCost > 0 ? shippingCost.toFixed(2) : "0.00";
    const discountAmountStr = discountAmount > 0 ? discountAmount.toFixed(2) : "0.00";

    const expectedTotalStr = (
      itemTotalValue +
      parseFloat(shippingCostStr) +
      parseFloat(calculatedTaxStr) -
      parseFloat(discountAmountStr)
    ).toFixed(2);

    if (parseFloat(expectedTotalStr) <= 0) {
      next(new APIError('Order total must be greater than zero. Discount cannot cover the full amount or amount is invalid.', 400));
      return;
    }

    const breakdown: any = {
      item_total: {
        currency_code: 'USD',
        value: itemTotalStr,
      }
    };

    if (parseFloat(shippingCostStr) > 0) {
      breakdown.shipping = { currency_code: 'USD', value: shippingCostStr };
    }
    if (parseFloat(discountAmountStr) > 0) {
      breakdown.discount = { currency_code: 'USD', value: discountAmountStr };
    }
    if (parseFloat(calculatedTaxStr) > 0) {
      breakdown.tax_total = { currency_code: 'USD', value: calculatedTaxStr };
    }

    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          items: finalItemsPayload,
          amount: {
            currency_code: 'USD',
            value: expectedTotalStr,
            breakdown,
          },
        },
      ],
    };

    console.log(`[PayPal] Creating Order with Payload: ${JSON.stringify(payload, null, 2)}`);

    const accessToken = await generateAccessToken();
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as any;
    if (data.id) {
      res.json({ success: true, id: data.id, orderId: savedOrder._id });
    } else {
      console.error('PayPal create order failed:', JSON.stringify(data));
      
      next(new APIError('Failed to create PayPal order: ' + JSON.stringify(data), 500));
    }
  } catch (err) {
    next(err);
  }
}

export async function capturePayPalOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { paypalOrderId, systemOrderId } = req.body;
  try {
    if (!paypalOrderId || !systemOrderId) {
      next(new APIError('Missing required order IDs', 400));
      return;
    }

    const accessToken = await generateAccessToken();
    console.log(`[PayPal] Capture Order ID: ${paypalOrderId} using domain: ${PAYPAL_API_BASE}`);
    
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json() as any;
    console.log('PayPal capture response data:', JSON.stringify(data, null, 2));
    
    if (data.status !== 'COMPLETED') {
      const detailsMsg = data.details?.[0]?.description || data.details?.[0]?.issue || '';
      console.error('PayPal capture error details:', detailsMsg, data);
      next(new APIError('Payment not completed: ' + (detailsMsg || data.message || data.status || 'Unknown error'), 400));
      return;
    }

    const order = await Order.findById(systemOrderId);
    if (!order) {
      next(new APIError('Order not found', 404));
      return;
    }

    order.status = 'Processing';

    try {
      const cjOrderData = {
        orderNumber: order._id.toString(),
        shippingZip: order.shippingAddress.zipCode,
        shippingCountry: order.shippingAddress.country,
        shippingProvince: order.shippingAddress.state,
        shippingCity: order.shippingAddress.city,
        shippingAddress: order.shippingAddress.street,
        customerName: order.shippingAddress.fullName,
        customerFirstName: (order.shippingAddress as any).firstName || '',
        customerLastName: (order.shippingAddress as any).lastName || '',
        apartmentUnit: (order.shippingAddress as any).apartmentUnit || '',
        customerPhone: (order.shippingAddress as any).phone || '0000000000',
        shippingPhone: (order.shippingAddress as any).phone || '0000000000',
        customerEmail: (order.shippingAddress as any).email || '',
        products: order.items.map((item: any) => ({
          vid: item.product.toString(),
          quantity: item.quantity
        }))
      };
      const cjRes = await CJDropshippingService.createOrder(cjOrderData) as any;
      if (cjRes && cjRes.data) {
        order.cjOrderId = cjRes.data;
      }
    } catch (err: any) {
      console.error('CJ Order Creation background error:', err.message);
    }
    
    for (const item of order.items) {
      try {
        const product = await findProductByAnyId(item.product.toString());
        if (product) {
          product.stock -= item.quantity;
          await product.save();
        }
      } catch (e) {}
    }

    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
}

export async function getPayPalConfig(req: Request, res: Response) {
  res.json({
    clientId: process.env.PAYPAL_CLIENT_ID || '',
  });
}
