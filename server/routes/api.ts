import { Router } from 'express';
import userRoutes from './userRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import orderRoutes from './orderRoutes';
import reviewRoutes from './reviewRoutes';
import wishlistRoutes from './wishlistRoutes';
import stripeRoutes from './stripeRoutes';
import adminRoutes from './adminRoutes';

const apiRouter = Router();

apiRouter.use('/users', userRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/wishlist', wishlistRoutes);
apiRouter.use('/stripe', stripeRoutes);
apiRouter.use('/admin', adminRoutes);

export default apiRouter;
