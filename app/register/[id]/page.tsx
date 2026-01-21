"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { useAuth } from "@/app/context/AuthContext";
import { registerForWorkshop } from "@/firebase/workshopActions";
import { Workshop } from "@/app/models/Workshop";

// Stripe Imports
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// --- Types ---
interface ParticipantDetails {
    fullName: string;
    age: string;
    phone: string;
    address: string;
    consentFile?: File | null;
}

// --- Payment Form Component ---
const PaymentForm = ({
    clientSecret,
    onSuccess,
    onCancel
}: {
    clientSecret: string;
    onSuccess: (id: string) => void;
    onCancel: () => void;
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            console.error("Stripe or Elements not loaded");
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            // Trigger form validation and wallet collection
            const { error: submitError } = await elements.submit();
            if (submitError) {
                setError(submitError.message || "An error occurred");
                setProcessing(false);
                return;
            }

            // Confirm Payment
            const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: 'if_required',
                confirmParams: {
                    return_url: window.location.href,
                },
            });

            if (confirmError) {
                setError(confirmError.message || "Payment failed");
                setProcessing(false);
            } else if (paymentIntent && paymentIntent.status === "succeeded") {
                await onSuccess(paymentIntent.id); // Await this to ensure flow completes
            } else {
                setError("Payment status unknown. Please check your dashboard.");
                setProcessing(false);
            }
        } catch (e: any) {
            console.error("Payment Error Exception:", e);
            setError(e.message || "Unexpected payment error occurred.");
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement options={{
                layout: "tabs",
            }} />
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg font-bold">{error}</div>}

            <div className="flex gap-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={processing}
                    className="flex-1 py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest bg-white/5 hover:bg-white/10 text-muted-foreground transition-all"
                >
                    Back
                </button>
                <button
                    type="submit"
                    disabled={!stripe || processing}
                    className="flex-1 py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                    {processing && <i className="fa-solid fa-circle-notch animate-spin"></i>}
                    {processing ? "Processing..." : "Pay Now"}
                </button>
            </div>
        </form>
    );
};

// --- Main Page ---

export default function RegisterPage() {
    const { id } = useParams();
    const { user, userData, refreshUserData } = useAuth();
    const router = useRouter();

    const [workshop, setWorkshop] = useState<Workshop | null>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [errorDisplay, setErrorDisplay] = useState("");

    // Steps: 1 = Details, 2 = Payment (if applicable), 3 = Success
    const [step, setStep] = useState(1);
    const [clientSecret, setClientSecret] = useState("");

    const [participants, setParticipants] = useState<ParticipantDetails[]>([{
        fullName: "",
        age: "",
        phone: "",
        address: "",
        consentFile: null,
    }]);

    const totalPrice = (workshop?.price || 0) * participants.length;

    useEffect(() => {
        const fetchWorkshop = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, "workshops", id as string);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const workshopData = { id: docSnap.id, ...docSnap.data() } as Workshop;
                    setWorkshop(workshopData);

                    // Check if user is a vendor
                    if (userData?.role === 'vendor') {
                        alert("Vendors cannot register for workshops. Please use a participant account.");
                        router.push("/vendor");
                        return;
                    }

                    // Check if already registered
                    if (userData?.registeredWorkshops?.includes(workshopData.id)) {
                        // Check exact status properly (allow re-buy if refunded)
                        const registrationsRef = collection(db, "registrations");
                        const q = query(
                            registrationsRef,
                            where("userId", "==", user.uid),
                            where("workshopId", "==", workshopData.id)
                        );

                        const snapshot = await getDocs(q);
                        const hasActiveRegistration = snapshot.docs.some(doc => {
                            const status = doc.data().status;
                            return ['confirmed', 'pending', 'refund_requested', 'refund_rejected'].includes(status);
                        });

                        if (hasActiveRegistration) {
                            alert("You already have an active registration for this workshop.");
                            router.push("/profile");
                            return;
                        }
                    }

                    // Prefill first participant
                    if (userData) {
                        setParticipants([{
                            fullName: userData.displayName || "",
                            phone: userData.phoneNumber || "",
                            age: "",
                            address: "",
                            consentFile: null
                        }]);
                    }
                } else {
                    router.push("/workshops");
                }
            } catch (error) {
                console.error("Error fetching workshop:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchWorkshop();
    }, [id, router, userData]);

    const addParticipant = () => {
        setParticipants([...participants, {
            fullName: "",
            age: "",
            phone: "",
            address: "",
            consentFile: null,
        }]);
    };

    const removeParticipant = (index: number) => {
        if (participants.length > 1) {
            setParticipants(participants.filter((_, i) => i !== index));
        }
    };

    const updateParticipant = (index: number, field: keyof ParticipantDetails, value: any) => {
        const newParticipants = [...participants];
        newParticipants[index] = { ...newParticipants[index], [field]: value };
        setParticipants(newParticipants);
    };

    const handleDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorDisplay("");

        for (const p of participants) {
            if (!p.fullName || !p.age || !p.phone) {
                setErrorDisplay("Please fill in all required fields for all participants.");
                return;
            }

            const ageNum = parseInt(p.age);
            if (isNaN(ageNum) || ageNum < 1) {
                setErrorDisplay(`Please enter a valid age for ${p.fullName || 'all participants'}.`);
                return;
            }

            // Parent Consent Validation
            if (ageNum < 18 && workshop?.consentRequired && !p.consentFile) {
                setErrorDisplay(`Participants under 18 (${p.fullName}) must upload a parental consent form.`);
                return;
            }
        }

        if (totalPrice > 0) {
            // Init Payment Intent
            try {
                setRegistering(true); // temporary spinner for "Initializing"
                const res = await fetch("/api/create-payment-intent", {
                    method: "POST",
                    body: JSON.stringify({ amount: totalPrice, workshopTitle: workshop?.title }),
                });
                const data = await res.json();
                if (data.clientSecret) {
                    setClientSecret(data.clientSecret);
                    setStep(2); // Go to payment
                } else {
                    setErrorDisplay("Failed to initialize payment. Please try again.");
                }
            } catch (err) {
                console.error("Payment init error", err);
                setErrorDisplay("Connection error. Please try again.");
            } finally {
                setRegistering(false);
            }
        } else {
            // Free Workshop -> Direct Register
            handleFinalRegistration();
        }
    };

    const handleFinalRegistration = async (paymentIntentId: string | null = null) => {
        if (!workshop || !user) return;
        setRegistering(true);
        try {
            await registerForWorkshop(
                workshop.id,
                user.uid,
                paymentIntentId,
                participants
            );
            await refreshUserData(); // Refresh user data to update registeredWorkshops
            setStep(3); // Success
        } catch (error) {
            console.error("Registration failed:", error);
            setErrorDisplay("Registration failed. Please try again.");
        } finally {
            setRegistering(false);
        }
    };


    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>;
    if (!workshop) return null;

    return (
        <div className="min-h-screen bg-transparent text-foreground flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full animate-float"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-6xl flex flex-col md:flex-row gap-8 items-stretch pt-20">

                {/* Left Side: Summary Card */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 glass-morphism rounded-[2.5rem] overflow-hidden flex flex-col max-h-[700px] sticky top-32"
                >
                    {/* Workshop Image */}
                    <div className="relative h-full w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={workshop.imageUrl || "https://images.unsplash.com/photo-1513364776144-60967b0f800f"} alt={workshop.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                        <div className="absolute bottom-0 left-0 p-10 w-full">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-primary/20">
                                    {workshop.category}
                                </span>
                                {workshop.price && workshop.price > 0 ? (
                                    <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-500/20">
                                        LKR {workshop.price.toLocaleString()} / Person
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/5">
                                        Free Entry
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-5xl font-black text-white leading-[0.9] tracking-tighter mb-4">{workshop.title}</h1>

                            <div className="grid grid-cols-2 gap-4 text-xs font-bold text-white/50 border-t border-white/10 pt-6 mt-6">
                                <span className="flex items-center gap-2"><i className="fa-solid fa-calendar text-primary"></i> {new Date(workshop.date).toLocaleDateString()}</span>
                                <span className="flex items-center gap-2"><i className="fa-solid fa-location-dot text-primary"></i> {workshop.location || "Online"}</span>
                                <span className="flex items-center gap-2"><i className="fa-solid fa-users text-primary"></i> {participants.length} Participant(s)</span>
                                <span className="flex items-center gap-2 text-white"><i className="fa-solid fa-wallet text-emerald-400"></i> Total: LKR {totalPrice.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: Form Wizard */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-[1.5] glass-morphism rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <AnimatePresence mode="wait">

                            {/* STEP 1: DETAILS */}
                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <div className="flex justify-between items-end mb-8">
                                        <div>
                                            <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Booking Details</h2>
                                            <p className="text-muted-foreground text-xs font-medium">Add all participants for this session.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addParticipant}
                                            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                        >
                                            <i className="fa-solid fa-plus"></i> Add Person
                                        </button>
                                    </div>

                                    <form onSubmit={handleDetailsSubmit} className="space-y-10">
                                        <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar space-y-12">
                                            {participants.map((p, index) => (
                                                <div key={index} className="relative p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-6">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/10">
                                                            Participant #{index + 1}
                                                        </span>
                                                        {participants.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeParticipant(index)}
                                                                className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>

                                                    <FormInput label="Full Name" value={p.fullName} onChange={(val) => updateParticipant(index, 'fullName', val)} placeholder="Ex: John Doe" icon="fa-user" />
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormInput label="Age" value={p.age} onChange={(val) => updateParticipant(index, 'age', val)} placeholder="Ex: 24" icon="fa-cake-candles" />
                                                        <FormInput label="Phone" value={p.phone} onChange={(val) => updateParticipant(index, 'phone', val)} placeholder="+94 77..." icon="fa-phone" />
                                                    </div>
                                                    <FormInput label="City / Address" value={p.address} onChange={(val) => updateParticipant(index, 'address', val)} placeholder="Ex: Colombo 7" icon="fa-map-pin" />

                                                    {((p.age && parseInt(p.age) < 18) || workshop.consentRequired) && (
                                                        <div className="p-6 rounded-2xl bg-black/40 border border-white/5 animate-in fade-in slide-in-from-top-2">
                                                            <label className="text-[10px] font-black uppercase text-red-400 tracking-widest block mb-4 flex items-center gap-2">
                                                                <i className="fa-solid fa-heart-pulse"></i>
                                                                Consent Required for {p.fullName || 'Minor'}
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type="file"
                                                                    onChange={(e) => updateParticipant(index, 'consentFile', e.target.files?.[0])}
                                                                    className="block w-full text-xs text-muted-foreground file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                                                                    accept="application/pdf,image/*"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {errorDisplay && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl font-bold text-center">{errorDisplay}</div>}

                                        <div className="flex flex-col gap-4 sticky bottom-0 pt-4 bg-transparent backdrop-blur-sm">
                                            <div className="flex justify-between items-center px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subtotal ({participants.length} People)</span>
                                                <span className="text-lg font-black text-white">LKR {totalPrice.toLocaleString()}</span>
                                            </div>
                                            <button
                                                disabled={registering}
                                                className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-primary/90 transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3"
                                            >
                                                {registering ? (<i className="fa-solid fa-circle-notch animate-spin"></i>) : (
                                                    <>
                                                        {totalPrice > 0 ? "Proceed to Checkout" : "Confirm Bulk Booking"}
                                                        <i className="fa-solid fa-arrow-right"></i>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {/* STEP 2: PAYMENT */}
                            {step === 2 && clientSecret && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <div className="mb-10">
                                        <h2 className="text-3xl font-black text-foreground uppercase tracking-tight mb-2">Checkout</h2>
                                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Workshop</span>
                                                <span className="text-xs font-black text-white">{workshop.title}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Participants</span>
                                                <span className="text-xs font-black text-white">{participants.length}</span>
                                            </div>
                                            <div className="h-px bg-white/5 w-full"></div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-black text-primary uppercase tracking-widest">Total Amount</span>
                                                <span className="text-2xl font-black text-white">LKR {totalPrice.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'flat', variables: { colorPrimary: '#ffffff' } } }}>
                                        <PaymentForm
                                            clientSecret={clientSecret}
                                            onSuccess={(id) => handleFinalRegistration(id)}
                                            onCancel={() => setStep(1)}
                                        />
                                    </Elements>
                                </motion.div>
                            )}

                            {/* STEP 3: SUCCESS */}
                            {step === 3 && (
                                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
                                    <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center text-5xl text-white mx-auto mb-8 shadow-2xl shadow-green-500/40 animate-vibe-float">
                                        <i className="fa-solid fa-check-double"></i>
                                    </div>
                                    <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-4">Universe Synced!</h2>
                                    <p className="text-muted-foreground font-black text-xs uppercase tracking-widest mb-12 max-w-sm mx-auto leading-relaxed">Bulk registration successful. Confirmation and workshop links have been sent.</p>

                                    <div className="flex gap-4 justify-center">
                                        <button onClick={() => router.push('/profile')} className="btn-vibe-primary px-12 py-5 !rounded-2xl">My Board</button>
                                        <button onClick={() => router.push('/workshops')} className="px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5">Discover More</button>
                                    </div>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

const FormInput = ({ label, value, onChange, placeholder, icon }: { label: string, value: string, onChange: (v: string) => void, placeholder: string, icon: string }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">{label}</label>
        <div className="relative group">
            <i className={`fa-solid ${icon} absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors`}></i>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-2xl outline-none focus:border-primary/50 text-white font-bold text-sm transition-all focus:bg-black/40 shadow-inner"
                placeholder={placeholder}
            />
        </div>
    </div>
);
