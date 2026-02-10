import { Registration } from "@/app/models/Registration";
import { Workshop } from "@/app/models/Workshop";
import StatusBadge from "@/app/components/ui/StatusBadge";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { useState } from "react";

interface ParticipantsViewProps {
    participantsMap: Record<string, Registration[]>;
    workshops: Workshop[];
    onUpdateStatus: (id: string, status: string) => void;
}

export const ParticipantsView: React.FC<ParticipantsViewProps> = ({
    participantsMap, workshops, onUpdateStatus
}) => {
    const [search, setSearch] = useState("");

    const allParticipants = Object.values(participantsMap).flat();
    const filtered = allParticipants.filter(p =>
        p.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        (p as any).userEmail?.toLowerCase().includes(search.toLowerCase()) ||
        (p as any).participantDetails?.fullName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase">Participants</h2>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Manage workshop attendees and approvals</p>
                </div>

                <div className="relative w-full md:w-96 group">
                    <i className="fa-solid fa-search absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors"></i>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-16 pl-14 pr-6 bg-[#121212] border border-white/10 rounded-[2rem] text-sm font-bold text-white focus:outline-none focus:border-primary/50 transition-all"
                    />
                </div>
            </div>

            <GlassCard className="!p-0 overflow-hidden bg-[#121212]">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/[0.02] border-b border-white/5">
                            <tr className="text-left font-black uppercase text-[10px] tracking-widest text-muted-foreground">
                                <th className="px-8 py-6">Participant</th>
                                <th className="px-8 py-6">Workshop</th>
                                <th className="px-8 py-6">Details</th>
                                <th className="px-8 py-6">Status</th>
                                <th className="px-8 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map((reg) => (
                                <tr key={reg.registrationId} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary uppercase">
                                                {reg.displayName?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{reg.displayName || (reg as any).participantDetails?.fullName}</p>
                                                <p className="text-[10px] font-medium text-muted-foreground">{(reg as any).userEmail || (reg as any).participantDetails?.email || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[9px] font-bold text-white uppercase tracking-widest">
                                            {workshops.find(w => w.id === reg.workshopId)?.title || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1 text-[10px] font-bold text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <i className="fa-solid fa-phone scale-75"></i>
                                                {(reg as any).participantDetails?.phone || 'N/A'}
                                            </div>
                                            {(reg as any).participantDetails?.age && (
                                                <div className="flex items-center gap-2">
                                                    <i className="fa-solid fa-cake-candles scale-75"></i>
                                                    Age: {(reg as any).participantDetails.age}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <StatusBadge status={reg.status || 'pending'} />
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <select
                                            value={reg.status}
                                            onChange={(e) => onUpdateStatus(reg.registrationId!, e.target.value)}
                                            className="bg-black text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-white/10 outline-none text-white focus:border-primary/50"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="refund_requested">Refund Req</option>
                                            <option value="refunded">Refunded</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
};
