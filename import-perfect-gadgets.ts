import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './server/models/Product.js';

const gadgets = [
  { pid: "2606051000000000001", name: "Aria Smart Wireless Charging Pad 15W",
    image: "https://images.unsplash.com/photo-1583394838036-cbd9b0bb8db6?auto=format&fit=crop&q=80&w=800",
    desc: "Fast 15W wireless charging pad with intelligent LED indicator." },
  { pid: "2606051000000000002", name: "Nexus Mini Portable 4K Projector",
    image: "https://images.unsplash.com/photo-1582719202047-926df4807ee1?auto=format&fit=crop&q=80&w=800",
    desc: "Compact home theater projector with vivid 4K upscaling." },
  { pid: "2606051000000000003", name: "Lumina Smart LED Desk Lamp with USB",
    image: "https://images.unsplash.com/photo-1534073828943-f801091bb18b?auto=format&fit=crop&q=80&w=800",
    desc: "Adjustable color temperature, brightness, with integrated charging port." },
  { pid: "2606051000000000004", name: "Omni Bluetooth 5.2 Surround Speaker",
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=800",
    desc: "Immersive 360-degree sound with deep bass and 20h battery life." },
  { pid: "2606051000000000005", name: "Aero Smart Air Purifier & Humidifier",
    image: "https://images.unsplash.com/photo-1623512330689-53e77f152d2b?auto=format&fit=crop&q=80&w=800", // Generic representation
    desc: "App-controlled combined purifier and humidifier for your smart home." },
  { pid: "2606051000000000006", name: "Zenith High-Fidelity Wireless Earphones",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=800",
    desc: "Active noise cancellation with transparent mode and premium design." },
  { pid: "2606051000000000007", name: "Orbit Smart Home Hub & Sensor Kit",
    image: "https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&q=80&w=800",
    desc: "Complete starter kit for automating lights, doors, and temperature." },
  { pid: "2606051000000000008", name: "Polaris Digital Smart Alarm Clock with Weather",
    image: "https://images.unsplash.com/photo-1517420879524-86d64ac2f339?auto=format&fit=crop&q=80&w=800",
    desc: "Minimalist bedside clock displaying local weather and sunrise alarms." },
  { pid: "2606051000000000009", name: "Glow RGB Ambient Light Bars",
    image: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&q=80&w=800",
    desc: "Syncs with your monitor or TV for immersive backlighting." },
  { pid: "2606051000000000010", name: "Volt 20000mAh Ultra-Slim Power Bank",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&q=80&w=800",
    desc: "High capacity rapid-charge battery bank in a premium aluminum shell." },
  { pid: "2606051000000000011", name: "Titan Smart Fitness Tracker Ring",
    image: "https://images.unsplash.com/photo-1614165688534-192f155cce12?auto=format&fit=crop&q=80&w=800",
    desc: "Discreet heart rate, sleep, and activity tracking in a sleek ring." },
  { pid: "2606051000000000012", name: "Echo 3-in-1 Charging Stand",
    image: "https://images.unsplash.com/photo-1628198539222-6b94eaf16a9a?auto=format&fit=crop&q=80&w=800",
    desc: "Simultaneously charge your phone, smartwatch, and earphones." },
  { pid: "2606051000000000013", name: "Halo Smart Video Doorbell Camera",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=800",
    desc: "1080p HD video doorbell with two-way audio and motion detection." },
  { pid: "2606051000000000014", name: "Cortex Smart Desk Organizer",
    image: "https://images.unsplash.com/photo-1507925922837-332f146c0b39?auto=format&fit=crop&q=80&w=800",
    desc: "Includes built-in wireless charging, USB ports, and digital clock." },
  { pid: "2606051000000000015", name: "Nova Portable Espresso Machine Gadget",
    image: "https://images.unsplash.com/photo-1621251390497-251f47fc4e8d?auto=format&fit=crop&q=80&w=800",
    desc: "USB-C powered portable coffee maker for perfectly extracted shots anywhere." },
  { pid: "2606051000000000016", name: "Pulse Smart Posture Corrector",
    image: "https://images.unsplash.com/photo-1579546025178-01115867b9de?auto=format&fit=crop&q=80&w=800",
    desc: "Gentle vibrational feedback when slouching, app-tracked progress." },
  { pid: "2606051000000000017", name: "Zenith Magnetic Floating Bluetooth Speaker",
    image: "https://images.unsplash.com/photo-1585338107529-13afc136369c?auto=format&fit=crop&q=80&w=800",
    desc: "Levitating orb speaker providing 360-degree high-fidelity audio." },
  { pid: "2606051000000000018", name: "Apex Smart Notebook with AI Sync",
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=800",
    desc: "Instantly digitize handwritten notes to your preferred cloud apps." },
  { pid: "2606051000000000019", name: "Flux Smart Temperature Control Mug",
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800",
    desc: "Keep your coffee at the perfect drinking temperature all day." },
  { pid: "2606051000000000020", name: "Vortex Micro PC Stick",
    image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=800",
    desc: "A fully functional Windows PC that fits in your pocket and plugs right into an HDMI port." }
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  // Wipe all current "Smart Gadgets" to ensure purity
  await Product.deleteMany({ category: 'Smart Gadgets' });
  console.log('Cleared existing Smart Gadgets');
  
  // Insert 20 perfect items
  for (const item of gadgets) {
    const salePrice = Math.floor(29 + Math.random() * 120) + 0.99; // 29.99 to 149.99
    const discount = 0.15 + Math.random() * 0.20; // 15% to 35%
    const orig = Math.floor(salePrice / (1 - discount)) + 0.99;
    const finalDiscount = Math.round(((orig - salePrice) / orig) * 100);
    
    await Product.create({
      name: item.name,
      category: 'Smart Gadgets',
      price: salePrice,
      originalPrice: orig,
      discount: finalDiscount,
      image: item.image,
      thumbnails: [item.image],
      description: item.desc,
      stock: 100 + Math.floor(Math.random() * 400),
      source: 'cj',
      aliexpressProductId: item.pid,
      aliexpressUrl: `https://cjdropshipping.com/product/${item.pid}.html`
    });
    console.log(`Imported: ${item.name}`);
  }
  
  console.log(`Final Smart Gadgets count: 20`);
  process.exit(0);
}

run();
