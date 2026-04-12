import React, { useState, useEffect } from "react";
import Table from "../components/Table";
import Skeleton from "../components/Skeleton";
import KYCDetailsModal from "../components/KYCDetailsModal";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { getPendingKYCUsers } from "../services/adminApi";

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
        if (activeTab === "tier3") return u.tier === 3;
        if (activeTab === "tier2") return u.tier === 2 || (u.tier === 1 && u.kycStatus === 'pending' && u.role === 'rider' && u.kycDocuments?.selfie && u.driverLicensePicture);
        return u.tier < 2;
    });

    const columns = [
        { header: "Name", accessor: "fullName" },
        { header: "Email", accessor: "email" },
        { 
            header: "Tier", 
            accessor: (user) => {
                const tier = user.tier || 0;
                let colorClass = "bg-gray-100 text-gray-700";
                if (tier === 1) colorClass = "bg-blue-100 text-blue-700";
                if (tier === 2) colorClass = "bg-purple-100 text-purple-700";
                if (tier === 3) colorClass = "bg-green-100 text-green-700";

                return (
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${colorClass}`}>
                        Tier {tier}
                    </span>
                );
            } 
        },
        { 
            header: "KYC Status", 
            accessor: (user) => (
                <span className={`capitalize font-medium ${user.kycStatus === 'approved' ? 'text-green-600' : user.kycStatus === 'pending' ? 'text-orange-600' : 'text-red-600'}`}>
                    {user.kycStatus || 'None'}
                </span>
            ) 
        },
        { header: "Role", accessor: (user) => <span className="capitalize">{user.role}</span> },
        { header: "Last Update", accessor: (user) => new Date(user.updatedAt).toLocaleDateString() },
        {
            header: "Actions",
            accessor: (user) => (
                <button
                    onClick={() => setSelectedUser(user)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
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
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab("tier1")}
                    className={`py-2 px-4 font-medium transition-colors border-b-2 ${
                        activeTab === "tier1" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    Tier 1 (Pending/Basic)
                </button>
                <button
                    onClick={() => setActiveTab("tier2")}
                    className={`py-2 px-4 font-medium transition-colors border-b-2 ${
                        activeTab === "tier2" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    Tier 2 (Identity Approved)
                </button>
                <button
                    onClick={() => setActiveTab("tier3")}
                    className={`py-2 px-4 font-medium transition-colors border-b-2 ${
                        activeTab === "tier3" ? "border-green-600 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    Tier 3 (Address Verified)
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
                        No pending {activeTab === "tier3" ? "Tier 3" : activeTab === "tier2" ? "Tier 2" : "Tier 1"} submissions.
                    </p>
                </div>
            ) : (
                <Table columns={columns} data={filteredUsers} />
            )}

            {selectedUser && (
                <KYCDetailsModal
                    user={selectedUser}
                    isOpen={!!selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onApproveSuccess={() => handleApprove(selectedUser._id)}
                    onRejectSuccess={() => handleReject(selectedUser._id)}
                />
            )}
        </div>
    );

};

export default KYCReview;
