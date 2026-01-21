import React, { useState } from 'react';
import { GlassCard } from "@/app/components/ui/GlassCard";
import { db } from "@/firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";

interface CustomizationViewProps {
    userData: any;
    onUpdate: () => void;
}

export const CustomizationView: React.FC<CustomizationViewProps> = ({ userData, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [customOrdersEnabled, setCustomOrdersEnabled] = useState(userData?.customOrdersEnabled || false);
    const [businessName, setBusinessName] = useState(userData?.businessName || "");
    const [phoneNumber, setPhoneNumber] = useState(userData?.phoneNumber || "");
    const [socialLink, setSocialLink] = useState(userData?.socialLink || "");

    const handleSave = async () => {
        if (!userData?.id) return;
        setLoading(true);
        try {
            const userRef = doc(db, "users", userData.id);
            await updateDoc(userRef, {
                customOrdersEnabled,
                businessName,
                phoneNumber,
                socialLink
            });
            alert("Profile updated successfully!");
            onUpdate();
        } catch (error) {
            console.error("Update failed:", error);
            alert("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase">Store Customization</h2>
                <p className="text-sm text-muted-foreground font-medium mt-1 uppercase tracking-widest">Tailor your creator presence and enable bespoke orders.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
                {/* Custom Orders Toggle */}
                <GlassCard className="p-10 bg-primary/5 border-primary/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-primary/20 transition-all"></div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-2xl">
                                <i className="fa-solid fa-wand-magic-sparkles"></i>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Custom Vibe Requests</h3>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Allow users to book custom sessions</p>
                            </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between p-6 bg-black/40 rounded-3xl border border-white/5">
                            <span className="text-xs font-black text-white uppercase tracking-widest">Accept Custom Orders</span>
                            <button
                                onClick={() => setCustomOrdersEnabled(!customOrdersEnabled)}
                                className={`w-16 h-8 rounded-full relative transition-all duration-500 ${customOrdersEnabled ? 'bg-primary' : 'bg-white/10'}`}
                            >
                                <motion.div
                                    animate={{ x: customOrdersEnabled ? 32 : 4 }}
                                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                                />
                            </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-4 ml-2 font-medium">When enabled, a "Custom Request" button will appear on your profile and workshops.</p>
                    </div>
                </GlassCard>

                {/* Profile Details */}
                <GlassCard className="p-10 space-y-8">
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <i className="fa-solid fa-address-card text-indigo-400"></i>
                        Vibe Creator Details
                    </h3>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Business Name / Stage Name</label>
                            <input
                                value={businessName}
                                onChange={e => setBusinessName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-indigo-400/50 transition-all"
                                placeholder="The Masterpiece Academy"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Contact Phone</label>
                                <input
                                    value={phoneNumber}
                                    onChange={e => setPhoneNumber(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-indigo-400/50 transition-all"
                                    placeholder="+94 77..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Portfolio Link</label>
                                <input
                                    value={socialLink}
                                    onChange={e => setSocialLink(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-indigo-400/50 transition-all"
                                    placeholder="instagram.com/user"
                                />
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="btn-vibe-primary px-16 py-6 shadow-2xl shadow-primary/30 min-w-[300px]"
                >
                    {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : "Synchronize Profile"}
                </button>
            </div>
        </div>
    );
};
