
import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const RIDER_EMAIL = 'oluwatoyosiolaniyan@gmail.com';

const checkRiderData = async () => {
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in the .env file.');
    process.exit(1);
  }

  try {
    console.log('Connecting to the database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Database connected successfully.');

    console.log(`Searching for rider with email: ${RIDER_EMAIL}...`);
    const rider = await User.findOne({ email: RIDER_EMAIL }).lean();

    if (rider) {
      console.log('\n✅ Found Rider Data:');
      console.log('--------------------');
      console.log(JSON.stringify(rider, null, 2));
      console.log('--------------------');
    } else {
      console.log(`\n❌ Rider with email ${RIDER_EMAIL} not found.`);
    }
  } catch (error) {
    console.error('\n❌ An error occurred:');
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase connection closed.');
  }
};

checkRiderData();
