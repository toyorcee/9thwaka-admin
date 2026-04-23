import React, { useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon, CheckCircleIcon, XCircleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import Loader from "./Loader";
import ConfirmationModal from "./ConfirmationModal";
import { verifyIdentity, approveKYC, approveAddressKYC, rejectKYC, rejectAddressKYC, revokeKYC, approveHackneyPermit, rejectHackneyPermit, approveInsurancePolicy, rejectInsurancePolicy } from "../services/adminApi";
import { fetchAdminSettings } from "../services/settingsApi";
import { resolveImageUrl } from "../utils/urlHelper";
import { useEffect } from "react";

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
    const [isApproveHackneyModalOpen, setIsApproveHackneyModalOpen] = useState(false);
    const [isApproveInsuranceModalOpen, setIsApproveInsuranceModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [grantReward, setGrantReward] = useState(true);
    const [complianceSettings, setComplianceSettings] = useState(null);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await fetchAdminSettings();
                if (data?.settings?.compliance) {
                    setComplianceSettings(data.settings.compliance);
                }
            } catch (err) {
                console.error("Failed to load compliance settings:", err);
            }
        };
        if (isOpen) loadSettings();
    }, [isOpen]);

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
            const data = await approveKYC(user._id, { grantReward: grantReward && !user.identityRewardPaid });
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
            const data = await approveAddressKYC(user._id, { grantReward: grantReward && !user.addressRewardPaid });
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

    // Hackney Approval
    const handleApproveHackney = async () => {
        setProcessing(true);
        try {
            const data = await approveHackneyPermit(user._id, { grantReward: grantReward && !user.hackneyRewardPaid });
            if (data.success) {
                onApproveSuccess();
                onClose();
            } else {
                alert(data.error || "Hackney approval failed");
            }
        } catch {
            alert("Network error");
        } finally {
            setProcessing(false);
            setIsApproveHackneyModalOpen(false);
        }
    };

    // Insurance Approval
    const handleApproveInsurance = async () => {
        setProcessing(true);
        try {
            const data = await approveInsurancePolicy(user._id, { grantReward: grantReward && !user.insuranceRewardPaid });
            if (data.success) {
                onApproveSuccess();
                onClose();
            } else {
                alert(data.error || "Insurance approval failed");
            }
        } catch {
            alert("Network error");
        } finally {
            setProcessing(false);
            setIsApproveInsuranceModalOpen(false);
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
            } else if (rejectAction === "hackney") {
                data = await rejectHackneyPermit(user._id, rejectReason);
            } else if (rejectAction === "insurance") {
                data = await rejectInsurancePolicy(user._id, rejectReason);
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

                        <div className="flex items-center space-x-4 mb-6">
                            <div className="relative">
                                <img
                                    src={resolveImageUrl(user.profilePicture || user.kycDocuments?.selfie)}
                                    alt={user.fullName}
                                    className="h-20 w-20 rounded-full object-cover border-4 border-indigo-50 shadow-lg cursor-pointer hover:border-indigo-200 transition-colors"
                                    onClick={() => setSelectedImage(user.profilePicture || user.kycDocuments?.selfie)}
                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=NP"; }}
                                />
                                <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                                    user.kycStatus === 'approved' ? 'bg-green-500' : 
                                    user.kycStatus === 'pending' ? 'bg-orange-500' : 'bg-red-500'
                                }`}>
                                    {user.kycStatus === 'approved' ? (
                                        <CheckCircleIcon className="h-4 w-4 text-white" />
                                    ) : (
                                        <div className="h-2 w-2 bg-white rounded-full"></div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold text-gray-900 leading-tight">
                                    {user.fullName}
                                </DialogTitle>
                                <div className="flex items-center space-x-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        user.tier === 3 ? "bg-green-100 text-green-700" :
                                        user.tier === 2 ? "bg-purple-100 text-purple-700" :
                                        "bg-blue-100 text-blue-700"
                                    }`}>
                                        Tier {user.tier || 1}
                                    </span>
                                    <span className="text-gray-400 text-xs text-sm font-medium">•</span>
                                    <span className="text-gray-600 text-xs font-semibold capitalize">{user.role}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                            {/* Contact Info */}
                            <div className="space-y-2">
                                <div className="flex items-center text-sm">
                                    <span className="text-gray-500 w-24">Email:</span>
                                    <span className="font-semibold text-gray-900 truncate">{user.email}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <span className="text-gray-500 w-24">Phone:</span>
                                    <span className="font-semibold text-gray-900">{user.phoneNumber || "N/A"}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <span className="text-gray-500 w-24">BVN:</span>
                                    <span className="font-semibold text-gray-900">{user.bvn || "N/A"}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <span className="text-gray-500 w-24">{user.role === 'rider' ? 'License:' : 'NIN:'}</span>
                                    <span className="font-semibold text-gray-900">{user.driverLicenseNumber || user.nin || "N/A"}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <span className="text-gray-500 w-24">Date of Birth:</span>
                                    <span className="font-semibold text-gray-900">{user.dob ? new Date(user.dob).toLocaleDateString() : "N/A"}</span>
                                </div>
                            </div>

                            {/* Virtual Account Info */}
                            <div className="space-y-2 border-l border-gray-200 pl-4">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Virtual Account (Payscribe)</h4>
                                {user.payscribeDetails?.accountNumber ? (
                                    <>
                                        <div className="flex items-center text-sm">
                                            <span className="text-gray-500 w-20">Account:</span>
                                            <span className="font-mono font-bold text-blue-700">{user.payscribeDetails.accountNumber}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <span className="text-gray-500 w-20">Bank:</span>
                                            <span className="font-semibold text-gray-900">{user.payscribeDetails.bankName}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <span className="text-gray-500 w-20">Name:</span>
                                            <span className="font-semibold text-gray-900 truncate">{user.payscribeDetails.accountName}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-gray-400 text-xs italic py-2">
                                        No virtual account generated yet.
                                    </div>
                                )}
                            </div>
                        </div>

                    <div className="space-y-6">


                        {/* Identity Verification Section */}
                        <div className="border-t pt-4">
                            <h3 className="font-semibold mb-3 flex items-center">
                                <ShieldCheckIcon className="h-5 w-5 mr-2 text-indigo-600" />
                                Identity Verification
                                {user.identityRewardPaid && (
                                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Reward Paid</span>
                                )}
                            </h3>

                            {/* Image Display */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                {(user.kycDocuments?.bvnImage || user.kycDocuments?.ninImage) && (
                                    <div className="border rounded-lg p-2 bg-gray-50">
                                        <h4 className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wide">{user.role === 'customer' ? 'NIN Card' : 'ID Document/License'}</h4>
                                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-inner group relative">
                                            <img
                                                src={resolveImageUrl(user.kycDocuments.bvnImage || user.kycDocuments.ninImage)}
                                                alt="Identity Document"
                                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
                                                onClick={() => setSelectedImage(user.kycDocuments.bvnImage || user.kycDocuments.ninImage)}
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none flex items-center justify-center">
                                                <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-[10px] font-bold px-2 py-1 rounded shadow-sm transition-opacity">CLICK TO VIEW</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {user.kycDocuments?.selfie && (
                                    <div className="border rounded-lg p-2 bg-gray-50">
                                        <h4 className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wide">
                                            {user.role === 'rider' ? 'Selfie holding License' : 'Selfie Verification'}
                                        </h4>
                                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-inner group relative">
                                            <img
                                                src={resolveImageUrl(user.kycDocuments.selfie)}
                                                alt="Selfie"
                                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
                                                onClick={() => setSelectedImage(user.kycDocuments.selfie)}
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none flex items-center justify-center">
                                                <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-[10px] font-bold px-2 py-1 rounded shadow-sm transition-opacity">CLICK TO VIEW</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {user.driverLicensePicture && (
                                    <div className="border rounded-lg p-2 bg-gray-50">
                                        <h4 className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wide text-xs">
                                            {user.role === 'rider' ? "Driver's License Photo" : "Identity Photo"}
                                        </h4>
                                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-inner group relative">
                                            <img 
                                                src={resolveImageUrl(user.driverLicensePicture)} 
                                                alt="Driver License" 
                                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
                                                onClick={() => setSelectedImage(user.driverLicensePicture)}
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none flex items-center justify-center">
                                                <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-[10px] font-bold px-2 py-1 rounded shadow-sm transition-opacity">CLICK TO VIEW</span>
                                            </div>
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
                                        {user.addressRewardPaid && (
                                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Reward Paid</span>
                                        )}
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

                            {/* Hackney Permit Verification (Riders only) */}
                            {user.kycDocuments?.hackneyPermit && (
                                <div className="border-t mt-4 pt-4">
                                    <h3 className="font-semibold mb-3 flex items-center text-sm">
                                        <ShieldCheckIcon className="h-4 w-4 mr-2 text-indigo-600" />
                                        Hackney Permit
                                        {user.hackneyRewardPaid && (
                                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Reward Paid</span>
                                        )}
                                    </h3>
                                    <div className="border rounded-lg p-2 bg-gray-50 max-w-sm">
                                        <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase text-[10px]">Hackney Permit Document</h4>
                                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-inner group">
                                            <img
                                                src={resolveImageUrl(user.kycDocuments.hackneyPermit)}
                                                alt="Hackney Permit"
                                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 cursor-zoom-in"
                                                onClick={() => window.open(resolveImageUrl(user.kycDocuments.hackneyPermit), "_blank")}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Commercial Insurance Policy (Riders only) */}
                            {user.kycDocuments?.insurancePolicy && (
                                <div className="border-t mt-4 pt-4">
                                    <h3 className="font-semibold mb-3 flex items-center text-sm">
                                        <ShieldCheckIcon className="h-4 w-4 mr-2 text-indigo-600" />
                                        Commercial Insurance Policy
                                        {user.insuranceRewardPaid && (
                                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Reward Paid</span>
                                        )}
                                    </h3>
                                    <div className="border rounded-lg p-2 bg-gray-50 max-w-sm">
                                        <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase text-[10px]">Insurance Policy Document</h4>
                                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-inner group">
                                            <img
                                                src={resolveImageUrl(user.kycDocuments.insurancePolicy)}
                                                alt="Insurance Policy"
                                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 cursor-zoom-in"
                                                onClick={() => window.open(resolveImageUrl(user.kycDocuments.insurancePolicy), "_blank")}
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
                                        disabled={!(user.driverLicenseNumber || user.nin)}
                                        className={`w-full sm:w-auto px-3 py-1.5 rounded text-xs font-bold border transition-colors ${
                                            !(user.driverLicenseNumber || user.nin) 
                                                ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed" 
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                                        }`}
                                    >
                                        {(user.driverLicenseNumber || user.bvn) ? "Run Payscribe ID Check" : "No Identity Number Found"}
                                    </button>
                                )}
                                <button
                                    onClick={handleConfirmAction}
                                    disabled={!rejectReason.trim()}
                                    className={`w-full sm:w-auto px-3 py-1.5 rounded text-xs font-bold border transition-colors ${
                                        !rejectReason.trim() ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                                    }`}
                                >
                                    {processing ? "Processing..." : "Confirm Action"}
                                </button>
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

                            {/* Approval Logic with Safety Checks */}
                            {user.kycStatus !== 'approved' && (
                                <div className="group relative">
                                    <button
                                        onClick={() => setIsApproveModalOpen(true)}
                                        disabled={processing || 
                                            !user.kycDocuments?.selfie || 
                                            (user.role === 'rider' ? !user.driverLicensePicture : !user.kycDocuments?.bvnImage && !user.kycDocuments?.ninImage)
                                        }
                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold text-sm flex items-center shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
                                    >
                                        <CheckCircleIcon className="h-5 w-5 mr-1.5" />
                                        Approve Identity (Tier 2)
                                    </button>
                                    {( !user.kycDocuments?.selfie || (user.role === 'rider' ? !user.driverLicensePicture : !user.kycDocuments?.bvnImage && !user.kycDocuments?.ninImage)) && (
                                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                            Cannot approve: Missing required documents (Selfie + {user.role === 'rider' ? 'License' : 'NIN Card'}).
                                        </div>
                                    )}
                                </div>
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

                            {user.role === 'rider' && !user.hackneyVerified && user.kycDocuments?.hackneyPermit && (
                                <div className="flex gap-2">
                                     <button
                                        onClick={() => { setRejectAction("hackney"); setIsRejectModalOpen(true); }}
                                        disabled={processing}
                                        className="px-3 py-1.5 border border-red-300 text-red-700 rounded hover:bg-red-50 font-medium text-xs"
                                    >
                                        Reject Hackney
                                    </button>
                                    <button
                                        onClick={() => setIsApproveHackneyModalOpen(true)}
                                        disabled={processing}
                                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium text-sm flex items-center shadow-md"
                                    >
                                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                                        Approve Hackney
                                    </button>
                                </div>
                            )}

                            {user.role === 'rider' && !user.insuranceVerified && user.kycDocuments?.insurancePolicy && (
                                <div className="flex gap-2">
                                     <button
                                        onClick={() => { setRejectAction("insurance"); setIsRejectModalOpen(true); }}
                                        disabled={processing}
                                        className="px-3 py-1.5 border border-red-300 text-red-700 rounded hover:bg-red-50 font-medium text-xs"
                                    >
                                        Reject Insurance
                                    </button>
                                    <button
                                        onClick={() => setIsApproveInsuranceModalOpen(true)}
                                        disabled={processing}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm flex items-center shadow-md"
                                    >
                                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                                        Approve Insurance
                                    </button>
                                </div>
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
            >
                {complianceSettings?.identityPoints > 0 && !user.identityRewardPaid && (
                   <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30 flex items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-sm text-blue-100 font-medium"> 
                           Automatic Reward: ₦{complianceSettings.identityPoints.toLocaleString()} points will be granted.
                        </span>
                   </div>
                )}
            </ConfirmationModal>

            {/* Approve Address Confirmation Modal */}
            <ConfirmationModal
                isOpen={isApproveAddressModalOpen}
                onClose={() => setIsApproveAddressModalOpen(false)}
                onConfirm={handleApproveAddress}
                title="Approve Residential Address"
                message={`Are you sure you want to approve the Address Proof for ${user.fullName}? This will upgrade them to Tier 3 (₦5,000,000 limit).`}
                confirmText="Approve Address"
                icon={ShieldCheckIcon}
            >
                {complianceSettings?.addressPoints > 0 && !user.addressRewardPaid && (
                   <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30 flex items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-sm text-blue-100 font-medium"> 
                           Automatic Reward: ₦{complianceSettings.addressPoints.toLocaleString()} points will be granted.
                        </span>
                   </div>
                )}
            </ConfirmationModal>

             {/* Approve Hackney Confirmation Modal */}
             <ConfirmationModal
                isOpen={isApproveHackneyModalOpen}
                onClose={() => setIsApproveHackneyModalOpen(false)}
                onConfirm={handleApproveHackney}
                title="Approve Hackney Permit"
                message={`Are you sure you want to approve the Hackney Permit for ${user.fullName}?`}
                confirmText="Approve Hackney"
                icon={CheckCircleIcon}
            >
                {complianceSettings?.hackneyPoints > 0 && !user.hackneyRewardPaid && (
                   <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30 flex items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-sm text-blue-100 font-medium"> 
                           Automatic Reward: ₦{complianceSettings.hackneyPoints.toLocaleString()} points will be granted.
                        </span>
                   </div>
                )}
            </ConfirmationModal>

             {/* Approve Insurance Confirmation Modal */}
             <ConfirmationModal
                isOpen={isApproveInsuranceModalOpen}
                onClose={() => setIsApproveInsuranceModalOpen(false)}
                onConfirm={handleApproveInsurance}
                title="Approve Insurance Policy"
                message={`Are you sure you want to approve the Insurance Policy for ${user.fullName}?`}
                confirmText="Approve Insurance"
                icon={CheckCircleIcon}
            >
                {complianceSettings?.insurancePoints > 0 && !user.insuranceRewardPaid && (
                   <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30 flex items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-sm text-blue-100 font-medium"> 
                           Automatic Reward: ₦{complianceSettings.insurancePoints.toLocaleString()} points will be granted.
                        </span>
                   </div>
                )}
            </ConfirmationModal>

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

            {/* Image Preview / Zoom Modal */}
            <Dialog 
                open={!!selectedImage} 
                onClose={() => setSelectedImage(null)} 
                className="fixed z-[100] inset-0 overflow-hidden"
            >
                <DialogBackdrop className="fixed inset-0 bg-black/90 transition-opacity" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="relative max-w-5xl w-full h-full flex items-center justify-center">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-0 right-0 p-4 text-white hover:text-gray-300 z-[110]"
                        >
                            <XMarkIcon className="h-10 w-10" />
                        </button>
                        
                        <img
                            src={selectedImage ? resolveImageUrl(selectedImage) : ""}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/800?text=Image+Load+Error"; }}
                        />
                        
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-bold tracking-widest uppercase border border-white/20">
                            Pinch or Use Scroll to Zoom
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </>
    );
};

export default KYCDetailsModal;
