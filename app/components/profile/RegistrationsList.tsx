import React from "react";
import { Registration } from "@/app/models/Registration";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { getWorkshopImage } from "@/app/utils/workshopUtils";

interface RegistrationsListProps {
    registrations: Registration[];
    onOpenReview: (registration: Registration) => void;
    onOpenRefund: (registration: Registration) => void;
    onReport: (registration: Registration) => void;
    userReviews: Record<string, any>;
    reportsMap: Record<string, any>;
}

export const RegistrationsList: React.FC<RegistrationsListProps> = ({
    registrations,
    onOpenReview,
    onOpenRefund,
    onReport,
    userReviews,
    reportsMap
}) => {
    if (registrations.length === 0) {
        return (
            <div className="glass-card !p-16 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fa-solid fa-ticket text-2xl text-muted-foreground"></i>
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">No Registrations Yet</h3>
                <p className="text-sm font-bold text-muted-foreground mb-8">Join your first workshop to start your journey.</p>
                <a href="/workshops" className="btn-vibe-primary px-10 py-4 text-[10px]">
                    Browse Workshops
                </a>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
                {registrations.map((ws, idx) => (
                    <motion.div
                        key={ws.registrationId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-card group overflow-hidden"
                    >
                        {/* Header Image */}
                        <div className="relative h-48 -m-8 mb-8 overflow-hidden">
                            <Image
                                src={getWorkshopImage(ws as any)}
                                alt={ws.workshopTitle || "Workshop"}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

                            <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md border ${ws.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border-green-500/20' :
                                        ws.status === 'refunded' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                                            'bg-white/10 text-white border-white/10'
                                    }`}>
                                    {ws.status || "Confirmed"}
                                </span>
                            </div>

                            <div className="absolute bottom-6 left-6 right-6">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight line-clamp-1">{ws.workshopTitle}</h3>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                    <i className="fa-solid fa-shop scale-75"></i> {(ws as any).vendorName || "Vendor"}
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-6 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Date</span>
                                    <p className="text-xs font-bold text-white">{(ws as any).date}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Price</span>
                                    <p className="text-xs font-bold text-white">Rs. {(ws as any).workshopPrice}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-white/5">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Participant</span>
                                    <p className="text-xs font-bold text-white">{(ws as any).participantName}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">WhatsApp</span>
                                    <p className="text-xs font-bold text-white truncate">{(ws as any).whatsappLink || "N/A"}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex gap-2">
                                    {ws.status !== 'refunded' && ws.status !== 'refund_requested' && (
                                        <>
                                            {new Date((ws as any).date) > new Date() ? (
                                                <span className="px-4 py-2 bg-white/5 text-muted-foreground text-[10px] font-bold uppercase tracking-widest rounded-lg border border-white/5 cursor-not-allowed" title="Available after workshop">
                                                    Upcoming
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => onOpenReview(ws)}
                                                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${userReviews[(ws as any).id] ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20' : 'bg-white text-black hover:bg-white/80 shadow-lg shadow-white/10'}`}
                                                >
                                                    {userReviews[(ws as any).id] ? 'Edit Review' : 'Write Review'}
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {reportsMap[ws.registrationId!] ? (
                                        <span className="px-4 py-2 bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-orange-500/20">
                                            Reported
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => onReport(ws)}
                                            className="px-4 py-2 bg-white/5 text-muted-foreground hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-lg border border-white/5 hover:bg-white/10"
                                        >
                                            Report
                                        </button>
                                    )}
                                </div>

                                {ws.status === 'confirmed' && (
                                    <button
                                        onClick={() => onOpenRefund(ws)}
                                        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-red-400 transition-colors"
                                    >
                                        Refund Policy
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
