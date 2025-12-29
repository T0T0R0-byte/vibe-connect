"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/firebase/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminRegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [secretCode, setSecretCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Simple security check to prevent unauthorized admin creation
        if (secretCode !== "VIBE_MASTER_KEY_2025") {
            setError("Invalid Administrative Access Code");
            return;
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await updateProfile(user, { displayName: name });

            // Create user document with 'admin' role
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                displayName: name,
                email: user.email,
                role: "admin",
                createdAt: serverTimestamp(),
                favorites: [],
                registeredWorkshops: []
            });

            // Redirect to admin dashboard
            router.push("/admin");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-black relative overflow-hidden">
            {/* Abstract tech background */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl relative z-10"
            >
                <div className="text-center mb-10">
                    <i className="fa-solid fa-user-shield text-4xl text-red-500 mb-4"></i>
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest">Admin Access</h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2">Restricted Area</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center mb-6 uppercasetracking-wider">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Admin Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-red-500 transition-all font-bold text-sm"
                            required
                            placeholder="Commander Name"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Secure Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-red-500 transition-all font-bold text-sm"
                            required
                            placeholder="admin@vibe.io"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-red-500 transition-all font-bold text-sm"
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-red-500 tracking-widest ml-1">Access Key</label>
                        <input
                            type="password"
                            value={secretCode}
                            onChange={e => setSecretCode(e.target.value)}
                            className="w-full px-5 py-4 bg-black/40 border border-red-500/30 rounded-xl text-white outline-none focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all font-bold text-sm"
                            required
                            placeholder="Enter Master Key"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-gradient-to-r from-red-600 to-red-800 text-white font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-red-500/20 mt-4"
                    >
                        {loading ? "Authorizing..." : "Grant Access"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
