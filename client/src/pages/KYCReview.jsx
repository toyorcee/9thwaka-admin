import React, { useState, useEffect } from "react";
import Table from "../components/Table";
import Skeleton from "../components/Skeleton";
import KYCDetailsModal from "../components/KYCDetailsModal";
import { CheckCircleIcon, XCircleIcon, UserIcon } from "@heroicons/react/24/outline";
import { getPendingKYCUsers } from "../services/adminApi";
import { resolveImageUrl } from "../utils/urlHelper";

const KYCReview = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("tier1");
    const [showAll, setShowAll] = useState(false);

    const fetchKYCInfo = async () => {
        setLoading(true);
        try {
            const data = await getPendingKYCUsers(showAll);
            if (data.success) {
                setUsers(data.users);
            } else {
                setError(data.error || "Failed to fetch KYC users");
            }
        } catch {
            setError("Network error fetching KYC users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKYCInfo();
    }, [showAll]);

    const handleApprove = async (userId) => {
        if (!showAll) setUsers(users.filter(u => u._id !== userId));
        else fetchKYCInfo();
        setSelectedUser(null);
    };

    const handleReject = async (userId) => {
         if (!showAll) setUsers(users.filter(u => u._id !== userId));
         else fetchKYCInfo();
         setSelectedUser(null);
    };

    const handleRevoke = async (userId) => {
        fetchKYCInfo();
        setSelectedUser(null);
    };

    // Filter users by Tier for the tabs
    const filteredUsers = users.filter((u) => {
        if (activeTab === "tier3") return u.tier === 3 || (u.tier === 2 && u.kycDocuments?.proofOfAddress);
        if (activeTab === "tier2") return u.tier === 2 || (u.tier === 1 && (u.kycStatus === 'pending' || u.kycDocuments?.selfie));
        return u.tier < 2 && u.kycStatus !== 'approved';
    });

    const columns = [
        { 
            header: "User", 
            accessor: (user) => (
                <div className="flex items-center space-x-3">
                    <img
                        src={resolveImageUrl(user.profilePicture || user.kycDocuments?.selfie)}
                        alt=""
                        className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/32"; }}
                    />
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-900 leading-tight">{user.fullName}</span>
                        <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{user.email}</span>
                    </div>
                </div>
            )
        },
        { 
            header: "Documents", 
            accessor: (user) => {
                const hasSelfie = !!user.kycDocuments?.selfie;
                const hasID = user.role === 'rider' ? !!user.driverLicensePicture : (!!user.kycDocuments?.bvnImage || !!user.kycDocuments?.ninImage);
                const hasAddress = !!user.kycDocuments?.proofOfAddress;
                
                return (
                    <div className="flex items-center space-x-1.5">
                        <span title="Selfie" className={`w-2.5 h-2.5 rounded-full ${hasSelfie ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-gray-200'}`}></span>
                        <span title="ID Card" className={`w-2.5 h-2.5 rounded-full ${hasID ? 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]' : 'bg-gray-200'}`}></span>
                        <span title="Address" className={`w-2.5 h-2.5 rounded-full ${hasAddress ? 'bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]' : 'bg-gray-200'}`}></span>
                    </div>
                );
            }
        },
        { 
            header: "Tier", 
            accessor: (user) => {
                const tier = user.tier || 0;
                let colorClass = "bg-gray-100 text-gray-700";
                if (tier === 1) colorClass = "bg-blue-100 text-blue-700";
                if (tier === 2) colorClass = "bg-purple-100 text-purple-700 font-extrabold";
                if (tier === 3) colorClass = "bg-green-100 text-green-700 font-extrabold";
    
                return (
                    <span className={`px-2.5 py-1 text-[10px] uppercase font-black rounded-lg ${colorClass}`}>
                        T{tier}
                    </span>
                );
            } 
        },
        { 
            header: "Status", 
            accessor: (user) => {
                const status = user.kycStatus === 'approved' ? 'Approved' : user.kycStatus === 'pending' ? 'Review' : 'None';
                const colors = user.kycStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                               user.kycStatus === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse' : 
                               'bg-red-50 text-red-700 border-red-200';
                
                return (
                    <span className={`px-2 py-0.5 text-[10px] font-bold border rounded capitalize ${colors}`}>
                        {status}
                    </span>
                );
            }
        },
        { header: "Role", accessor: (user) => <span className="capitalize font-medium text-gray-600 text-xs">{user.role}</span> },
        { header: "Updated", accessor: (user) => <span className="text-gray-400 text-[10px]">{new Date(user.updatedAt).toLocaleDateString()}</span> },
        {
            header: "Action",
            accessor: (user) => (
                <button
                    onClick={() => setSelectedUser(user)}
                    className="text-indigo-600 hover:text-indigo-900 font-bold text-xs bg-indigo-50 px-2 py-1 rounded transition-colors"
                >
                    Review
                </button>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="p-6">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <div className="grid grid-cols-5 gap-4">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-6 w-full" />)}
                        </div>
                    </div>
                    <div>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="p-4 border-b border-gray-100 grid grid-cols-5 gap-4">
                                {[1, 2, 3, 4, 5].map(j => <Skeleton key={j} className="h-5 w-full" />)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">KYC Review Queue</h1>
                <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Show All Users</span>
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            showAll ? "bg-blue-600" : "bg-gray-200"
                        }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                showAll ? "translate-x-5" : "translate-x-0"
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 bg-white overflow-hidden">
                <button
                    onClick={() => setActiveTab("tier1")}
                    className={`py-3 px-6 font-bold text-sm transition-all border-b-2 flex items-center space-x-2 ${
                        activeTab === "tier1" ? "border-blue-600 text-blue-600 bg-blue-50/30" : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                    <span>Tier 1 (Wallet Active)</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'tier1' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {users.filter(u => u.tier < 2).length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("tier2")}
                    className={`py-3 px-6 font-bold text-sm transition-all border-b-2 flex items-center space-x-2 ${
                        activeTab === "tier2" ? "border-purple-600 text-purple-600 bg-purple-50/30" : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                    <span>Tier 2 (Identity)</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'tier2' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {users.filter(u => u.tier === 2 || (u.tier === 1 && u.kycStatus === 'pending' && u.role === 'rider' && u.kycDocuments?.selfie && u.driverLicensePicture)).length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("tier3")}
                    className={`py-3 px-6 font-bold text-sm transition-all border-b-2 flex items-center space-x-2 ${
                        activeTab === "tier3" ? "border-green-600 text-green-600 bg-green-50/30" : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                    <span>Tier 3 (Address)</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'tier3' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {users.filter(u => u.tier === 3).length}
                    </span>
                </button>
            </div>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

                {filteredUsers.length === 0 && !loading && !error ? (
                <div className="text-center py-10 bg-white rounded-lg shadow">
                    <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-3" />
                    <p className="text-gray-500 text-lg">
                        No pending {activeTab === "tier3" ? "Tier 3 Compliance" : activeTab === "tier2" ? "Tier 2 Identity" : "Tier 1 Wallet"} users.
                    </p>
                </div>
            ) : (
                <Table columns={columns} data={filteredUsers} />
            )}

            {selectedUser && (
                <KYCDetailsModal
                    user={selectedUser}
                    isOpen={!!selectedUser}
                    activeTab={activeTab}
                    onClose={() => setSelectedUser(null)}
                    onApproveSuccess={() => handleApprove(selectedUser._id)}
                    onRejectSuccess={() => handleReject(selectedUser._id)}
                />
            )}
        </div>
    );

};

export default KYCReview;
