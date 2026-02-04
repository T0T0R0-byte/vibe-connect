"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, updateDoc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebase/firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { requestRefund } from "@/firebase/workshopActions";
import { reportVendor } from "@/firebase/reportActions";
import { getWorkshopImage } from "@/app/utils/workshopUtils";
import { PremiumModal } from "@/app/components/ui/PremiumModal";

// --- Types ---

interface Workshop {
    id: string;
    title: string;
    description: string;
    category: string;
    imageUrl: string;
    imageBase64?: string;
    date: string;
    location: string;
    ageGroup: string;
    rating?: number;
    vendorId: string;
    whatsappLink?: string;
    price?: number;
    refundUntil?: string;
}

interface RegisteredWorkshop extends Workshop {
    vendorName: string;
    vendorPhone: string;
    status: string;
    registrationId: string; // Changed to required as it's our key
    participantName?: string;
    participantPhone?: string;
    participantEmail?: string;
    participantAge?: string;
    participantAddress?: string;
    ratingCount?: number;
    refundId?: string;
    rejectionReason?: string;
}

interface CustomRequest {
    id: string;
    topic: string;
    budget: string;
    status: string;
    createdAt: { seconds: number };
    pdfUrl?: string;
    vendorId: string;
}

interface Report {
    id: string;
    registrationId: string;
    reason: string;
    status: string;
    details: string;
    createdAt: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    vendorResponse?: string;
}

// ... (rest of code) ...



// --- Icons & UI Components ---

const TabButton = ({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: string }) => (
    <button
        onClick={onClick}
        className={`relative px-6 py-3 rounded-full flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${active ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
    >
        {active && (
            <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white/10 rounded-full border border-white/10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
        )}
        <i className={`fa-solid ${icon} ${active ? 'text-primary' : ''}`}></i>
        <span className="relative z-10">{label}</span>
    </button>
);

const EditInput = ({ label, value, onChange, placeholder, disabled }: { label: string; value: string; onChange?: (v: string) => void; placeholder?: string; disabled?: boolean }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em]">{label}</label>
        {disabled ? (
            <div className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-muted-foreground font-medium text-sm cursor-not-allowed">
                {value}
            </div>
        ) : (
            <input
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl outline-none focus:border-primary/50 text-white font-medium text-sm transition-all focus:bg-black/40"
                placeholder={placeholder}
            />
        )}
    </div>
);

// --- Main Component ---

function ProfileContent() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const reviewId = searchParams.get('reviewId');

    // Profile State
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [socialLink, setSocialLink] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
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

    const showModal = (title: string, message: string, type: "success" | "error" | "info" | "warning" = "info", actionLabel?: string, onAction?: () => void) => {
        setModalConfig({ isOpen: true, title, message, type, actionLabel, onAction });
    };

    // Data State
    const [activeTab, setActiveTab] = useState<'registrations' | 'favorites' | 'requests'>('registrations');
    const [favorites, setFavorites] = useState<Workshop[]>([]);
    const [registeredWorkshops, setRegisteredWorkshops] = useState<RegisteredWorkshop[]>([]);
    const [customRequests, setCustomRequests] = useState<CustomRequest[]>([]);
    const [reportsMap, setReportsMap] = useState<Record<string, Report>>({});
    const [fetching, setFetching] = useState(true);

    // Review State
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedWorkshopForReview, setSelectedWorkshopForReview] = useState<RegisteredWorkshop | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [userReviews, setUserReviews] = useState<Record<string, any>>({}); // Cached user reviews

    // --- Effects ---

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        } else if (userData) {
            setName(userData.displayName || "");
            setPhone(userData.phoneNumber || "");
            setSocialLink(userData.socialLink || "");
            setBusinessName(userData.businessName || "");
            setPhotoPreview(userData.photoURL || "");

            if (userData.role !== 'vendor') {
                loadAllData();
            } else {
                setFetching(false);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, userData, loading, router]);

    useEffect(() => {
        if (reviewId && registeredWorkshops.length > 0) {
            const workshopToReview = registeredWorkshops.find(ws => ws.id === reviewId);
            if (workshopToReview) {
                openReviewModal(workshopToReview);
                router.replace('/profile');
            }
        }
    }, [reviewId, registeredWorkshops, router]);

    // --- Data Fetching ---

    const loadAllData = async () => {
        setFetching(true);
        await Promise.all([fetchFavorites(), fetchCustomRequests()]); // Removed fetchRegisteredWorkshops from manual load
        setFetching(false);
    };

    const fetchFavorites = async () => {
        if (!userData?.favorites || userData.favorites.length === 0) {
            setFavorites([]);
            return;
        }
        try {
            const promises = userData.favorites.map(favId => getDoc(doc(db, "workshops", favId)));
            const snapshots = await Promise.all(promises);
            const favs = snapshots.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() } as Workshop));
            setFavorites(favs);
        } catch (e) {
            console.error("Error fetching favorites", e);
        }
    };

    // fetchRegisteredWorkshops removed as it is now a real-time listener effect

    const fetchCustomRequests = async () => {
        if (!user) return;
        try {
            const q = query(collection(db, "custom_requests"), where("userId", "==", user.uid));
            const snap = await getDocs(q);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setCustomRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
        } catch (e) {
            console.error("Error fetching custom requests", e);
        }
    };

    // --- Actions ---

    // Real-time listener for Registered Workshops & Reviews
    useEffect(() => {
        if (!user) return;

        // 1. Listen for user reviews to enable "Edit" mode and pre-fill
        const reviewsQuery = query(collection(db, "reviews"), where("userId", "==", user.uid));
        const unsubscribeReviews = onSnapshot(reviewsQuery, (snap) => {
            const rMap: Record<string, any> = {};
            snap.docs.forEach(d => {
                const data = d.data();
                rMap[data.workshopId] = { id: d.id, ...data };
            });
            setUserReviews(rMap);
        });

        // 2. Listen for all registrations for this user
        const q = query(collection(db, "registrations"), where("userId", "==", user.uid));

        const unsubscribeRegs = onSnapshot(q, async (snapshot) => {
            const regs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // Optimization: Fetch all data concurrently
            const results = await Promise.all(regs.map(async (reg: any) => {
                const wsDoc = await getDoc(doc(db, "workshops", reg.workshopId));
                if (!wsDoc.exists()) return null;

                const wsData = wsDoc.data() as Workshop;
                let vendorName = "Unknown";
                let vendorPhone = "";

                if (wsData.vendorId) {
                    const vDoc = await getDoc(doc(db, "users", wsData.vendorId));
                    if (vDoc.exists()) {
                        vendorName = vDoc.data().businessName || vDoc.data().displayName || "Unknown Vendor";
                        vendorPhone = vDoc.data().phoneNumber || "";
                    }
                }

                return {
                    ...wsData,
                    id: wsDoc.id,
                    vendorName,
                    vendorPhone,
                    status: reg.status,
                    registrationId: reg.id,
                    participantName: reg.participantDetails?.fullName || "Guest",
                    participantPhone: reg.participantDetails?.phone || "",
                    participantEmail: reg.userEmail || "",
                    participantAge: reg.participantDetails?.age || "",

                    participantAddress: reg.participantDetails?.address || "",
                    refundId: reg.refundId,
                    rejectionReason: reg.rejectionReason
                } as RegisteredWorkshop;
            }));

            setRegisteredWorkshops(results.filter((w): w is RegisteredWorkshop => w !== null));
        });

        return () => {
            unsubscribeReviews();
            unsubscribeRegs();
        };
    }, [user]);

    // Real-time listener for Reports
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "reports"), where("reporterId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const map: Record<string, Report> = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data() as Omit<Report, 'id'>;
                map[data.registrationId] = { id: doc.id, ...data };
            });
            setReportsMap(map);
        });
        return () => unsubscribe();
    }, [user]);

    const handleSaveProfile = async () => {
        if (!user) return;
        setSaving(true);
        try {
            let photoURL = photoPreview;
            if (photo) {
                const storageRef = ref(storage, `profile_photos/${user.uid}`);
                await uploadBytes(storageRef, photo);
                photoURL = await getDownloadURL(storageRef);
            }

            await updateProfile(user, { displayName: name, photoURL });
            await updateDoc(doc(db, "users", user.uid), {
                displayName: name,
                phoneNumber: phone,
                photoURL,
                ...(userData?.role === 'vendor' && { socialLink, businessName })
            });

            setIsEditing(false);
            window.location.reload();
        } catch (error) {
            console.error(error);
            showModal("Update Failed", "We couldn't update your profile. Please check your connection and try again.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!selectedWorkshopForReview || !user) return;
        try {
            const existingReview = userReviews[selectedWorkshopForReview.id];
            const reviewId = existingReview ? existingReview.id : `${user.uid}_${selectedWorkshopForReview.id}`;

            // 1. Set Review Doc
            const reviewRef = doc(db, "reviews", reviewId);
            await setDoc(reviewRef, {
                workshopId: selectedWorkshopForReview.id,
                userId: user.uid,
                userName: userData?.displayName || "Verified User",
                rating: reviewRating,
                comment: reviewComment,
                updatedAt: serverTimestamp(),
                createdAt: existingReview?.createdAt || serverTimestamp()
            }, { merge: true });

            // 2. Update Workshop Rating
            const wsRef = doc(db, "workshops", selectedWorkshopForReview.id);
            const wsSnap = await getDoc(wsRef);
            if (wsSnap.exists()) {
                const wsData = wsSnap.data();
                const currentCount = wsData.ratingCount || 0;
                const currentRating = wsData.rating || 5;

                let newCount = currentCount;
                let newAverage = currentRating;

                if (existingReview) {
                    // Updating: (TotalSum - oldRating + newRating) / count
                    newAverage = ((currentRating * currentCount) - existingReview.rating + reviewRating) / currentCount;
                } else {
                    // New: (TotalSum + newRating) / (count + 1)
                    newCount = currentCount + 1;
                    newAverage = ((currentRating * currentCount) + reviewRating) / newCount;
                }

                await updateDoc(wsRef, {
                    rating: Number(newAverage.toFixed(1)),
                    ratingCount: newCount
                });

                // 3. Update Vendor Rating
                if (selectedWorkshopForReview.vendorId) {
                    const vendorId = selectedWorkshopForReview.vendorId;
                    // Recalculate vendor average from all their workshops or reviews?
                    // Requirement: "Vendor’s Avg. Rating must recalculate instantly" based on "Total Stars / Total Reviews"
                    // Best way: Query all REVIEWS where workshopId belongs to this vendor? No, reviews have workshopId.
                    // Easier: Aggregate from WORKSHOPS. Vendor Rating = Avg of Workshop Ratings?
                    // OR: Aggregate ALL reviews for vendor's workshops.
                    // Given the prompt: "Avg Rating = (Total Stars / Total Reviews)"
                    // I will query ALL reviews for workshops by this vendor.

                    // First find all workshops by this vendor
                    const wsQuery = query(collection(db, "workshops"), where("vendorId", "==", vendorId));
                    const wsSnaps = await getDocs(wsQuery);
                    const vendorWorkshopIds = wsSnaps.docs.map(d => d.id);

                    if (vendorWorkshopIds.length > 0) {
                        // Find reviews for these workshops
                        // Firestore "in" query limited to 10. If > 10, need multiple queries or loop.
                        // Safe approach: Client side aggregation might be too heavy if many reviews.
                        // Better approach: Update Vendor Doc atomically if we stored totalStars/totalReviews on Vendor.
                        // Assuming we didn't, I will use the Workshop Ratings to average the Vendor Rating (Proxy).
                        // Weighted average: Sum(ws.rating * ws.ratingCount) / Sum(ws.ratingCount)

                        let totalStars = 0;
                        let totalReviews = 0;

                        wsSnaps.docs.forEach(doc => {
                            const d = doc.data();
                            // Use the updated values for the CURRENT workshop
                            if (doc.id === selectedWorkshopForReview.id) {
                                totalStars += newAverage * newCount;
                                totalReviews += newCount;
                            } else {
                                totalStars += (d.rating || 0) * (d.ratingCount || 0);
                                totalReviews += (d.ratingCount || 0);
                            }
                        });

                        const vendorRating = totalReviews > 0 ? (totalStars / totalReviews) : 5;

                        await updateDoc(doc(db, "users", vendorId), {
                            rating: Number(vendorRating.toFixed(1)),
                            ratingCount: totalReviews
                        });
                    }
                }
            }

            setReviewModalOpen(false);
            showModal("Success", existingReview ? "Review updated!" : "Thanks for your feedback!", "success");
        } catch (error) {
            console.error("Review failed", error);
            showModal("Review Failed", "We couldn't post your review right now. Please try again later.", "error");
        }
    };

    const openReviewModal = (ws: RegisteredWorkshop) => {
        const existing = userReviews[ws.id];
        setSelectedWorkshopForReview(ws);
        setReviewRating(existing ? existing.rating : 5);
        setReviewComment(existing ? existing.comment : "");
        setReviewModalOpen(true);
    };

    const [refundModalOpen, setRefundModalOpen] = useState(false);
    const [selectedRegistrationForRefund, setSelectedRegistrationForRefund] = useState<string | null>(null);
    const [refundReason, setRefundReason] = useState("");

    const openRefundModal = (regId: string) => {
        setSelectedRegistrationForRefund(regId);
        setRefundReason("");
        setRefundModalOpen(true);
    };

    const submitRefundRequest = async () => {
        if (!selectedRegistrationForRefund) return;
        if (!refundReason.trim()) {
            showModal("Reason Required", "Please let us know why you're requesting a refund so we can process it correctly.", "warning");
            return;
        }

        try {
            await requestRefund(selectedRegistrationForRefund, refundReason);
            showModal("Refund Requested", "Your request is in the pipeline! We'll notify you as soon as the vendor reviews it.", "success");
            setRefundModalOpen(false);
        } catch (error) {
            console.error("Refund request failed", error);
            showModal("Request Error", error instanceof Error ? error.message : "We couldn't process your refund request. Please try again later.", "error");
        }
    };

    // --- Report Logic ---
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [selectedRegistrationForReport, setSelectedRegistrationForReport] = useState<RegisteredWorkshop | null>(null);
    const [reportReason, setReportReason] = useState("");
    const [reportDetails, setReportDetails] = useState("");

    const openReportModal = (ws: RegisteredWorkshop) => {
        setSelectedRegistrationForReport(ws);
        setReportReason("Refund Delayed");
        setReportDetails("");
        setReportModalOpen(true);
    };

    const submitReport = async () => {
        if (!selectedRegistrationForReport || !user) return;

        try {
            await reportVendor(
                selectedRegistrationForReport.registrationId,
                selectedRegistrationForReport.id,
                selectedRegistrationForReport.title,
                selectedRegistrationForReport.price || 0,
                selectedRegistrationForReport.vendorId,
                user.uid,
                selectedRegistrationForReport.participantName || userData?.displayName || "User",
                selectedRegistrationForReport.participantEmail || user.email || "No Email",
                selectedRegistrationForReport.participantPhone || userData?.phoneNumber || "No Phone",
                reportReason,
                reportDetails
            );

            showModal("Report Submitted", "Thank you for looking out for the community. Our support team will review this shortly.", "success");
            setReportModalOpen(false);
        } catch (error) {
            console.error(error);
            showModal("Submission Error", "We couldn't submit your report. Please try again.", "error");
        }
    };

    // --- Render ---

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-transparent text-foreground relative pb-20 pt-32 px-6">

            {/* 1. Header Section - Glass Card */}
            <div className="max-w-6xl mx-auto mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-[2.5rem] bg-white/[0.03] dark:bg-black/30 backdrop-blur-3xl border border-white/10 overflow-hidden p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center md:items-start"
                >
                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none -z-10" />

                    {/* Avatar */}
                    <div className="relative group shrink-0">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white/5 shadow-2xl relative">
                            <Image
                                src={photoPreview || userData?.photoURL || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
                                alt="Profile"
                                fill
                                className="object-cover"
                            />
                            {isEditing && (
                                <label className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i className="fa-solid fa-camera text-white text-2xl"></i>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            setPhoto(e.target.files[0]);
                                            setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                                        }
                                    }} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 w-full space-y-8">
                        <div className="flex justify-between items-start w-full">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">{userData?.displayName || "Welcome Back"}</h1>
                                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                    <i className="fa-solid fa-envelope"></i> {user?.email}
                                </p>
                            </div>
                            <button
                                onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                                disabled={saving}
                                className={`px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all ${isEditing ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'}`}
                            >
                                {saving ? "Saving..." : isEditing ? "Save Changes" : "Edit Profile"}
                            </button>
                        </div>

                        {/* Editable Fields Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                            <EditInput label="Display Name" value={name} onChange={setName} disabled={!isEditing} />
                            <EditInput label="Phone Number" value={phone} onChange={setPhone} disabled={!isEditing} placeholder="+94 77 123 4567" />
                            {userData?.role === 'vendor' && (
                                <EditInput label="Business Name" value={businessName} onChange={setBusinessName} disabled={!isEditing} />
                            )}
                            {userData?.role === 'vendor' && (
                                <EditInput label="Social Link" value={socialLink} onChange={setSocialLink} disabled={!isEditing} />
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* 2. Content Tabs */}
            {userData?.role !== 'vendor' && (
                <div className="max-w-6xl mx-auto min-h-[500px]">
                    <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-4 no-scrollbar">
                        <TabButton
                            active={activeTab === 'registrations'}
                            onClick={() => setActiveTab('registrations')}
                            label="My Registrations"
                            icon="fa-graduation-cap"
                        />
                        <TabButton
                            active={activeTab === 'favorites'}
                            onClick={() => setActiveTab('favorites')}
                            label="Favorites"
                            icon="fa-heart"
                        />
                        <TabButton
                            active={activeTab === 'requests'}
                            onClick={() => setActiveTab('requests')}
                            label="Custom Requests"
                            icon="fa-wand-magic-sparkles"
                        />
                    </div>

                    {/* Tab Content */}
                    <div className="relative">
                        {fetching ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2, 3].map(n => <div key={n} className="h-40 bg-white/5 rounded-3xl animate-pulse" />)}
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                {activeTab === 'registrations' && (
                                    <motion.div
                                        key="registrations"
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                    >
                                        {registeredWorkshops.length === 0 ? (
                                            <EmptyState icon="fa-ghost" title="No registrations yet" sub="Ready to start learning?" link="/workshops" linkText="Browse Workshops" />
                                        ) : registeredWorkshops.map(ws => {
                                            const existingReport = reportsMap[ws.registrationId];
                                            return (
                                                <div key={ws.registrationId} className="group relative bg-white/[0.03] dark:bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:border-primary/30 transition-all flex gap-6 overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4 opacity-50 text-[100px] leading-none text-white/5 -rotate-12 pointer-events-none group-hover:scale-110 transition-transform">
                                                        <i className="fa-solid fa-ticket"></i>
                                                    </div>

                                                    <div className="flex-1 relative z-10 flex flex-col h-full">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${['confirmed', 'approved', 'paid'].includes(ws.status) ? 'bg-green-500/10 text-green-500' :
                                                                ws.status === 'refunded' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-amber-500/10 text-amber-500'
                                                                }`}>
                                                                {['confirmed', 'approved', 'paid'].includes(ws.status) ? 'PAID' : ws.status}
                                                            </span>
                                                            {ws.refundId && (
                                                                <span className="text-[9px] font-mono text-muted-foreground border border-white/10 px-2 py-1 rounded bg-black/20">
                                                                    {ws.refundId}
                                                                </span>
                                                            )}
                                                            <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                                                <i className="fa-solid fa-user-tie"></i> {ws.vendorName}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{ws.title}</h3>
                                                        <p className="text-xs text-muted-foreground mb-6 flex items-center gap-2">
                                                            <i className="fa-solid fa-calendar"></i> {new Date(ws.date).toLocaleDateString()}
                                                        </p>

                                                        <div className="mt-auto flex items-center gap-3">
                                                            {ws.status !== 'refunded' && ws.status !== 'refund_requested' && (
                                                                <button
                                                                    onClick={() => openReviewModal(ws)}
                                                                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${userReviews[ws.id] ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20' : 'bg-white text-black hover:bg-white/80 shadow-lg shadow-white/10'}`}
                                                                >
                                                                    {userReviews[ws.id] ? 'Edit Review' : 'Write Review'}
                                                                </button>
                                                            )}

                                                            {ws.status === 'confirmed' && (
                                                                (ws.refundUntil && new Date(ws.refundUntil) < new Date()) ? (
                                                                    <span className="px-4 py-2 bg-gray-500/10 text-gray-500 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-gray-500/20 cursor-not-allowed" title="Refund period has ended">
                                                                        Refund Expired
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => openRefundModal(ws.registrationId)}
                                                                        className="px-4 py-2 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                                                                    >
                                                                        Request Refund
                                                                    </button>
                                                                )
                                                            )}
                                                            {ws.status === 'refund_requested' && (
                                                                <div className="flex gap-2 items-center">
                                                                    <span className="px-4 py-2 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-amber-500/20 flex items-center gap-2">
                                                                        <i className="fa-solid fa-clock"></i> Refund Pending
                                                                    </span>
                                                                    {existingReport ? (
                                                                        <span className="px-3 py-1.5 bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-red-500/20">
                                                                            Reported
                                                                        </span>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => openReportModal(ws)}
                                                                            className="px-4 py-2 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                                                            title="Report if vendor is unresponsive"
                                                                        >
                                                                            <i className="fa-solid fa-flag"></i> Report
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {(ws.status === 'rejected' || ws.status === 'refund_rejected') && (
                                                                <div className="flex flex-col gap-2 items-end">
                                                                    {ws.rejectionReason && (
                                                                        <span className="text-[9px] text-red-400 italic font-medium px-2 max-w-[150px] text-right">
                                                                            &quot;{ws.rejectionReason}&quot;
                                                                        </span>
                                                                    )}
                                                                    <button
                                                                        onClick={() => openReportModal(ws)}
                                                                        className="px-4 py-2 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                                                    >
                                                                        <i className="fa-solid fa-triangle-exclamation"></i> Report Issue
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {ws.whatsappLink && ws.status !== 'refunded' && (
                                                                <a href={ws.whatsappLink} target="_blank" className="px-4 py-2 bg-[#25D366]/10 text-[#25D366] text-[10px] font-bold uppercase tracking-widest rounded-lg border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-colors">
                                                                    <i className="fa-brands fa-whatsapp"></i> Chat
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                )
                                }

                                {activeTab === 'favorites' && (
                                    <motion.div
                                        key="favorites"
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                        className="grid grid-cols-2 md:grid-cols-4 gap-6"
                                    >
                                        {favorites.length === 0 ? (
                                            <EmptyState icon="fa-heart-crack" title="No favorites saved" sub="Find something you love." link="/workshops" linkText="Explore Vibe" />
                                        ) : favorites.map(ws => (
                                            <Link href={`/register/${ws.id}`} key={ws.id} className="group relative aspect-[4/5] rounded-3xl overflow-hidden bg-background/50 border border-white/5">
                                                <Image src={getWorkshopImage(ws)} alt={ws.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                                <div className="absolute bottom-0 left-0 p-5">
                                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest mb-1 block">{ws.category}</span>
                                                    <h3 className="text-white font-bold text-sm leading-tight">{ws.title}</h3>
                                                </div>
                                            </Link>
                                        ))}
                                    </motion.div>
                                )}

                                {activeTab === 'requests' && (
                                    <motion.div
                                        key="requests"
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                    >
                                        {customRequests.length === 0 ? (
                                            <EmptyState icon="fa-wand-magic" title="No requests found" sub="Have a unique idea?" link="/custom-request" linkText="Create Request" />
                                        ) : customRequests.map(req => (
                                            <div key={req.id} className="p-6 rounded-3xl bg-white/[0.03] dark:bg-black/20 backdrop-blur-xl border border-white/10 flex flex-col justify-between h-48 group hover:border-primary/20 transition-all">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="text-lg font-bold text-white">{req.topic}</h3>
                                                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${req.status === 'accepted' ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-500'}`}>{req.status}</span>
                                                    </div>
                                                    <p className="text-muted-foreground text-xs font-medium">Budget: LKR {req.budget}</p>
                                                </div>
                                                <div className="flex justify-between items-end border-t border-white/5 pt-4">
                                                    <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest">{req.createdAt?.seconds ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                                                    <button className="text-muted-foreground hover:text-white transition-colors text-xs flex items-center gap-2">
                                                        Details <i className="fa-solid fa-arrow-right"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            )
            }

            {/* Refund Request Modal */}
            <AnimatePresence>
                {refundModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setRefundModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="relative w-full max-w-lg bg-[#0F0F0F] border border-white/10 rounded-[2rem] p-10 overflow-hidden shadow-2xl"
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Request Refund</h2>
                                <p className="text-muted-foreground text-sm">We&apos;re sorry to see you go. Please tell us why.</p>
                            </div>

                            <textarea
                                value={refundReason}
                                onChange={e => setRefundReason(e.target.value)}
                                placeholder="E.g., Scheduling conflict, unexpected emergency..."
                                className="w-full h-32 bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all resize-none mb-8"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setRefundModalOpen(false)} className="py-4 rounded-xl bg-white/5 text-muted-foreground font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-colors">Cancel</button>
                                <button onClick={submitRefundRequest} className="py-4 rounded-xl bg-red-500 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">Submit Request</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Review Modal Overlay */}
            <AnimatePresence>
                {reviewModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setReviewModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="relative w-full max-w-lg bg-[#0F0F0F] border border-white/10 rounded-[2rem] p-10 overflow-hidden shadow-2xl"
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Rate Experience</h2>
                                <p className="text-muted-foreground text-sm">How was {selectedWorkshopForReview?.title}?</p>
                            </div>

                            <div className="flex justify-center gap-4 mb-8">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => setReviewRating(star)}
                                        onMouseEnter={() => setReviewRating(star)}
                                        className="text-3xl transition-transform hover:scale-110 active:scale-95"
                                    >
                                        <i className={`fa-solid fa-star ${star <= reviewRating ? 'text-amber-500' : 'text-white/5'}`}></i>
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={reviewComment}
                                onChange={e => setReviewComment(e.target.value)}
                                placeholder="Share your thoughts about the workshop..."
                                className="w-full h-32 bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all resize-none mb-8"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setReviewModalOpen(false)} className="py-4 rounded-xl bg-white/5 text-muted-foreground font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-colors">Cancel</button>
                                <button onClick={handleSubmitReview} className="py-4 rounded-xl bg-white text-black font-bold uppercase text-[10px] tracking-widest hover:bg-primary/20 transition-colors">Submit Review</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Report Modal */}
            <AnimatePresence>
                {reportModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setReportModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="relative w-full max-w-lg bg-[#0F0F0F] border border-white/10 rounded-[2rem] p-10 overflow-hidden shadow-2xl"
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Report Vendor</h2>
                                <p className="text-muted-foreground text-sm">Facing an issue? Let us know.</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <label className="block text-xs font-bold uppercase text-muted-foreground tracking-widest">Reason</label>
                                <select
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-white/20 appearance-none"
                                >
                                    <option value="Refund Delayed">Refunding taking too long</option>
                                    <option value="Unfair Rejection">Refund rejected unfairly</option>
                                    <option value="Unresponsive Vendor">Vendor not responding</option>
                                    <option value="Other">Other</option>
                                </select>

                                <label className="block text-xs font-bold uppercase text-muted-foreground tracking-widest mt-4">Details</label>
                                <textarea
                                    value={reportDetails}
                                    onChange={e => setReportDetails(e.target.value)}
                                    placeholder="Describe the issue..."
                                    className="w-full h-32 bg-white/5 border border-white/5 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setReportModalOpen(false)} className="py-4 rounded-xl bg-white/5 text-muted-foreground font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-colors">Cancel</button>
                                <button onClick={submitReport} className="py-4 rounded-xl bg-red-500 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">Submit Report</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <PremiumModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                actionLabel={modalConfig.actionLabel}
                onAction={modalConfig.onAction}
            />
        </div >
    );
}

const EmptyState = ({ icon, title, sub, link, linkText }: { icon: string; title: string, sub: string, link: string, linkText: string }) => (
    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-50 hover:opacity-100 transition-opacity">
        <i className={`fa-solid ${icon} text-4xl mb-4 text-primary/40`}></i>
        <h3 className="text-xl font-bold text-foreground/80">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{sub}</p>
        <Link href={link} className="px-6 py-2 border border-white/10 rounded-full text-muted-foreground text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
            {linkText}
        </Link>
    </div>
);

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <ProfileContent />
        </Suspense>
    );
}
