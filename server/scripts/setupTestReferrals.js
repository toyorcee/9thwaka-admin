/**
 * Test Script: Setup Test Referrals
 *
 * This script sets up a complete referral scenario to test and award referral rewards.
 * It simulates the referral flow where a rider refers a customer, and when that customer
 * completes 2 orders, the rider receives a ₦1,000 reward in their rewards balance.
 *
 * What this script does:
 * 1. Finds an existing rider in the database (or you can create one first)
 * 2. Generates a referral code for the rider if they don't have one
 * 3. Creates or finds a test customer that was referred by the rider
 * 4. Creates a Referral record linking the rider and customer
 * 5. Checks how many completed orders the customer has
 * 6. Creates additional completed orders if needed (up to 2 total)
 * 7. Automatically triggers the referral bonus award using the production logic
 *    - When customer completes 2 orders, rider gets ₦1,000 added to rewards balance
 *    - Uses the same checkAndAwardReferralBonus function used in production
 * 8. Displays a summary showing:
 *    - Rider information and referral code
 *    - Customer's completed trips count
 *    - Rider's updated rewards balance (should show ₦1,000 if bonus was awarded)
 *    - Referral status (reward paid, amount, etc.)
 *
 * Important Notes:
 * - The script uses production logic, so it properly credits the wallet/rewards balance
 * - The reward is added to the rider's rewards balance (visible in Earnings tab)
 * - If the customer already has 2+ completed trips but bonus wasn't awarded, it will award it now
 * - The script is idempotent - safe to run multiple times
 *
 * Usage: node server/scripts/setupTestReferrals.js
 *
 * After running, check the Earnings tab in the app to see the ₦1,000 reward!
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Referral from "../models/Referral.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
// Don't import controller to avoid circular dependency - we implement the logic directly here

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const COMMISSION_RATE_PERCENT =
  Number(process.env.COMMISSION_RATE_PERCENT) || 10;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env file.");
  process.exit(1);
}

const setupTestReferrals = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("📊 Connected to MongoDB");

    // Find a rider
    const rider = await User.findOne({ role: "rider" });

    if (!rider) {
      console.error(
        "❌ No rider found in the database. Please create a rider first."
      );
      return;
    }

    // Ensure rider has a referral code
    if (!rider.referralCode) {
      console.log("⚠️ Rider doesn't have a referral code. Generating one...");
      const crypto = await import("crypto");
      let code;
      let isUnique = false;
      while (!isUnique) {
        code = crypto.randomBytes(4).toString("hex").toUpperCase();
        const existingUser = await User.findOne({ referralCode: code });
        if (!existingUser) {
          isUnique = true;
        }
      }
      rider.referralCode = code;
      await rider.save();
      console.log(`✅ Generated referral code: ${code}`);
    }

    console.log(`\n👤 Found rider: ${rider.fullName} (${rider.email})`);
    console.log(`   ID: ${rider._id}`);
    console.log(`   Referral Code: ${rider.referralCode}`);

    // Check if customer already exists
    let customer = await User.findOne({
      role: "customer",
      referredBy: rider._id,
    });

    if (customer) {
      console.log(`\n👤 Found existing referred customer: ${customer.email}`);
      console.log(`   ID: ${customer._id}`);
    } else {
      // Create a test customer referred by the rider
      console.log("\n👤 Creating test customer...");
      customer = await User.create({
        email: `test-customer-${Date.now()}@test.com`,
        password: "$2b$10$test", // Dummy password hash
        role: "customer",
        fullName: "Test Customer",
        phoneNumber: "+2348000000000",
        referredBy: rider._id,
        isVerified: true,
        completedTrips: 0,
      });
      console.log(`✅ Created customer: ${customer.email} (${customer._id})`);

      // Create Referral record
      const referral = await Referral.create({
        referrerId: rider._id,
        referredUserId: customer._id,
        referralCode: rider.referralCode,
        completedTrips: 0,
        rewardPaid: false,
      });
      console.log(`✅ Created referral record: ${referral._id}`);
    }

    // Sync customer's completedTrips with actual order count
    const completedOrders = await Order.countDocuments({
      customerId: customer._id,
      status: "delivered",
    });

    // Refresh customer and sync completedTrips with actual count
    customer = await User.findById(customer._id);
    if (customer.completedTrips !== completedOrders) {
      customer.completedTrips = completedOrders;
      await customer.save();
      console.log(
        `\n🔄 Synced customer's completedTrips to ${completedOrders} (from actual order count)`
      );
    }

    console.log(
      `\n📦 Customer has ${customer.completedTrips} completed trip(s)`
    );

    // Create orders until customer has 2 completed trips
    const ordersNeeded = 2 - customer.completedTrips;
    if (ordersNeeded <= 0) {
      console.log(
        `✅ Customer already has ${customer.completedTrips} completed trips.`
      );

      // Check if bonus should be awarded but hasn't been yet
      const referral = await Referral.findOne({
        referrerId: rider._id,
        referredUserId: customer._id,
      });

      if (referral && customer.completedTrips >= 2 && !referral.rewardPaid) {
        console.log(
          `\n🎉 Customer has 2 trips but bonus not awarded yet. Awarding now...`
        );
        console.log(
          `   Referral record - Completed Trips: ${referral.completedTrips}, Reward Paid: ${referral.rewardPaid}`
        );

        // Sync referral record's completedTrips with customer's actual count
        if (referral.completedTrips !== customer.completedTrips) {
          console.log(
            `   Syncing referral record: ${referral.completedTrips} → ${customer.completedTrips}`
          );
          referral.completedTrips = customer.completedTrips;
          await referral.save();
        }

        // Use production function - get the last completed order
        const lastOrder = await Order.findOne({
          customerId: customer._id,
          status: "delivered",
        }).sort({ "delivery.deliveredAt": -1 });

        if (lastOrder) {
          // Structure order so production logic uses customerId (for customer referrals)
          // Convert to plain object and ensure _id is included
          const orderForReferral = {
            ...lastOrder.toObject(),
            _id: lastOrder._id, // Ensure _id is included
            customerId: lastOrder.customerId,
            riderId: undefined, // Remove riderId so production uses customerId
          };

          // Award reward directly - avoid circular dependency by implementing logic here
          console.log(`   Awarding ₦1,000 referral reward directly...`);
          try {
            const REFERRAL_REWARD_AMOUNT = 1000;
            const REQUIRED_TRIPS = 2;

            // Check if referral meets requirements
            if (
              referral.completedTrips >= REQUIRED_TRIPS &&
              !referral.rewardPaid
            ) {
              // Credit wallet
              const { creditWallet } = await import("../utils/walletUtils.js");
              const wallet = await creditWallet(
                rider._id,
                REFERRAL_REWARD_AMOUNT,
                {
                  type: "referral_reward",
                  orderId: lastOrder._id,
                  referralId: referral._id,
                  description: `Referral reward: ${
                    customer.fullName || customer.email
                  } completed ${REQUIRED_TRIPS} trips`,
                  metadata: {
                    referredUserId: customer._id.toString(),
                    referralId: referral._id.toString(),
                  },
                }
              );

              // Update referral record
              referral.rewardAmount = REFERRAL_REWARD_AMOUNT;
              referral.rewardPaid = true;
              referral.paidAt = new Date();

              // Create transaction record
              const transaction = await Transaction.create({
                orderId: lastOrder._id,
                customerId: lastOrder.customerId,
                riderId: lastOrder.riderId,
                type: "referral_reward",
                amount: REFERRAL_REWARD_AMOUNT,
                currency: "NGN",
                status: "completed",
                description: `Referral reward (wallet credit): ${
                  customer.fullName || customer.email
                } completed ${REQUIRED_TRIPS} trips`,
                metadata: {
                  referrerId: rider._id.toString(),
                  referredUserId: customer._id.toString(),
                  referralId: referral._id.toString(),
                  walletId: wallet._id.toString(),
                  creditedToWallet: true,
                },
                processedAt: new Date(),
              });

              referral.transactionId = transaction._id;
              await referral.save();

              // Update rider's stats
              rider.referralRewardEarned =
                (rider.referralRewardEarned || 0) + REFERRAL_REWARD_AMOUNT;
              rider.referralRewardPaid =
                (rider.referralRewardPaid || 0) + REFERRAL_REWARD_AMOUNT;
              await rider.save();

              console.log(
                `✅ Awarded ₦1,000 referral bonus! Wallet balance: ₦${wallet.balance}`
              );
            } else {
              console.log(
                `⚠️ Referral doesn't meet requirements: trips=${referral.completedTrips}, paid=${referral.rewardPaid}`
              );
            }
          } catch (awardError) {
            console.error("❌ Failed to award bonus:");
            console.error("   Error:", awardError.message);
            console.error("   Stack:", awardError.stack);
          }
        } else {
          console.error("⚠️ No completed orders found for customer");
        }
      } else if (referral && referral.rewardPaid) {
        console.log(
          `✅ Referral bonus already awarded (₦${referral.rewardAmount || 0})`
        );
      }
    } else {
      console.log(`\n📦 Creating ${ordersNeeded} test order(s)...`);

      for (let i = 0; i < ordersNeeded; i++) {
        const orderPrice = 5000 + i * 1000; // Varying prices
        const commissionAmount =
          Math.round(((orderPrice * COMMISSION_RATE_PERCENT) / 100) * 100) /
          100;
        const riderNetAmount = orderPrice - commissionAmount;

        const order = await Order.create({
          customerId: customer._id,
          riderId: rider._id, // Assign to the rider
          pickup: {
            address: `Test Pickup Address ${i + 1}`,
            coordinates: { type: "Point", coordinates: [3.39, 6.52] },
          },
          dropoff: {
            address: `Test Dropoff Address ${i + 1}`,
            coordinates: { type: "Point", coordinates: [3.4, 6.53] },
          },
          items: `Test Order ${i + 1} (Referral Test)`,
          price: orderPrice,
          originalPrice: orderPrice,
          serviceType: "courier",
          status: "delivered",
          "delivery.deliveredAt": new Date(),
          financial: {
            grossAmount: orderPrice,
            commissionRatePct: COMMISSION_RATE_PERCENT,
            commissionAmount: commissionAmount,
            riderNetAmount: riderNetAmount,
          },
        });

        console.log(
          `✅ Created order ${order._id} (Price: ₦${orderPrice}, Status: delivered)`
        );

        // Check and award referral bonus if needed
        // We implement the logic directly to avoid circular dependency
        try {
          // Refresh customer to get updated trip count
          customer = await User.findById(customer._id);

          // Find referral record
          const referralRecord = await Referral.findOne({
            referrerId: rider._id,
            referredUserId: customer._id,
          });

          if (
            referralRecord &&
            customer.completedTrips >= 2 &&
            !referralRecord.rewardPaid
          ) {
            console.log(
              `   Customer has ${customer.completedTrips} trips - awarding reward...`
            );

            const REFERRAL_REWARD_AMOUNT = 1000;
            const { creditWallet } = await import("../utils/walletUtils.js");
            const wallet = await creditWallet(
              rider._id,
              REFERRAL_REWARD_AMOUNT,
              {
                type: "referral_reward",
                orderId: order._id,
                referralId: referralRecord._id,
                description: `Referral reward: ${
                  customer.fullName || customer.email
                } completed 2 trips`,
                metadata: {
                  referredUserId: customer._id.toString(),
                  referralId: referralRecord._id.toString(),
                },
              }
            );

            referralRecord.rewardAmount = REFERRAL_REWARD_AMOUNT;
            referralRecord.rewardPaid = true;
            referralRecord.paidAt = new Date();

            const transaction = await Transaction.create({
              orderId: order._id,
              customerId: order.customerId,
              riderId: order.riderId,
              type: "referral_reward",
              amount: REFERRAL_REWARD_AMOUNT,
              currency: "NGN",
              status: "completed",
              description: `Referral reward (wallet credit): ${
                customer.fullName || customer.email
              } completed 2 trips`,
              metadata: {
                referrerId: rider._id.toString(),
                referredUserId: customer._id.toString(),
                referralId: referralRecord._id.toString(),
                walletId: wallet._id.toString(),
                creditedToWallet: true,
              },
              processedAt: new Date(),
            });

            referralRecord.transactionId = transaction._id;
            await referralRecord.save();

            rider.referralRewardEarned =
              (rider.referralRewardEarned || 0) + REFERRAL_REWARD_AMOUNT;
            rider.referralRewardPaid =
              (rider.referralRewardPaid || 0) + REFERRAL_REWARD_AMOUNT;
            await rider.save();

            console.log(
              `   ✅ Awarded ₦1,000 reward! Wallet balance: ₦${wallet.balance}`
            );
          }

          console.log(
            `   Customer now has ${
              customer.completedTrips || 0
            } completed trip(s)`
          );
        } catch (referralError) {
          console.error(
            "⚠️ Failed to process referral bonus:",
            referralError.message
          );
          // Continue anyway - the order is created
        }
      }
    }

    // Refresh customer to get final state
    customer = await User.findById(customer._id);

    // Get final wallet balance
    const { getWalletBalance } = await import("../utils/walletUtils.js");
    const walletBalance = await getWalletBalance(rider._id);

    // Get referral stats
    const referral = await Referral.findOne({
      referrerId: rider._id,
      referredUserId: customer._id,
    });

    console.log("\n" + "=".repeat(50));
    console.log("✅ TEST REFERRAL SETUP COMPLETE!");
    console.log("=".repeat(50));
    console.log(`\n👤 Rider: ${rider.fullName} (${rider.email})`);
    console.log(`   Referral Code: ${rider.referralCode}`);
    console.log(
      `\n👤 Referred Customer: ${customer.fullName || customer.email}`
    );
    console.log(`   Completed Trips: ${customer.completedTrips || 0}`);
    console.log(`\n💰 Wallet Balance: ₦${walletBalance.toLocaleString()}`);
    if (referral) {
      console.log(`\n🎁 Referral Status:`);
      console.log(
        `   Reward Amount: ₦${referral.rewardAmount.toLocaleString()}`
      );
      console.log(
        `   Reward Paid: ${referral.rewardPaid ? "Yes ✅" : "No ❌"}`
      );
      if (referral.rewardPaid) {
        console.log(`   Paid At: ${referral.paidAt?.toLocaleString()}`);
      }
    }
    console.log(
      "\n💡 You can now check the wallet balance in the Earnings tab!"
    );
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("❌ Error during setup:", error);
  } finally {
    await mongoose.disconnect();
    console.log("📊 Disconnected from MongoDB");
  }
};

setupTestReferrals();
