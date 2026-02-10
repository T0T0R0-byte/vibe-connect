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
    onIssueRefund: (regId: string) => void;
    onRemoveParticipant?: (regId: string) => void;
}

export const ParticipantsView: React.FC<ParticipantsViewProps> = ({
    participants, workshops, participantSearch, setParticipantSearch, onStatusChange, onIssueRefund, onRemoveParticipant
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
                                            <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground mr-4">
                                                <i className="fa-solid fa-phone w-4"></i>
                                                {participant.phoneNumber || 'N/A'}
                                            </div>
                                            {(participant.address || participant.details?.address) && (
                                                <div className="flex items-start gap-2 text-[10px] font-medium text-muted-foreground/70">
                                                    <i className="fa-solid fa-location-dot w-4 mt-1"></i>
                                                    <span className="line-clamp-2">{participant.address || participant.details?.address}</span>
                                                </div>
                                            )}
                                            {participant.details && (
                                                <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                                                    <i className="fa-solid fa-cake-candles w-4"></i>
                                                    Age: {participant.details.age}
                                                </div>
                                            )}
                                            {(participant.consentUrl || participant.details?.consentUrl) && (
                                                <div className="mt-2">
                                                    <a
                                                        href={participant.consentUrl || participant.details?.consentUrl}
                                                        target="_blank"
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors group"
                                                    >
                                                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-black text-[8px] animate-pulse">
                                                            <i className="fa-solid fa-file-signature"></i>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Signed Consent</span>
                                                            <span className="text-[7px] font-bold text-emerald-500/70 group-hover:text-emerald-500 transition-colors">Click to View Document</span>
                                                        </div>
                                                        <i className="fa-solid fa-arrow-up-right-from-square text-[8px] text-emerald-500 ml-1 opacity-50 group-hover:opacity-100 transition-opacity"></i>
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <StatusBadge status={participant.status || 'pending'} />
                                    </td>
                                    <td className="px-8 py-6 text-right flex flex-col items-end gap-2">
                                        <select
                                            value={['confirmed', 'paid', 'approved'].includes(participant.status || '') ? 'approved' : participant.status}
                                            onChange={(e) => onStatusChange(participant.registrationId!, e.target.value)}
                                            className={`bg-black text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl border outline-none cursor-pointer transition-all w-36 ${['confirmed', 'paid', 'approved'].includes(participant.status || '') ? 'text-green-500 border-green-500/20 shadow-[0_0_15px_-5px_var(--green-500)]' : 'text-white border-white/10'
                                                }`}
                                        >
                                            <option value="pending" className="bg-[#121212]">Pending</option>
                                            <option value="approved" className="bg-[#121212]">Approved (Paid)</option>
                                            <option value="confirmed" className="bg-[#121212]" hidden>Confirmed</option>
                                            <option value="rejected" className="bg-[#121212]">Rejected</option>
                                            <option value="refund_requested" className="bg-[#121212]">Refund Req</option>
                                            <option value="refunded" className="bg-[#121212]">Refunded</option>
                                        </select>

                                        {participant.status === 'refund_requested' && (
                                            <button
                                                onClick={() => onIssueRefund(participant.registrationId!)}
                                                className="w-32 px-4 py-2 bg-green-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                                            >
                                                Approve Refund
                                            </button>
                                        )}

                                        {['refund_rejected', 'rejected', 'failed'].includes(participant.status || '') && (
                                            <button
                                                onClick={() => onRemoveParticipant?.(participant.registrationId!)}
                                                className="w-32 px-4 py-2 bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                            >
                                                Remove Record
                                            </button>
                                        )}
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
