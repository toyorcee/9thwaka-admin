import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Wallet from "../models/Wallet.js";

/**
 * Get or create wallet for a user
 * @param {string} userId - User ID
 * @param {mongoose.ClientSession} session - Optional MongoDB session for transactions
 */
export const getOrCreateWallet = async (userId, session = null) => {
  const options = session ? { session } : {};
  let wallet = await Wallet.findOne({ userId }, null, options);
  if (!wallet) {
    wallet = await Wallet.create(
      [
        {
          userId,
          balance: 0,
          transactions: [],
        },
      ],
      options
    );
    wallet = wallet[0] || wallet;
  }
  return wallet;
};

/**
 * Credit wallet (add money)
 * @param {string} userId - User ID
 * @param {number} amount - Amount to credit
 * @param {Object} transactionData - Transaction metadata
 * @param {mongoose.ClientSession} session - Optional MongoDB session for transactions
 */
export const creditWallet = async (
  userId,
  amount,
  transactionData,
  session = null
) => {
  const options = session ? { session } : {};
  const wallet = await getOrCreateWallet(userId, session);
  wallet.balance = (wallet.balance || 0) + amount;

  wallet.transactions.push({
    type: transactionData.type,
    amount: amount,
    orderId: transactionData.orderId || null,
    referralId: transactionData.referralId || null,
    payoutId: transactionData.payoutId || null,
    description: transactionData.description || "",
    metadata: transactionData.metadata || {},
  });

  await wallet.save(options);
  return wallet;
};

/**
 * Debit wallet (subtract money)
 * @param {string} userId - User ID
 * @param {number} amount - Amount to debit
 * @param {Object} transactionData - Transaction metadata
 * @param {mongoose.ClientSession} session - Optional MongoDB session for transactions
 */
export const debitWallet = async (
  userId,
  amount,
  transactionData,
  session = null
) => {
  const options = session ? { session } : {};
  const wallet = await getOrCreateWallet(userId, session);

  if ((wallet.balance || 0) < amount) {
    throw new Error("Insufficient wallet balance");
  }

  wallet.balance = (wallet.balance || 0) - amount;

  wallet.transactions.push({
    type: transactionData.type,
    amount: -amount,
    orderId: transactionData.orderId || null,
    referralId: transactionData.referralId || null,
    payoutId: transactionData.payoutId || null,
    description: transactionData.description || "",
    metadata: transactionData.metadata || {},
  });

  await wallet.save(options);

  if (transactionData.createTransactionRecord !== false) {
    await Transaction.create(
      [
        {
          orderId: transactionData.orderId || null,
          customerId: transactionData.customerId || null,
          riderId: transactionData.riderId || null,
          type:
            transactionData.type === "order_payment"
              ? "order_payment"
              : "commission",
          amount: amount,
          currency: "NGN",
          status: "completed",
          description:
            transactionData.description ||
            `Wallet payment: ${transactionData.type}`,
          metadata: {
            ...transactionData.metadata,
            walletId: wallet._id.toString(),
            paidFromWallet: true,
          },
          processedAt: new Date(),
        },
      ],
      options
    );
  }

  return wallet;
};

/**
 * Get wallet balance
 */
export const getWalletBalance = async (userId) => {
  const wallet = await Wallet.findOne({ userId });
  return wallet ? wallet.balance || 0 : 0;
};
