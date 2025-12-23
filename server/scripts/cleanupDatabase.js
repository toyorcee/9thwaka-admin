import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import User from '../models/User.js';
import RiderLocation from '../models/RiderLocation.js';
import RiderPayout from '../models/RiderPayout.js';
import Transaction from '../models/Transaction.js';

dotenv.config();

const cleanupDatabase = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in your .env file');
    }
    await mongoose.connect(MONGODB_URI);
    console.log('📊 Connected to MongoDB');

    console.log('🧹 Starting database cleanup...');

    const deletedOrders = await Order.deleteMany({});
    console.log(`🔥 Deleted ${deletedOrders.deletedCount} orders.`);

    const deletedUsers = await User.deleteMany({ role: { $ne: 'admin' } });
    console.log(`🔥 Deleted ${deletedUsers.deletedCount} users (customers and riders).`);

    const deletedLocations = await RiderLocation.deleteMany({});
    console.log(`🔥 Deleted ${deletedLocations.deletedCount} rider locations.`);

    const deletedPayouts = await RiderPayout.deleteMany({});
    console.log(`🔥 Deleted ${deletedPayouts.deletedCount} rider payouts (commissions).`);

    const deletedTransactions = await Transaction.deleteMany({});
    console.log(`🔥 Deleted ${deletedTransactions.deletedCount} transactions.`);

    console.log('✅ Database cleanup complete.');

  } catch (error) {
    console.error('❌ An error occurred during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

cleanupDatabase();
