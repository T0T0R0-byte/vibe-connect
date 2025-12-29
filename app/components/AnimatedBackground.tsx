"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const AnimatedBackground = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
            {/* Soft Ambient Glows (Base) */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full"
            />
            <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 15, repeat: Infinity, delay: 2 }}
                className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[100px] rounded-full"
            />

            {/* Floating Glass Shapes (The "Thingys") */}

            {/* Shape 1: Floating Cube-ish thing on Left */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{
                    x: [0, 50, 0],
                    y: [0, -30, 0],
                    rotate: [0, 45, 0],
                    opacity: 1
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 left-10 md:left-20 w-24 h-24 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10 rounded-3xl z-0 hidden md:block"
            />

            {/* Shape 2: Floating Sphere on Right */}
            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{
                    x: [0, -40, 0],
                    y: [0, 40, 0],
                    scale: [1, 1.1, 1],
                    opacity: 1
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-1/3 right-10 md:right-20 w-32 h-32 bg-gradient-to-bl from-primary/10 to-purple-500/10 backdrop-blur-md border border-white/10 rounded-full z-0 hidden md:block"
            />

            {/* Shape 3: Small floating particles */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{
                        x: Math.random() * 1000 - 500,
                        y: Math.random() * 1000 - 500,
                        opacity: 0,
                        scale: 0
                    }}
                    animate={{
                        y: [0, -100, 0],
                        opacity: [0, 0.5, 0],
                        scale: [0, 1, 0]
                    }}
                    transition={{
                        duration: 5 + Math.random() * 5,
                        repeat: Infinity,
                        delay: Math.random() * 5,
                        ease: "easeInOut"
                    }}
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    className={`absolute w-4 h-4 rounded-full ${i % 2 === 0 ? 'bg-primary' : 'bg-indigo-500'} blur-sm`}
                />
            ))}
        </div>
    );
};
