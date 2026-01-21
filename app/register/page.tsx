"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/firebase/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AuthBear } from "@/app/components/AuthBear";
import { AnimatedBackground } from "@/app/components/AnimatedBackground";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"user" | "vendor">("user");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const router = useRouter();

    // Vendor Specific State
    const [phoneNumber, setPhoneNumber] = useState("");
    const [socialLink, setSocialLink] = useState("");
    const [businessIdFile, setBusinessIdFile] = useState<File | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (role === "vendor") {
                if (!phoneNumber || !socialLink || !businessIdFile) {
                    throw new Error("Complete all mentor verification steps.");
                }
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await updateProfile(user, { displayName: name });

            let businessIdUrl = "";
            if (role === "vendor" && businessIdFile) {
                const storageRef = ref(storage, `business_ids/${user.uid}-${Date.now()}-${businessIdFile.name}`);
                await uploadBytes(storageRef, businessIdFile);
                businessIdUrl = await getDownloadURL(storageRef);
            }

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                displayName: name,
                email: user.email,
                role: role,
                createdAt: serverTimestamp(),
                favorites: [],
                registeredWorkshops: [],
                ...(role === "vendor" && {
                    phoneNumber,
                    socialLink,
                    businessIdUrl,
                    isVerified: false
                })
            });

            router.push("/");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-24 bg-background relative overflow-hidden">
            <AnimatedBackground />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-xl glass-card !p-10 shadow-3xl"
            >
                <div className="text-center mb-10">
                    <AuthBear inputLength={email.length} isPasswordFocused={isPasswordFocused} />
                    <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-[0.8] mb-3">
                        Join the <span className="text-primary">Vibe</span>
                    </h2>
                    <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">Create your holographic identity</p>
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black text-center mb-8 uppercase tracking-widest">
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleRegister} className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-6 md:col-span-2">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Identity Class</label>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setRole("user")} className={`flex-1 py-4 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest ${role === "user" ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"}`}>User</button>
                                <button type="button" onClick={() => setRole("vendor")} className={`flex-1 py-4 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest ${role === "vendor" ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"}`}>Vendor</button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Full Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-6 py-4 bg-white/5 text-foreground border border-white/10 rounded-2xl focus:border-primary focus:bg-white/10 outline-none transition-all font-bold text-sm" required placeholder="Display Name" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-6 py-4 bg-white/5 text-foreground border border-white/10 rounded-2xl focus:border-primary focus:bg-white/10 outline-none transition-all font-bold text-sm" required placeholder="name@vibe.io" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)} className="w-full px-6 py-4 bg-white/5 text-foreground border border-white/10 rounded-2xl focus:border-primary focus:bg-white/10 outline-none transition-all font-bold text-sm" required placeholder="••••••••" />
                    </div>

                    <AnimatePresence>
                        {role === "vendor" && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:col-span-2 grid md:grid-cols-2 gap-6 overflow-hidden">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Contact Protocol</label>
                                    <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full px-6 py-4 bg-white/5 text-foreground border border-white/10 rounded-2xl focus:border-primary focus:bg-white/10 outline-none transition-all font-bold text-sm" placeholder="+94 77..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Social Feed</label>
                                    <input type="url" value={socialLink} onChange={e => setSocialLink(e.target.value)} className="w-full px-6 py-4 bg-white/5 text-foreground border border-white/10 rounded-2xl focus:border-primary focus:bg-white/10 outline-none transition-all font-bold text-sm" placeholder="Instagram / Web" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Business Identity (PDF)</label>
                                    <div className="relative h-20 bg-white/5 border border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center group cursor-pointer hover:border-primary/40 transition-all">
                                        <input type="file" accept="application/pdf" onChange={e => setBusinessIdFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        <i className={`fa-solid ${businessIdFile ? 'fa-check text-primary' : 'fa-upload text-white/20'} text-xl mb-1`}></i>
                                        <span className="text-[10px] font-black uppercase text-muted-foreground">{businessIdFile ? businessIdFile.name : "Select Document"}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="md:col-span-2 pt-4">
                        <button type="submit" disabled={loading} className="btn-vibe-primary w-full py-5 disabled:opacity-50">
                            {loading ? "Transmitting..." : "Initialize Identity"}
                        </button>
                    </div>
                </form>

                <div className="mt-10 pt-10 border-t border-white/5 text-center">
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                        Part of the collective?{" "}
                        <Link href="/login" className="text-primary hover:underline ml-1">
                            Access Portal
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
