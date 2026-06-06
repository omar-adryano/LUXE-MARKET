import cron from 'node-cron';
import { Order } from '../models/Order';
import { CJDropshippingService } from '../services/aliexpressService';

// Run every 6 hours
export const startTrackingCron = () => {
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔄 [Cron] Running CJ tracking sync...');
    try {
      // Find orders that are Processing or Shipped and have a CJ order ID
      const activeOrders = await Order.find({
        status: { $in: ['Processing', 'Shipped'] },
        cjOrderId: { $exists: true, $ne: null }
      });
      
      console.log(`[Cron] Found ${activeOrders.length} active orders to check.`);

      for (const order of activeOrders) {
        try {
          const trackInfo = await CJDropshippingService.trackOrder(order.cjOrderId) as any;
          if (trackInfo && trackInfo.data) {
            const trackingData = trackInfo.data[0] || trackInfo.data;
            const status = trackingData.status;

            if (trackingData.trackingNumber && !order.trackingNumber) {
              order.trackingNumber = trackingData.trackingNumber;
              order.status = 'Shipped';
              order.trackingStep = 2;
            }

            if (status === 'Delivered' || status === 'completed') {
               order.status = 'Delivered';
               order.trackingStep = 3;
            }
            
            await order.save();
          }
        } catch (err: any) {
          console.error(`[Cron] Error syncing order ${order._id}:`, err.message);
        }
      }
    } catch (error) {
      console.error('[Cron] Error running tracking sync:', error);
    }
  });
};
