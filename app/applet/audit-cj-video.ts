import { CJDropshippingService } from './server/services/aliexpressService';

async function audit() {
  console.log("Fetching CJ product list...");
  // Use getProducts to get a list
  const data = await CJDropshippingService.getProducts('home', 1);
  const products = data.data.list;
  
  if (products && products.length > 0) {
    const rawUrl = 'https://developers.cjdropshipping.com/api2.0/v1/product/query';
    console.log(`\nExact CJ API endpoint used: ${rawUrl}`);

    console.log(`\n\n--- Raw CJ API response for a real product ---`);
    const p1 = products[0];
    const pid = p1.pid;
    const detail = await CJDropshippingService.getProductInfo(pid);
    
    // Print all keys
    console.log("Response fields in detail data:");
    console.log(Object.keys(detail.data || {}));
    
    // Check if video fields exist
    console.log("\nSearching for video fields (video, videoUrl, videoList, media, mediaList):");
    const testKeys = ['video', 'videoUrl', 'videoList', 'media', 'mediaList'];
    for (const key of testKeys) {
       console.log(`- ${key}: ${detail.data[key] !== undefined ? detail.data[key] : 'Not found'}`);
    }
    
    // Find any key that relates to media
    console.log(`\nAll media-related fields (containing img, url, pic, vid, media, list):`);
    for (const [k, v] of Object.entries(detail.data || {})) {
      if (k.toLowerCase().includes('img') || k.toLowerCase().includes('url') || k.toLowerCase().includes('pic') || k.toLowerCase().includes('vid') || k.toLowerCase().includes('media') || k.toLowerCase().includes('list')) {
        console.log(`${k}: ${JSON.stringify(v)?.substring(0, 100)}...`);
      }
    }
    
    console.log(`\n\n--- For 5 real CJ products ---`);
    for (let i = 0; i < Math.min(5, products.length); i++) {
       const pd = await CJDropshippingService.getProductInfo(products[i].pid);
       const d = pd.data;
       const name = d.productNameEn || d.productName;
       
       let images = 0;
       if (d.productImageSet) {
           images = d.productImageSet.length;
       }
       
       // Detect videos
       let videoUrl = 'Not available';
       let videos = 0;
       if (d.videoUrl) {
           videoUrl = d.videoUrl;
           videos = 1;
       } else if (d.videoList && d.videoList.length > 0) {
           videoUrl = d.videoList[0];
           videos = d.videoList.length;
       } else if (d.productVideo) {
           videoUrl = d.productVideo;
           videos = 1;
       }

       console.log(`Product Name: ${name}`);
       console.log(`Number of Images: ${images}`);
       console.log(`Number of Videos: ${videos}`);
       console.log(`Video URL: ${videoUrl}\n`);
    }
  } else {
    console.log("No products found.");
  }
}

audit().catch(console.error).finally(() => process.exit(0));
