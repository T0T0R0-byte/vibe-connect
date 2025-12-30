import { Participant } from "@/app/models/Participant";
import { Workshop } from "@/app/models/Workshop";
import StatusBadge from "@/app/components/ui/StatusBadge";
import { GlassCard } from "@/app/components/ui/GlassCard";

interface ParticipantsViewProps {
    participants: Participant[];
    workshops: Workshop[];
    participantSearch: string;
    setParticipantSearch: (val: string) => void;
    onStatusChange: (id: string, status: string) => void;
}

export const ParticipantsView: React.FC<ParticipantsViewProps> = ({
    participants, workshops, participantSearch, setParticipantSearch, onStatusChange
}) => {

    // Filter Logic (Pure View Logic)
    const filteredParticipants = participants.filter(p =>
        p.displayName?.toLowerCase().includes(participantSearch.toLowerCase()) ||
        p.email?.toLowerCase().includes(participantSearch.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-foreground tracking-tighter">Participants</h2>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Manage workshop attendees and approvals</p>
                </div>

                <div className="relative w-full md:w-96 group">
                    <i className="fa-solid fa-search absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors"></i>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={participantSearch}
                        onChange={(e) => setParticipantSearch(e.target.value)}
                        className="w-full h-16 pl-14 pr-6 bg-[#121212] border border-white/10 rounded-[2rem] text-sm font-bold text-white focus:outline-none focus:border-primary/50 focus:shadow-[0_0_30px_-5px_var(--primary)] transition-all placeholder:text-muted-foreground/50"
                    />
                </div>
            </div>

            <GlassCard className="!p-0 overflow-hidden bg-[#121212]">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/[0.02] border-b border-white/5">
                            <tr className="text-left">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Participant</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Workshop</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Details</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredParticipants.map((participant) => (
                                <tr key={participant.uid + participant.registrationId} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase shadow-lg shadow-indigo-500/20">
                                                {participant.displayName?.[0] || 'G'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{participant.displayName}</p>
                                                <p className="text-[10px] font-medium text-muted-foreground">{participant.email || 'No Email'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-white">
                                            {workshops.find(w => w.id === participant.workshopId)?.title || 'Unknown Workshop'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                                                <i className="fa-solid fa-phone w-4"></i>
                                                {participant.phoneNumber || 'N/A'}
                                            </div>
                                            {participant.details && (
                                                <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                                                    <i className="fa-solid fa-cake-candles w-4"></i>
                                                    Age: {participant.details.age}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <StatusBadge status={participant.status || 'pending'} />
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <select
                                            value={participant.status}
                                            onChange={(e) => onStatusChange(participant.registrationId!, e.target.value)}
                                            className="bg-black text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl border border-white/10 focus:border-primary outline-none cursor-pointer hover:bg-white/5 transition-colors"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
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
