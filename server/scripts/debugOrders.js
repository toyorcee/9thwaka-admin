import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from '../models/Order.js';

dotenv.config();

async function debugOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/9thwaka', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const orders = await Order.find().sort({ createdAt: -1 }).limit(10);

    if (!orders.length) {
      console.log('No orders found in the database.');
    } else {
      console.log('🔍 Found the 10 most recent orders:');
      orders.forEach(order => {
        console.log(JSON.stringify(order, null, 2));
      });
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

debugOrders();
