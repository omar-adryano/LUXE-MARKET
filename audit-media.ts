import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db');
  console.log("Connected to DB.");

  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));

  for (const coll of collections) {
    const c = db.collection(coll.name);
    console.log(`\n--- ${coll.name} ---`);
    const doc = await c.findOne({});
    if (doc) {
      console.log(JSON.stringify(doc, null, 2).slice(0, 1000));
    }
  }

  // Sample products
  console.log("\n\n==== PRODUCT SAMPLES ====");
  const productsResult = await db.collection('products').find({}).limit(5).toArray();
  for (const p of productsResult) {
    console.log(`Product Name: ${p.name}`);
    console.log(`Image Field: image (and thumbnails)`);
    console.log(`Stored Value: ${p.image}`);
    let storageType = "Unknown";
    if (p.image && p.image.startsWith("http")) storageType = "Public URL";
    else if (p.image && p.image.startsWith("data:")) storageType = "Base64";
    else if (p.image && p.image.startsWith("/")) storageType = "Local File Path";
    console.log(`Storage Type: ${storageType}`);
    console.log("----");
  }

  // Sample users
  console.log("\n\n==== USER SAMPLES ====");
  const usersResult = await db.collection('users').find({ avatar: { $exists: true, $ne: null } }).limit(5).toArray();
  if (usersResult.length === 0) {
    console.log("No users with avatar found.");
  }
  for (const u of usersResult) {
    console.log(`User Name: ${u.name}`);
    console.log(`Image Field: avatar`);
    console.log(`Stored Value: ${u.avatar}`);
    let storageType = "Unknown";
    if (u.avatar && u.avatar.startsWith("http")) storageType = "Public URL";
    else if (u.avatar && u.avatar.startsWith("data:")) storageType = "Base64";
    else if (u.avatar && u.avatar.startsWith("/")) storageType = "Local File Path";
    console.log(`Storage Type: ${storageType}`);
    console.log("----");
  }

  // videos
  console.log("\n\n==== VIDEO SAMPLES ====");
  // let's see if there are any video fields in products
  const videosResult = await db.collection('products').find({ $or: [{ video: { $exists: true } }, { videoUrl: { $exists: true } }] }).limit(5).toArray();
  if (videosResult.length === 0) {
    console.log("No products with video fields found.");
  } else {
    for (const v of videosResult) {
       console.log(`Product Name: ${v.name}`);
       console.log(`Stored Value: ${v.video || v.videoUrl}`);
    }
  }

  process.exit(0);
}

run();
