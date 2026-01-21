
import React, { useState } from "react";
import { Participant } from "../../models/Participant";
import { rejectRefund } from "@/firebase/workshopActions";
import { ParticipantController } from "@/app/controllers/ParticipantController";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// -- STRIPE SETUP --
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface RefundsViewProps {
    participants: Participant[];
    onIssueRefund?: (regId: string) => Promise<void>;
}

// -- INTERNAL COMPONENT: Payment Form for Manual Refund --
const RefundPaymentForm = ({ amount, onSuccess, onCancel }: { amount: number, onSuccess: () => void, onCancel: () => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        // Confirm Payment (Vendor pays)
        const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
        });

        if (confirmError) {
            setError(confirmError.message || "Payment failed");
            setProcessing(false);
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            onSuccess();
        } else {
            setError("Payment status unknown. Check dashboard.");
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            {error && <div className="text-red-500 text-xs font-bold">{error}</div>}
            <div className="flex gap-2 justify-end mt-4">
                <button type="button" onClick={onCancel} disabled={processing} className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-white">Cancel</button>
                <button type="submit" disabled={!stripe || processing} className="px-6 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20">
                    {processing ? "Processing..." : `Pay Refund (Rs. ${amount})`}
                </button>
            </div>
        </form>
    );
};

export const RefundsView: React.FC<RefundsViewProps> = ({ participants }) => {
    // Filter only those who requested refund or are refunded/rejected
    const refundList = participants.filter(p => ['refund_requested', 'refunded', 'rejected', 'refund_rejected'].includes(p.status));

    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedRefund, setSelectedRefund] = useState<Participant | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // 1. Approve Refund -> Opens Payment Modal
    const handleApproveRefund = async (participant: Participant) => {
        if (!participant.registrationId) return;

        // Setup for payment
        setSelectedRefund(participant);
        setLoadingAction(participant.registrationId);

        try {
            // Create payment intent for the refund amount (Vendor paying the refund)
            const res = await fetch("/api/create-payment-intent", {
                method: "POST",
                body: JSON.stringify({
                    amount: participant.workshopPrice,
                    workshopTitle: `Refund: ${participant.workshopTitle} (User: ${participant.displayName})`
                }),
            });

            const data = await res.json();
            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
                setShowPaymentModal(true);
            } else {
                alert("Failed to initialize refund payment.");
            }
        } catch (error) {
            console.error("Refund Init Error", error);
            alert("Error initializing refund gateway.");
        } finally {
            setLoadingAction(null);
        }
    };

    const handlePaymentSuccess = async () => {
        if (!selectedRefund?.registrationId) return;

        try {
            // Update status to refunded manually since we just paid
            await ParticipantController.updateStatus(selectedRefund.registrationId, 'refunded');
            alert("Refund processed and paid successfully!");
            setShowPaymentModal(false);
            setClientSecret(null);
            setSelectedRefund(null);
        } catch (error) {
            console.error(error);
            alert("Payment marked successful but failed to update status.");
        }
    };


    // 2. Reject Refund
    const openRejectModal = (participant: Participant) => {
        setSelectedRefund(participant);
        setRejectionReason("");
        setRejectModalOpen(true);
    };

    const handleRejectRefund = async () => {
        if (!selectedRefund?.registrationId) return;
        if (!rejectionReason.trim()) {
            alert("Please provide a reason for rejection.");
            return;
        }

        setLoadingAction(selectedRefund.registrationId);
        try {
            await rejectRefund(selectedRefund.registrationId, rejectionReason);
            alert("Refund request rejected.");
            setRejectModalOpen(false);
        } catch (error) {
            console.error("Rejection failed", error);
            alert("Failed to reject request.");
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
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

            {/* Pending Requests Section */}
            <div className="space-y-4 mb-8">
                <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2 px-1">
                    <i className="fa-solid fa-clock text-orange-500"></i> Pending Requests
                    <span className="text-xs font-bold text-muted-foreground bg-white/5 px-2 py-1 rounded-full ml-2">{refundList.filter(p => p.status === 'refund_requested').length}</span>
                </h3>

                <div className="glass-card !p-0 overflow-hidden">
                    {refundList.filter(p => p.status === 'refund_requested').length === 0 ? (
                        <div className="p-8 text-center bg-white/5">
                            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i className="fa-solid fa-check text-green-500"></i>
                            </div>
                            <p className="text-sm font-bold text-muted-foreground">All caught up! No pending refunds.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-orange-500/10 border-b border-orange-500/10 text-[10px] font-black uppercase tracking-widest text-orange-500">
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
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-black text-white">
                                                        {p.displayName[0]}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-foreground">{p.displayName}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-bold text-muted-foreground">{p.workshopTitle}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-black text-foreground">Rs. {p.workshopPrice}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-medium text-foreground truncate max-w-[200px]" title={p.refundReason || "No reason provided"}>
                                                    {p.refundReason || "No reason"}
                                                </p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openRejectModal(p)}
                                                        disabled={loadingAction === p.registrationId}
                                                        className="px-4 py-2 bg-white/5 text-muted-foreground hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproveRefund(p)}
                                                        disabled={loadingAction === p.registrationId}
                                                        className="px-4 py-2 bg-green-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 flex items-center gap-2"
                                                    >
                                                        {loadingAction === p.registrationId ? (
                                                            <i className="fa-solid fa-circle-notch animate-spin"></i>
                                                        ) : (
                                                            <>
                                                                <i className="fa-solid fa-check"></i> Approve
                                                            </>
                                                        )}
                                                    </button>
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

            {/* History Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2 px-1">
                    <i className="fa-solid fa-clock-rotate-left text-muted-foreground"></i> History
                </h3>

                <div className="glass-card !p-0 overflow-hidden">
                    {refundList.filter(p => p.status !== 'refund_requested').length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-xs font-bold text-muted-foreground">No refund history available.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <tr>
                                        <th className="px-8 py-4">Participant</th>
                                        <th className="px-8 py-4">Workshop</th>
                                        <th className="px-8 py-4">Amount</th>
                                        <th className="px-8 py-4">Details</th>
                                        <th className="px-8 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {refundList.filter(p => p.status !== 'refund_requested').map((p) => (
                                        <tr key={p.registrationId} className="hover:bg-white/5 transition-colors opacity-75">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-muted-foreground">
                                                        {p.displayName[0]}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-muted-foreground">{p.displayName}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-bold text-muted-foreground">{p.workshopTitle}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-bold text-muted-foreground">Rs. {p.workshopPrice}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="max-w-[200px]">
                                                    {p.rejectionReason ? (
                                                        <p className="text-[10px] text-red-400 truncate" title={p.rejectionReason}>
                                                            Rejected: {p.rejectionReason}
                                                        </p>
                                                    ) : (
                                                        <p className="text-[10px] text-muted-foreground truncate">
                                                            Reason: {p.refundReason || "N/A"}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {p.status === 'refunded' && (
                                                    <span className="px-3 py-1 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20 text-[9px] font-black uppercase tracking-widest">
                                                        Refunded
                                                    </span>
                                                )}
                                                {(p.status === 'rejected' || p.status === 'refund_rejected') && (
                                                    <span className="px-3 py-1 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-black uppercase tracking-widest">
                                                        Rejected
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Rejection Modal */}
            {rejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#121212] w-full max-w-sm rounded-[2rem] border border-white/10 p-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Reject Request</h3>
                        <p className="text-xs font-bold text-muted-foreground mb-6">Why are you rejecting this refund?</p>

                        <textarea
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-red-500/50 mb-6 h-32 resize-none"
                            placeholder="Reason for rejection..."
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRejectModalOpen(false)}
                                className="px-4 py-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectRefund}
                                disabled={loadingAction === selectedRefund?.registrationId}
                                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-500/20"
                            >
                                Reject Refund
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal for Approval */}
            {showPaymentModal && clientSecret && selectedRefund && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-[#121212] w-full max-w-md rounded-[2rem] border border-white/10 p-8 shadow-2xl animate-in zoom-in-95">
                        <div className="mb-6">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Process Refund</h3>
                            <p className="text-xs font-bold text-muted-foreground mt-1">
                                Refund <span className="text-primary">Rs. {selectedRefund.workshopPrice}</span> to {selectedRefund.displayName}
                            </p>
                        </div>

                        {/* Element Wrapper */}
                        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#6366f1' } } }}>
                            <RefundPaymentForm
                                amount={selectedRefund.workshopPrice}
                                onSuccess={handlePaymentSuccess}
                                onCancel={() => { setShowPaymentModal(false); setClientSecret(null); setSelectedRefund(null); }}
                            />
                        </Elements>
                    </div>
                </div>
            )}
        </div>
    );
};
