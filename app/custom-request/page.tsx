"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebase/firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomRequestPage() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    const searchParams = useSearchParams();
    const vendorId = searchParams.get("vendorId");
    const vendorNameParam = searchParams.get("vendorName");

    const [topic, setTopic] = useState("");
    const [budget, setBudget] = useState("");
    const [attendees, setAttendees] = useState("");
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (loading) return null;
    if (!user) {
        router.push("/login");
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pdfFile || !topic || !budget) return;

        setUploading(true);
        try {
            // Upload PDF
            const pdfRef = ref(storage, `custom_requests/${user.uid}-${Date.now()}-${pdfFile.name}`);
            await uploadBytes(pdfRef, pdfFile);
            const pdfUrl = await getDownloadURL(pdfRef);

            // Create Doc
            await addDoc(collection(db, "custom_requests"), {
                userId: user.uid,
                userName: userData?.displayName || "Anonymous",
                userEmail: user.email,
                vendorId: vendorId || "all", // "all" implies open request if no vendor selected
                topic,
                budget,
                attendees,
                pdfUrl,
                status: "pending", // pending, accepted, rejected, completed
                createdAt: serverTimestamp()
            });

            setSuccess(true);
            setTimeout(() => router.push("/profile"), 2000);
        } catch (error) {
            console.error(error);
            alert("Failed to submit request.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-6 pt-32">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10 rounded-full animate-vibe-float" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] -z-10 rounded-full animate-vibe-float" style={{ animationDelay: '2.5s' }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card max-w-2xl w-full !p-12 border-primary/10 shadow-3xl relative"
            >
                {success ? (
                    <div className="text-center py-12">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 text-4xl"
                        >
                            <i className="fa-solid fa-check"></i>
                        </motion.div>
                        <h2 className="text-3xl font-black text-foreground uppercase tracking-tight mb-2">Request Sent!</h2>
                        <p className="text-muted-foreground font-bold">Vendors will review your requirement shortly.</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-10">
                            <h1 className="text-3xl md:text-4xl font-black text-foreground uppercase tracking-tighter mb-2">Custom Workshop</h1>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Design your perfect learning experience</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Topic / Skill</label>
                                    <input
                                        value={topic}
                                        onChange={e => setTopic(e.target.value)}
                                        className="w-full px-5 py-4 bg-secondary/30 border border-white/5 rounded-2xl text-sm font-bold text-foreground focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/20"
                                        placeholder="e.g. Adv. Pottery"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Budget (LKR)</label>
                                    <input
                                        value={budget}
                                        onChange={e => setBudget(e.target.value)}
                                        className="w-full px-5 py-4 bg-secondary/30 border border-white/5 rounded-2xl text-sm font-bold text-foreground focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/20"
                                        placeholder="15000"
                                        required
                                        type="number"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Requirement Document</label>
                                    <a href="/templates/VibeConnect_Custom_Request.pdf" download className="text-[9px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-2">
                                        <i className="fa-solid fa-download"></i> Download Template
                                    </a>
                                </div>

                                <label className="flex flex-col items-center justify-center h-32 bg-secondary/20 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-primary/30 hover:bg-secondary/30 transition-all group">
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="application/pdf"
                                        onChange={e => setPdfFile(e.target.files?.[0] || null)}
                                        required
                                    />
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors mb-2">
                                        {pdfFile ? <i className="fa-solid fa-file-pdf"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
                                    </div>
                                    <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground uppercase tracking-widest transition-colors">
                                        {pdfFile ? pdfFile.name : "Upload Filled PDF"}
                                    </span>
                                </label>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="w-full btn-vibe-primary py-4 text-sm shadow-xl shadow-primary/20"
                                >
                                    {uploading ? "Submitting..." : "Submit Request"}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
}
