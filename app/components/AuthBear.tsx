"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface AuthBearProps {
    inputLength: number;
    isPasswordFocused: boolean;
}

export const AuthBear = ({ inputLength, isPasswordFocused }: AuthBearProps) => {
    // Limit eye movement
    const eyeX = Math.min(inputLength * 1.5, 12);
    const eyeY = inputLength > 0 ? 3 : 0;

    return (
        <div className="w-[120px] h-[100px] mx-auto relative mb-4">
            {/* Bear Head */}
            <motion.div
                animate={{
                    y: isPasswordFocused ? 10 : 0,
                    rotate: isPasswordFocused ? -5 : 0
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-24 h-24 bg-[#dba879] rounded-full mx-auto relative z-10 border-4 border-foreground/10 shadow-xl"
            >
                {/* Ears */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#dba879] rounded-full border-4 border-foreground/10" />
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#dba879] rounded-full border-4 border-foreground/10" />

                {/* Face Mask (Lighter area around eyes) */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-4 p-1">
                    {/* Left Eye */}
                    <div className="w-6 h-6 bg-white rounded-full relative overflow-hidden ring-2 ring-black/5">
                        <motion.div
                            animate={{ x: eyeX, y: eyeY }}
                            className="w-2.5 h-2.5 bg-black rounded-full absolute top-1.5 left-1.5"
                        />
                    </div>
                    {/* Right Eye */}
                    <div className="w-6 h-6 bg-white rounded-full relative overflow-hidden ring-2 ring-black/5">
                        <motion.div
                            animate={{ x: eyeX, y: eyeY }}
                            className="w-2.5 h-2.5 bg-black rounded-full absolute top-1.5 left-1.5"
                        />
                    </div>
                </div>

                {/* Muzzle */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-8 bg-white/90 rounded-[1rem]">
                    {/* Nose */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-3 bg-black rounded-full" />
                </div>

                {/* Hands (cover eyes on password) */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{
                        y: isPasswordFocused ? -55 : 50,
                        opacity: isPasswordFocused ? 1 : 0,
                        scale: isPasswordFocused ? 1 : 0.8
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-12 flex justify-between px-1 z-20 pointer-events-none"
                >
                    <div className="w-12 h-12 bg-[#dba879] rounded-full border-4 border-foreground/10 shadow-lg relative">
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-4 bg-white/20 rounded-full" />
                    </div>
                    <div className="w-12 h-12 bg-[#dba879] rounded-full border-4 border-foreground/10 shadow-lg relative">
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-4 bg-white/20 rounded-full" />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};
