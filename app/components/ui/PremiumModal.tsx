"use client";

import { motion, AnimatePresence } from "framer-motion";

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: "success" | "error" | "info" | "warning";
    actionLabel?: string;
    onAction?: () => void;
}

export function PremiumModal({
    isOpen,
    onClose,
    title,
    message,
    type = "info",
    actionLabel = "Confirm",
    onAction
}: PremiumModalProps) {
    const icons = {
        success: { icon: "fa-check-double", color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30", btn: "bg-emerald-500" },
        error: { icon: "fa-triangle-exclamation", color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30", btn: "bg-red-500" },
        info: { icon: "fa-circle-info", color: "text-primary", bg: "bg-primary/20", border: "border-primary/30", btn: "bg-primary" },
        warning: { icon: "fa-circle-exclamation", color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30", btn: "bg-amber-500" },
    };

    const config = icons[type];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md glass-card-premium overflow-hidden border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
                    >
                        <div className="p-8 text-center pt-12">
                            <div className={`w-20 h-20 ${config.bg} ${config.border} border rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12 group-hover:rotate-0 transition-transform duration-500`}>
                                <i className={`fa-solid ${config.icon} text-3xl ${config.color}`}></i>
                            </div>

                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
                                {title}
                            </h2>
                            <p className="text-muted-foreground font-medium text-sm leading-relaxed mb-8">
                                {message}
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={onAction || onClose}
                                    className={`flex-1 py-4 ${config.btn} text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-${type === 'info' ? 'primary' : type}-500/20`}
                                >
                                    {actionLabel}
                                </button>
                                {type !== "info" && type !== "success" && (
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-xl transition-all border border-white/10"
                                    >
                                        Dismiss
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Decorative line */}
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${type === 'info' ? 'primary' : (type === 'error' ? 'red-500' : 'amber-500')} to-transparent`} />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
