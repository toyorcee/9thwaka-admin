import React, { useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon, CheckCircleIcon, XCircleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import Loader from "./Loader";
import ConfirmationModal from "./ConfirmationModal";
import { verifyIdentity, approveKYC, approveAddressKYC, rejectKYC, rejectAddressKYC, revokeKYC } from "../services/adminApi";
import { resolveImageUrl } from "../utils/urlHelper";

const KYCDetailsModal = ({ user, isOpen, onClose, onApproveSuccess, onRejectSuccess, onRevokeSuccess }) => {
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [verificationError, setVerificationError] = useState("");
    const [processing, setProcessing] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectAction, setRejectAction] = useState("all");
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isApproveAddressModalOpen, setIsApproveAddressModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
    const [revokeTargetTier, setRevokeTargetTier] = useState(null);

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

    // Address Approval (Tier 3)
    const handleApproveAddress = async () => {
        setProcessing(true);
        try {
            const data = await approveAddressKYC(user._id);
            if (data.success) {
                onApproveSuccess();
                onClose();
            } else {
                alert(data.error || "Address approval failed");
            }
        } catch {
            alert("Network error");
        } finally {
            setProcessing(false);
            setIsApproveAddressModalOpen(false);
        }
    };

    // Rejection / Specific Address Rejection
    const handleReject = async () => {
        if (!rejectReason.trim()) return alert("Please provide a rejection reason.");
        
        setProcessing(true);
        try {
            let data;
            if (rejectAction === "address") {
                data = await rejectAddressKYC(user._id, rejectReason);
            } else {
                data = await rejectKYC(user._id, rejectReason);
            }

            if (data.success) {
                onRejectSuccess();
                onClose();
            } else {
                alert(data.error || "Action failed");
            }
        } catch {
            alert("Network error");
        } finally {
            setProcessing(false);
            setIsRejectModalOpen(false);
        }
    };

    // Revocation
    const handleRevoke = async () => {
        if (!rejectReason.trim()) return alert("Please provide a reason for revocation.");
        
        setProcessing(true);
        try {
            const data = await revokeKYC(user._id, revokeTargetTier, rejectReason);
            if (data.success) {
                if (onRevokeSuccess) onRevokeSuccess();
                else onRejectSuccess();
                onClose();
            } else {
                alert(data.error || "Revocation failed");
            }
        } catch {
            alert("Network error");
        } finally {
            setProcessing(false);
            setIsRevokeModalOpen(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
                <DialogBackdrop className="fixed inset-0 bg-black opacity-30 transition-opacity" />

                <div className="flex items-center justify-center min-h-screen px-4 py-8">
                    <DialogPanel className="relative bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl mx-auto my-auto max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>

                        <DialogTitle className="text-xl font-bold mb-4">KYC Review: {user.fullName}</DialogTitle>

                    <div className="space-y-6">
                        {/* User Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="block text-gray-500">Full Name</span>
                                <span className="font-semibold">{user.fullName}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Current Tier</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                    user.tier === 3 ? "bg-green-100 text-green-700" :
                                    user.tier === 2 ? "bg-purple-100 text-purple-700" :
                                    user.tier === 1 ? "bg-blue-100 text-blue-700" :
                                    "bg-gray-100 text-gray-700"
                                }`}>
                                    Tier {user.tier || 0}
                                </span>
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
                                <span className="block text-gray-500">{user.role === 'rider' ? 'License Number' : 'NIN'} Submitted</span>
                                <span className="font-semibold">{user.driverLicenseNumber || user.nin || "N/A"}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">DOB Submitted</span>
                                <span className="font-semibold">{user.dob ? new Date(user.dob).toLocaleDateString() : "N/A"}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Status</span>
                                <span className={`font-semibold capitalize ${
                                    user.kycStatus === 'approved' ? 'text-green-600' :
                                    user.kycStatus === 'pending' ? 'text-orange-600' :
                                    'text-red-600'
                                }`}>
                                    {user.kycStatus || 'None'}
                                </span>
                            </div>
                        </div>

                        {/* Identity Verification Section */}
                        <div className="border-t pt-4">
                            <h3 className="font-semibold mb-3 flex items-center">
                                <ShieldCheckIcon className="h-5 w-5 mr-2 text-indigo-600" />
                                Identity Verification
                            </h3>

                            {/* Image Display */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                {user.kycDocuments?.ninImage && (
                                    <div className="border rounded-lg p-2 bg-gray-50">
                                        <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Identity Card (NIN/BVN)</h4>
                                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-inner group">
                                            <img
                                                src={resolveImageUrl(user.kycDocuments.ninImage)}
                                                alt="Identity Document"
                                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 cursor-zoom-in"
                                                onClick={() => window.open(resolveImageUrl(user.kycDocuments.ninImage), "_blank")}
                                            />
                                        </div>
                                    </div>
                                )}

                                {user.kycDocuments?.selfie && (
                                    <div className="border rounded-lg p-2 bg-gray-50">
                                        <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">
                                            {user.role === 'rider' ? 'Selfie holding License' : 'Selfie'}
                                        </h4>
                                        <div className="flex-shrink-0">
                                            <img
                                                src={resolveImageUrl(user.kycDocuments.selfie)}
                                                alt="Selfie"
                                                className="h-24 w-24 rounded-full object-cover border-4 border-indigo-100 shadow-md transform transition-transform hover:scale-105"
                                                onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=No+Selfie"; }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {user.driverLicensePicture && (
                                    <div className="border rounded-lg p-2 bg-gray-50">
                                        <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">
                                            {user.role === 'rider' ? "Driver's License Card" : "NIN ID Photo"}
                                        </h4>
                                        <div className="h-44 w-full flex items-center justify-center overflow-hidden rounded bg-white border">
                                            <img 
                                                src={resolveImageUrl(user.driverLicensePicture)} 
                                                alt="Driver License" 
                                                className="h-full w-auto object-contain cursor-pointer hover:opacity-90"
                                                onClick={() => window.open(resolveImageUrl(user.driverLicensePicture), "_blank")}
                                                onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/300?text=No+License"; }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Address Verification Section (Tier 3) */}
                            {user.kycDocuments?.proofOfAddress && (
                                <div className="border-t mt-4 pt-4">
                                    <h3 className="font-semibold mb-3 flex items-center">
                                        <ShieldCheckIcon className="h-5 w-5 mr-2 text-indigo-600" />
                                        Address Verification (Utility Bill)
                                    </h3>
                                    <div className="border rounded-lg p-2 bg-gray-50 max-w-sm">
                                        <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Proof of Address / Utility Bill</h4>
                                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-inner group">
                                            <img
                                                src={resolveImageUrl(user.kycDocuments.proofOfAddress)}
                                                alt="Proof of Address"
                                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 cursor-zoom-in"
                                                onClick={() => window.open(resolveImageUrl(user.kycDocuments.proofOfAddress), "_blank")}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            
                            {/* Payscribe Integration - Distinct Section */}
                            <div className="mt-6 pt-4 border-t border-dashed border-gray-300">
                                <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase flex items-center">
                                    <ShieldCheckIcon className="h-3 w-3 mr-1" />
                                    External Verification (Payscribe)
                                </h4>
                                {!verificationResult && !verifying && (
                                    <button
                                        onClick={handleVerifyIdentity}
                                        className="w-full sm:w-auto px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs font-bold border border-gray-300 transition-colors"
                                    >
                                        Run Payscribe ID Check
                                    </button>
                                )}
                            </div>

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
                        <div className="border-t pt-4 flex flex-wrap gap-2 justify-end">
                            {/* Rejection Actions */}
                            {user.kycStatus === 'pending' && (
                                <button
                                    onClick={() => { setRejectAction("all"); setIsRejectModalOpen(true); }}
                                    disabled={processing}
                                    className="px-3 py-1.5 border border-red-300 text-red-700 rounded hover:bg-red-50 font-medium text-xs"
                                >
                                    Reject Identity
                                </button>
                            )}

                            {user.addressVerified === false && user.kycDocuments?.proofOfAddress && (
                                <button
                                    onClick={() => { setRejectAction("address"); setIsRejectModalOpen(true); }}
                                    disabled={processing}
                                    className="px-3 py-1.5 border border-orange-300 text-orange-700 rounded hover:bg-orange-50 font-medium text-xs"
                                >
                                    Reject Address Only
                                </button>
                            )}

                            {/* Revocation Actions (Visible for Approved users) */}
                            {user.tier === 3 && (
                                <button
                                    onClick={() => { setRevokeTargetTier(2); setIsRevokeModalOpen(true); }}
                                    disabled={processing}
                                    className="px-3 py-1.5 border border-red-600 text-red-600 rounded hover:bg-red-50 font-medium text-xs"
                                >
                                    Revoke to Tier 2
                                </button>
                            )}

                            {user.tier >= 2 && (
                                <button
                                    onClick={() => { setRevokeTargetTier(1); setIsRevokeModalOpen(true); }}
                                    disabled={processing}
                                    className="px-3 py-1.5 border border-red-800 text-red-800 rounded hover:bg-red-50 font-medium text-xs"
                                >
                                    Revoke to Tier 1
                                </button>
                            )}
                            
                            {user.tier >= 1 && (
                                <button
                                    onClick={() => { setRevokeTargetTier(0); setIsRevokeModalOpen(true); }}
                                    disabled={processing}
                                    className="px-3 py-1.5 bg-red-100 text-red-900 rounded hover:bg-red-200 font-bold text-xs"
                                >
                                    Rescind All (Tier 0)
                                </button>
                            )}

                            {/* Approval Actions */}
                            {user.kycStatus !== 'approved' && (
                                <button
                                    onClick={() => setIsApproveModalOpen(true)}
                                    disabled={processing}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium text-sm flex items-center shadow-sm"
                                >
                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                    Approve Identity (Tier 2)
                                </button>
                            )}

                            {user.kycStatus === 'approved' && !user.addressVerified && user.kycDocuments?.proofOfAddress && (
                                <button
                                    onClick={() => setIsApproveAddressModalOpen(true)}
                                    disabled={processing}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium text-sm flex items-center shadow-md"
                                >
                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                    Approve Address (Tier 3)
                                </button>
                            )}
                        </div>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            {/* Confirmation Modals - Moved Outside Main Dialog */}

            <ConfirmationModal
                isOpen={isApproveModalOpen}
                onClose={() => setIsApproveModalOpen(false)}
                onConfirm={handleApprove}
                title="Approve Identity"
                message={`Are you sure you want to approve Identity KYC for ${user.fullName}? This will upgrade them to Tier 2 (₦200,000 limit).`}
                confirmText="Approve Identity"
                icon={CheckCircleIcon}
            />

            {/* Approve Address Confirmation Modal */}
            <ConfirmationModal
                isOpen={isApproveAddressModalOpen}
                onClose={() => setIsApproveAddressModalOpen(false)}
                onConfirm={handleApproveAddress}
                title="Approve Residential Address"
                message={`Are you sure you want to approve the Address Proof for ${user.fullName}? This will upgrade them to Tier 3 (₦5,000,000 limit).`}
                confirmText="Approve Address"
                icon={ShieldCheckIcon}
            />

            {/* Revoke/Reject with Reason Dialog */}
            <Dialog 
                open={isRejectModalOpen || isRevokeModalOpen} 
                onClose={() => { setIsRejectModalOpen(false); setIsRevokeModalOpen(false); }} 
                className="fixed z-[60] inset-0 overflow-y-auto"
            >
                <DialogBackdrop className="fixed inset-0 bg-black opacity-50 transition-opacity" />

                <div className="flex items-center justify-center min-h-screen px-4">
                     <DialogPanel className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl mx-auto z-50">
                        <DialogTitle className="text-lg font-bold text-gray-900 mb-2">
                            {isRevokeModalOpen ? `Revoke to Tier ${revokeTargetTier}` : `Reject ${rejectAction === 'address' ? 'Address' : 'KYC'}`}
                        </DialogTitle>
                        <p className="text-sm text-gray-500 mb-4">
                            Please provide a mandatory reason for this action. The user will be notified via in-app and push notification.
                        </p>
                        
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500 text-sm"
                            rows="4"
                            placeholder="Reason (e.g. Document expired, Image blurred, Identity mismatch...)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        ></textarea>

                        <div className="mt-4 flex justify-end space-x-3">
                            <button
                                onClick={() => { setIsRejectModalOpen(false); setIsRevokeModalOpen(false); }}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={isRevokeModalOpen ? handleRevoke : handleReject}
                                disabled={processing || !rejectReason.trim()}
                                className={`px-4 py-2 text-white rounded font-medium shadow-sm ${
                                    !rejectReason.trim() ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                                }`}
                            >
                                {processing ? "Processing..." : "Confirm Action"}
                            </button>
                        </div>
                     </DialogPanel>
                </div>
            </Dialog>
        </>
    );
};

export default KYCDetailsModal;
