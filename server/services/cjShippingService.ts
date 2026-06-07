import fetch from 'node-fetch';
import { ShippingCache } from '../models/ShippingCache';
import { APIError } from '../middleware/errorHandler';

export class CJShippingService {
  private static BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';
  private static cachedToken: string | null = null;
  private static tokenExpiry: Date | null = null;
  private static lastRequestTime: number = 0;

  static async getAccessToken(): Promise<string> {
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
      if (data.data.accessTokenExpiryDate) {
        this.tokenExpiry = new Date(data.data.accessTokenExpiryDate);
      } else {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 12);
        this.tokenExpiry = expiry;
      }

      return this.cachedToken!;
    } catch (error: any) {
      console.error('[CJShippingService.getAccessToken] error:', error);
      throw new APIError(`Failed to authenticate with CJ Dropshipping: ${error.message}`, 500);
    }
  }

  // Rate Limiter logic: 1 request per second
  static async throttleRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLast = now - this.lastRequestTime;
    const minInterval = 1050; // 1050ms to be safe for 1req/sec

    if (timeSinceLast < minInterval) {
      const delay = minInterval - timeSinceLast;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    this.lastRequestTime = Date.now();
  }

  static async calculateFreight(vid: string, countryCode: string, quantity: number = 1) {
    try {
      await this.throttleRequest();
      const token = await this.getAccessToken();

      const response = await fetch(`${this.BASE_URL}/logistic/freightCalculate`, {
        method: 'POST',
        headers: { 
          'CJ-Access-Token': token, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          startCountryCode: "CN", 
          endCountryCode: countryCode, 
          products: [{ quantity, vid }] 
        })
      });

      const data = await response.json() as any;
      
      if (!data.success) {
        console.warn(`[CJShippingService] CJ freight API failed for vid ${vid}:`, data.message);
        return null; // Handle graceful failure
      }

      return data.data; // Usually returns a list of logistics options
    } catch (error: any) {
      console.error(`[CJShippingService] Error calculating freight for vid ${vid}:`, error.message);
      return null;
    }
  }

  static async updateCacheForVariant(vid: string, countryCode: string) {
     const options = await this.calculateFreight(vid, countryCode, 1);
     if (!options || options.length === 0) return null;

     // Take the cheapest trackable standard option, or first available if simplified
     const bestOption = options[0]; // Simplification for now

     if (bestOption) {
        const cost = typeof bestOption.logisticPrice === 'number' ? bestOption.logisticPrice : Number(bestOption.logisticPrice || 0);
        
        await ShippingCache.findOneAndUpdate(
           { vid, countryCode },
           {
               logisticsName: bestOption.logisticName || 'Standard',
               shippingCost: cost,
               estimatedDays: bestOption.logisticAging || '7-15',
               updatedAt: new Date()
           },
           { upsert: true, new: true }
        );
        return cost;
     }

     return null;
  }
}
