import React, { useState } from 'react';
import { Workshop } from "@/app/models/Workshop";
import Image from "next/image";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { ActionButton } from "@/app/components/ui/ActionButton";
import { AnimatePresence, motion } from "framer-motion";
import StatusBadge from "@/app/components/ui/StatusBadge";
import { Participant } from "@/app/models/Participant";
import { getWorkshopImage } from "@/app/utils/workshopUtils";

import { ReviewsView } from "./ReviewsView";

interface WorkshopsViewProps {
    workshops: Workshop[];
    participantsMap?: Record<string, Participant[]>;
    onEdit: (workshop: Workshop) => void;
    onDelete: (id: string) => void;
    onCreate: () => void;
    onRemoveParticipant?: (regId: string) => void;
    onToggleFreeze?: (workshop: Workshop) => void;
}

export const WorkshopsView: React.FC<WorkshopsViewProps> = ({ workshops, participantsMap = {}, onEdit, onDelete, onCreate, onRemoveParticipant, onToggleFreeze }) => {
    const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);
    const [participantFilter, setParticipantFilter] = useState("");
    const [activeManageTab, setActiveManageTab] = useState<"participants" | "reviews">("participants");

    const selectedWorkshop = workshops.find(w => w.id === selectedWorkshopId);
    const selectedParticipants = selectedWorkshopId ? (participantsMap[selectedWorkshopId] || []) : [];

    const filteredParticipants = selectedParticipants.filter(p =>
        p.displayName?.toLowerCase().includes(participantFilter.toLowerCase()) ||
        p.email?.toLowerCase().includes(participantFilter.toLowerCase())
    );

    const handleOpenManage = (id: string) => {
        setSelectedWorkshopId(id);
        setActiveManageTab("participants");
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

            <div className="grid md:grid-cols-3 xl:grid-cols-4 gap-4">
                {workshops.map((workshop) => (
                    <GlassCard key={workshop.id} className="group !p-0 bg-[#121212] hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 rounded-[2rem]">
                        {/* Image Area */}
                        <div className="h-40 relative overflow-hidden rounded-t-[2rem]">
                            <Image
                                src={getWorkshopImage(workshop)}
                                alt={workshop.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            {workshop.isFrozen && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10 pointer-events-none">
                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-md">
                                        <i className="fa-solid fa-snowflake mr-2"></i> Frozen
                                    </span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60" />

                            <div className="absolute top-2 right-2 flex gap-1">
                                <ActionButton
                                    onClick={() => onEdit(workshop)}
                                    size="icon"
                                    className="w-8 h-8 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white hover:text-black rounded-full text-[10px]"
                                    icon="fa-pen"
                                />
                                <ActionButton
                                    onClick={() => onDelete(workshop.id)}
                                    size="icon"
                                    className="w-8 h-8 bg-black/40 backdrop-blur-md border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-full text-[10px]"
                                    icon="fa-trash"
                                />
                            </div>

                            <div className="absolute bottom-3 left-4">
                                <span className="px-2 py-0.5 bg-primary/20 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-widest text-primary border border-primary/20">
                                    {workshop.category}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col gap-4">
                            <div>
                                <h3 className="text-sm font-black text-white leading-tight tracking-tight line-clamp-1 group-hover:text-primary transition-colors uppercase">
                                    {workshop.title}
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center">
                                    <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Enrollment</span>
                                    <span className="text-[10px] font-bold text-white flex items-center gap-1 mt-1">
                                        <i className="fa-solid fa-user-group text-primary text-[8px]"></i>
                                        {(() => {
                                            const enrolled = participantsMap[workshop.id]?.filter(p => ['approved', 'pending', 'confirmed', 'paid', 'participant_confirmed', 'refund_requested', 'refund_rejected'].includes(p.status || '')).length || 0;
                                            return workshop.capacity ? `${enrolled}/${workshop.capacity}` : `${enrolled}`;
                                        })()}
                                    </span>
                                </div>
                                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center">
                                    <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Rating</span>
                                    <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 mt-1">
                                        <i className="fa-solid fa-star text-[8px]"></i>
                                        {workshop.rating?.toFixed(1) || "5.0"}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleOpenManage(workshop.id)}
                                className="w-full py-2.5 bg-secondary hover:bg-primary/20 hover:text-primary text-muted-foreground rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <i className="fa-solid fa-users-gear text-[10px]"></i> Manage
                            </button>

                            {onToggleFreeze && (
                                <button
                                    onClick={() => onToggleFreeze(workshop)}
                                    className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${workshop.isFrozen
                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                                        : 'bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10 hover:text-white'}`}
                                >
                                    <i className={`fa-solid ${workshop.isFrozen ? 'fa-fire' : 'fa-snowflake'} text-[10px]`}></i>
                                    {workshop.isFrozen ? "Unfreeze" : "Freeze"}
                                </button>
                            )}
                        </div>
                    </GlassCard>
                ))}

                {/* Create New Card */}
                <button
                    onClick={onCreate}
                    className="group relative h-full min-h-[280px] rounded-[2rem] border-2 border-dashed border-white/10 hover:border-primary/50 flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/[0.02]"
                >
                    <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-primary/10 flex items-center justify-center transition-all group-hover:scale-110">
                        <i className="fa-solid fa-plus text-xl text-muted-foreground group-hover:text-primary transition-colors"></i>
                    </div>
                    <div className="text-center space-y-1">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">New Vibe</h3>
                        <p className="text-[8px] text-muted-foreground font-medium uppercase">Add Listing</p>
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
                            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-[#121212]">
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                                        Managing: {selectedWorkshop?.title}
                                    </h3>
                                    <div className="flex items-center gap-4 mt-4">
                                        <button
                                            onClick={() => setActiveManageTab("participants")}
                                            className={`text-[9px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeManageTab === 'participants' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-white'}`}
                                        >
                                            Participants ({selectedParticipants.length})
                                        </button>
                                        <button
                                            onClick={() => setActiveManageTab("reviews")}
                                            className={`text-[9px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeManageTab === 'reviews' ? 'text-amber-500 border-amber-500' : 'text-muted-foreground border-transparent hover:text-white'}`}
                                        >
                                            Reviews
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedWorkshopId(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/5 text-muted-foreground hover:text-white">
                                    <i className="fa-solid fa-xmark text-lg"></i>
                                </button>
                            </div>

                            {activeManageTab === "participants" ? (
                                <>
                                    <div className="p-4 bg-black/40 border-b border-white/5">
                                        <div className="relative">
                                            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"></i>
                                            <input
                                                value={participantFilter}
                                                onChange={e => setParticipantFilter(e.target.value)}
                                                placeholder="Filter participants by name..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white outline-none focus:border-primary/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="overflow-y-auto p-0 flex-1 bg-[#121212]">
                                        {filteredParticipants.length > 0 ? (
                                            <table className="w-full">
                                                <thead className="bg-white/[0.02] sticky top-0 z-10">
                                                    <tr className="text-left">
                                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground font-black">Name</th>
                                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground font-black">Contact</th>
                                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground font-black">Status</th>
                                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-right font-black">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {filteredParticipants.map(p => (
                                                        <tr key={p.registrationId} className="hover:bg-white/[0.02] transition-colors">
                                                            <td className="px-6 py-4">
                                                                <span className="text-sm font-black text-white">{p.displayName}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col text-[10px] font-bold text-muted-foreground">
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
                                                                        onClick={() => onRemoveParticipant?.(p.registrationId!)}
                                                                        className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="p-20 text-center text-muted-foreground">
                                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <i className="fa-solid fa-users-slash text-2xl opacity-20"></i>
                                                </div>
                                                <p className="font-black text-[10px] uppercase tracking-widest">No participants found.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 overflow-y-auto p-8 bg-[#121212]">
                                    <ReviewsView participants={selectedParticipants} workshopId={selectedWorkshopId!} />
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
