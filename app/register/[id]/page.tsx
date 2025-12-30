"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { useAuth } from "@/app/context/AuthContext";
import { registerForWorkshop } from "@/firebase/workshopActions";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

interface Workshop {
    id: string;
    title: string;
    description: string;
    price: number;
    date: string;
    imageUrl: string;
    location: string;
    whatsappLink?: string;
    category: string;
    rating?: number;
    ratingCount?: number;
    vendorId: string;
    vendorPhone?: string;
    consentRequired?: boolean;
    imageUrls?: string[];
    imageBase64?: string;
    bankDetails?: string;
    refundPolicy?: string;
}

interface ParticipantDetails {
    fullName: string;
    age: string;
    phone: string;
    address: string;
    consentFile?: File | null;
}

export default function RegisterWorkshopPage() {
    const { id } = useParams();
    const { user, userData, loading: authLoading } = useAuth();
    const router = useRouter();
    const [workshop, setWorkshop] = useState<Workshop | null>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [step, setStep] = useState(1);

    const [participants, setParticipants] = useState<ParticipantDetails[]>([
        { fullName: "", age: "", phone: "", address: "", consentFile: null }
    ]);
    const [receipt, setReceipt] = useState<File | null>(null);
    const [consent, setConsent] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) { router.push("/login"); return; }
        if (userData?.role === 'vendor') {
            alert("Vendors cannot register for workshops. Please use a participant account.");
            router.push("/workshops");
            return;
        }

        const fetchWorkshop = async () => {
            if (typeof id !== "string") return;
            const docRef = doc(db, "workshops", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                let vPhone = "";
                let vBankDetails = "";
                if (data.vendorId) {
                    const vSnap = await getDoc(doc(db, "users", data.vendorId));
                    if (vSnap.exists()) {
                        const vData = vSnap.data();
                        vPhone = vData.phoneNumber || "";
                        vBankDetails = vData.bankDetails || "";
                    }
                }
                setWorkshop({
                    id: docSnap.id,
                    ...data,
                    vendorPhone: vPhone,
                    bankDetails: data.bankDetails || vBankDetails
                } as Workshop);
            }
            setLoading(false);
        };
        fetchWorkshop();
    }, [id, user, authLoading, router]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleParticipantChange = (index: number, field: keyof ParticipantDetails, value: any) => {
        const updated = [...participants];
        updated[index] = { ...updated[index], [field]: value };
        setParticipants(updated);
    };

    const addParticipant = () => setParticipants([...participants, { fullName: "", age: "", phone: "", address: "", consentFile: null }]);
    const removeParticipant = (index: number) => { if (participants.length > 1) setParticipants(participants.filter((_, i) => i !== index)); };

    const downloadConsentTemplate = () => {
        const text = `CONSENT FORM\n\nI, __________________________ (Parent/Guardian Name), give my consent for my child, __________________________ (Child Name), to participate in the workshop "${workshop?.title || 'Workshop'}".\n\nEmergency Contact: __________________________\n\nDate: ____________________\nSignature: ____________________`;
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Consent_Form_Template.txt";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleNext = () => {
        for (const p of participants) {
            if (!p.fullName || !p.age || !p.phone || !p.address) { alert("Please complete all details"); return; }
            const isMinor = parseInt(p.age) < 18;
            const needsConsent = isMinor || workshop?.consentRequired;

            if (needsConsent && !p.consentFile) {
                alert(`Consent form required for ${p.fullName} (${isMinor ? 'Minor' : 'Workshop Policy'}). Please upload the signed form.`);
                return;
            }
        }
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !workshop || registering) return;
        if (!consent) { alert("Please agree to the terms and conditions."); return; }

        if (!receipt) { alert("Please upload the bank transfer receipt."); return; }

        setRegistering(true);
        try {
            await registerForWorkshop(workshop.id, user.uid, receipt, participants);
            alert("Registration Submitted Successfully! You will be redirected shortly.");
            setStep(3);
        } catch (e) {
            console.error(e);
            alert("Registration failed. Please try again.");
        } finally {
            setRegistering(false);
        }
    };

    if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
    if (!workshop) return <div className="min-h-screen pt-32 text-center">Workshop not found</div>;

    const totalPrice = workshop.price * participants.length;

    return (
        <div className="min-h-screen pt-32 pb-24 px-6 relative overflow-hidden bg-background">
            {/* Background Glows for Immersion */}
            <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-primary/5 blur-[150px] -z-10 rounded-full animate-vibe-float" />
            <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] -z-10 rounded-full animate-vibe-float" style={{ animationDelay: '2s' }} />

            <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12">

                {/* LEFT: Workshop Content */}
                <div className="lg:col-span-8 space-y-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <Link href="/workshops" className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-all flex items-center gap-2 tracking-widest group w-fit">
                            <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Return to Workshops
                        </Link>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">{workshop.category}</span>
                                <div className="flex items-center gap-1 text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/10">
                                    <i className="fa-solid fa-star"></i> {workshop.rating || "NEW VIBE"}
                                </div>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-foreground tracking-tighter leading-[0.85]">{workshop.title}</h1>
                        </div>

                        <div className="h-[500px] relative rounded-[3rem] overflow-hidden group shadow-3xl border border-border/50">
                            <Image
                                src={workshop.imageBase64 || workshop.imageUrl || "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071&auto=format&fit=crop"}
                                alt={workshop.title || "Workshop"}
                                fill
                                priority
                                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                            <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4 text-white font-bold text-lg">
                                        <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                            <i className="fa-solid fa-location-dot text-primary"></i>
                                        </div>
                                        {workshop.location}
                                    </div>
                                    <div className="flex items-center gap-4 text-white font-bold text-lg">
                                        <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                            <i className="fa-solid fa-calendar text-primary"></i>
                                        </div>
                                        {new Date(workshop.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </div>
                                </div>
                                <div className="text-right p-8 rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10">
                                    <span className="block text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Access Fee</span>
                                    <span className="text-5xl font-black text-white">Rs. {workshop.price.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>


                        {/* Image Gallery */}
                        {workshop?.imageUrls && workshop.imageUrls.length > 0 && (
                            <div className="grid grid-cols-4 gap-4">
                                {workshop.imageUrls.map((url, i) => (
                                    <div key={i} className="h-32 rounded-2xl overflow-hidden border border-border/50 group cursor-pointer">
                                        <img src={url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={`View ${i + 1}`} />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="glass-card !p-12 space-y-12">
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-2 h-8 bg-primary rounded-full"></div>
                                    <h3 className="text-3xl font-black text-foreground tracking-tight uppercase">About This Workshop</h3>
                                </div>
                                <p className="text-muted-foreground font-medium调整 leading-relaxed text-xl max-w-3xl whitespace-pre-line">{workshop.description}</p>
                            </section>

                            <section className="pt-12 border-t border-border space-y-8">
                                <h3 className="text-xl font-black text-foreground tracking-tight uppercase">Vendor Interaction & Policies</h3>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="p-6 bg-secondary/50 rounded-3xl border border-border hover:border-primary/30 transition-all">
                                        <i className="fa-solid fa-rotate-left text-primary mb-4 block text-2xl"></i>
                                        <h4 className="font-black text-[10px] uppercase tracking-widest mb-2">Refund Policy</h4>
                                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">Requests permitted up to 7 days before activation. Single-use policy.</p>
                                    </div>
                                    <div className="p-6 bg-secondary/50 rounded-3xl border border-border hover:border-indigo-400/30 transition-all">
                                        <i className="fa-solid fa-shield-heart text-indigo-400 mb-4 block text-2xl"></i>
                                        <h4 className="font-black text-[10px] uppercase tracking-widest mb-2">Safety Guidelines</h4>
                                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">Encrypted, inclusive environment for high-level creative flow.</p>
                                    </div>
                                    <div className="p-6 bg-secondary/50 rounded-3xl border border-border hover:border-purple-400/30 transition-all">
                                        <i className="fa-solid fa-bolt text-purple-400 mb-4 block text-2xl"></i>
                                        <h4 className="font-black text-[10px] uppercase tracking-widest mb-2">Communication</h4>
                                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">Live coordination via secure WhatsApp channels post-booking.</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </motion.div>
                </div>

                {/* RIGHT: Booking Flow */}
                <div className="lg:col-span-4 relative">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="sticky top-32 glass-card !p-0 overflow-hidden shadow-3xl border-primary/20 ring-1 ring-primary/10"
                    >
                        <div className="p-8 bg-primary/10 border-b border-primary/20 relative overflow-hidden">
                            {/* Accent Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
                            <h3 className="text-2xl font-black text-foreground tracking-tight uppercase">Registration</h3>
                            <p className="text-[10px] font-black uppercase text-primary tracking-[0.3em] mt-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                {step === 1 ? "Step 1 / Details" : step === 2 ? "Step 2 / Payment" : "Confirmed"}
                            </p>
                        </div>

                        {step === 3 ? (
                            <div className="p-10 text-center space-y-8 py-20">
                                <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-primary/20 rotate-12">
                                    <i className="fa-solid fa-check text-5xl text-primary -rotate-12"></i>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-3xl font-black text-foreground tracking-tight">Registration Successful!</h4>
                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed px-4">Your connection is being processed by the vendor grid. Welcome to the collective.</p>
                                </div>
                                <div className="space-y-4 pt-6">
                                    {workshop.whatsappLink && (
                                        <a href={workshop.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-vibe-primary w-full !bg-[#25D366] !border-none flex items-center justify-center gap-3 py-5 text-sm">
                                            <i className="fa-brands fa-whatsapp text-2xl"></i> Join WhatsApp Group
                                        </a>
                                    )}
                                    <Link href="/profile" className="btn-vibe-secondary w-full block text-center py-5 text-sm">Go to Profile</Link>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 space-y-8">
                                {step === 1 ? (
                                    <>
                                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-vibe custom-scrollbar">
                                            {participants.map((p, i) => (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    key={i}
                                                    className="p-8 bg-secondary/30 rounded-[2.5rem] border border-border space-y-6 relative group hover:border-primary/20 transition-all"
                                                >
                                                    {participants.length > 1 && (
                                                        <button onClick={() => removeParticipant(i)} className="absolute top-6 right-6 text-muted-foreground hover:text-red-500 transition-colors">
                                                            <i className="fa-solid fa-circle-xmark text-lg"></i>
                                                        </button>
                                                    )}
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20">0{i + 1}</div>
                                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Participant Details</h5>
                                                    </div>
                                                    <div className="space-y-5">
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Full Name</label>
                                                            <input
                                                                value={p.fullName}
                                                                onChange={e => handleParticipantChange(i, 'fullName', e.target.value)}
                                                                className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-foreground placeholder:text-muted-foreground/30"
                                                                placeholder="Enter full name"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Age</label>
                                                                <input
                                                                    type="number"
                                                                    value={p.age}
                                                                    onChange={e => handleParticipantChange(i, 'age', e.target.value)}
                                                                    className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-foreground"
                                                                    placeholder="Age"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Phone Number</label>
                                                                <input
                                                                    value={p.phone}
                                                                    onChange={e => handleParticipantChange(i, 'phone', e.target.value)}
                                                                    className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-foreground"
                                                                    placeholder="Phone"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Address / City</label>
                                                            <input
                                                                value={p.address}
                                                                onChange={e => handleParticipantChange(i, 'address', e.target.value)}
                                                                className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-foreground"
                                                                placeholder="Location details"
                                                            />
                                                        </div>

                                                        {(parseInt(p.age) < 18 || workshop.consentRequired) && (
                                                            <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/20 space-y-4 shadow-inner">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                                            <i className="fa-solid fa-file-signature text-sm"></i>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Parental Consent Required</p>
                                                                            <p className="text-[8px] font-bold text-primary/60 uppercase tracking-tighter">PDF / JPG / PNG Accepted</p>
                                                                        </div>
                                                                    </div>
                                                                    {p.consentFile && <i className="fa-solid fa-circle-check text-primary animate-bounce"></i>}
                                                                </div>
                                                                <button onClick={downloadConsentTemplate} className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1 mb-2">
                                                                    <i className="fa-solid fa-download"></i> Download Template
                                                                </button>
                                                                <input
                                                                    type="file"
                                                                    accept="application/pdf,image/jpeg,image/png"
                                                                    onChange={e => handleParticipantChange(i, "consentFile", e.target.files?.[0])}
                                                                    className="text-[10px] w-full text-muted-foreground file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-primary file:text-white cursor-pointer hover:file:bg-primary/80 transition-all font-bold"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                        <button onClick={addParticipant} className="w-full py-5 border-2 border-dashed border-border rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:bg-secondary hover:border-primary/20 hover:text-primary transition-all active:scale-95">
                                            + Add Participant
                                        </button>
                                        <button onClick={handleNext} className="btn-vibe-primary w-full py-6 text-[11px] tracking-[0.2em]">
                                            Proceed to Payment
                                        </button>
                                    </>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                                        <div className="space-y-5 bg-secondary/30 p-8 rounded-[2.5rem] border border-border">
                                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                                                <span className="text-muted-foreground">Registering For</span>
                                                <span className="text-foreground">{participants.length} Person{participants.length > 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="h-px bg-border" />
                                            <div className="flex justify-between items-end pt-2">
                                                <div className="space-y-1">
                                                    <span className="block text-[9px] font-black uppercase text-muted-foreground tracking-widest">Total Amount</span>
                                                    <span className="text-3xl font-black text-foreground">Rs. {totalPrice.toLocaleString()}</span>
                                                </div>
                                                <div className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/10">READY TO PAY</div>
                                            </div>
                                        </div>

                                        <div className="p-8 bg-secondary/30 rounded-[2.5rem] border border-border space-y-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-5 bg-primary rounded-full" />
                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground">Payment Details</h5>
                                                </div>
                                            </div>

                                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="space-y-3 bg-background p-5 rounded-2xl border border-border">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bank Instructions</p>
                                                    <p className="text-sm font-medium text-foreground whitespace-pre-line leading-relaxed">
                                                        {workshop.bankDetails || "Please contact the vendor for bank details."}
                                                    </p>
                                                </div>

                                                <div className="space-y-3 bg-background p-5 rounded-2xl border border-border">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Refund Policy</p>
                                                    <p className="text-sm font-medium text-amber-500 whitespace-pre-line leading-relaxed">
                                                        {workshop.refundPolicy || "Contact vendor for refund details."}
                                                    </p>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Upload Receipt (PDF/IMG)</label>
                                                    <div className="relative h-32 bg-background border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center group cursor-pointer hover:border-primary/40 hover:bg-secondary/20 transition-all overflow-hidden">
                                                        <input
                                                            type="file"
                                                            accept="application/pdf,image/*"
                                                            onChange={e => setReceipt(e.target.files?.[0] || null)}
                                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                        />
                                                        <div className="flex flex-col items-center relative z-0">
                                                            <i className={`fa-solid ${receipt ? 'fa-check-circle text-primary scale-125' : 'fa-cloud-arrow-up text-muted-foreground/30 group-hover:text-primary'} text-3xl mb-3 transition-all duration-500`}></i>
                                                            <span className="text-[10px] font-black uppercase text-muted-foreground truncate w-48 text-center px-4 tracking-tighter">
                                                                {receipt ? receipt.name : "Upload Receipt"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <label className="flex items-start gap-4 cursor-pointer group p-2">
                                            <input
                                                type="checkbox"
                                                checked={consent}
                                                onChange={e => setConsent(e.target.checked)}
                                                className="w-6 h-6 rounded-lg border-border bg-background checked:bg-primary transition-all cursor-pointer mt-0.5"
                                            />
                                            <p className="text-[10px] font-bold text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">I accept the Terms & Conditions and acknowledge the refund policy of this workshop.</p>
                                        </label>

                                        <div className="space-y-4">
                                            <button
                                                type="submit"
                                                disabled={registering}
                                                className="btn-vibe-primary w-full py-6 text-sm disabled:opacity-50 shadow-2xl shadow-primary/20"
                                            >
                                                {registering ? "Processing..." : "Confirm Registration"}
                                            </button>

                                            <button type="button" onClick={() => setStep(1)} className="w-full text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-all">
                                                Back to Details
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div >
        </div >
    );
}

