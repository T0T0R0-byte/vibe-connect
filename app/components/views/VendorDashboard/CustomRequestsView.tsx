import React, { useEffect, useState } from 'react';
import { GlassCard } from "@/app/components/ui/GlassCard";
import { db } from "@/firebase/firebaseConfig";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import StatusBadge from "@/app/components/ui/StatusBadge";
import { PremiumModal } from "@/app/components/ui/PremiumModal";

interface CustomRequest {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    topic: string;
    budget: string;
    attendees: string;
    pdfUrl: string;
    status: string;
    createdAt: any;
}

interface CustomRequestsViewProps {
    vendorId: string;
}

export const CustomRequestsView: React.FC<CustomRequestsViewProps> = ({ vendorId }) => {
    const [requests, setRequests] = useState<CustomRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);

    useEffect(() => {
        // Query for requests specifically for this vendor OR "all" vendors
        const q = query(
            collection(db, "custom_requests"),
            where("vendorId", "in", [vendorId, "all"])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomRequest));
            setRequests(list.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [vendorId]);

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await updateDoc(doc(db, "custom_requests", id), { status });
            // Close modal if open and it was the updated request
            if (selectedRequest && selectedRequest.id === id) {
                setSelectedRequest(prev => prev ? { ...prev, status } : null);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to update status.");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Custom Vibe Requests</h2>
                <p className="text-sm text-muted-foreground font-medium mt-1 uppercase tracking-widest">Bespoke workshop inquiries from students</p>
            </div>

            {loading ? (
                <div className="p-20 flex justify-center"><i className="fa-solid fa-circle-notch animate-spin text-primary text-3xl"></i></div>
            ) : requests.length === 0 ? (
                <GlassCard className="p-20 text-center border-dashed border-2 border-white/10 bg-transparent">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fa-solid fa-wand-sparkles text-2xl text-muted-foreground"></i>
                    </div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No custom requests found.</p>
                </GlassCard>
            ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {requests.map((request) => (
                        <div
                            key={request.id}
                            onClick={() => setSelectedRequest(request)}
                            className="group relative cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <GlassCard className="p-0 h-full overflow-hidden bg-[#121212] rounded-[2rem] border-white/5 group-hover:border-white/20 transition-all duration-300">
                                {/* Header Status Strip */}
                                <div className={`h-1.5 w-full ${request.status === 'pending' ? 'bg-amber-500' :
                                        request.status === 'accepted' ? 'bg-emerald-500' :
                                            'bg-red-500'
                                    }`}></div>

                                <div className="p-6 space-y-5">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                <i className="fa-solid fa-calendar-day"></i>
                                                {new Date(request.createdAt?.seconds * 1000).toLocaleDateString()}
                                            </span>
                                            <h3 className="text-lg font-black text-white leading-tight uppercase tracking-tight line-clamp-2 min-h-[3rem]">
                                                {request.topic}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl group-hover:bg-white/[0.04] transition-colors">
                                            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Budget</div>
                                            <div className="text-xl font-black text-emerald-400">
                                                <span className="text-xs align-top mr-0.5">LKR</span>
                                                {Number(request.budget).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl group-hover:bg-white/[0.04] transition-colors">
                                            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Group Size</div>
                                            <div className="text-xl font-black text-white">
                                                {request.attendees}
                                                <span className="text-xs text-muted-foreground ml-1 font-bold">Ppl</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                                                {request.userName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-white uppercase tracking-wide">{request.userName}</span>
                                                <span className="text-[9px] text-muted-foreground">{request.userPhone}</span>
                                            </div>
                                        </div>

                                        <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${request.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                request.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                    'bg-red-500/10 text-red-500 border border-red-500/20'
                                            }`}>
                                            <i className={`fa-solid ${request.status === 'pending' ? 'fa-clock' :
                                                    request.status === 'accepted' ? 'fa-check' :
                                                        'fa-xmark'
                                                }`}></i>
                                            {request.status}
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    ))}
                </div>
            )}

            {/* Detailed Request Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={() => setSelectedRequest(null)}
                    ></div>
                    <div className="relative w-full max-w-4xl bg-[#0F0F0F] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-8 pb-4 border-b border-white/5 flex justify-between items-start bg-white/[0.02]">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground border border-white/5">
                                        Request Details
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${selectedRequest.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                            selectedRequest.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                'bg-red-500/10 text-red-500 border border-red-500/20'
                                        }`}>
                                        <i className={`fa-solid ${selectedRequest.status === 'pending' ? 'fa-clock' :
                                                selectedRequest.status === 'accepted' ? 'fa-check' :
                                                    'fa-xmark'
                                            }`}></i>
                                        {selectedRequest.status}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-black text-white uppercase tracking-tight">{selectedRequest.topic}</h2>
                            </div>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all"
                            >
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="grid lg:grid-cols-3 gap-8">
                                {/* Left Column: Key Stats & Contact */}
                                <div className="space-y-6">
                                    {/* Contact Card */}
                                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-4">
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                            <i className="fa-solid fa-address-card text-primary"></i> Contact Info
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs text-white font-bold shrink-0">
                                                    {selectedRequest.userName.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">{selectedRequest.userName}</div>
                                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Requestor</div>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-white/5 space-y-3">
                                                <a href={`tel:${selectedRequest.userPhone}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-white transition-colors group">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs group-hover:bg-primary group-hover:text-white transition-colors">
                                                        <i className="fa-solid fa-phone"></i>
                                                    </div>
                                                    {selectedRequest.userPhone}
                                                </a>
                                                <a href={`mailto:${selectedRequest.userEmail}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-white transition-colors group">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs group-hover:bg-primary group-hover:text-white transition-colors">
                                                        <i className="fa-solid fa-envelope"></i>
                                                    </div>
                                                    {selectedRequest.userEmail}
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl">
                                            <div className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest mb-1">Proposed Budget</div>
                                            <div className="text-2xl font-black text-emerald-400">
                                                <span className="text-sm align-top mr-1">LKR</span>
                                                {Number(selectedRequest.budget).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
                                            <div className="text-[10px] font-black text-indigo-400/80 uppercase tracking-widest mb-1">Group Size</div>
                                            <div className="text-xl font-bold text-indigo-300">
                                                <i className="fa-solid fa-users mr-2"></i>
                                                {selectedRequest.attendees} Attendees
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: PDF & Actions */}
                                <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
                                    <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[2rem] p-1 overflow-hidden flex flex-col">
                                        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                                            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                <i className="fa-solid fa-paperclip text-primary"></i> Attached Proposal
                                            </h3>
                                            <a
                                                href={selectedRequest.pdfUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[10px] font-bold text-primary hover:text-white transition-colors uppercase tracking-wider flex items-center gap-2"
                                            >
                                                Open in New Tab <i className="fa-solid fa-arrow-up-right-from-square"></i>
                                            </a>
                                        </div>
                                        <div className="flex-1 bg-[#1a1a1a] relative group">
                                            <iframe
                                                src={`${selectedRequest.pdfUrl}#toolbar=0`}
                                                className="w-full h-full min-h-[400px] opacity-80 group-hover:opacity-100 transition-opacity"
                                                title="Proposal PDF"
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {selectedRequest.status === 'pending' && (
                                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-[2rem] flex gap-4">
                                            <button
                                                onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                                                className="flex-1 py-4 rounded-xl font-black uppercase text-xs tracking-widest bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all flex items-center justify-center gap-2 group"
                                            >
                                                <i className="fa-solid fa-xmark text-lg group-hover:scale-110 transition-transform"></i>
                                                Decline Request
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(selectedRequest.id, 'accepted')}
                                                className="flex-[2] py-4 rounded-xl font-black uppercase text-xs tracking-widest bg-emerald-500 text-white hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group"
                                            >
                                                <i className="fa-solid fa-check text-lg group-hover:scale-110 transition-transform"></i>
                                                Accept Proposal
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
