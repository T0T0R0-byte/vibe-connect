import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { useAuth } from "@/app/context/AuthContext";
import { motion } from "framer-motion";

interface Report {
    id: string;
    registrationId: string;
    workshopId: string;
    reporterId: string;
    reporterName: string;
    reason: string;
    details: string;
    status: 'pending' | 'resolved' | 'dismissed';
    createdAt: string; // ISO String
    timestamp?: { seconds: number; nanoseconds: number }; // Firestore Timestamp
    vendorId: string;
    vendorResponse?: string;
}

export const ReportsView: React.FC = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "reports"),
            where("vendorId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Report));

            // Sort: Prefer timestamp if available, else parse createdAt string
            data.sort((a, b) => {
                const timeA = a.timestamp?.seconds || new Date(a.createdAt).getTime() / 1000;
                const timeB = b.timestamp?.seconds || new Date(b.createdAt).getTime() / 1000;
                return timeB - timeA;
            });

            setReports(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleUpdateStatus = async (reportId: string, newStatus: 'resolved' | 'dismissed') => {
        const response = prompt(`Enter a note for the user regarding this ${newStatus} report (Optional):`);
        if (response === null) return; // User cancelled

        try {
            await updateDoc(doc(db, "reports", reportId), {
                status: newStatus,
                vendorResponse: response,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error(error);
            alert("Failed to update status");
        }
    };

    if (loading) return <div className="text-white">Loading reports...</div>;

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Reports & Disputes</h2>
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">
                    Manage issues reported by participants.
                </p>
            </header>

            <div className="grid gap-4">
                {reports.length === 0 ? (
                    <div className="p-12 border border-white/5 rounded-3xl bg-white/[0.02] text-center">
                        <i className="fa-solid fa-shield-check text-4xl text-green-500/50 mb-4"></i>
                        <h3 className="text-xl font-bold text-white mb-1">Clean Record</h3>
                        <p className="text-muted-foreground text-sm">No active reports found.</p>
                    </div>
                ) : (
                    reports.map(report => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={report.id}
                            className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row gap-6"
                        >
                            <div className="flex-1 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2 border ${report.status === 'pending' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                report.status === 'resolved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                    'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                            }`}>
                                            {report.status}
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1">{report.reason}</h3>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-2">
                                            <i className="fa-solid fa-user"></i> {report.reporterName} • {new Date(report.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Details</h4>
                                    <p className="text-sm text-gray-300 italic whitespace-pre-wrap">
                                        {report.details || "No further details provided."}
                                    </p>
                                </div>

                                {report.vendorResponse && (
                                    <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20">
                                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Your Response</h4>
                                        <p className="text-sm text-indigo-200 italic whitespace-pre-wrap">
                                            {report.vendorResponse}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 justify-center min-w-[140px]">
                                {report.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleUpdateStatus(report.id, 'resolved')}
                                            className="px-4 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-500 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-green-500/20 transition-colors"
                                        >
                                            <i className="fa-solid fa-check mr-2"></i> Resolve
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                                            className="px-4 py-3 bg-white/5 hover:bg-white/10 text-muted-foreground text-[10px] font-bold uppercase tracking-widest rounded-xl border border-white/10 transition-colors"
                                        >
                                            <i className="fa-solid fa-xmark mr-2"></i> Dismiss
                                        </button>
                                    </>
                                )}
                                {report.status !== 'pending' && (
                                    <div className="text-center p-4 rounded-xl bg-white/5 text-muted-foreground text-xs font-bold uppercase tracking-widest">
                                        Marked as {report.status}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};
