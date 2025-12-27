"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [isOpen, setIsOpen] = useState(false);

    if (!mounted) return null;

    const themes = [
        { id: "light", label: "Light", icon: "fa-sun", color: "text-amber-500" },
        { id: "dark", label: "Dark", icon: "fa-moon", color: "text-indigo-400" },
        { id: "cozy", label: "Cozy", icon: "fa-coffee", color: "text-orange-600" },
    ];

    const effectiveTheme = theme === "system" ? "dark" : theme;
    const currentTheme = themes.find(t => t.id === effectiveTheme) || themes[1]; // Default to dark if unknown

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2 text-muted-foreground hover:text-primary transition-all flex items-center gap-2 relative group min-w-[60px]"
                aria-label="Theme Menu"
            >
                <motion.div
                    key={theme}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    <span className="text-[10px] font-black uppercase tracking-widest">{currentTheme.label}</span>
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10, x: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10, x: -20 }}
                            className="absolute right-0 top-14 w-48 bg-card/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 z-50 shadow-2xl overflow-hidden"
                        >
                            <div className="flex flex-col gap-1">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => {
                                            setTheme(t.id);
                                            setIsOpen(false);
                                        }}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${theme === t.id ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${theme === t.id ? 'bg-primary/20' : 'bg-white/5'}`}>
                                            <i className={`fa-solid ${t.icon} ${t.color}`}></i>
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest">{t.label}</span>
                                        {theme === t.id && (
                                            <motion.div layoutId="active-theme" className="ml-auto">
                                                <i className="fa-solid fa-circle-check text-[10px]"></i>
                                            </motion.div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div >
    );
}
