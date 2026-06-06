import dotenv from 'dotenv';
dotenv.config();

console.log("CJ_API_EMAIL:", !!process.env.CJ_API_EMAIL);
console.log("CJ_API_KEY:", !!process.env.CJ_API_KEY);
console.log(process.env.MONGODB_URI ? "MongoDB connected" : "No MongoDB");
