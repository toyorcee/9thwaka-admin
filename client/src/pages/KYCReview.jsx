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

    useEffect(() => {
        const fetchPendingKYCInfo = async () => {
            setLoading(true);
            try {
                const data = await getPendingKYCUsers();
                if (data.success) {
                    setUsers(data.users);
                } else {
                    setError(data.error || "Failed to fetch pending KYC users");
                }
            } catch {
                setError("Network error fetching pending KYC users");
            } finally {
                setLoading(false);
            }
        };

        fetchPendingKYCInfo();
    }, []);

    const handleApprove = async (userId) => {
        setUsers(users.filter(u => u._id !== userId));
        setSelectedUser(null);
    };

    const handleReject = async (userId) => {
         setUsers(users.filter(u => u._id !== userId));
         setSelectedUser(null);
    };

    const columns = [
        { header: "Name", accessor: "fullName" },
        { header: "Email", accessor: "email" },
        { header: "Role", accessor: (user) => <span className="capitalize">{user.role}</span> },
        { header: "Date Submitted", accessor: (user) => new Date(user.updatedAt).toLocaleDateString() },
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
            <h1 className="text-2xl font-bold mb-6">KYC Review Queue</h1>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {users.length === 0 && !loading && !error ? (
                <div className="text-center py-10 bg-white rounded-lg shadow">
                    <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-3" />
                    <p className="text-gray-500 text-lg">All caught up! No pending KYC submissions.</p>
                </div>
            ) : (
                <Table columns={columns} data={users} />
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
