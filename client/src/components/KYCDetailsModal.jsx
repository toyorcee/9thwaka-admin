import React, { useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { 
    XMarkIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    ShieldCheckIcon, 
    InformationCircleIcon,
    CheckBadgeIcon,
    UserIcon,
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    IdentificationIcon,
    CalendarIcon,
    ArrowTopRightOnSquareIcon,
    DocumentCheckIcon,
    ShieldExclamationIcon,
    ClockIcon
} from "@heroicons/react/24/outline";
import { ShieldCheckIcon as ShieldCheckIconSolid } from "@heroicons/react/24/solid";
import Loader from "./Loader";
import ConfirmationModal from "./ConfirmationModal";
import { verifyIdentity, approveTier2, approveTier3, rejectTier2, rejectTier3, revokeKYC } from "../services/adminApi";
import { fetchAdminSettings } from "../services/settingsApi";
import { resolveImageUrl } from "../utils/urlHelper";
import { useEffect, Fragment } from "react";

const KYCDetailsModal = ({ user, isOpen, activeTab, onClose, onApproveSuccess, onRejectSuccess, onRevokeSuccess }) => {
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
        if (isOpen) {
            loadSettings();
        }
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

    const handleApprove = async () => {
        setProcessing(true);
        try {
            const data = await approveTier2(user._id, { grantReward: grantReward && !user.identityRewardPaid });
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

    const handleApproveTier3 = async () => {
        setProcessing(true);
        try {
            const data = await approveTier3(user._id, { grantReward: grantReward && !user.tier3RewardPaid });
            if (data.success) {
                onApproveSuccess();
                onClose();
            } else {
                alert(data.error || "Tier 3 approval failed");
            }
        } catch {
            alert("Network error");
        } finally {
            setProcessing(false);
            setIsApproveAddressModalOpen(false); 
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return alert("Please provide a rejection reason.");
        
        setProcessing(true);
        try {
            let data;
            if (rejectAction === "tier3") {
                data = await rejectTier3(user._id, rejectReason);
            } else {
                data = await rejectTier2(user._id, rejectReason);
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

    const DocCard = ({ title, imageUrl, isVerified, subtitle, onClick }) => (
        <div className="group relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300">
            <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
                <div>
                    <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{title}</h4>
                    {subtitle && <p className="text-[9px] text-neutral-400 font-medium">{subtitle}</p>}
                </div>
                {isVerified && (
                    <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase border border-emerald-100">
                        <CheckBadgeIcon className="h-2.5 w-2.5" />
                        <span>Verified</span>
                    </div>
                )}
            </div>
            <div className="aspect-video relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                {imageUrl ? (
                    <img
                        src={resolveImageUrl(imageUrl)}
                        alt={title}
                        className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110 cursor-zoom-in"
                        onClick={() => onClick ? onClick(imageUrl) : setSelectedImage(imageUrl)}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300">
                        <ShieldExclamationIcon className="h-8 w-8 mb-1 opacity-20" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">No Document</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors pointer-events-none" />
            </div>
            {imageUrl && (
                <button 
                    onClick={() => window.open(resolveImageUrl(imageUrl), "_blank")}
                    className="w-full py-2 bg-neutral-50 dark:bg-neutral-900 text-[10px] font-black text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all uppercase tracking-widest border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-center space-x-2"
                >
                    <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                    <span>Open Original</span>
                </button>
            )}
        </div>
    );

    const InfoItem = ({ icon: Icon, label, value, color = "indigo" }) => (
        <div className="flex items-start space-x-3 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm">
            <div className={`p-2 rounded-lg bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400`}>
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-[150px]">{value || "N/A"}</p>
            </div>
        </div>
    );

    return (
        <>
            <Transition show={isOpen} as={Fragment}>
                <Dialog onClose={() => {}} className="relative z-50">
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <DialogBackdrop className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm" />
                    </TransitionChild>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <TransitionChild
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95 translate-y-4"
                                enterTo="opacity-100 scale-100 translate-y-0"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100 translate-y-0"
                                leaveTo="opacity-0 scale-95 translate-y-4"
                            >
                                <DialogPanel className="w-full max-w-3xl transform overflow-hidden rounded-[2.5rem] bg-white dark:bg-neutral-950 shadow-2xl transition-all border border-neutral-200 dark:border-neutral-800">
                                    {/* Header Section */}
                                    <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-purple-600 overflow-hidden">
                                        <div className="absolute inset-0 opacity-10">
                                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                <path d="M0 0 L100 100 M100 0 L0 100" stroke="currentColor" strokeWidth="0.5" fill="none" />
                                            </svg>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="absolute top-6 right-6 p-2 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors backdrop-blur-md"
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="px-8 pb-8 -mt-12 relative">
                                        {/* Profile Info Card */}
                                        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-xl border border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
                                            <div className="relative -mt-16 md:-mt-20 group">
                                                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                                <img
                                                    src={resolveImageUrl(user.profilePicture || user.kycDocuments?.selfie)}
                                                    alt={user.fullName}
                                                    className="h-32 w-32 rounded-full object-cover border-4 border-white dark:border-neutral-900 shadow-2xl relative z-10 cursor-pointer hover:scale-105 transition-transform"
                                                    onClick={() => setSelectedImage(user.profilePicture || user.kycDocuments?.selfie)}
                                                />
                                                {user.is9thWakaVerified && (
                                                    <div className="absolute bottom-1 right-1 z-20 h-8 w-8 bg-indigo-600 rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center shadow-lg animate-bounce">
                                                        <CheckBadgeIcon className="h-5 w-5 text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 text-center md:text-left">
                                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-1">
                                                    <h2 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                                                        {user.fullName}
                                                    </h2>
                                                    {user.is9thWakaVerified && (
                                                        <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-tighter rounded-full shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 flex items-center gap-1">
                                                            <ShieldCheckIconSolid className="h-3 w-3" />
                                                            9thWaka Verified
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                        user.tier === 3 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                                        user.tier === 2 ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                                                        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                    }`}>
                                                        Tier {user.tier || 1} Compliance
                                                    </span>
                                                    <span className="text-neutral-300 dark:text-neutral-700">•</span>
                                                    <span className="text-neutral-500 dark:text-neutral-400 text-[11px] font-black uppercase tracking-widest">{user.role}</span>
                                                    <span className="text-neutral-300 dark:text-neutral-700">•</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                        user.kycStatus === 'approved' ? 'text-emerald-500' :
                                                        user.kycStatus === 'pending' ? 'text-amber-500' : 'text-rose-500'
                                                    }`}>
                                                        {user.kycStatus || "Unverified"}
                                                    </span>
                                                </div>
                                                <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800">
                                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-tighter mb-2">Active Service Modes</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {user.supportedServices && user.supportedServices.length > 0 ? (
                                                            user.supportedServices.map(svc => (
                                                                <span key={svc} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] font-black rounded uppercase border border-indigo-100 dark:border-indigo-900/50">
                                                                    {svc === 'ride' ? 'Ride' : 'Courier'}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-400 text-[8px] font-black rounded uppercase">No Active Modes</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Main Content Tabs/Grid */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            {/* Left Column: Stats & Contact */}
                                            <div className="lg:col-span-1 space-y-4">
                                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2 px-1">User Dossier</h3>
                                                <InfoItem icon={EnvelopeIcon} label="Email Address" value={user.email} />
                                                <InfoItem icon={PhoneIcon} label="Phone Number" value={user.phoneNumber} color="emerald" />
                                                <InfoItem icon={IdentificationIcon} label="BVN" value={user.bvn} color="purple" />
                                                <InfoItem icon={CalendarIcon} label="Birth Date" value={user.dob ? new Date(user.dob).toLocaleDateString() : "N/A"} color="amber" />
                                                <InfoItem icon={ClockIcon} label="Last Seen" value={user.lastSeen ? new Date(user.lastSeen).toLocaleString() : "N/A"} color="indigo" />
                                                
                                                {user.payscribeDetails?.accountNumber && (
                                                    <div className="mt-6 p-5 rounded-2xl bg-neutral-900 dark:bg-neutral-800 text-white shadow-xl relative overflow-hidden group">
                                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                                            <DocumentCheckIcon className="h-16 w-16" />
                                                        </div>
                                                        <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">Settlement Account</h4>
                                                        <p className="text-xl font-mono font-black tracking-widest mb-1">{user.payscribeDetails.accountNumber}</p>
                                                        <p className="text-[10px] font-bold text-neutral-400 uppercase">{user.payscribeDetails.bankName}</p>
                                                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                                                            <span className="text-[9px] font-black text-emerald-400 uppercase">Status: Active</span>
                                                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                                                        </div>
                                                    </div>
                                                )}

                                                {user.kycUpdateReason && (
                                                    <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
                                                        <div className="flex items-center space-x-2 mb-2 text-rose-600">
                                                            <ShieldExclamationIcon className="h-4 w-4" />
                                                            <h4 className="text-[10px] font-black uppercase tracking-widest">Update Required</h4>
                                                        </div>
                                                        <p className="text-xs text-rose-800 dark:text-rose-300 font-bold leading-relaxed">{user.kycUpdateReason}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Column: Documents & Actions */}
                                            <div className="lg:col-span-2 space-y-6">
                                                {/* Identity Section */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] flex items-center">
                                                            <IdentificationIcon className="h-4 w-4 mr-2 text-indigo-600" />
                                                            Identity Assets
                                                        </h3>
                                                        {user.tier >= 2 && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded uppercase border border-indigo-100">Tier 2 Approved</span>}
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <DocCard 
                                                            title={user.role === 'customer' ? 'NIN / ID CARD' : 'DRIVERS LICENSE'} 
                                                            imageUrl={user.kycDocuments?.bvnImage || user.kycDocuments?.ninImage || user.driverLicensePicture}
                                                            isVerified={user.kycStatus === 'approved'}
                                                            subtitle={user.driverLicenseNumber || user.nin}
                                                        />
                                                        <DocCard 
                                                            title="SELFIE VERIFICATION" 
                                                            imageUrl={user.kycDocuments?.selfie}
                                                            isVerified={user.kycStatus === 'approved'}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Compliance Section (Tier 3) */}
                                                {(user.kycDocuments?.proofOfAddress || user.role === 'rider') && (
                                                    <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] flex items-center">
                                                                <MapPinIcon className="h-4 w-4 mr-2 text-purple-600" />
                                                                Compliance Assets (Tier 3)
                                                            </h3>
                                                            {user.tier >= 3 && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[8px] font-black rounded uppercase border border-purple-100">Tier 3 Approved</span>}
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            {user.kycDocuments?.proofOfAddress && (
                                                                <DocCard 
                                                                    title="PROOF OF ADDRESS" 
                                                                    imageUrl={user.kycDocuments.proofOfAddress}
                                                                    isVerified={user.addressVerified}
                                                                    subtitle={user.address}
                                                                />
                                                            )}
                                                            {user.role === 'rider' && (
                                                                <>
                                                                    <DocCard 
                                                                        title="HACKNEY PERMIT" 
                                                                        imageUrl={user.kycDocuments?.hackneyPermit}
                                                                        isVerified={user.hackneyVerified}
                                                                    />
                                                                    <DocCard 
                                                                        title="COMMERCIAL INSURANCE" 
                                                                        imageUrl={user.kycDocuments?.insurancePolicy}
                                                                        isVerified={user.insuranceVerified}
                                                                    />
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Guarantor Section */}
                                                {(user.guarantor?.name || user.guarantor?.fullName) && (
                                                    <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 mb-6">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] flex items-center">
                                                                <UserIcon className="h-4 w-4 mr-2 text-indigo-600" />
                                                                Guarantor Intelligence
                                                            </h3>
                                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded uppercase border border-indigo-100">Reference Verified</span>
                                                        </div>
                                                        
                                                        <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800">
                                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                                <div>
                                                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-tighter mb-1">Guarantor Name</p>
                                                                    <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase">{user.guarantor.name || user.guarantor.fullName}</p>
                                                                    <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">{user.guarantor.relationship}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-tighter mb-1">Contact Anchor</p>
                                                                    <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{user.guarantor.phone || user.guarantor.phoneNumber}</p>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="p-3 bg-white dark:bg-neutral-950 rounded-xl border border-neutral-100 dark:border-neutral-800 mb-4">
                                                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-tighter mb-1">Professional Anchor</p>
                                                                <p className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                                                                    {user.guarantor.occupation} @ {user.guarantor.workAddress || "N/A"}
                                                                </p>
                                                            </div>

                                                            {user.guarantor.idCardPicture && (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    <DocCard 
                                                                        title="GUARANTOR ID EVIDENCE" 
                                                                        imageUrl={user.guarantor.idCardPicture}
                                                                        subtitle="Government Issued Identity"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Payscribe Check */}
                                                {!verificationResult && (
                                                    <div className="p-6 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div>
                                                                <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-100 mb-1">External Data Validation</h4>
                                                                <p className="text-xs text-indigo-600/70 font-medium">Cross-reference NIN/License with government database via Payscribe.</p>
                                                            </div>
                                                            <button
                                                                onClick={handleVerifyIdentity}
                                                                disabled={verifying || !(user.driverLicenseNumber || user.nin)}
                                                                className="px-6 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                                                            >
                                                                {verifying ? "Validating..." : "Run Check"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {verificationResult && (
                                                    <div className="p-6 rounded-[2rem] bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                        <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Payscribe Lookup Result</h4>
                                                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                                            <div>
                                                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Full Name</p>
                                                                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100 uppercase">{verificationResult.firstName || verificationResult.first_name} {verificationResult.lastName || verificationResult.last_name}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Date of Birth</p>
                                                                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{verificationResult.dob || verificationResult.date_of_birth}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Gender</p>
                                                                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100 uppercase">{verificationResult.gender}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Linked Phone</p>
                                                                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{verificationResult.phone || verificationResult.phoneNumber || "-"}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Bar */}
                                                <div className="flex flex-col gap-4 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                                                    {user.role === 'rider' && (
                                                        <div className={`p-4 rounded-2xl border ${
                                                            (user.vehicleVerificationStatus === 'approved' && user.vehicleInspectionStatus === 'completed')
                                                                ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30'
                                                                : 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30'
                                                        }`}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Rider Prerequisite Status</h4>
                                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                                                    (user.vehicleVerificationStatus === 'approved' && user.vehicleInspectionStatus === 'completed')
                                                                        ? 'bg-emerald-100 text-emerald-700'
                                                                        : 'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                    {(user.vehicleVerificationStatus === 'approved' && user.vehicleInspectionStatus === 'completed') ? 'Qualified' : 'Pending Lifecycle'}
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-2 h-2 rounded-full ${user.vehicleVerificationStatus === 'approved' ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                                                                    <span className="text-[10px] font-bold text-neutral-600">Phase 1: Documents</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-2 h-2 rounded-full ${user.vehicleInspectionStatus === 'completed' ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                                                                    <span className="text-[10px] font-bold text-neutral-600">Phase 2: Hub Inspection</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap items-center justify-end gap-3">
                                                        {user.tier < 2 && activeTab === 'tier2' && (
                                                            <>
                                                                <button
                                                                    onClick={() => { setRejectAction("tier2"); setIsRejectModalOpen(true); }}
                                                                    className="px-6 py-3 border border-rose-200 text-rose-600 rounded-2xl hover:bg-rose-50 font-black text-[10px] uppercase tracking-widest transition-all"
                                                                >
                                                                    Reject Tier 2
                                                                </button>
                                                                {user.role === 'rider' && (user.vehicleVerificationStatus !== 'approved' || user.vehicleInspectionStatus !== 'completed') ? (
                                                                    <div className="flex items-center gap-2 px-6 py-3 bg-neutral-100 text-neutral-400 font-black rounded-2xl text-[10px] uppercase tracking-widest cursor-not-allowed border border-neutral-200" title="Locked: Complete Vehicle Verification First">
                                                                        <ShieldExclamationIcon className="h-4 w-4" />
                                                                        <span>Approval Locked</span>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => setIsApproveModalOpen(true)}
                                                                        className="px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center space-x-2 text-[10px] uppercase tracking-widest active:scale-95"
                                                                    >
                                                                        <CheckCircleIcon className="h-4 w-4" />
                                                                        <span>Approve Tier 2</span>
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}

                                                        {user.tier === 2 && activeTab === 'tier3' && (
                                                            <>
                                                                <button
                                                                    onClick={() => { setRejectAction("tier3"); setIsRejectModalOpen(true); }}
                                                                    className="px-6 py-3 border border-amber-200 text-amber-600 rounded-2xl hover:bg-amber-50 font-black text-[10px] uppercase tracking-widest transition-all"
                                                                >
                                                                    Reject Tier 3
                                                                </button>
                                                                <button
                                                                    onClick={() => setIsApproveAddressModalOpen(true)}
                                                                    className="px-8 py-3 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 dark:shadow-none flex items-center space-x-2 text-[10px] uppercase tracking-widest active:scale-95"
                                                                >
                                                                    <CheckBadgeIcon className="h-4 w-4" />
                                                                    <span>Approve Tier 3</span>
                                                                </button>
                                                            </>
                                                        )}

                                                        {user.is9thWakaVerified && (
                                                            <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center gap-2">
                                                                <ShieldCheckIconSolid className="h-4 w-4 animate-pulse" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">9thWaka Verified Platform User</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Confirmation & Secondary Modals (Outside main dialog to avoid stacking context issues) */}
            <ConfirmationModal
                isOpen={isApproveModalOpen}
                onClose={() => setIsApproveModalOpen(false)}
                onConfirm={handleApprove}
                title="Authorize Identity Verification"
                message={`You are about to approve Tier 2 (Identity) status for ${user.fullName}. This will elevate their transaction limits to ₦200,000.`}
                confirmText="Approve Identity"
                icon={IdentificationIcon}
            >
                {complianceSettings?.identityPoints > 0 && (
                    <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-full animate-pulse shadow-lg shadow-indigo-200">
                            <DocumentCheckIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-[11px] text-indigo-900 font-bold"> 
                           Automatic Reward: ₦{complianceSettings.identityPoints.toLocaleString()} points will be credited to user wallet.
                        </span>
                    </div>
                )}
            </ConfirmationModal>

            <ConfirmationModal
                isOpen={isApproveAddressModalOpen}
                onClose={() => setIsApproveAddressModalOpen(false)}
                onConfirm={handleApproveTier3}
                title="Authorize Compliance Bundle"
                message={`Confirm Tier 3 (Compliance) verification for ${user.fullName}. This will upgrade them to the maximum platform limit of ₦5,000,000.`}
                confirmText="Authorize Tier 3"
                icon={ShieldCheckIcon}
            >
                {((user.role === 'rider' ? complianceSettings?.tier3RiderPoints : complianceSettings?.tier3CustomerPoints) > 0) && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-3">
                        <div className="p-2 bg-purple-600 rounded-full animate-pulse shadow-lg shadow-purple-200">
                            <DocumentCheckIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-[11px] text-purple-900 font-bold"> 
                           Automatic Reward: ₦{(user.role === 'rider' ? complianceSettings.tier3RiderPoints : complianceSettings.tier3CustomerPoints).toLocaleString()} points will be credited.
                        </span>
                    </div>
                )}
            </ConfirmationModal>

            {/* Rejection / Revocation Modal */}
            <Dialog 
                open={isRejectModalOpen || isRevokeModalOpen} 
                onClose={() => { setIsRejectModalOpen(false); setIsRevokeModalOpen(false); }} 
                className="relative z-[60]"
            >
                <DialogBackdrop className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2rem] p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800">
                        <DialogTitle className="text-xl font-black text-neutral-900 dark:text-white mb-2">
                            {isRevokeModalOpen ? `Revocation Protocol: T${revokeTargetTier}` : `Rejection Protocol: T${rejectAction === 'tier3' ? '3' : '2'}`}
                        </DialogTitle>
                        <p className="text-xs text-neutral-500 font-medium mb-6">
                            A mandatory reason is required for any compliance reversal. The user will be formally notified via system push.
                        </p>
                        
                        <textarea
                            className="w-full p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm font-bold text-neutral-800 dark:text-neutral-200"
                            rows="4"
                            placeholder="Detail the failure reason (e.g. Identity Mismatch, Low Image Resolution...)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => { setIsRejectModalOpen(false); setIsRevokeModalOpen(false); }}
                                className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={isRevokeModalOpen ? handleRevoke : handleReject}
                                disabled={processing || !rejectReason.trim()}
                                className="px-8 py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200 dark:shadow-none disabled:opacity-50"
                            >
                                {processing ? "Processing..." : "Execute Reversal"}
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            {/* Fullscreen Image Preview */}
            <Dialog 
                open={!!selectedImage} 
                onClose={() => setSelectedImage(null)} 
                className="relative z-[100]"
            >
                <DialogBackdrop className="fixed inset-0 bg-neutral-950/95 backdrop-blur-xl" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full h-full flex flex-col items-center justify-center">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-8 right-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        
                        <div className="relative group max-w-5xl max-h-[80vh] w-full">
                            <img
                                src={selectedImage ? resolveImageUrl(selectedImage) : ""}
                                alt="Preview"
                                className="w-full h-full object-contain rounded-lg shadow-2xl border border-white/10"
                            />
                            <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                Digital Evidence Preview
                            </div>
                        </div>
                        
                        <div className="mt-8 flex gap-4">
                            <button 
                                onClick={() => window.open(resolveImageUrl(selectedImage), "_blank")}
                                className="px-8 py-3 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all"
                            >
                                Open Original Asset
                            </button>
                            <button 
                                onClick={() => setSelectedImage(null)}
                                className="px-8 py-3 bg-white/10 text-white border border-white/20 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all"
                            >
                                Dismiss
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </>
    );
};

export default KYCDetailsModal;

