import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon, CheckCircleIcon, XCircleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import Loader from "./Loader";
import ConfirmationModal from "./ConfirmationModal";
import { verifyIdentity, approveKYC, rejectKYC } from "../services/adminApi";

const KYCDetailsModal = ({ user, isOpen, onClose, onApproveSuccess, onRejectSuccess }) => {
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [verificationError, setVerificationError] = useState("");
    const [processing, setProcessing] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    const handleVerifyIdentity = async () => {
        setVerifying(true);
        setVerificationResult(null);
        setVerificationError("");

        try {
            const data = await verifyIdentity(user._id, { type: "nin", value: user.nin });

            if (data.success) {
                setVerificationResult(data.data);
            } else {
                setVerificationError(data.error || "Verification failed");
            }
        } catch {
            setVerificationError("Network error during verification");
        } finally {
            setVerifying(false);
        }
    };

    // Approval
    const handleApprove = async () => {
        setProcessing(true);
        try {
            const data = await approveKYC(user._id);
            if (data.success) {
                onApproveSuccess();
                onClose();
            } else {
                alert(data.error || "Approval failed");
            }
        } catch {
            alert("Network error");
        } finally {
            setProcessing(false);
            setIsApproveModalOpen(false);
        }
    };

    // Rejection
    const handleReject = async () => {
        if (!rejectReason.trim()) return alert("Please provide a rejection reason.");
        
        setProcessing(true);
        try {
            const data = await rejectKYC(user._id, rejectReason);
            if (data.success) {
                onRejectSuccess();
                onClose();
            } else {
                alert(data.error || "Rejection failed");
            }
        } catch {
            alert("Network error");
        } finally {
            setProcessing(false);
            setIsRejectModalOpen(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

                <div className="relative bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl mx-auto">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>

                    <Dialog.Title className="text-xl font-bold mb-4">KYC Review: {user.fullName}</Dialog.Title>

                    <div className="space-y-6">
                        {/* User Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="block text-gray-500">Full Name</span>
                                <span className="font-semibold">{user.fullName}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Email</span>
                                <span className="font-semibold">{user.email}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Role</span>
                                <span className="font-semibold capitalize">{user.role}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Phone</span>
                                <span className="font-semibold">{user.phoneNumber || "N/A"}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">NIN Submitted</span>
                                <span className="font-semibold">{user.nin || "N/A"}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">DOB Submitted</span>
                                <span className="font-semibold">{user.dob ? new Date(user.dob).toLocaleDateString() : "N/A"}</span>
                            </div>
                        </div>

                        {/* Identity Verification Section */}
                        <div className="border-t pt-4">
                            <h3 className="font-semibold mb-3 flex items-center">
                                <ShieldCheckIcon className="h-5 w-5 mr-2 text-indigo-600" />
                                Identity Verification
                            </h3>

                            {/* Image Display */}
                            {user.kycDocuments?.ninImage && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Uploaded Document</h4>
                                    <div className="border rounded-lg overflow-hidden bg-gray-50 h-48 w-full flex items-center justify-center">
                                        <img 
                                            src={`http://localhost:5000${user.kycDocuments.ninImage}`} 
                                            alt="KYC Document" 
                                            className="h-full w-auto object-contain"
                                            onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/300?text=Image+Load+Error"; }}
                                        />
                                    </div>
                                    <a 
                                        href={`http://localhost:5000${user.kycDocuments.ninImage}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline mt-1 block text-center"
                                    >
                                        View Full Size
                                    </a>
                                </div>
                            )}
                            
                            {!verificationResult && !verifying && (
                                <button
                                    onClick={handleVerifyIdentity}
                                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
                                >
                                    Verify Identity via Payscribe
                                </button>
                            )}

                            {verifying && <Loader text="Verifying with Payscribe..." />}

                            {verificationError && (
                                <div className="mt-2 p-3 bg-red-50 text-red-700 rounded text-sm border border-red-200">
                                    <strong>Verification Failed:</strong> {verificationError}
                                </div>
                            )}

                            {verificationResult && (
                                <div className="mt-2 p-4 bg-gray-50 rounded border border-gray-200 text-sm">
                                    <h4 className="font-bold text-gray-700 mb-2">Payscribe Lookup Result:</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="block text-gray-500">First Name</span>
                                            <span className="font-medium">{verificationResult.firstName || verificationResult.first_name}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500">Last Name</span>
                                            <span className="font-medium">{verificationResult.lastName || verificationResult.last_name}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500">Middle Name</span>
                                            <span className="font-medium">{verificationResult.middleName || verificationResult.middle_name || "-"}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500">DOB</span>
                                            <span className="font-medium">{verificationResult.dob || verificationResult.date_of_birth}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500">Phone</span>
                                            <span className="font-medium">{verificationResult.phone || verificationResult.phoneNumber}</span>
                                        </div>
                                         <div>
                                            <span className="block text-gray-500">Gender</span>
                                            <span className="font-medium">{verificationResult.gender}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-xs text-gray-500 italic">
                                        Compare these details with the user's submission above.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="border-t pt-4 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsRejectModalOpen(true)}
                                disabled={processing}
                                className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50 font-medium"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => setIsApproveModalOpen(true)}
                                disabled={processing}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium flex items-center"
                            >
                                <CheckCircleIcon className="h-5 w-5 mr-1" />
                                Approve
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Approve Confirmation Modal */}
            <ConfirmationModal
                isOpen={isApproveModalOpen}
                onClose={() => setIsApproveModalOpen(false)}
                onConfirm={handleApprove}
                title="Approve KYC"
                message={`Are you sure you want to approve KYC for ${user.fullName}? This will unlock features for them.`}
                confirmText="Approve User"
                icon={CheckCircleIcon}
            />

            {/* Reject Confirmation Modal (Custom for Reason) */}
            <Dialog 
                open={isRejectModalOpen} 
                onClose={() => setIsRejectModalOpen(false)} 
                className="fixed z-[60] inset-0 overflow-y-auto"
            >
                <div className="flex items-center justify-center min-h-screen px-4">
                     <Dialog.Overlay className="fixed inset-0 bg-black opacity-50" />
                     <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl mx-auto z-50">
                        <Dialog.Title className="text-lg font-bold text-gray-900 mb-2">Reject KYC Submission</Dialog.Title>
                        <p className="text-sm text-gray-500 mb-4">
                            Please provide a reason for rejecting this KYC application. The user will be notified and asked to correct their details.
                        </p>
                        
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500 text-sm"
                            rows="4"
                            placeholder="Reason for rejection (e.g. Name mismatch, Blurred image...)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        ></textarea>

                        <div className="mt-4 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsRejectModalOpen(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processing || !rejectReason.trim()}
                                className={`px-4 py-2 text-white rounded font-medium ${
                                    !rejectReason.trim() ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                                }`}
                            >
                                {processing ? "Rejecting..." : "Confirm Rejection"}
                            </button>
                        </div>
                     </div>
                </div>
            </Dialog>

        </Dialog>
    );
};

export default KYCDetailsModal;
