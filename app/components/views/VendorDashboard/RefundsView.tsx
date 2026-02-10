
import React, { useState } from "react";
import { Registration } from "@/app/models/Registration";

interface RefundsViewProps {
    participants: Registration[];
    onIssueRefund: (regId: string) => Promise<any>;
    onRejectRefund: (regId: string, reason: string) => Promise<void>;
}

export const RefundsView: React.FC<RefundsViewProps> = ({ participants, onIssueRefund, onRejectRefund }) => {
    const refundList = participants.filter(p => ['refund_requested', 'refunded', 'rejected', 'refund_rejected'].includes(p.status || ''));

    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedRefund, setSelectedRefund] = useState<Registration | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const handleApproveRefund = async (reg: Registration) => {
        if (!reg.registrationId) return;
        setLoadingAction(reg.registrationId);
        try {
            await onIssueRefund(reg.registrationId);
        } catch (error) {
            alert("Error processing refund.");
        } finally {
            setLoadingAction(null);
        }
    };

    const handleRejectRefund = async () => {
        if (!selectedRefund?.registrationId || !rejectionReason.trim()) return;
        setLoadingAction(selectedRefund.registrationId);
        try {
            await onRejectRefund(selectedRefund.registrationId, rejectionReason);
            setRejectModalOpen(false);
        } catch (error) {
            alert("Failed to reject request.");
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass-card !p-8 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -mr-12 -mt-12 pointer-events-none"></div>
                <div className="flex items-center gap-6 z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/20">
                        <i className="fa-solid fa-money-bill-transfer"></i>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Refund Requests</h2>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Manage disputes & returns</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4 mb-8">
                <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2 px-1">
                    <i className="fa-solid fa-clock text-orange-500"></i> Pending Requests
                </h3>

                <div className="glass-card !p-0 overflow-hidden">
                    {refundList.filter(p => p.status === 'refund_requested').length === 0 ? (
                        <div className="p-8 text-center bg-white/5">
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-50">No pending refunds</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <tr>
                                        <th className="px-8 py-4">Participant</th>
                                        <th className="px-8 py-4">Workshop</th>
                                        <th className="px-8 py-4">Amount</th>
                                        <th className="px-8 py-4">Reason</th>
                                        <th className="px-8 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {refundList.filter(p => p.status === 'refund_requested').map((p) => (
                                        <tr key={p.registrationId} className="hover:bg-white/5 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary uppercase">
                                                        {p.displayName?.[0] || 'U'}
                                                    </div>
                                                    <span className="text-xs font-bold text-white">{p.displayName}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{(p as any).workshopTitle}</span>
                                            </td>
                                            <td className="px-8 py-6 text-xs font-black text-white">
                                                Rs. {(p as any).workshopPrice}
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-[10px] text-muted-foreground max-w-[200px] truncate">{(p as any).refundReason || "No reason"}</p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => { setSelectedRefund(p); setRejectModalOpen(true); }} className="px-4 py-2 text-[9px] font-black text-white uppercase tracking-widest bg-white/5 rounded-xl border border-white/10 hover:bg-white/10">Reject</button>
                                                    <button onClick={() => handleApproveRefund(p)} className="px-4 py-2 text-[9px] font-black text-white uppercase tracking-widest bg-primary rounded-xl shadow-lg shadow-primary/20">Approve</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2 px-1">
                    <i className="fa-solid fa-clock-rotate-left text-muted-foreground"></i> Refund History
                </h3>
                <div className="glass-card !p-0 overflow-hidden opacity-80">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <tr>
                                    <th className="px-8 py-4">Participant</th>
                                    <th className="px-8 py-4">Workshop</th>
                                    <th className="px-8 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {refundList.filter(p => p.status !== 'refund_requested').map((p) => (
                                    <tr key={p.registrationId}>
                                        <td className="px-8 py-6 text-xs font-bold text-white">{p.displayName}</td>
                                        <td className="px-8 py-6 text-[10px] uppercase tracking-widest text-muted-foreground">{(p as any).workshopTitle}</td>
                                        <td className="px-8 py-6">
                                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${p.status === 'refunded' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {rejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-[#121212] w-full max-w-sm rounded-3xl border border-white/10 p-8 shadow-2xl">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6">Reject Refund</h3>
                        <textarea
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-red-500/50 mb-6 h-32 resize-none"
                            placeholder="Reason for rejection..."
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setRejectModalOpen(false)} className="px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cancel</button>
                            <button onClick={handleRejectRefund} className="px-6 py-3 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">Reject Refund</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
