import React, { useState, useEffect } from "react";
import Table from "../components/Table";
import Skeleton from "../components/Skeleton";
import VehicleDetailsModal from "../components/VehicleDetailsModal";
import { TruckIcon, CheckCircleIcon, InformationCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { getPendingVehicleVerifications } from "../services/adminApi";

const VehicleVerification = () => {
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVerification, setSelectedVerification] = useState(null);
    const [error, setError] = useState("");

    const fetchVerifications = async () => {
        setLoading(true);
        try {
            const data = await getPendingVehicleVerifications();
            if (data.success) {
                setVerifications(data.data || []);
            } else {
                setVerifications([]);
                setError(data.error || "Failed to fetch verifications");
            }
        } catch (err) {
            setError("Network error fetching vehicle verifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVerifications();
    }, []);

    const handleSuccess = () => {
        fetchVerifications();
    };

    const columns = [
        { 
            header: "Rider", 
            accessor: (v) => (
                <div className="flex items-center space-x-3 py-1">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                        <TruckIcon className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 dark:text-white text-sm leading-tight">{v.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{v.email}</span>
                    </div>
                </div>
            )
        },
        { 
            header: "Plate Number", 
            accessor: (v) => (
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 text-[11px] font-black rounded-lg border border-slate-200 dark:border-neutral-700 font-mono tracking-widest">
                        {v.vehiclePlateNumber}
                    </span>
                </div>
            )
        },
        { 
            header: "Vehicle Details", 
            accessor: (v) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">{v.vehicleColor} {v.vehicleYear}</span>
                    <span className="text-[9px] text-slate-400 font-black uppercase">Standard Inspection</span>
                </div>
            )
        },
        { 
            header: "Owner", 
            accessor: (v) => (
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-600 dark:text-neutral-400">{v.vehicleOwner?.name || v.name}</span>
                    <span className="text-[10px] text-slate-400">{v.vehicleOwner?.phone || "N/A"}</span>
                </div>
            )
        },
        { 
            header: "Status", 
            accessor: () => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-tight animate-pulse">
                    Review Required
                </span>
            )
        },
        {
            header: "Action",
            accessor: (v) => (
                <button
                    onClick={() => setSelectedVerification(v)}
                    className="group flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all duration-300"
                >
                    Review Details
                    <InformationCircleIcon className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center gap-4 mb-10">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-neutral-800">
                    <div className="p-6 border-b border-slate-100 dark:border-neutral-800">
                        <div className="grid grid-cols-6 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-6 w-full rounded-lg" />)}
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="grid grid-cols-6 gap-4">
                                {[1, 2, 3, 4, 5, 6].map(j => <Skeleton key={j} className="h-10 w-full rounded-xl" />)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-50/50 dark:bg-neutral-950 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white dark:bg-neutral-900 rounded-[2rem] shadow-xl shadow-indigo-500/10 border border-indigo-50 dark:border-indigo-900/30">
                        <TruckIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div>
                       <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Vehicle Queue</h1>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                         Rider Compliance & Asset Verification
                       </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 px-6 py-4 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-neutral-800">
                    <InformationCircleIcon className="h-5 w-5 text-indigo-500" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-neutral-400">
                        {(verifications || []).length} Pending Verifications
                    </span>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-4">
                    <XCircleIcon className="h-5 w-5" />
                    <span className="text-xs font-black uppercase tracking-widest">{error}</span>
                </div>
            )}

            {(!verifications || verifications.length === 0) && !loading && !error ? (
                <div className="text-center py-24 bg-white dark:bg-neutral-900 rounded-[3rem] shadow-2xl shadow-indigo-500/5 border border-slate-100 dark:border-neutral-800">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <CheckCircleIcon className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Queue Clear!</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
                        All rider vehicle submissions have been processed.
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl shadow-indigo-500/5 border border-slate-100 dark:border-neutral-800 overflow-hidden">
                    <Table columns={columns} data={verifications} />
                </div>
            )}

            {selectedVerification && (
                <VehicleDetailsModal
                    verification={selectedVerification}
                    isOpen={!!selectedVerification}
                    onClose={() => setSelectedVerification(null)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
};

export default VehicleVerification;
