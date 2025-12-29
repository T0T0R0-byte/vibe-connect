"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if user is actually an admin
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().role === "admin") {
                router.push("/admin");
            } else {
                setError("Assess Denied: Not an authorized administrator.");
                await auth.signOut(); // Logout if not admin
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-black relative overflow-hidden">
            {/* Abstract tech background - Red Theme for Admin */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/10 blur-[120px] -z-10 rounded-full animate-pulse" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-red-500/20 p-10 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.1)] relative z-10"
            >
                <div className="text-center mb-10">
                    <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-2xl flex items-center justify-center mb-4 border border-red-500/20">
                        <i className="fa-solid fa-lock text-3xl text-red-500"></i>
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest">System Access</h2>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em] mt-2">Authorized Personnel Only</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center mb-6 uppercase tracking-wider">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Identity</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-red-500 transition-all font-bold text-sm placeholder:text-gray-700"
                            required
                            placeholder="admin@vibe.io"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Passcode</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-red-500 transition-all font-bold text-sm placeholder:text-gray-700"
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-red-500/20 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Verifying Credentials..." : "Login"}
                    </button>

                    <div className="text-center mt-6">
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                            Secure Connection • v2.0.4
                        </p>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
