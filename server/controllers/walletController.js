import Wallet from "../models/Wallet.js";
import { getWalletBalance } from "../utils/walletUtils.js";

/**
 * Get wallet balance
 * GET /api/wallet/balance
 */
export const getBalance = async (req, res) => {
  try {
    const balance = await getWalletBalance(req.user._id);
    res.json({
      success: true,
      balance,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Get wallet details with transactions
 * GET /api/wallet
 */
export const getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet) {
      return res.json({
        success: true,
        wallet: {
          balance: 0,
          transactions: [],
        },
      });
    }

    res.json({
      success: true,
      wallet: {
        balance: wallet.balance || 0,
        transactions: wallet.transactions || [],
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};
