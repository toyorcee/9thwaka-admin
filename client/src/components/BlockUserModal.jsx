import React, { useState } from "react";
import { toast } from "react-toastify";
import { blockUser } from "../services/adminApi";
import ConfirmationModal from "./ConfirmationModal";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

const BlockUserModal = ({
  isOpen,
  onClose,
  user,
  onBlocked,
  isLoading: externalLoading,
}) => {
  const [blockReason, setBlockReason] = useState("");
  const [blockConfirmModalOpen, setBlockConfirmModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isLoading = externalLoading || actionLoading;

  const handleBlockReasonSubmit = () => {
    if (!blockReason.trim()) {
      toast.error("Please provide a reason for blocking.");
      return;
    }
    // Close reason modal and open confirmation modal
    setBlockConfirmModalOpen(true);
  };

  const handleBlockUser = async () => {
    if (!user || !blockReason.trim()) {
      toast.error("Please provide a reason for blocking.");
      return;
    }

    try {
      setActionLoading(true);
      await blockUser(user._id, blockReason.trim());
      toast.success("User blocked successfully.");
      setBlockConfirmModalOpen(false);
      setBlockReason("");
      if (onBlocked) {
        onBlocked();
      }
      onClose();
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to block user.";
      toast.error(message);
      console.error("Failed to block user:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = () => {
    setBlockReason("");
    setBlockConfirmModalOpen(false);
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <>
      {/* Block User Modal with Reason Input */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Block User
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Block {user.fullName || user.email}
              </p>
            </div>
            <button
              onClick={handleClose}
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
              onClick={handleClose}
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

      {/* Block Confirmation Modal */}
      <ConfirmationModal
        isOpen={blockConfirmModalOpen}
        onClose={() => {
          setBlockConfirmModalOpen(false);
        }}
        onConfirm={handleBlockUser}
        title="Confirm Block User"
        message={
          user && blockReason.trim()
            ? `Are you sure you want to block ${
                user.fullName || user.email
              }?\n\nReason: ${blockReason.trim()}`
            : "Are you sure you want to block this user?"
        }
        confirmText="Yes, Block User"
        cancelText="Cancel"
        icon={CheckCircleIcon}
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        isLoading={isLoading}
      />
    </>
  );
};

export default BlockUserModal;
