import React, { useState } from 'react';
import { Workshop } from "@/app/models/Workshop";
import Image from "next/image";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { ActionButton } from "@/app/components/ui/ActionButton";
import { AnimatePresence, motion } from "framer-motion";
import StatusBadge from "@/app/components/ui/StatusBadge";
import { Participant } from "@/app/models/Participant";

interface WorkshopsViewProps {
    workshops: Workshop[];
    participantsMap?: Record<string, Participant[]>;
    onEdit: (workshop: Workshop) => void;
    onDelete: (id: string) => void;
    onCreate: () => void;
}

export const WorkshopsView: React.FC<WorkshopsViewProps> = ({ workshops, participantsMap = {}, onEdit, onDelete, onCreate }) => {
    const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);
    const [participantFilter, setParticipantFilter] = useState("");

    const selectedWorkshop = workshops.find(w => w.id === selectedWorkshopId);
    const selectedParticipants = selectedWorkshopId ? (participantsMap[selectedWorkshopId] || []) : [];

    const filteredParticipants = selectedParticipants.filter(p =>
        p.displayName?.toLowerCase().includes(participantFilter.toLowerCase()) ||
        p.email?.toLowerCase().includes(participantFilter.toLowerCase())
    );

    const handleRefund = async (regId: string) => {
        if (confirm("Are you sure you want to mark this participant as refunded? This will remove them from the active list.")) {
            const { updateDoc, doc, serverTimestamp } = await import("firebase/firestore");
            const { db } = await import("@/firebase/firebaseConfig");
            try {
                await updateDoc(doc(db, "registrations", regId), {
                    status: "refunded",
                    refundStatus: "vendor_proof_uploaded", // Auto-verify for manual vendor action
                    refundedAt: serverTimestamp()
                });
                alert("Refund processed successfully!");
            } catch (e) {
                console.error(e);
                alert("Failed to process refund.");
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-foreground tracking-tighter">My Workshops</h2>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Manage your active listings</p>
                </div>
                <ActionButton
                    onClick={onCreate}
                    variant="primary"
                    className="rounded-[2rem] px-8 py-4 tracking-[0.2em] text-xs"
                    icon="fa-plus"
                >
                    Create Vibe
                </ActionButton>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {workshops.map((workshop) => (
                    <GlassCard key={workshop.id} className="group !p-0 bg-[#121212] hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500">
                        {/* Image Area */}
                        <div className="h-64 relative overflow-hidden">
                            <Image
                                src={workshop.imageUrls?.[0] || workshop.imageUrl || workshop.imageBase64 || "https://images.unsplash.com/photo-1513364776144-60967b0f800f"}
                                alt={workshop.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-90" />

                            <div className="absolute top-4 right-4 flex gap-2">
                                <ActionButton
                                    onClick={() => onEdit(workshop)}
                                    size="icon"
                                    className="bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white hover:text-black rounded-full"
                                    icon="fa-pen-to-square"
                                />
                                <ActionButton
                                    onClick={() => onDelete(workshop.id)}
                                    size="icon"
                                    className="bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-full"
                                    icon="fa-trash"
                                />
                            </div>

                            <div className="absolute bottom-4 left-6">
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-white border border-white/10 mb-2 inline-block">
                                    {workshop.category}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-6">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-2xl font-black text-white leading-tight tracking-tight line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
                                        {workshop.title}
                                    </h3>
                                    <div className="flex flex-col items-end">
                                        <span className="text-lg font-black text-white">Rs. {workshop.price}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                    {workshop.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">Date</span>
                                    <span className="text-xs font-bold text-white flex items-center gap-2">
                                        <i className="fa-regular fa-calendar text-primary"></i>
                                        {new Date(workshop.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">Stats</span>
                                    <span className="text-xs font-bold text-white flex items-center gap-2">
                                        <i className="fa-solid fa-user-group text-primary"></i>
                                        {(() => {
                                            const enrolled = participantsMap[workshop.id]?.filter(p => ['paid', 'approved', 'pending'].includes(p.status || '')).length || 0;
                                            return workshop.capacity ? `${enrolled}/${workshop.capacity}` : `${enrolled} Active`;
                                        })()}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedWorkshopId(workshop.id)}
                                className="w-full py-3 bg-secondary hover:bg-primary/20 hover:text-primary text-muted-foreground rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <i className="fa-solid fa-users-gear"></i> Manage Participants
                            </button>
                        </div>
                    </GlassCard>
                ))}

                {/* Create New Card */}
                <button
                    onClick={onCreate}
                    className="group relative h-full min-h-[400px] rounded-[2.5rem] border-2 border-dashed border-white/10 hover:border-primary/50 flex flex-col items-center justify-center gap-6 transition-all hover:bg-white/[0.02]"
                >
                    <div className="w-20 h-20 rounded-full bg-white/5 group-hover:bg-primary/10 flex items-center justify-center transition-all group-hover:scale-110">
                        <i className="fa-solid fa-plus text-3xl text-muted-foreground group-hover:text-primary transition-colors"></i>
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-black text-white uppercase tracking-widest">Create New Vibe</h3>
                        <p className="text-xs text-muted-foreground font-medium">Add a workshop to your collection</p>
                    </div>
                </button>
            </div>

            {/* Manage Modal */}
            <AnimatePresence>
                {selectedWorkshopId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedWorkshopId(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="glass-card !p-0 w-full max-w-4xl max-h-[80vh] flex flex-col relative z-10 shadow-3xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#121212]">
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                                        Managing: {selectedWorkshop?.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground font-bold mt-1">
                                        {selectedParticipants.length} Total Registrations
                                    </p>
                                </div>
                                <button onClick={() => setSelectedWorkshopId(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                                    <i className="fa-solid fa-xmark text-white"></i>
                                </button>
                            </div>

                            <div className="p-4 bg-black/40 border-b border-white/5">
                                <div className="relative">
                                    <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
                                    <input
                                        value={participantFilter}
                                        onChange={e => setParticipantFilter(e.target.value)}
                                        placeholder="Filter participants by name..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-white outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="overflow-y-auto p-0 flex-1 bg-[#121212]">
                                {filteredParticipants.length > 0 ? (
                                    <table className="w-full">
                                        <thead className="bg-white/[0.02] sticky top-0 z-10">
                                            <tr className="text-left">
                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Name</th>
                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Contact</th>
                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredParticipants.map(p => (
                                                <tr key={p.registrationId} className="hover:bg-white/[0.02]">
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-bold text-white">{p.displayName}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col text-xs text-muted-foreground">
                                                            <span>{p.email}</span>
                                                            <span>{p.phoneNumber}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <StatusBadge status={p.status || 'pending'} />
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {p.status !== 'refunded' && p.status !== 'rejected' && (
                                                            <button
                                                                onClick={() => p.registrationId && handleRefund(p.registrationId)}
                                                                className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                                            >
                                                                Refund
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-12 text-center text-muted-foreground">
                                        <p className="font-bold text-sm">No participants found matching your filter.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
