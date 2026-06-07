import mongoose from 'mongoose';
import { ShippingCache } from './server/models/ShippingCache';
import dotenv from 'dotenv';
dotenv.config();
mongoose.connect('mongodb://127.0.0.1:27017/luxemarket').then(async () => {
    console.log("Cached items:", await ShippingCache.countDocuments());
    process.exit(0);
});
