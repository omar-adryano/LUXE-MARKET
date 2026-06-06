import { Router } from 'express';
import userRoutes from './userRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import orderRoutes from './orderRoutes';
import reviewRoutes from './reviewRoutes';
import wishlistRoutes from './wishlistRoutes';
import paypalRoutes from './paypalRoutes';
import adminRoutes from './adminRoutes';
import aliexpressRoutes from './aliexpressRoutes';

const apiRouter = Router();

apiRouter.use('/users', userRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/wishlist', wishlistRoutes);
apiRouter.use('/paypal', paypalRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/aliexpress', aliexpressRoutes);

export default apiRouter;
