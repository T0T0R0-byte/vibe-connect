import React, { useState } from "react";
import { ReportController } from "@/app/controllers/ReportController";
import { Registration } from "@/app/models/Registration";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    registration: Registration | null;
    userId: string;
    userName: string;
    userEmail: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, registration, userId, userName, userEmail }) => {
    const [reason, setReason] = useState("Scam/Fraud");
    const [details, setDetails] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen || !registration) return null;

    const handleSubmit = async () => {
        if (!details.trim()) return alert("Please provide details.");
        setSubmitting(true);
        try {
            await ReportController.submitReport({
                registrationId: registration.registrationId!,
                workshopId: registration.workshopId!,
                workshopTitle: registration.workshopTitle || "Untitled",
                purchasePrice: (registration as any).workshopPrice || 0,
                vendorId: (registration as any).vendorId || "",
                reporterId: userId,
                reporterName: userName,
                reporterEmail: userEmail,
                reporterPhone: (registration as any).participantPhone || "",
                reason,
                details
            });
            alert("Report submitted successfully.");
            onClose();
        } catch (e) {
            console.error(e);
            alert("Failed to submit report.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#121212] w-full max-w-sm rounded-[2rem] border border-white/10 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Report Vendor</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">Describe the issue clearly</p>

                <div className="space-y-4 mb-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Reason</label>
                        <select
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none"
                        >
                            <option value="Scam/Fraud" className="bg-[#121212]">Scam/Fraud</option>
                            <option value="Poor Content" className="bg-[#121212]">Poor Content</option>
                            <option value="No Show" className="bg-[#121212]">No Show</option>
                            <option value="Other" className="bg-[#121212]">Other</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Details</label>
                        <textarea
                            value={details}
                            onChange={e => setDetails(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-red-500/50 h-32 resize-none"
                            placeholder="Please provide specifics..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-white transition-all">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-6 py-3 bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        {submitting ? <i className="fa-solid fa-circle-notch animate-spin"></i> : 'Submit Report'}
                    </button>
                </div>
            </div>
        </div>
    );
};
