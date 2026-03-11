import axios from "./api";

// Transfer funds to a user (rider or customer)
export const transferToUser = async (data) => {
  const response = await axios.post("/admin/wallet/transfer", data);
  return response.data;
};

// Get a user's wallet balance
export const getUserWalletBalance = async (userId) => {
  const response = await axios.get(`/admin/wallet/users/${userId}/balance`);
  return response.data;
};

// Fetch users for transfer dropdown
export const fetchTransferUsers = async (role) => {
    let endpoint = "";
  if (role === "rider") endpoint = "/admin/riders?limit=1000"; 
  else if (role === "customer") endpoint = "/admin/customers?limit=1000";
  
  const response = await axios.get(endpoint);
  
  // Normalize response
  if (role === "rider") {
    return (response.data.riders || []).map(u => ({
      value: u._id,
      label: `${u.fullName} (${u.phoneNumber})`,
      data: u 
    }));
  } else {
    // response.data.customers
    return (response.data.customers || []).map(u => ({
      value: u._id,
      label: `${u.fullName} (${u.phoneNumber})`,
      data: u
    }));
  }
};

// Get Admin Wallet details
export const getAdminWallet = async () => {
  const response = await axios.get("/admin/wallet");
  return response.data;
};

// Transfer funds FROM a user (debit)
export const transferFromUser = async (data) => {
  const response = await axios.post("/admin/wallet/debit", data);
  return response.data;
};

// Transfer funds internally between AdminWallet balances
export const transferInternalBalance = async (data) => {
  const response = await axios.post("/admin/wallet/transfer-internal", data);
  return response.data;
};

// Sync Admin Wallet balance with Payscribe
export const syncAdminWallet = async () => {
  const response = await axios.post("/admin/wallet/sync");
  return response.data;
};
