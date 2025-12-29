"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const themes = [
        { id: "light", icon: "fa-sun" },
        { id: "dark", icon: "fa-moon" },
        { id: "cozy", icon: "fa-mug-hot" },
    ];

    const activeTheme = themes.some(t => t.id === theme) ? theme : "dark";

    return (
        <div className="flex items-center p-1 rounded-full bg-secondary/50 border border-white/10 backdrop-blur-md shadow-inner">
            {themes.map((t) => (
                <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200 z-10 
                    ${activeTheme === t.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    aria-label={`Switch to ${t.id} theme`}
                >
                    {activeTheme === t.id && (
                        <motion.div
                            layoutId="theme-pill"
                            className="absolute inset-0 bg-primary rounded-full shadow-lg shadow-primary/25"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                    )}
                    <i className={`fa-solid ${t.icon} relative z-10 text-xs`}></i>
                </button>
            ))}
        </div>
    );
}
