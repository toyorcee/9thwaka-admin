import axios from "./api";

// Transfer funds to a user (rider or customer)
export const transferToUser = async (data) => {
  const response = await axios.post("/api/admin/wallet/transfer", data);
  return response.data;
};

// Get a user's wallet balance
export const getUserWalletBalance = async (userId) => {
  const response = await axios.get(`/api/admin/wallet/users/${userId}/balance`);
  return response.data;
};

// Fetch users for transfer dropdown
export const fetchTransferUsers = async (role) => {
    let endpoint = "";
  if (role === "rider") endpoint = "/api/admin/riders?limit=1000"; 
  else if (role === "customer") endpoint = "/api/admin/customers?limit=1000";
  
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
  const response = await axios.get("/api/admin/wallet");
  return response.data;
};

// Transfer funds FROM a user (debit)
export const transferFromUser = async (data) => {
  const response = await axios.post("/api/admin/wallet/debit", data);
  return response.data;
};
