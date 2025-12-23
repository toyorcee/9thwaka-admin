import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import User from '../models/User.js';
import RiderLocation from '../models/RiderLocation.js';

dotenv.config();

const cleanup = async () => {
  console.log('🧹 Cleaning up old test data...');
  const testUsers = await User.find({ email: /^test-(customer|rider)-\d+@test\.com$/ });

  if (testUsers.length === 0) {
    console.log('No old test data found to clean up.');
    return;
  }

  const userIds = testUsers.map(u => u._id);
  const customerIds = testUsers.filter(u => u.role === 'customer').map(u => u._id);
  const riderIds = testUsers.filter(u => u.role === 'rider').map(u => u._id);

  console.log(`Found ${customerIds.length} test customers and ${riderIds.length} test riders to delete.`);

  // Delete orders associated with test customers and riders
  const { deletedCount: deletedOrders } = await Order.deleteMany({ 
    $or: [{ customerId: { $in: userIds } }, { riderId: { $in: userIds } }] 
  });
  if (deletedOrders > 0) {
    console.log(`🔥 Deleted ${deletedOrders} associated orders.`);
  }

  // Delete rider locations
  const { deletedCount: deletedLocations } = await RiderLocation.deleteMany({ riderId: { $in: riderIds } });
  if (deletedLocations > 0) {
    console.log(`🔥 Deleted ${deletedLocations} associated rider locations.`);
  }

  // Delete the users themselves
  const { deletedCount: deletedUsers } = await User.deleteMany({ _id: { $in: userIds } });
  if (deletedUsers > 0) {
    console.log(`🔥 Deleted ${deletedUsers} test user(s).`);
  }
};

const createCustomer = async (index) => {
  const customer = new User({
    email: `test-customer-${Date.now()}-${index}@test.com`,
    password: 'test123',
    role: 'customer',
    isVerified: true,
  });
  await customer.save();
  console.log(`✅ Created customer: ${customer.email}`);
  return customer;
};

const createRider = async (index) => {
  const rider = new User({
    email: `test-rider-${Date.now()}-${index}@test.com`,
    password: 'test123',
    role: 'rider',
    isVerified: true,
    kyc: {
      nin: { number: '12345678901', isVerified: true },
      driversLicense: { number: 'DLI12345', isVerified: true },
      vehicle: { pictureUrl: 'http://example.com/vehicle.jpg', isVerified: true },
      address: { line1: '123 Test St', city: 'Lagos', state: 'Lagos', isVerified: true },
      bank: { accountName: 'Test Rider', accountNumber: '0123456789', bankName: 'Test Bank', isVerified: true },
    },
  });
  await rider.save();

  // Set rider to online
  await RiderLocation.findOneAndUpdate(
    { riderId: rider._id },
    { 
      riderId: rider._id, 
      isOnline: true, 
      location: { type: 'Point', coordinates: [3.3792, 6.5244] } 
    },
    { upsert: true, new: true }
  );

  console.log(`✅ Created rider: ${rider.email}`);
  return rider;
};

const createOrder = async (customerId, riderId) => {
  const order = new Order({
    customerId,
    riderId,
    pickup: {
      address: 'Test Pickup Address',
      lat: 6.5244,
      lng: 3.3792,
    },
    dropoff: {
      address: 'Test Dropoff Address',
      lat: 6.5244,
      lng: 3.3792,
    },
    items: 'Test Order',
    serviceType: 'courier',
    preferredVehicleType: 'motorbike',
    price: 5000,
    originalPrice: 5000,
    status: 'delivered',
    delivery: {
      deliveredAt: new Date(),
    },
  });
  await order.save();
  console.log(`✅ Created order: ${order.orderId} for customer ${customerId}`);
  return order;
};

const run = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in your .env file');
    }
    await mongoose.connect(MONGODB_URI);
    console.log('📊 Connected to MongoDB');

    await cleanup();

    console.log('🌱 Seeding 10 new customers, riders, and orders...');
    for (let i = 1; i <= 10; i++) {
      const customer = await createCustomer(i);
      const rider = await createRider(i);
      await createOrder(customer._id, rider._id);
      // Small delay to ensure unique timestamps for emails if script runs too fast
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    console.log('✅ Seeding complete.');

  } catch (error) {
    console.error('❌ An error occurred:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

run();
