import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getBlockedUsers,
  blockUser,
  unblockUser,
  getRiders,
  getCustomers,
} from "../services/adminApi";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import ConfirmationModal from "../components/ConfirmationModal";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

const BlockedUsers = () => {
  const navigate = useNavigate();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRole, setFilterRole] = useState("all");
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [unblockModalOpen, setUnblockModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockConfirmModalOpen, setBlockConfirmModalOpen] = useState(false);
  const [searchUserModalOpen, setSearchUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockReason, setBlockReason] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchRole, setSearchRole] = useState("all");

  useEffect(() => {
    if (showAllUsers) {
      loadAllUsers();
    } else {
      loadBlockedUsers();
    }
  }, [filterRole, showAllUsers]);

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const role = filterRole === "all" ? null : filterRole;
      const response = await getBlockedUsers(role);
      setBlockedUsers(response.users || []);
    } catch (err) {
      setError("Failed to load blocked users.");
      console.error("Failed to load blocked users:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      let users = [];

      if (filterRole === "all" || filterRole === "rider") {
        try {
          const ridersResponse = await getRiders({
            page: 1,
            limit: 100,
            blocked: filterRole === "all" ? undefined : false,
          });
          const riders = (ridersResponse?.riders || []).map((r) => ({
            ...r,
            role: "rider",
          }));
          users = [...users, ...riders];
        } catch (err) {
          console.error("Failed to load riders:", err);
        }
      }

      if (filterRole === "all" || filterRole === "customer") {
        try {
          const customersResponse = await getCustomers({
            page: 1,
            limit: 100,
          });
          const customers = (customersResponse?.customers || []).map((c) => ({
            ...c,
            role: "customer",
          }));
          users = [...users, ...customers];
        } catch (err) {
          console.error("Failed to load customers:", err);
        }
      }

      setAllUsers(users);
    } catch (err) {
      setError("Failed to load users.");
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!userSearchQuery.trim()) {
      toast.error("Please enter a search query.");
      return;
    }

    try {
      setSearching(true);
      const searchFilters = {
        search: userSearchQuery.trim(),
        page: 1,
        limit: 20,
      };

      let results = [];
      if (searchRole === "all" || searchRole === "rider") {
        try {
          const ridersResponse = await getRiders({
            ...searchFilters,
            blocked: false,
          });
          const riders = (ridersResponse?.riders || []).map((r) => ({
            ...r,
            role: "rider",
          }));
          results = [...results, ...riders];
        } catch (err) {
          console.error("Failed to search riders:", err);
        }
      }

      if (searchRole === "all" || searchRole === "customer") {
        try {
          const customersResponse = await getCustomers(searchFilters);
          const customers = (customersResponse?.customers || []).map((c) => ({
            ...c,
            role: "customer",
          }));
          results = [...results, ...customers];
        } catch (err) {
          console.error("Failed to search customers:", err);
        }
      }

      // Filter out already blocked users
      const blockedIds = blockedUsers.map((u) => u._id);
      results = results.filter(
        (u) => !u.accountDeactivated && !blockedIds.includes(u._id)
      );

      setSearchResults(results);
      if (results.length === 0) {
        toast.info("No unblocked users found matching your search.");
      }
    } catch (err) {
      toast.error("Failed to search users.");
      console.error("Failed to search users:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUserToBlock = (user) => {
    setSelectedUser(user);
    setSearchUserModalOpen(false);
    setUserSearchQuery("");
    setSearchResults([]);
    setBlockModalOpen(true);
  };

  const handleBlockReasonSubmit = () => {
    if (!blockReason.trim()) {
      toast.error("Please provide a reason for blocking.");
      return;
    }

    setBlockModalOpen(false);
    setBlockConfirmModalOpen(true);
  };

  const handleBlockUser = async () => {
    if (!selectedUser || !blockReason.trim()) {
      toast.error("Please provide a reason for blocking.");
      return;
    }

    try {
      setActionLoading(selectedUser._id);
      await blockUser(selectedUser._id, blockReason.trim());
      toast.success("User blocked successfully.");
      setBlockConfirmModalOpen(false);
      setBlockModalOpen(false);
      setSelectedUser(null);
      setBlockReason("");
      if (showAllUsers) {
        await loadAllUsers();
      } else {
        await loadBlockedUsers();
      }
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to block user.";
      toast.error(message);
      console.error("Failed to block user:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuickBlock = (user) => {
    setSelectedUser(user);
    setBlockModalOpen(true);
  };

  const handleViewRiderPayouts = (riderId) => {
    navigate("/rider-payouts", { state: { riderIdFilter: riderId } });
  };

  const handleViewCustomerOrders = (customerId) => {
    navigate("/orders", { state: { customerIdFilter: customerId } });
  };

  const handleUnblockUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(selectedUser._id);
      await unblockUser(selectedUser._id);
      toast.success("User unblocked successfully.");
      setUnblockModalOpen(false);
      setSelectedUser(null);
      if (showAllUsers) {
        await loadAllUsers();
      } else {
        await loadBlockedUsers();
      }
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to unblock user.";
      toast.error(message);
      console.error("Failed to unblock user:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuickUnblock = (user) => {
    setSelectedUser(user);
    setUnblockModalOpen(true);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleBadgeColor = (role) => {
    return role === "rider"
      ? "bg-blue-100 text-blue-800"
      : "bg-purple-100 text-purple-800";
  };

  return (
    <div className="p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Blocked Users</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setSearchUserModalOpen(true);
              setUserSearchQuery("");
              setSearchResults([]);
            }}
            className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300"
          >
            Block User
          </button>
          <button
            onClick={() => {
              if (showAllUsers) {
                loadAllUsers();
              } else {
                loadBlockedUsers();
              }
            }}
            className="bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 flex items-center space-x-4">
        <label className="text-gray-700 font-semibold">Filter by role:</label>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
        >
          <option value="all">All Users</option>
          <option value="rider">Riders</option>
          <option value="customer">Customers</option>
        </select>
        <label className="flex items-center space-x-2 text-gray-700">
          <input
            type="checkbox"
            checked={showAllUsers}
            onChange={(e) => setShowAllUsers(e.target.checked)}
            className="form-checkbox h-5 w-5 text-accent-blue bg-white border-gray-300 rounded focus:ring-accent-blue"
          />
          <span>Show all users</span>
        </label>
        <span className="text-sm text-gray-500">
          {showAllUsers
            ? `${allUsers.length} user${allUsers.length !== 1 ? "s" : ""}`
            : `${blockedUsers.length} blocked user${
                blockedUsers.length !== 1 ? "s" : ""
              }`}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Loader
          text={showAllUsers ? "Loading users..." : "Loading blocked users..."}
        />
      ) : (showAllUsers ? allUsers : blockedUsers).length === 0 ? (
        <EmptyState
          type="users"
          title={showAllUsers ? "No users found" : "No blocked users"}
          description={
            showAllUsers
              ? filterRole === "all"
                ? "No users found matching the filter."
                : `No ${filterRole}s found.`
              : filterRole === "all"
              ? "There are no blocked users at the moment."
              : `There are no blocked ${filterRole}s at the moment.`
          }
        />
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blocked Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(showAllUsers ? allUsers : blockedUsers).map((user) => {
                const isBlocked = user.accountDeactivated;
                return (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {user.fullName || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                        {user.phoneNumber && (
                          <div className="text-sm text-gray-500">
                            {user.phoneNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role === "rider" ? "Rider" : "Customer"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isBlocked ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Blocked
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {isBlocked
                        ? formatDateTime(user.accountDeactivatedAt)
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {isBlocked ? (
                        <div
                          className="max-w-xs truncate"
                          title={user.accountDeactivatedReason}
                        >
                          {user.accountDeactivatedReason ||
                            "No reason provided"}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.role === "rider" && user.paymentBlocked ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Payment Blocked
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {user.role === "rider" && (
                          <button
                            onClick={() => handleViewRiderPayouts(user._id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-lg transition duration-300 text-xs"
                            title="View payout history"
                          >
                            Payouts
                          </button>
                        )}
                        {user.role === "customer" && (
                          <button
                            onClick={() => handleViewCustomerOrders(user._id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-lg transition duration-300 text-xs"
                            title="View order history"
                          >
                            Orders
                          </button>
                        )}
                        {isBlocked ? (
                          <button
                            onClick={() => handleQuickUnblock(user)}
                            disabled={actionLoading === user._id}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                          >
                            {actionLoading === user._id
                              ? "Processing..."
                              : "Unblock"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleQuickBlock(user)}
                            disabled={actionLoading === user._id}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                          >
                            {actionLoading === user._id
                              ? "Processing..."
                              : "Block"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Unblock Confirmation Modal */}
      <ConfirmationModal
        isOpen={unblockModalOpen}
        onClose={() => {
          setUnblockModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleUnblockUser}
        title="Unblock User"
        message={
          selectedUser
            ? `Are you sure you want to unblock ${
                selectedUser.fullName || selectedUser.email
              }? They will be able to access the platform again.`
            : "Are you sure you want to unblock this user?"
        }
        confirmText="Unblock"
        cancelText="Cancel"
        icon={CheckCircleIcon}
        confirmButtonClass="bg-green-600 hover:bg-green-700"
        isLoading={actionLoading === selectedUser?._id}
      />

      {/* Block Confirmation Modal */}
      <ConfirmationModal
        isOpen={blockConfirmModalOpen}
        onClose={() => {
          setBlockConfirmModalOpen(false);
          setBlockModalOpen(true); // Return to reason modal
        }}
        onConfirm={handleBlockUser}
        title="Confirm Block User"
        message={
          selectedUser && blockReason.trim()
            ? `Are you sure you want to block ${
                selectedUser.fullName || selectedUser.email
              }?\n\nReason: ${blockReason.trim()}`
            : "Are you sure you want to block this user?"
        }
        confirmText="Yes, Block User"
        cancelText="Cancel"
        icon={CheckCircleIcon}
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        isLoading={actionLoading === selectedUser?._id}
      />

      {/* Search User Modal */}
      {searchUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Search User to Block
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Search for a user by name, email, or phone number
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchUserModalOpen(false);
                  setUserSearchQuery("");
                  setSearchResults([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="mb-4 flex items-center space-x-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearchUsers();
                    }
                  }}
                  placeholder="Search by name, email, or phone..."
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>
              <select
                value={searchRole}
                onChange={(e) => setSearchRole(e.target.value)}
                className="bg-white text-gray-800 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
              >
                <option value="all">All</option>
                <option value="rider">Riders</option>
                <option value="customer">Customers</option>
              </select>
              <button
                onClick={handleSearchUsers}
                disabled={searching || !userSearchQuery.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="min-w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        User
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {searchResults.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900">
                              {user.fullName || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                            {user.phoneNumber && (
                              <div className="text-sm text-gray-500">
                                {user.phoneNumber}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(
                              user.role
                            )}`}
                          >
                            {user.role === "rider" ? "Rider" : "Customer"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleSelectUserToBlock(user)}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-lg transition duration-300 text-xs"
                          >
                            Block
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Block User Modal with Reason Input */}
      {blockModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Block User
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Block {selectedUser.fullName || selectedUser.email}
                </p>
              </div>
              <button
                onClick={() => {
                  setBlockModalOpen(false);
                  setBlockConfirmModalOpen(false);
                  setSelectedUser(null);
                  setBlockReason("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Reason for blocking <span className="text-red-500">*</span>
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Enter the reason for blocking this user..."
                rows={4}
                className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue resize-none"
              />
              {!blockReason.trim() && (
                <p className="text-xs text-red-500 mt-1">
                  A reason is required to block a user
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setBlockModalOpen(false);
                  setBlockConfirmModalOpen(false);
                  setSelectedUser(null);
                  setBlockReason("");
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockReasonSubmit}
                disabled={!blockReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockedUsers;
