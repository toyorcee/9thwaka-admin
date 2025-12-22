import axios from "axios";
import crypto from "crypto";

const getPaystackSecretKey = () => {
  return (
    process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_TEST_SECRET_KEY
  );
};

const getPaystackPublicKey = () => {
  return (
    process.env.PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_TEST_PUBLIC_KEY
  );
};

const getPaystackBaseUrl = () => {
  return process.env.PAYSTACK_BASE_URL || "https://api.paystack.co";
};

/**
 * Initialize a Paystack payment transaction
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in kobo (NGN)
 * @param {string} params.email - Customer email
 * @param {string} params.reference - Unique transaction reference
 * @param {string} params.metadata - Additional metadata (riderId, payoutId, etc.)
 * @param {string} params.callback_url - Callback URL after payment
 * @returns {Promise<Object>} Paystack response with authorization_url
 */
export const initializePayment = async ({
  amount,
  email,
  reference,
  metadata = {},
  callback_url,
}) => {
  // Get keys at function call time (after dotenv has loaded)
  const PAYSTACK_SECRET_KEY = getPaystackSecretKey();
  const PAYSTACK_BASE_URL = getPaystackBaseUrl();

  // Validate Paystack key before making request
  if (!PAYSTACK_SECRET_KEY) {
    console.error("[PAYSTACK] Secret key is missing");
    return {
      success: false,
      error:
        "Payment service is not properly configured. Please contact support.",
    };
  }

  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        amount: Math.round(amount * 100), // Convert to kobo
        email,
        reference,
        metadata,
        callback_url,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      authorization_url: response.data.data.authorization_url,
      access_code: response.data.data.access_code,
      reference: response.data.data.reference,
    };
  } catch (error) {
    console.error(
      "[PAYSTACK] Initialize payment error:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to initialize payment",
    };
  }
};

/**
 * Verify a Paystack transaction
 * @param {string} reference - Transaction reference
 * @returns {Promise<Object>} Transaction details
 */
export const verifyPayment = async (reference) => {
  // Get keys at function call time (after dotenv has loaded)
  const PAYSTACK_SECRET_KEY = getPaystackSecretKey();
  const PAYSTACK_BASE_URL = getPaystackBaseUrl();

  if (!PAYSTACK_SECRET_KEY) {
    console.error("[PAYSTACK] Secret key is missing");
    return {
      success: false,
      error:
        "Payment service is not properly configured. Please contact support.",
    };
  }

  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const transaction = response.data.data;

    return {
      success: true,
      data: {
        reference: transaction.reference,
        amount: transaction.amount / 100, // Convert from kobo to Naira
        status: transaction.status,
        gateway_response: transaction.gateway_response,
        paid_at: transaction.paid_at,
        created_at: transaction.created_at,
        customer: transaction.customer,
        metadata: transaction.metadata,
      },
    };
  } catch (error) {
    console.error(
      "[PAYSTACK] Verify payment error:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to verify payment",
    };
  }
};

/**
 * Verify Paystack webhook signature
 * @param {string} signature - Webhook signature from Paystack
 * @param {Object} body - Request body
 * @returns {boolean} True if signature is valid
 */
export const verifyWebhookSignature = (signature, body) => {
  const PAYSTACK_SECRET_KEY = getPaystackSecretKey();

  if (!PAYSTACK_SECRET_KEY) {
    console.error("[PAYSTACK] Secret key is missing for webhook verification");
    return false;
  }

  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(body))
    .digest("hex");

  return hash === signature;
};

/**
 * Get Paystack public key (for frontend)
 */
export const getPublicKey = () => {
  return getPaystackPublicKey();
};

/**
 * Get list of banks from Paystack
 * @returns {Promise<Object>} List of banks with codes
 */
export const getBanks = async () => {
  const PAYSTACK_SECRET_KEY = getPaystackSecretKey();
  const PAYSTACK_BASE_URL = getPaystackBaseUrl();

  if (!PAYSTACK_SECRET_KEY) {
    console.error("[PAYSTACK] Secret key is missing");
    return {
      success: false,
      error: "Payment service is not properly configured",
    };
  }

  try {
    const response = await axios.get(`${PAYSTACK_BASE_URL}/bank`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    return {
      success: true,
      banks: response.data.data || [],
    };
  } catch (error) {
    console.error("[PAYSTACK] Get banks error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to fetch banks",
    };
  }
};

/**
 * Resolve/Verify bank account number
 * @param {string} accountNumber - Bank account number
 * @param {string} bankCode - Bank code from Paystack
 * @returns {Promise<Object>} Account details with account name
 */
export const resolveBankAccount = async (accountNumber, bankCode) => {
  const PAYSTACK_SECRET_KEY = getPaystackSecretKey();
  const PAYSTACK_BASE_URL = getPaystackBaseUrl();

  if (!PAYSTACK_SECRET_KEY) {
    console.error("[PAYSTACK] Secret key is missing");
    return {
      success: false,
      error: "Payment service is not properly configured",
    };
  }

  if (!accountNumber || !bankCode) {
    return {
      success: false,
      error: "Account number and bank code are required",
    };
  }

  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    return {
      success: true,
      data: {
        accountNumber: response.data.data.account_number,
        accountName: response.data.data.account_name,
      },
    };
  } catch (error) {
    console.error("[PAYSTACK] Resolve account error:", error.response?.data || error.message);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to verify bank account. Please check the account number and bank.",
    };
  }
};
