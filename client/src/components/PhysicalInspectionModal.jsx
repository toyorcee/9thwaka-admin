import React, { useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon, CheckCircleIcon, XCircleIcon, TruckIcon, MapPinIcon, ShieldCheckIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { verifyInspection } from "../services/adminApi";

const PhysicalInspectionModal = ({ verification, isOpen, onClose, onSuccess }) => {
    const [processing, setProcessing] = useState(false);
    const [failReason, setFailReason] = useState("");
    const [isFailModalOpen, setIsFailModalOpen] = useState(false);

    if (!verification) return null;

    const handleApprove = async () => {
        setProcessing(true);
        try {
            const data = await verifyInspection(verification._id, { status: "completed" });
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
        if (!failReason.trim()) return alert("Please provide a reason for inspection failure.");
        
        setProcessing(true);
        try {
            const data = await verifyInspection(verification._id, { 
                status: "failed", 
                message: failReason 
            });
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                alert(data.error || "Update failed");
            }
        } catch {
            alert("Network error");
        } finally {
            setProcessing(false);
            setIsFailModalOpen(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
                <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />

                <div className="flex items-center justify-center min-h-screen px-4 py-8">
                    <DialogPanel className="relative bg-white dark:bg-neutral-900 rounded-[2.5rem] max-w-2xl w-full p-0 shadow-2xl mx-auto overflow-hidden border border-white/10">
                        {/* Header Section */}
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-8 text-white relative">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>

                            <div className="flex items-center gap-6">
                                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/30">
                                    <MapPinIcon className="h-10 w-10 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-3xl font-black tracking-tight">
                                        Hub Physical Audit
                                    </DialogTitle>
                                    <div className="flex flex-wrap items-center gap-3 mt-1 opacity-90">
                                        <span className="text-sm font-bold uppercase tracking-widest">{verification.fullName || verification.name}</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-white/50"></span>
                                        <span className="text-sm font-black uppercase tracking-tighter bg-white/20 px-2 py-0.5 rounded">{verification.vehiclePlateNumber}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/50 mb-8">
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
                                        <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-blue-900 dark:text-blue-100 uppercase tracking-widest mb-1">Audit Protocol</p>
                                        <p className="text-xs text-blue-800/70 dark:text-blue-200/60 leading-relaxed">
                                            Verify that the physical vehicle matches the records:
                                        </p>
                                        <ul className="mt-3 space-y-2">
                                            <li className="flex items-center gap-2 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                Plate Number: {verification.vehiclePlateNumber}
                                            </li>
                                            <li className="flex items-center gap-2 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                Color: {verification.vehicleColor}
                                            </li>
                                            <li className="flex items-center gap-2 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                Type: {verification.vehicleType?.replace('_', ' ')}
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {verification.vehicleInspectionStatus === 'failed' && (
                                <div className="mb-8 p-6 bg-rose-50 dark:bg-rose-900/20 rounded-3xl border border-rose-100 dark:border-rose-800/50">
                                    <h4 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.2em] mb-2">Previous Failure Reason</h4>
                                    <p className="text-sm font-bold text-rose-900 dark:text-rose-100 italic">
                                        "{verification.vehicleInspectionMessage}"
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={handleApprove}
                                    disabled={processing}
                                    className="w-full py-5 bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {processing ? "Updating..." : (
                                        <>
                                            <CheckCircleIcon className="h-5 w-5" />
                                            <span>Pass Physical Audit</span>
                                        </>
                                    )}
                                </button>
                                
                                <button
                                    onClick={() => setIsFailModalOpen(true)}
                                    disabled={processing}
                                    className="w-full py-4 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-2xl transition-all active:scale-95 border border-transparent hover:border-rose-100"
                                >
                                    Fail Physical Audit
                                </button>
                            </div>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            {/* Fail Reason Dialog */}
            <Dialog 
                open={isFailModalOpen} 
                onClose={() => setIsFailModalOpen(false)} 
                className="fixed z-[60] inset-0 overflow-y-auto"
            >
                <DialogBackdrop className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity" />

                <div className="flex items-center justify-center min-h-screen px-4">
                     <DialogPanel className="relative bg-white dark:bg-neutral-900 rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl mx-auto z-50 border border-white/10">
                        <div className="bg-rose-50 dark:bg-rose-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                            <XCircleIcon className="h-8 w-8 text-rose-600" />
                        </div>
                        
                        <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                            Audit Failed
                        </DialogTitle>
                        <p className="text-sm text-slate-500 dark:text-neutral-400 mb-6 font-medium">
                            Please specify why the physical inspection failed. The rider will be notified.
                        </p>
                        
                        <textarea
                            className="w-full p-5 bg-slate-50 dark:bg-neutral-800 border-2 border-slate-100 dark:border-neutral-700 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 text-sm font-medium transition-all outline-none min-h-[120px]"
                            placeholder="e.g. Broken windshield, expired papers, vehicle color mismatch..."
                            value={failReason}
                            onChange={(e) => setFailReason(e.target.value)}
                        ></textarea>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setIsFailModalOpen(false)}
                                className="flex-1 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-2xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processing || !failReason.trim()}
                                className="flex-1 py-4 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {processing ? "Submitting..." : "Confirm Failure"}
                            </button>
                        </div>
                     </DialogPanel>
                </div>
            </Dialog>
        </>
    );
};

export default PhysicalInspectionModal;
