"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AuthBear } from "@/app/components/AuthBear";
import { AnimatedBackground } from "@/app/components/AnimatedBackground";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 pt-20 pb-10 bg-background relative overflow-hidden">
            <AnimatedBackground />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md glass-card !p-10 shadow-3xl border-white/10 bg-card/60 backdrop-blur-xl"
            >
                <div className="text-center mb-8 relative">
                    <AuthBear inputLength={email.length} isPasswordFocused={isPasswordFocused} />

                    <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-[0.8] mb-2">
                        Vibe<span className="text-primary">Connect</span>
                    </h2>
                    <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">User Portal</p>
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center mb-8 uppercase tracking-wider">
                        Login Failed: {error.includes('auth/invalid-credential') ? 'Invalid Login' : 'System Error'}
                    </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Email Address</label>
                        <div className="relative">
                            <i className="fa-solid fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-secondary/50 text-foreground border border-border rounded-2xl focus:border-primary focus:bg-secondary outline-none transition-all font-bold text-sm placeholder:text-muted-foreground"
                                required
                                placeholder="name@vibe.io"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Password</label>
                        </div>
                        <div className="relative">
                            <i className="fa-solid fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setIsPasswordFocused(true)}
                                onBlur={() => setIsPasswordFocused(false)}
                                className="w-full pl-12 pr-12 py-4 bg-secondary/50 text-foreground border border-border rounded-2xl focus:border-primary focus:bg-secondary outline-none transition-all font-bold text-sm placeholder:text-muted-foreground"
                                required
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                            >
                                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-vibe-primary w-full py-5 disabled:opacity-50"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <div className="mt-10 pt-10 border-t border-white/5 text-center">
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                        New to the network?{" "}
                        <Link href="/register" className="text-primary hover:underline ml-1">
                            Create Account
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
