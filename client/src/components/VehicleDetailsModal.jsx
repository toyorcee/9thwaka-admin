import React, { useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon, CheckCircleIcon, XCircleIcon, TruckIcon, UserIcon, IdentificationIcon, CalendarIcon, PaintBrushIcon } from "@heroicons/react/24/outline";
import { verifyVehicle } from "../services/adminApi";
import { resolveImageUrl } from "../utils/urlHelper";

const VehicleDetailsModal = ({ verification, isOpen, onClose, onSuccess }) => {
    const [processing, setProcessing] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    if (!verification) return null;

    const handleApprove = async () => {
        setProcessing(true);
        try {
            const data = await verifyVehicle(verification._id, { status: "approved" });
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                alert(data.error || "Approval failed");
            }
        } catch {
            alert("Network error");
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return alert("Please provide a rejection reason.");
        
        setProcessing(true);
        try {
            const data = await verifyVehicle(verification._id, { 
                status: "rejected", 
                message: rejectReason 
            });
            if (data.success) {
                onSuccess();
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
        <>
            <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
                <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />

                <div className="flex items-center justify-center min-h-screen px-4 py-8">
                    <DialogPanel className="relative bg-white dark:bg-neutral-900 rounded-3xl max-w-4xl w-full p-0 shadow-2xl mx-auto overflow-hidden border border-white/10">
                        {/* Header Section */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>

                            <div className="flex items-center gap-6">
                                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/30">
                                    <TruckIcon className="h-10 w-10 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-3xl font-black tracking-tight">
                                        Vehicle Verification
                                    </DialogTitle>
                                    <div className="flex items-center gap-2 mt-1 opacity-90">
                                        <span className="text-sm font-bold uppercase tracking-widest">{verification.name}</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-white/50"></span>
                                        <span className="text-sm font-medium">{verification.email}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Side: Details */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Vehicle Specifications</h3>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-slate-100 dark:border-neutral-800">
                                            <div className="flex items-center gap-3 mb-1 text-slate-500 dark:text-neutral-400">
                                                <IdentificationIcon className="h-4 w-4" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Plate Number</span>
                                            </div>
                                            <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{verification.vehiclePlateNumber}</p>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-slate-100 dark:border-neutral-800">
                                            <div className="flex items-center gap-3 mb-1 text-slate-500 dark:text-neutral-400">
                                                <PaintBrushIcon className="h-4 w-4" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Color</span>
                                            </div>
                                            <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{verification.vehicleColor}</p>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-slate-100 dark:border-neutral-800">
                                            <div className="flex items-center gap-3 mb-1 text-slate-500 dark:text-neutral-400">
                                                <CalendarIcon className="h-4 w-4" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Model Year</span>
                                            </div>
                                            <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{verification.vehicleYear}</p>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-slate-100 dark:border-neutral-800">
                                            <div className="flex items-center gap-3 mb-1 text-slate-500 dark:text-neutral-400">
                                                <UserIcon className="h-4 w-4" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Verification Status</span>
                                            </div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-700 uppercase tracking-tighter">
                                                PENDING REVIEW
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                                        <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-3">Owner Information</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-blue-800/60 dark:text-blue-200/60 font-medium">Owner Name</span>
                                                <span className="text-sm font-bold text-blue-900 dark:text-blue-100">{verification.vehicleOwner?.name || verification.name}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-blue-800/60 dark:text-blue-200/60 font-medium">Contact Phone</span>
                                                <span className="text-sm font-bold text-blue-900 dark:text-blue-100">{verification.vehicleOwner?.phone || "N/A"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Pictures */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Inspection Photos</h3>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Front View</span>
                                            <div 
                                                className="aspect-[4/3] bg-slate-100 dark:bg-neutral-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-700 group relative cursor-zoom-in"
                                                onClick={() => setSelectedImage(verification.vehiclePictureFront)}
                                            >
                                                <img 
                                                    src={resolveImageUrl(verification.vehiclePictureFront)} 
                                                    alt="Vehicle Front" 
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/800?text=Image+Load+Error"; }}
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                    <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-[10px] font-black px-3 py-1.5 rounded-full shadow-xl transition-opacity uppercase tracking-widest">Enlarge</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => window.open(resolveImageUrl(verification.vehiclePictureFront), "_blank")}
                                                className="mt-2 w-full text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 py-1 rounded uppercase tracking-wider transition-colors"
                                            >
                                                View Full Document
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Rear View</span>
                                            <div 
                                                className="aspect-[4/3] bg-slate-100 dark:bg-neutral-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-700 group relative cursor-zoom-in"
                                                onClick={() => setSelectedImage(verification.vehiclePictureBack)}
                                            >
                                                <img 
                                                    src={resolveImageUrl(verification.vehiclePictureBack)} 
                                                    alt="Vehicle Back" 
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/800?text=Image+Load+Error"; }}
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                    <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-[10px] font-black px-3 py-1.5 rounded-full shadow-xl transition-opacity uppercase tracking-widest">Enlarge</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => window.open(resolveImageUrl(verification.vehiclePictureBack), "_blank")}
                                                className="mt-2 w-full text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 py-1 rounded uppercase tracking-wider transition-colors"
                                            >
                                                View Full Document
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800/50 flex items-start gap-4">
                                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
                                            <CheckCircleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-amber-800 dark:text-amber-200">Guidelines for Review</p>
                                            <p className="text-[10px] text-amber-700/70 dark:text-amber-300/60 mt-1 leading-relaxed">
                                                Ensure plate number matches the text entry. Check for clear visibility of vehicle color and overall condition. Reject if photos are dark or blurry.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-12 flex items-center justify-end gap-4 border-t border-slate-100 dark:border-neutral-800 pt-8">
                                <button
                                    onClick={() => setIsRejectModalOpen(true)}
                                    disabled={processing}
                                    className="px-8 py-4 text-rose-600 dark:text-rose-400 font-black text-[11px] uppercase tracking-[0.1em] hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                                >
                                    Reject Application
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={processing}
                                    className="px-10 py-4 bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-3"
                                >
                                    {processing ? "Processing..." : (
                                        <>
                                            <CheckCircleIcon className="h-4 w-4" />
                                            <span>Approve Vehicle</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            {/* Reject with Reason Dialog */}
            <Dialog 
                open={isRejectModalOpen} 
                onClose={() => setIsRejectModalOpen(false)} 
                className="fixed z-[60] inset-0 overflow-y-auto"
            >
                <DialogBackdrop className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity" />

                <div className="flex items-center justify-center min-h-screen px-4">
                     <DialogPanel className="relative bg-white dark:bg-neutral-900 rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl mx-auto z-50 border border-white/10">
                        <div className="bg-rose-50 dark:bg-rose-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                            <XCircleIcon className="h-8 w-8 text-rose-600" />
                        </div>
                        
                        <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                            Reason for Rejection
                        </DialogTitle>
                        <p className="text-sm text-slate-500 dark:text-neutral-400 mb-6 font-medium">
                            The rider will receive a push notification with this reason. Please be specific.
                        </p>
                        
                        <textarea
                            className="w-full p-5 bg-slate-50 dark:bg-neutral-800 border-2 border-slate-100 dark:border-neutral-700 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 text-sm font-medium transition-all outline-none min-h-[120px]"
                            placeholder="e.g. Front picture is too dark, plate number mismatch..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        ></textarea>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setIsRejectModalOpen(false)}
                                className="flex-1 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-2xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processing || !rejectReason.trim()}
                                className="flex-1 py-4 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {processing ? "Sending..." : "Confirm Reject"}
                            </button>
                        </div>
                     </DialogPanel>
                </div>
            </Dialog>

            {/* Image Preview Modal */}
            <Dialog 
                open={!!selectedImage} 
                onClose={() => setSelectedImage(null)} 
                className="fixed z-[100] inset-0 overflow-hidden"
            >
                <DialogBackdrop className="fixed inset-0 bg-black/95 transition-opacity" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="relative max-w-6xl w-full h-full flex items-center justify-center">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-0 right-0 p-4 text-white hover:text-gray-300 z-[110]"
                        >
                            <XMarkIcon className="h-10 w-10" />
                        </button>
                        <img
                            src={selectedImage ? resolveImageUrl(selectedImage) : ""}
                            alt="Full View"
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/800?text=Image+Load+Error"; }}
                        />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-[10px] font-black tracking-[0.2em] uppercase border border-white/20">
                            Pinch or Use Scroll to Zoom
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </>
    );
};

export default VehicleDetailsModal;
