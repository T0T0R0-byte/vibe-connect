"use client";

import { useState, useEffect, Suspense } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/firebase/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AuthBear } from "@/app/components/AuthBear";
import { AnimatedBackground } from "@/app/components/AnimatedBackground";
import { PremiumModal } from "@/app/components/ui/PremiumModal";

function RegisterContent() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"user" | "vendor">("user");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Vendor Specific State
    const [phoneNumber, setPhoneNumber] = useState("");
    const [socialLink, setSocialLink] = useState("");
    const [businessIdFile, setBusinessIdFile] = useState<File | null>(null);

    // Modal State
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info" as "success" | "error" | "info" | "warning"
    });

    useEffect(() => {
        const roleParam = searchParams.get("role");
        if (roleParam === "vendor") {
            setRole("vendor");
        }
    }, [searchParams]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (role === "vendor") {
                if (!phoneNumber || !socialLink || !businessIdFile) {
                    throw new Error("Please complete all vendor verification steps including a PDF upload.");
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

            setModalConfig({
                isOpen: true,
                title: "Identity Initialized",
                message: role === "vendor"
                    ? "Welcome to the collective! Your vendor application is pending verification. You can now access your dashboard."
                    : "Account created successfully! Welcome to VibeConnect.",
                type: "success"
            });

            setTimeout(() => {
                router.push(role === "vendor" ? "/vendor" : "/");
            }, 2000);

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
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-2xl glass-card !p-8 md:!p-12 shadow-3xl border-white/10 bg-card/40 backdrop-blur-2xl relative z-10"
            >
                <div className="text-center mb-12">
                    <AuthBear inputLength={email.length} isPasswordFocused={isPasswordFocused} />
                    <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter uppercase leading-[0.85] mb-4">
                        {role === 'vendor' ? 'Partner' : 'Join'} the <span className="text-primary">Vibe</span>
                    </h2>
                    <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.3em] opacity-60">
                        {role === 'vendor' ? 'Launch your craft to a global audience' : 'Create your holographic identity'}
                    </p>
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black text-center mb-8 uppercase tracking-widest">
                        <i className="fa-solid fa-triangle-exclamation mr-2"></i> {error}
                    </motion.div>
                )}

                <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="md:col-span-2 space-y-3">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Account Type</label>
                        <div className="flex p-1.5 bg-black/40 rounded-[2rem] border border-white/5">
                            <button
                                type="button"
                                onClick={() => setRole("user")}
                                className={`flex-1 py-4 rounded-[1.75rem] transition-all font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 ${role === "user" ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:text-white"}`}
                            >
                                <i className="fa-solid fa-user-astronaut"></i> Participant
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole("vendor")}
                                className={`flex-1 py-4 rounded-[1.75rem] transition-all font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 ${role === "vendor" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" : "text-muted-foreground hover:text-white"}`}
                            >
                                <i className="fa-solid fa-gem"></i> Vendor
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 flex items-center gap-2">
                            <i className="fa-solid fa-id-card text-primary/60"></i> Full Name
                        </label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-6 py-4 bg-white/5 text-foreground border border-white/10 rounded-2xl focus:border-primary focus:bg-white/10 outline-none transition-all font-bold text-sm placeholder:text-white/10"
                            required
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 flex items-center gap-2">
                            <i className="fa-solid fa-at text-primary/60"></i> Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-6 py-4 bg-white/5 text-foreground border border-white/10 rounded-2xl focus:border-primary focus:bg-white/10 outline-none transition-all font-bold text-sm placeholder:text-white/10"
                            required
                            placeholder="name@vibe.io"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 flex items-center gap-2">
                            <i className="fa-solid fa-lock text-primary/60"></i> Security Key
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onFocus={() => setIsPasswordFocused(true)}
                            onBlur={() => setIsPasswordFocused(false)}
                            className="w-full px-6 py-4 bg-white/5 text-foreground border border-white/10 rounded-2xl focus:border-primary focus:bg-white/10 outline-none transition-all font-bold text-sm placeholder:text-white/10"
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <AnimatePresence>
                        {role === "vendor" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                className="md:col-span-2 grid md:grid-cols-2 gap-6 p-6 mt-4 bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden"
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 flex items-center gap-2">
                                        <i className="fa-solid fa-phone text-indigo-400"></i> Contact Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={e => setPhoneNumber(e.target.value)}
                                        className="w-full px-6 py-4 bg-black/20 text-foreground border border-white/10 rounded-2xl focus:border-indigo-500 focus:bg-black/40 outline-none transition-all font-bold text-sm"
                                        placeholder="+94 77..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 flex items-center gap-2">
                                        <i className="fa-solid fa-globe text-indigo-400"></i> Social / Portfolio
                                    </label>
                                    <input
                                        type="url"
                                        value={socialLink}
                                        onChange={e => setSocialLink(e.target.value)}
                                        className="w-full px-6 py-4 bg-black/20 text-foreground border border-white/10 rounded-2xl focus:border-indigo-500 focus:bg-black/40 outline-none transition-all font-bold text-sm"
                                        placeholder="Instagram / Website Link"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 flex items-center gap-2">
                                        <i className="fa-solid fa-file-pdf text-indigo-400"></i> Proof of Identity (PDF)
                                    </label>
                                    <div className="relative h-28 bg-black/40 border-2 border-dashed border-white/10 rounded-[1.5rem] flex flex-col items-center justify-center group cursor-pointer hover:border-indigo-500/50 hover:bg-black/60 transition-all">
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={e => setBusinessIdFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        <i className={`fa-solid ${businessIdFile ? 'fa-circle-check text-emerald-500' : 'fa-cloud-arrow-up text-white/20'} text-2xl mb-2 group-hover:scale-110 transition-transform`}></i>
                                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-4 text-center">
                                            {businessIdFile ? businessIdFile.name : "Upload Identification Documents"}
                                        </span>
                                        {!businessIdFile && <span className="text-[8px] text-white/10 mt-1 uppercase font-bold">Max file size 5MB</span>}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="md:col-span-2 pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-4 ${loading ? 'bg-primary/50 cursor-not-allowed' : 'btn-vibe-primary hover:shadow-2xl hover:shadow-primary/20'}`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Transmitting...
                                </>
                            ) : (
                                <>
                                    Initialize Identity
                                    <i className="fa-solid fa-arrow-right-long"></i>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-12 pt-10 border-t border-white/5 text-center">
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]">
                        Part of the collective?{" "}
                        <Link href="/login" className="text-primary hover:text-white transition-colors ml-1 border-b border-primary/20">
                            Access Portal
                        </Link>
                    </p>
                </div>
            </motion.div>

            <PremiumModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
            />
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
            <RegisterContent />
        </Suspense>
    );
}
