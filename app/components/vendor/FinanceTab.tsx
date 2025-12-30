"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { uploadRefundProof } from '@/firebase/refundActions';
import StatusBadge from '../ui/StatusBadge';

interface Participant {
    uid: string;
    displayName: string;
    email: string;
    phoneNumber?: string;
    receiptUrl?: string;
    refundProofUrl?: string;
    status?: string; // "pending" | "approved" | "rejected" | "paid" | "failed" | "refunded";
    registrationId?: string;
    refundStatus?: string;
    workshopTitle?: string;
    workshopId?: string;
    price?: number;
    details?: {
        fullName: string;
    };
}

interface FinanceTabProps {
    participants: Participant[];
    fetchData: () => Promise<void>;
}

const FinanceTab: React.FC<FinanceTabProps> = ({ participants, fetchData }) => {
    const [activeView, setActiveView] = useState<'approvals' | 'refunds'>('approvals');

    // Refund Upload State
    const [proofModalOpen, setProofModalOpen] = useState(false);
    const [selectedReg, setSelectedReg] = useState<Participant | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Filter lists
    const pendingPayments = participants.filter(p => p.status === 'pending');
    const refundRequests = participants.filter(p => !['none', undefined, 'refunded', 'participant_confirmed'].includes(p.refundStatus || 'none'));
    const processedRefunds = participants.filter(p => p.status === 'refunded' || p.refundStatus === 'participant_confirmed');

    const handleApprovePayment = async (regId?: string) => {
        if (!regId || !confirm("Confirm this payment as Received?")) return;
        try {
            await updateDoc(doc(db, "registrations", regId), { status: 'paid' });
            fetchData();
        } catch (e) { alert("Error approving payment"); }
    };

    const handleMarkRefunded = async () => {
        if (!selectedReg?.registrationId || !proofFile) return;
        setUploading(true);
        setUploadSuccess(false);
        try {
            // 1. Upload Proof
            await uploadRefundProof(selectedReg.registrationId, proofFile);
            // 2. Update status to refunded manually if the action didn't do it (it usually just sets refundStatus)
            // But for "Refunded" final status, we want to update the main status too.
            await updateDoc(doc(db, "registrations", selectedReg.registrationId), {
                status: 'refunded',
                refundStatus: 'vendor_proof_uploaded'
            });

            setUploadSuccess(true);
            await fetchData();
            setTimeout(() => {
                setProofModalOpen(false);
                setProofFile(null);
                setSelectedReg(null);
                setUploadSuccess(false);
            }, 1500);
        } catch (e) {
            console.error(e);
            alert("Failed to process refund");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="glass-card !p-6 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Pending Revenue</p>
                        <h3 className="text-2xl font-black text-foreground">
                            Rs. {pendingPayments.reduce((acc, p) => acc + (p.price || 0), 0).toLocaleString()}
                        </h3>
                        <span className="text-[10px] font-bold text-amber-500">{pendingPayments.length} Approvals Needed</span>
                    </div>
                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 text-xl">
                        <i className="fa-solid fa-clock-rotate-left"></i>
                    </div>
                </div>

                <div className="glass-card !p-6 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Active Refund Req.</p>
                        <h3 className="text-2xl font-black text-foreground">{refundRequests.length}</h3>
                        <span className="text-[10px] font-bold text-red-500">Action Required</span>
                    </div>
                    <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 text-xl">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                </div>
            </div>

            {/* Toggle View */}
            <div className="flex gap-4 border-b border-white/5 pb-4">
                <button
                    onClick={() => setActiveView('approvals')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'approvals' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-white/5 text-muted-foreground'}`}
                >
                    Payment Approvals ({pendingPayments.length})
                </button>
                <button
                    onClick={() => setActiveView('refunds')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'refunds' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-white/5 text-muted-foreground'}`}
                >
                    Refund Requests ({refundRequests.length})
                </button>
            </div>

            {/* Main Content Area */}
            <div className="glass-card !p-0 overflow-hidden min-h-[400px]">

                {/* APPROVALS VIEW */}
                {activeView === 'approvals' && (
                    <div>
                        {pendingPayments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <i className="fa-solid fa-check-circle text-4xl mb-4 opacity-20"></i>
                                <p className="text-xs font-bold uppercase tracking-widest">All caught up!</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-white/5 uppercase text-[9px] font-black tracking-widest text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-4">Participant</th>
                                        <th className="px-6 py-4">Workshop</th>
                                        <th className="px-6 py-4">Proof</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {pendingPayments.map((p, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02]">
                                            <td className="px-6 py-4">
                                                <span className="block text-xs font-bold text-foreground">{p.displayName}</span>
                                                <span className="text-[10px] text-muted-foreground">{p.email}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-bold text-foreground block">{p.workshopTitle}</span>
                                                <span className="text-[10px] text-muted-foreground block">Rs. {(p.price || 0).toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {p.receiptUrl ? (
                                                    <a href={p.receiptUrl} target="_blank" className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[9px] font-black uppercase hover:bg-blue-500/20 w-fit">
                                                        <i className="fa-solid fa-receipt"></i> View
                                                    </a>
                                                ) : <span className="text-[10px] text-muted-foreground">-</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleApprovePayment(p.registrationId)}
                                                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase hover:bg-emerald-600 transition-all shadow-lg mr-2"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (!p.registrationId || !confirm("Reject this payment?")) return;
                                                        await updateDoc(doc(db, "registrations", p.registrationId), { status: 'rejected' });
                                                        fetchData();
                                                    }}
                                                    className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[9px] font-black uppercase hover:bg-red-500/20 transition-all"
                                                >
                                                    Reject
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* REFUNDS VIEW */}
                {activeView === 'refunds' && (
                    <div className="p-6 space-y-8">
                        <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Active Requests</h3>
                        {refundRequests.length === 0 ? (
                            <div className="p-8 border border-white/5 rounded-2xl text-center text-muted-foreground text-xs font-bold uppercase tracking-widest">
                                No active refund requests
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {refundRequests.map((p, i) => (
                                    <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                                <i className="fa-solid fa-rotate-left"></i>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-foreground">{p.displayName}</h4>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase">{p.workshopTitle}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <StatusBadge status={p.refundStatus || ''} type="refund" />
                                            {p.refundStatus === 'admin_approved' || p.refundStatus === 'admin_rejected' ? (
                                                <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest border border-white/10 px-3 py-2 rounded-xl bg-zinc-800/50">
                                                    <i className="fa-solid fa-lock mr-2"></i> Locked by Admin
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => { setSelectedReg(p); setProofModalOpen(true); }}
                                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase transition-all"
                                                >
                                                    Process Refund
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-8 border-t border-white/5 space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Processed History</h3>
                            {processedRefunds.map((p, i) => (
                                <div key={i} className="flex flex-col gap-4 p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black text-xs">
                                                {p.displayName[0]}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-foreground">{p.displayName}</h4>
                                                <p className="text-[10px] text-muted-foreground uppercase">{p.workshopTitle}</p>
                                            </div>
                                        </div>
                                        <StatusBadge status="Refunded" type="refund" />
                                    </div>

                                    {/* Refund Timeline */}
                                    <div className="relative pt-6 pb-2 px-2">
                                        <div className="absolute top-8 left-0 right-0 h-0.5 bg-white/10 -z-10" />
                                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-muted-foreground tracking-widest">

                                            {/* Step 1: Requested */}
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white">
                                                    <i className="fa-solid fa-check"></i>
                                                </div>
                                                <span className="text-emerald-500">Requested</span>
                                            </div>

                                            {/* Step 2: Vendor Proof */}
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${p.refundProofUrl ? 'bg-emerald-500 text-white' : 'bg-zinc-800 border border-white/20'}`}>
                                                    {p.refundProofUrl ? <i className="fa-solid fa-check"></i> : 2}
                                                </div>
                                                <span className={p.refundProofUrl ? 'text-emerald-500' : ''}>Proof Uploaded</span>
                                            </div>

                                            {/* Step 3: Admin Approval */}
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${p.refundStatus === 'admin_approved' ? 'bg-emerald-500 text-white' :
                                                    p.refundStatus === 'admin_rejected' ? 'bg-red-500 text-white' :
                                                        'bg-zinc-800 border border-white/20'}`}>
                                                    {p.refundStatus === 'admin_approved' ? <i className="fa-solid fa-check"></i> :
                                                        p.refundStatus === 'admin_rejected' ? <i className="fa-solid fa-xmark"></i> : 3}
                                                </div>
                                                <span className={
                                                    p.refundStatus === 'admin_approved' ? 'text-emerald-500' :
                                                        p.refundStatus === 'admin_rejected' ? 'text-red-500' : ''
                                                }>Admin Review</span>
                                            </div>

                                            {/* Step 4: Final */}
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${p.status === 'refunded' ? 'bg-emerald-500 text-white' : 'bg-zinc-800 border border-white/20'}`}>
                                                    {p.status === 'refunded' ? <i className="fa-solid fa-check"></i> : 4}
                                                </div>
                                                <span className={p.status === 'refunded' ? 'text-emerald-500' : ''}>Complete</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Interception */}
                                    {p.refundStatus === 'admin_approved' && (
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-3">
                                            <i className="fa-solid fa-shield text-emerald-500"></i>
                                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Processed by Admin</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* UPLOAD MODAL */}
            <AnimatePresence>
                {proofModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProofModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-card w-full max-w-md relative z-10 !p-8">
                            <h3 className="text-xl font-black text-foreground mb-4">Process Refund</h3>
                            <p className="text-sm text-muted-foreground mb-6">Upload proof of refund for <b>{selectedReg?.displayName}</b>. This will mark the registration as refunded.</p>

                            <div className="space-y-4">
                                <div className="relative h-32 bg-secondary/30 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center group hover:border-primary/50 transition-all">
                                    <input type="file" onChange={e => setProofFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,application/pdf" />
                                    <i className={`fa-solid ${proofFile ? 'fa-check text-emerald-500' : 'fa-cloud-upload text-muted-foreground'} text-2xl mb-2`}></i>
                                    <span className="text-xs font-black uppercase text-muted-foreground">{proofFile ? proofFile.name : "Upload Receipt"}</span>
                                </div>

                                <button onClick={handleMarkRefunded} disabled={uploading || !proofFile || uploadSuccess} className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all ${uploadSuccess ? 'bg-emerald-500 text-white' : 'btn-vibe-primary'}`}>
                                    {uploadSuccess ? (
                                        <span className="flex items-center justify-center gap-2"><i className="fa-solid fa-circle-check"></i> Processed!</span>
                                    ) : uploading ? (
                                        <span className="flex items-center justify-center gap-2"><i className="fa-solid fa-spinner animate-spin"></i> Uploading...</span>
                                    ) : (
                                        "Confirm Refund"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default FinanceTab;
