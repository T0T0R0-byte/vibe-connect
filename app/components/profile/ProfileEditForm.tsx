import React, { useState } from "react";
import { UserController } from "@/app/controllers/UserController";
import { User } from "@/app/models/User";
import { motion } from "framer-motion";
import Image from "next/image";

interface ProfileEditFormProps {
    userData: User;
    onSuccess: () => void;
    onCancel: () => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ userData, onSuccess, onCancel }) => {
    const [name, setName] = useState(userData.displayName || "");
    const [phone, setPhone] = useState(userData.phoneNumber || "");
    const [socialLink, setSocialLink] = useState(userData.socialLink || "");
    const [businessName, setBusinessName] = useState(userData.businessName || "");
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState(userData.photoURL || "");
    const [saving, setSaving] = useState(false);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await UserController.updateUserData(userData.uid, {
                displayName: name,
                phoneNumber: phone,
                socialLink,
                businessName,
            }, photo);
            onSuccess();
        } catch (error) {
            console.error(error);
            alert("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center gap-6">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-2 border-primary/20 bg-white/5 relative shadow-2xl">
                        {photoPreview ? (
                            <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground font-black">
                                {name?.[0] || "?"}
                            </div>
                        )}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <i className="fa-solid fa-camera text-white text-xl"></i>
                            <input type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" />
                        </label>
                    </div>
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Edit Profile</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Update your personal information</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em]">Full Name</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl outline-none focus:border-primary/50 text-white font-medium text-sm transition-all focus:bg-black/40"
                        placeholder="Your Name"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em]">Phone Number</label>
                    <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl outline-none focus:border-primary/50 text-white font-medium text-sm transition-all focus:bg-black/40"
                        placeholder="98XXXXXX"
                    />
                </div>
                {userData.role === 'vendor' && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em]">Business Name</label>
                        <input
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl outline-none focus:border-primary/50 text-white font-medium text-sm transition-all focus:bg-black/40"
                            placeholder="Vibe Studio"
                        />
                    </div>
                )}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em]">Social Link</label>
                    <input
                        value={socialLink}
                        onChange={(e) => setSocialLink(e.target.value)}
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl outline-none focus:border-primary/50 text-white font-medium text-sm transition-all focus:bg-black/40"
                        placeholder="https://instagram.com/..."
                    />
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <button
                    onClick={onCancel}
                    className="flex-1 px-8 py-4 bg-white/5 text-muted-foreground hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5 hover:bg-white/10"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {saving ? <i className="fa-solid fa-circle-notch animate-spin"></i> : "Save Changes"}
                </button>
            </div>
        </div>
    );
};
