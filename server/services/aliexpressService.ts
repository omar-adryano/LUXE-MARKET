import fetch from 'node-fetch';
import { APIError } from '../middleware/errorHandler';
import { Product } from '../models/Product';

/**
 * Service to interact with CJ Dropshipping API (replacing AliExpress RapidAPI)
 */
export class CJDropshippingService {
  private static cachedToken: string | null = null;
  private static tokenExpiry: Date | null = null;
  private static BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

  /**
   * Auto-authenticate and cache token
   */
  private static async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.cachedToken;
    }

    const email = process.env.CJ_API_EMAIL;
    const apiKey = process.env.CJ_API_KEY;

    if (!email || !apiKey) {
      throw new APIError('CJ Dropshipping credentials not configured.', 500);
    }

    try {
      const response = await fetch(`${this.BASE_URL}/authentication/getAccessToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: apiKey }),
      });

      const data = await response.json() as any;
      if (!data.success || !data.data?.accessToken) {
        throw new Error(data.message || 'Authentication failed');
      }

      this.cachedToken = data.data.accessToken;
      // Token usually expires after some time, parse expiry if possible or set a default (e.g. 24h)
      if (data.data.accessTokenExpiryDate) {
        this.tokenExpiry = new Date(data.data.accessTokenExpiryDate);
      } else {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 12);
        this.tokenExpiry = expiry;
      }

      return this.cachedToken;
    } catch (error: any) {
      console.error('[CJDropshipping.getAccessToken] error:', error);
      throw new APIError(`Failed to authenticate with CJ Dropshipping: ${error.message}`, 500);
    }
  }

  /**
   * Search products by keyword or category
   */
  static async getProducts(keyword: string = '', page: number = 1) {
    try {
      const token = await this.getAccessToken();
      // Using /product/trend/list if keyword is ignored
      const response = await fetch(`${this.BASE_URL}/product/list?pageNum=${page}&pageSize=50` + (keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''), {
        headers: { 'CJ-Access-Token': token }
      });

      const data = await response.json() as any;
      if (!data.success) {
        throw new Error(data.message || 'Product search failed');
      }

      return data.data; // Usually an object with { pageNum, total, list: [...] }
    } catch (error: any) {
      console.error('[CJDropshipping.getProducts] error:', error);
      throw new APIError(`Failed to fetch products from CJ Dropshipping: ${error.message}`, 500);
    }
  }

  /**
   * Get product info
   */
  static async getProductInfo(productId: string) {
    try {
      const token = await this.getAccessToken();
      // Using /product/query as it retrieves full details for a pid
      const response = await fetch(`${this.BASE_URL}/product/query?pid=${productId}`, {
        headers: { 'CJ-Access-Token': token }
      });

      const data = await response.json() as any;
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch product info');
      }

      return data.data;
    } catch (error: any) {
      console.error('[CJDropshipping.getProductInfo] error:', error);
      throw new APIError(`Failed to fetch product info: ${error.message}`, 500);
    }
  }

  /**
   * Import product to MongoDB
   */
  static async importProductToDB(productId: string, fallbackImage?: string) {
    try {
      const info = await this.getProductInfo(productId);
      if (!info || !info.productNameEn) {
        throw new APIError('Invalid product data received from CJ Dropshipping', 400);
      }

      const existingProduct = await Product.findOne({ aliexpressProductId: productId });
      if (existingProduct) {
        throw new APIError('Product is already imported', 409);
      }

      const getPrices = () => {
         let p = 0;
         if (info.sellPrice) p = Number(info.sellPrice);
         else if (info.variants && info.variants.length > 0) p = Number(info.variants[0].variantSellPrice) || Number(info.variants[0].sellPrice) || 0;
         
         let basePrice = isNaN(p) || p <= 0 ? 10 : p; // fallback to 10 if parsed as NaN
         let salePrice = basePrice * 3;
         if (salePrice < 4.99) salePrice = 4.99;
         
         // Round to .99 ending
         salePrice = Math.floor(salePrice) + 0.99;

         // Target discount range: 15%–35%
         // If sale is 20% off original, then original = sale / 0.8
         // discount between 15% and 35% means original is sale / (1 - discountPercentage)
         // where discountPercentage is random between 0.15 and 0.35
         const discount = 0.15 + Math.random() * 0.20;
         let originalPrice = salePrice / (1 - discount);
         originalPrice = Math.floor(originalPrice) + 0.99;

         return { salePrice, originalPrice };
      };

      let finalImage = fallbackImage || info.productImageSet?.[0] || info.bigImage || '';
      if (!fallbackImage && info.productImage) {
        try {
          const parsed = JSON.parse(info.productImage);
          if (Array.isArray(parsed) && parsed.length > 0) finalImage = parsed[0];
          else if (typeof parsed === 'string') finalImage = parsed;
        } catch {
          if (typeof info.productImage === 'string') finalImage = info.productImage;
        }
      }

      const { salePrice, originalPrice } = getPrices();

      const importedProductData = {
         name: info.productNameEn || info.productName,
         category: info.categoryName || 'Imported CJ',
         price: salePrice,
         originalPrice: originalPrice,
        image: finalImage,
        thumbnails: info.productImageSet || [],
        description: info.remark || info.productNameEn,
        stock: info.listedNum || 100,
        source: 'cj',
        aliexpressProductId: productId,
        aliexpressUrl: `https://cjdropshipping.com/product/${productId}.html`, 
      };

      const product = await Product.create(importedProductData);
      return product;
    } catch (error: any) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error('[CJDropshipping.importProductToDB] error:', error);
      throw new APIError(`Failed to import product: ${error.message}`, 500);
    }
  }

  /**
   * Auto-fulfill orders through CJ API (Scaffold)
   */
  static async createOrder(orderData: any) {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(`${this.BASE_URL}/shopping/order/createOrder`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'CJ-Access-Token': token 
        },
        body: JSON.stringify(orderData)
      });
      const data = await response.json() as any;
      return data;
    } catch (error: any) {
      throw new APIError(`Failed to create order on CJ Dropshipping: ${error.message}`, 500);
    }
  }

  /**
   * Sync tracking numbers back to orders (Scaffold)
   */
  static async trackOrder(trackNumber: string) {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(`${this.BASE_URL}/logistic/track/queryTrack?trackNumber=${trackNumber}`, {
        method: 'GET',
        headers: { 'CJ-Access-Token': token }
      });
      const data = await response.json() as any;
      return data;
    } catch (error: any) {
      throw new APIError(`Failed to track order: ${error.message}`, 500);
    }
  }
}
