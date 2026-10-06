"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, QuerySnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { useAuth } from "@/app/context/AuthContext";
import { registerForWorkshop } from "@/firebase/workshopActions";
import { Workshop } from "@/app/models/Workshop";
import { getWorkshopImage } from "@/app/utils/workshopUtils";

// Stripe Imports
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { PremiumModal } from "@/app/components/ui/PremiumModal";
import { DigitalConsentForm } from "@/app/components/ui/DigitalConsentForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// --- Types ---
interface ParticipantDetails {
    fullName: string;
    age: string;
    phone: string;
    address: string;
    consentFile?: File | null;
    consentUrl?: string; // For digital consent
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
        } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
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
    const [reviews, setReviews] = useState<any[]>([]);
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "success" | "error" | "info" | "warning";
        actionLabel?: string;
        onAction?: () => void;
    }>({
        isOpen: false,
        title: "",
        message: "",
        type: "info"
    });

    const refundPolicy = "Full refund if cancelled at least 24 hours before the workshop starts. Cancellations made within 24 hours of the event are non-refundable.";

    // Listen to Reviews for this workshop
    useEffect(() => {
        if (!id) return;

        const q = query(collection(db, "reviews"), where("workshopId", "==", id));
        const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReviews(list.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
        });

        return () => unsubscribe();
    }, [id]);

    const showModal = (title: string, message: string, type: "success" | "error" | "info" | "warning" = "info", actionLabel?: string, onAction?: () => void) => {
        setModalConfig({ isOpen: true, title, message, type, actionLabel, onAction });
    };

    const [participants, setParticipants] = useState<ParticipantDetails[]>([{
        fullName: "",
        age: "",
        phone: "",
        address: "",
        consentFile: null,
        consentUrl: ""
    }]);
    const [activeParticipantIndex, setActiveParticipantIndex] = useState(0);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [showConsentForm, setShowConsentForm] = useState(false);
    const [consentParticipantIndex, setConsentParticipantIndex] = useState<number | null>(null);

    const validateParticipant = (p: ParticipantDetails) => {
        const errors: Record<string, string> = {};
        if (!p.fullName || p.fullName.trim().length < 3) errors.fullName = "Name must be at least 3 characters";
        if (!p.age || isNaN(Number(p.age)) || Number(p.age) < 1 || Number(p.age) > 120) errors.age = "Valid age (1-120) required";
        if (!p.phone || !/^(0|94|\+94)?[0-9]{9}$/.test(p.phone)) errors.phone = "Valid 10-digit number required";
        if (!p.address || p.address.trim().length < 5) errors.address = "Address must be at least 5 characters";
        return errors;
    };

    const totalPrice = (workshop?.price || 0) * participants.length;

    useEffect(() => {
        const fetchWorkshop = async () => {
            if (!id || !user) return;
            try {
                const docRef = doc(db, "workshops", id as string);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const workshopData = { id: docSnap.id, ...docSnap.data() } as Workshop;
                    setWorkshop(workshopData);

                    // Check if user is a vendor
                    if (userData?.role === 'vendor') {
                        showModal(
                            "Access Restricted",
                            "Vendors cannot register for workshops. Please use a participant account to continue.",
                            "warning",
                            "Go to Dashboard",
                            () => router.push("/vendor")
                        );
                        return;
                    }

                    // Check if frozen
                    if (workshopData.isFrozen) {
                        showModal(
                            "Access Restricted",
                            "Registration for this workshop is currently closed.",
                            "info",
                            "Browse Workshops",
                            () => router.push("/workshops")
                        );
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
                            showModal(
                                "Already In The Vibe",
                                "You're already registered for this workshop! We've secured your spot in the universe.",
                                "info",
                                "View My Board",
                                () => router.push("/profile")
                            );
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
    }, [id, router, userData, user]);

    const addParticipant = () => {
        const currentP = participants[activeParticipantIndex];
        const errors = validateParticipant(currentP);
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        setValidationErrors({});
        const nextIndex = participants.length;
        setParticipants([...participants, {
            fullName: "",
            age: "",
            phone: "",
            address: "",
            consentFile: null,
        }]);
        setActiveParticipantIndex(nextIndex);
    };

    const removeParticipant = (index: number) => {
        if (participants.length > 1) {
            const newParticipants = participants.filter((_, i) => i !== index);
            setParticipants(newParticipants);
            if (activeParticipantIndex >= newParticipants.length) {
                setActiveParticipantIndex(newParticipants.length - 1);
            }
        }
    };

    const updateParticipant = (index: number, field: keyof ParticipantDetails, value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const newParticipants = [...participants];
        newParticipants[index] = { ...newParticipants[index], [field]: value };
        setParticipants(newParticipants);

        if (validationErrors[field]) {
            const newErrors = { ...validationErrors };
            delete newErrors[field];
            setValidationErrors(newErrors);
        }
    };

    const handleDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorDisplay("");

        // Validate all participants
        for (let i = 0; i < participants.length; i++) {
            const errors = validateParticipant(participants[i]);
            if (Object.keys(errors).length > 0) {
                setActiveParticipantIndex(i);
                setValidationErrors(errors);
                setErrorDisplay(`Details for Participant #${i + 1} are incomplete.`);
                return;
            }
        }

        if (totalPrice > 0) {
            try {
                setRegistering(true);
                const res = await fetch("/api/create-payment-intent", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount: totalPrice, workshopId: workshop?.id, workshopTitle: workshop?.title }),
                });
                const data = await res.json();
                if (data.clientSecret) {
                    setClientSecret(data.clientSecret);
                    setStep(2);
                } else {
                    setErrorDisplay("Failed to initialize payment.");
                }
            } catch (err) {
                console.error("Payment init error", err);
                setErrorDisplay("Connection error. Please try again.");
            } finally {
                setRegistering(false);
            }
        } else {
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
                user.email || "",
                workshop.vendorId,
                paymentIntentId,
                participants
            );
            await refreshUserData();
            setStep(3);
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
                <div className="flex-1 glass-morphism rounded-[2.5rem] overflow-y-auto max-h-[85vh] sticky top-32 custom-scrollbar space-y-8 pb-10">
                    {/* Workshop Image */}
                    <div className="relative h-[400px] w-full shrink-0">
                        <Image
                            src={getWorkshopImage(workshop)}
                            alt={workshop.title}
                            fill
                            className="object-cover transition-transform duration-1000 group-hover:scale-105"
                            priority
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
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

                    {/* Additional Content: Refund Policy & Reviews */}
                    <div className="px-10 space-y-10">
                        {/* Refund Policy */}
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-3">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                <i className="fa-solid fa-shield-halved"></i> Refund Policy
                            </h4>
                            <p className="text-[11px] text-white/50 font-medium leading-relaxed italic">{refundPolicy}</p>
                        </div>

                        {/* Recent Reviews Summary */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                <i className="fa-solid fa-star"></i> Student Experiences
                            </h4>
                            {reviews.length === 0 ? (
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-center py-6 border border-dashed border-white/5 rounded-2xl">No stories shared yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.slice(0, 3).map((r, i) => (
                                        <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[8px] font-black text-white uppercase">{r.userName?.[0] || "?"}</div>
                                                    <span className="text-[10px] font-black text-white uppercase tracking-tight">{r.userName}</span>
                                                </div>
                                                <div className="flex text-amber-500 text-[6px] gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <i key={i} className={`fa-solid fa-star ${i < r.rating ? 'opacity-100' : 'opacity-20'}`}></i>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-white/50 italic line-clamp-2">&quot;{r.comment}&quot;</p>
                                        </div>
                                    ))}
                                    {reviews.length > 3 && (
                                        <p className="text-center text-[8px] font-black text-muted-foreground uppercase tracking-widest pt-2">+{reviews.length - 3} more experiences</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Form Wizard */}
                <div className="flex-[1.5] glass-morphism rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
                    <div className="relative z-10">

                        {/* STEP 1: DETAILS */}
                        {step === 1 && (
                            <div>
                                <div className="flex flex-col gap-8 mb-8">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Booking Details</h2>
                                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">Add guests for this session</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addParticipant}
                                            className="px-5 py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group"
                                        >
                                            <i className="fa-solid fa-plus group-hover:rotate-90 transition-transform"></i> Add Person
                                        </button>
                                    </div>

                                    {/* Participant Tabs */}
                                    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                                        {participants.map((_, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    const errors = validateParticipant(participants[activeParticipantIndex]);
                                                    if (Object.keys(errors).length === 0 || idx < activeParticipantIndex) {
                                                        setActiveParticipantIndex(idx);
                                                        setValidationErrors({});
                                                    } else {
                                                        setValidationErrors(errors);
                                                    }
                                                }}
                                                className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 border ${activeParticipantIndex === idx
                                                    ? 'bg-primary text-white shadow-xl shadow-primary/20 border-primary'
                                                    : 'bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10'
                                                    }`}
                                            >
                                                Guest #{idx + 1}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <form onSubmit={handleDetailsSubmit} className="space-y-6">
                                    <div
                                        key={activeParticipantIndex}
                                        className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-6 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                                            <i className="fa-solid fa-user-plus text-8xl"></i>
                                        </div>

                                        <div className="flex justify-between items-center relative z-10">
                                            <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                                <i className="fa-solid fa-id-card"></i> Guest Details
                                            </span>
                                            {participants.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeParticipant(activeParticipantIndex)}
                                                    className="text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5"
                                                >
                                                    <i className="fa-solid fa-trash-can"></i> Remove
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-4 relative z-10">
                                            <FormInput
                                                label="Full Name"
                                                value={participants[activeParticipantIndex].fullName}
                                                onChange={(val) => updateParticipant(activeParticipantIndex, 'fullName', val)}
                                                placeholder="Ex: John Doe"
                                                icon="fa-user"
                                                error={validationErrors.fullName}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormInput
                                                    label="Age"
                                                    value={participants[activeParticipantIndex].age}
                                                    onChange={(val) => updateParticipant(activeParticipantIndex, 'age', val)}
                                                    placeholder="Ex: 24"
                                                    icon="fa-cake-candles"
                                                    type="tel"
                                                    maxLength={3}
                                                    error={validationErrors.age}
                                                />
                                                <FormInput
                                                    label="Phone"
                                                    value={participants[activeParticipantIndex].phone}
                                                    onChange={(val) => updateParticipant(activeParticipantIndex, 'phone', val)}
                                                    placeholder="0771234567"
                                                    icon="fa-phone"
                                                    type="tel"
                                                    maxLength={10}
                                                    error={validationErrors.phone}
                                                />
                                            </div>
                                            <FormInput
                                                label="City / Address"
                                                value={participants[activeParticipantIndex].address}
                                                onChange={(val) => updateParticipant(activeParticipantIndex, 'address', val)}
                                                placeholder="Ex: Colombo 7"
                                                icon="fa-map-pin"
                                                error={validationErrors.address}
                                            />

                                            {workshop && ((participants[activeParticipantIndex].age && parseInt(participants[activeParticipantIndex].age) < 18) || workshop.consentRequired) && (
                                                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                                    <label className="text-[9px] font-black uppercase text-amber-500 tracking-widest block mb-4 flex items-center gap-2">
                                                        <i className="fa-solid fa-circle-exclamation"></i>
                                                        Parental Consent Required
                                                    </label>

                                                    {participants[activeParticipantIndex].consentUrl ? (
                                                        <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                                            <div className="flex items-center gap-3">
                                                                <i className="fa-solid fa-check-circle text-emerald-500 text-xl"></i>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Consent Form Signed</p>
                                                                    <p className="text-[8px] text-emerald-500/70 mt-0.5">Digital consent has been recorded</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setConsentParticipantIndex(activeParticipantIndex);
                                                                    setShowConsentForm(true);
                                                                }}
                                                                className="text-[8px] font-bold text-emerald-500 hover:text-emerald-400 underline"
                                                            >
                                                                Re-sign
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setConsentParticipantIndex(activeParticipantIndex);
                                                                setShowConsentForm(true);
                                                            }}
                                                            className="w-full py-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border-2 border-amber-500/30 hover:border-amber-500/50 text-amber-500 font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 group"
                                                        >
                                                            <i className="fa-solid fa-file-signature text-lg group-hover:scale-110 transition-transform"></i>
                                                            Sign Digital Consent Form
                                                        </button>
                                                    )}

                                                    <p className="text-[8px] text-amber-500/60 mt-3 text-center italic">
                                                        Parent/Guardian must complete and sign the consent form
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {errorDisplay && (
                                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] rounded-xl font-black uppercase tracking-widest text-center">
                                            <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                                            {errorDisplay}
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-4 mt-6">
                                        <div className="flex justify-between items-center px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Payment</span>
                                                <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest">({participants.length} Participant{participants.length > 1 ? 's' : ''})</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black text-muted-foreground mr-2">LKR</span>
                                                <span className="text-2xl font-black text-white tracking-tighter">{totalPrice.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <button
                                            disabled={registering}
                                            className="w-full py-5 bg-primary text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] hover:bg-primary/90 transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 group"
                                        >
                                            {registering ? (<i className="fa-solid fa-circle-notch animate-spin"></i>) : (
                                                <>
                                                    {totalPrice > 0 ? "Proceed to Checkout" : "Confirm Booking"}
                                                    <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* STEP 2: PAYMENT */}
                        {step === 2 && clientSecret && (
                            <div>
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
                            </div>
                        )}

                        {/* STEP 3: SUCCESS */}
                        {step === 3 && (
                            <div className="text-center py-20">
                                <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center text-5xl text-white mx-auto mb-8 shadow-2xl shadow-emerald-500/40 animate-vibe-float">
                                    <i className="fa-solid fa-check-double"></i>
                                </div>
                                <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-4">You're In!</h2>
                                <p className="text-muted-foreground font-black text-xs uppercase tracking-widest mb-12 max-w-sm mx-auto leading-relaxed">
                                    You have successfully secured a spot! Registration complete. Confirmation and details have been sent.
                                </p>

                                <div className="flex gap-4 justify-center">
                                    <button onClick={() => router.push('/profile')} className="btn-vibe-primary px-12 py-5 !rounded-2xl">View My Board</button>
                                    <button onClick={() => router.push('/workshops')} className="px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5">Explore More</button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            <PremiumModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                actionLabel={modalConfig.actionLabel}
                onAction={modalConfig.onAction}
            />

            {/* Digital Consent Form Modal */}
            {showConsentForm && consentParticipantIndex !== null && workshop && (
                <DigitalConsentForm
                    participantName={participants[consentParticipantIndex].fullName}
                    participantAge={participants[consentParticipantIndex].age}
                    workshopTitle={workshop.title}
                    workshopDate={workshop.date}
                    onConsentSigned={(consentUrl) => {
                        updateParticipant(consentParticipantIndex, 'consentUrl', consentUrl);
                        setShowConsentForm(false);
                        setConsentParticipantIndex(null);
                    }}
                    onCancel={() => {
                        setShowConsentForm(false);
                        setConsentParticipantIndex(null);
                    }}
                />
            )}
        </div >
    );
}

const FormInput = ({ label, value, onChange, placeholder, icon, type = "text", maxLength, error }: { label: string, value: string, onChange: (v: string) => void, placeholder: string, icon: string, type?: string, maxLength?: number, error?: string }) => (
    <div className="space-y-1.5 transition-all">
        <div className="flex justify-between items-center ml-1">
            <label className={`text-[9px] font-black uppercase tracking-[0.2em] ${error ? 'text-red-400' : 'text-muted-foreground'}`}>{label}</label>
            {error && <span className="text-[8px] font-bold text-red-500/80 uppercase tracking-tighter animate-pulse">{error}</span>}
        </div>
        <div className="relative group">
            <i className={`fa-solid ${icon} absolute left-4 top-1/2 -translate-y-1/2 text-[10px] ${error ? 'text-red-400/60' : 'text-muted-foreground group-focus-within:text-primary'} transition-colors`}></i>
            <input
                value={value}
                type={type}
                maxLength={maxLength}
                inputMode={type === "tel" ? "numeric" : undefined}
                onChange={(e) => {
                    const val = e.target.value;
                    if (type === "tel") {
                        if (/^\d*$/.test(val)) onChange(val);
                    } else {
                        onChange(val);
                    }
                }}
                className={`w-full pl-11 pr-4 py-3.5 bg-black/20 border ${error ? 'border-red-500/30' : 'border-white/10'} rounded-xl outline-none focus:border-primary/50 text-white font-bold text-xs transition-all focus:bg-black/40 shadow-inner`}
                placeholder={placeholder}
            />
        </div>
    </div>
);
