import React, { useState, useEffect } from "react";
import Table from "../components/Table";
import Skeleton from "../components/Skeleton";
import VehicleDetailsModal from "../components/VehicleDetailsModal";
import EmptyState from "../components/EmptyState";
import { TruckIcon, CheckCircleIcon, InformationCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { getPendingVehicleVerifications } from "../services/adminApi";

const VehicleVerification = () => {
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVerification, setSelectedVerification] = useState(null);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("pending");

    const fetchVerifications = async () => {
        setLoading(true);
        try {
            const data = await getPendingVehicleVerifications({ status: activeTab });
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
    }, [activeTab]);

    const handleSuccess = () => {
        fetchVerifications();
    };

    const columns = [
        { 
            header: "Rider", 
            accessor: (v) => (
                <div className="flex items-center space-x-3 py-1">
                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center border ${
                        activeTab === 'approved' ? 'bg-emerald-50 border-emerald-100' : 
                        activeTab === 'rejected' ? 'bg-rose-50 border-rose-100' : 
                        'bg-indigo-50 border-indigo-100'
                    }`}>
                        <TruckIcon className={`h-6 w-6 ${
                            activeTab === 'approved' ? 'text-emerald-500' : 
                            activeTab === 'rejected' ? 'text-rose-500' : 
                            'text-indigo-500'
                        }`} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 dark:text-white text-sm leading-tight">
                            {v.fullName || v.name || "Unknown Rider"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            {v.email}
                        </span>
                    </div>
                </div>
            )
        },
        { 
            header: "Vehicle Details", 
            accessor: (v) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 text-[11px] font-black rounded-lg border border-slate-200 dark:border-neutral-700 font-mono tracking-widest">
                            {v.vehiclePlateNumber}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase">
                            {v.vehicleType?.replace('_', ' ') || 'Car'}
                        </span>
                    </div>
                </div>
            )
        },
        { 
            header: "Review Status", 
            accessor: (v) => {
                const colors = activeTab === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                               activeTab === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                               'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
                
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-tight ${colors}`}>
                        {activeTab === 'approved' ? 'Docs Approved' : activeTab === 'rejected' ? 'Docs Rejected' : 'Review Required'}
                    </span>
                );
            }
        },
        {
            header: "Action",
            accessor: (v) => (
                <button
                    onClick={() => setSelectedVerification(v)}
                    className={`group flex items-center gap-2 px-4 py-2 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all duration-300 ${
                        activeTab === 'approved' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' :
                        activeTab === 'rejected' ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white' :
                        'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                    }`}
                >
                    {activeTab === 'pending' ? 'Review Docs' : 'View History'}
                    <InformationCircleIcon className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
            ),
        },
    ];

    if (loading && verifications.length === 0) {
        return <div className="p-8"><Skeleton className="h-20 w-full mb-4" /><Skeleton className="h-64 w-full" /></div>;
    }

    return (
        <div className="p-8 bg-slate-50/50 dark:bg-neutral-950 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white dark:bg-neutral-900 rounded-[2rem] shadow-xl shadow-indigo-500/10 border border-indigo-50 dark:border-indigo-900/30">
                        <TruckIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div>
                       <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Vehicle Setup</h1>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                         Phase 1: Document Verification
                       </p>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 mb-8 bg-slate-100 dark:bg-neutral-900/50 p-1.5 rounded-[2rem] w-fit border border-slate-200 dark:border-neutral-800">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeTab === "pending" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                    }`}
                >
                    Review Queue
                </button>
                <button
                    onClick={() => setActiveTab("approved")}
                    className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeTab === "approved" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400"
                    }`}
                >
                    Verified History
                </button>
                <button
                    onClick={() => setActiveTab("rejected")}
                    className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeTab === "rejected" ? "bg-white text-rose-600 shadow-sm" : "text-slate-400"
                    }`}
                >
                    Rejected
                </button>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                <Table columns={columns} data={verifications} />
                {!loading && verifications.length === 0 && (
                    <EmptyState type="vehicles" />
                )}
            </div>

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
