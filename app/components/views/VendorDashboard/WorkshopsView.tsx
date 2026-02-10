import React, { useState } from 'react';
import { Workshop } from "@/app/models/Workshop";
import Image from "next/image";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { ActionButton } from "@/app/components/ui/ActionButton";
import { AnimatePresence, motion } from "framer-motion";
import StatusBadge from "@/app/components/ui/StatusBadge";
import { Registration } from "@/app/models/Registration";
import { getWorkshopImage } from "@/app/utils/workshopUtils";
import { ReviewsView } from "./ReviewsView";

interface WorkshopsViewProps {
    workshops: Workshop[];
    participantsMap?: Record<string, Registration[]>;
    onEdit: (workshop: Workshop) => void;
    onDelete: (id: string) => void;
    onCreate: () => void;
    onToggleFreeze?: (workshop: Workshop) => void;
}

export const WorkshopsView: React.FC<WorkshopsViewProps> = ({ workshops, participantsMap = {}, onEdit, onDelete, onCreate, onToggleFreeze }) => {
    const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);
    const [participantFilter, setParticipantFilter] = useState("");
    const [activeManageTab, setActiveManageTab] = useState<"participants" | "reviews">("participants");

    const selectedWorkshop = workshops.find(w => w.id === selectedWorkshopId);
    const selectedParticipants = selectedWorkshopId ? (participantsMap[selectedWorkshopId] || []) : [];

    const filteredParticipants = selectedParticipants.filter(p =>
        p.displayName?.toLowerCase().includes(participantFilter.toLowerCase()) ||
        p.email?.toLowerCase().includes(participantFilter.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-foreground tracking-tighter">My Workshops</h2>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Manage your active listings</p>
                </div>
                <ActionButton onClick={onCreate} variant="primary" className="rounded-[2rem] px-8 py-4 tracking-[0.2em] text-xs" icon="fa-plus">
                    Create Vibe
                </ActionButton>
            </div>

            <div className="grid md:grid-cols-3 xl:grid-cols-4 gap-4">
                {workshops.map((workshop) => (
                    <GlassCard key={workshop.id} className="group !p-0 bg-[#121212] hover:border-primary/50 transition-all rounded-[2rem]">
                        <div className="h-40 relative overflow-hidden rounded-t-[2rem]">
                            <Image src={getWorkshopImage(workshop)} alt={workshop.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                            {workshop.isFrozen && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-md">
                                        <i className="fa-solid fa-snowflake mr-2"></i> Frozen
                                    </span>
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-1">
                                <ActionButton onClick={() => onEdit(workshop)} size="icon" className="w-8 h-8 bg-black/40 border border-white/10 hover:bg-white hover:text-black rounded-full text-[10px]" icon="fa-pen" />
                                <ActionButton onClick={() => onDelete(workshop.id)} size="icon" className="w-8 h-8 bg-black/40 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-full text-[10px]" icon="fa-trash" />
                            </div>
                        </div>

                        <div className="p-5 flex flex-col gap-4">
                            <h3 className="text-sm font-black text-white hover:text-primary transition-colors uppercase truncate">{workshop.title}</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center">
                                    <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Enrollment</span>
                                    <span className="text-[10px] font-bold text-white flex items-center gap-1 mt-1">
                                        <i className="fa-solid fa-user-group text-primary text-[8px]"></i>
                                        {participantsMap[workshop.id]?.length || 0}
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
                            <button onClick={() => setSelectedWorkshopId(workshop.id)} className="w-full py-2.5 bg-secondary hover:bg-primary/10 hover:text-primary text-muted-foreground rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Manage</button>
                        </div>
                    </GlassCard>
                ))}
            </div>

            <AnimatePresence>
                {selectedWorkshopId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card !p-0 w-full max-w-4xl max-h-[80vh] flex flex-col relative z-10 overflow-hidden">
                            <div className="p-6 border-b border-white/10 flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase truncate">Managing: {selectedWorkshop?.title}</h3>
                                    <div className="flex gap-4 mt-4">
                                        <button onClick={() => setActiveManageTab("participants")} className={`text-[9px] font-black uppercase tracking-widest pb-2 border-b-2 ${activeManageTab === 'participants' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent'}`}>Participants ({selectedParticipants.length})</button>
                                        <button onClick={() => setActiveManageTab("reviews")} className={`text-[9px] font-black uppercase tracking-widest pb-2 border-b-2 ${activeManageTab === 'reviews' ? 'text-amber-500 border-amber-500' : 'text-muted-foreground border-transparent'}`}>Reviews</button>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedWorkshopId(null)} className="w-10 h-10 rounded-full hover:bg-white/10 text-muted-foreground"><i className="fa-solid fa-xmark"></i></button>
                            </div>

                            {activeManageTab === "participants" ? (
                                <div className="overflow-y-auto flex-1 p-6">
                                    {filteredParticipants.length > 0 ? (
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/5">
                                                    <th className="px-4 py-2">Name</th>
                                                    <th className="px-4 py-2">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {filteredParticipants.map(p => (
                                                    <tr key={p.registrationId}>
                                                        <td className="px-4 py-4 text-sm font-bold text-white">{p.displayName}</td>
                                                        <td className="px-4 py-4"><StatusBadge status={p.status || 'pending'} /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : <p className="text-center p-20 text-muted-foreground text-xs uppercase font-black">No participants found</p>}
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto p-6">
                                    <ReviewsView workshopId={selectedWorkshopId!} />
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
