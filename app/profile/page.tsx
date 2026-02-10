"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/firebase/firebaseConfig";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// MVC Controllers & Models
import { UserController } from "@/app/controllers/UserController";
import { RegistrationController } from "@/app/controllers/RegistrationController";
import { RefundController } from "@/app/controllers/RefundController";
import { Registration } from "@/app/models/Registration";
import { Workshop } from "@/app/models/Workshop";

// Components
import { ProfileEditForm } from "@/app/components/profile/ProfileEditForm";
import { RegistrationsList } from "@/app/components/profile/RegistrationsList";
import { FavoritesList } from "@/app/components/profile/FavoritesList";
import { ReviewModal } from "@/app/components/profile/ReviewModal";
import { ReportModal } from "@/app/components/profile/ReportModal";

export default function ProfilePage() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    // UI State
    const [activeTab, setActiveTab] = useState<'registrations' | 'favorites' | 'requests'>('registrations');
    const [isEditing, setIsEditing] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Data State
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [favorites, setFavorites] = useState<Workshop[]>([]);
    const [userReviews, setUserReviews] = useState<Record<string, any>>({});
    const [reportsMap, setReportsMap] = useState<Record<string, any>>({});
    const [customRequests, setCustomRequests] = useState<any[]>([]);

    // Modals State
    const [selectedWS, setSelectedWS] = useState<Registration | null>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [statusModal, setStatusModal] = useState<{ isOpen: boolean, workshop: Registration | null }>({ isOpen: false, workshop: null });

    // --- Data Management ---

    useEffect(() => {
        if (!loading && !user) router.push("/login?redirect=/profile");
    }, [user, loading, router]);

    // Real-time Listeners
    useEffect(() => {
        if (!user) return;

        // 1. Listen for Registrations
        const q = query(collection(db, "registrations"), where("userId", "==", user.uid));
        const unsubscribeRegs = onSnapshot(q, async (snapshot) => {
            const data = await Promise.all(snapshot.docs.map(async (d) => {
                const reg = d.data();
                const wsDoc = await getDoc(doc(db, "workshops", reg.workshopId));
                let vendorName = "Unknown Vendor";
                let refundUntil = "event day";
                if (wsDoc.exists()) {
                    const wsData = wsDoc.data();
                    refundUntil = wsData.refundUntil || "event day";
                    const vDoc = await getDoc(doc(db, "users", wsData.vendorId));
                    if (vDoc.exists()) vendorName = vDoc.data().businessName || vDoc.data().displayName || "Unknown";
                }
                return {
                    registrationId: d.id,
                    ...reg,
                    workshopTitle: wsDoc.exists() ? wsDoc.data().title : "Unknown Workshop",
                    date: wsDoc.exists() ? wsDoc.data().date : "N/A",
                    workshopPrice: wsDoc.exists() ? wsDoc.data().price : 0,
                    imageUrl: wsDoc.exists() ? wsDoc.data().imageUrl : "",
                    vendorName,
                    refundUntil // Include this property
                } as any as Registration;
            }));
            setRegistrations(data);
            setFetching(false);
        });

        // 2. Listen for Reviews
        const rQ = query(collection(db, "reviews"), where("userId", "==", user.uid));
        const unsubscribeReviews = onSnapshot(rQ, (snap) => {
            const map: Record<string, any> = {};
            snap.docs.forEach(d => map[d.data().workshopId] = { id: d.id, ...d.data() });
            setUserReviews(map);
        });

        // 3. Listen for Reports
        const repQ = query(collection(db, "reports"), where("reporterId", "==", user.uid));
        const unsubscribeReports = onSnapshot(repQ, (snap) => {
            const map: Record<string, any> = {};
            snap.docs.forEach(d => map[d.data().registrationId] = d.data());
            setReportsMap(map);
        });

        // 4. Custom Requests
        UserController.fetchCustomRequests(user.uid).then(setCustomRequests);

        return () => {
            unsubscribeRegs();
            unsubscribeReviews();
            unsubscribeReports();
        };
    }, [user]);

    // Fetch Favorites
    useEffect(() => {
        if (userData?.favorites) {
            UserController.fetchFavorites(userData.favorites).then(setFavorites);
        }
    }, [userData?.favorites]);

    // --- Handlers ---

    const handleToggleFavorite = async (id: string) => {
        if (!user) return;
        const isFav = favorites.some(f => f.id === id);
        await UserController.toggleFavorite(user.uid, id, !isFav);
    };

    const handleRequestRefund = async (reg: Registration, reason: string) => {
        try {
            await RefundController.requestRefund(reg.registrationId!, reason);
            alert("Refund requested successfully.");
            setStatusModal({ isOpen: false, workshop: null });
        } catch (e: any) {
            alert(e.message);
        }
    };

    if (loading || (fetching && !isEditing)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!userData) return null;

    return (
        <div className="min-h-screen bg-black pt-32 pb-20 px-6">
            <div className="max-w-7xl mx-auto">

                {/* Profile Header */}
                <div className="glass-card !p-12 mb-12 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>

                    <div className="w-40 h-40 rounded-[3rem] overflow-hidden border-2 border-primary/20 bg-white/5 relative shadow-2xl">
                        {userData.photoURL ? (
                            <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl text-muted-foreground font-black">
                                {userData.displayName?.[0] || "?"}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left z-10">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">{userData.displayName}</h1>
                            <span className="px-4 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mx-auto md:mx-0">
                                {userData.role}
                            </span>
                        </div>
                        <p className="text-muted-foreground font-medium mb-8 max-w-lg">{userData.email}</p>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="px-8 py-3 bg-white text-black hover:bg-white/90 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-white/5"
                            >
                                {isEditing ? "View Profile" : "Edit Profile"}
                            </button>
                            {userData.role === 'vendor' && (
                                <button onClick={() => router.push('/vendor')} className="px-8 py-3 bg-white/5 text-white hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">
                                    Vendor Dashboard
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {isEditing ? (
                        <motion.div key="edit" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <div className="max-w-3xl mx-auto glass-card !p-12">
                                <ProfileEditForm userData={userData as any} onSuccess={() => setIsEditing(false)} onCancel={() => setIsEditing(false)} />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            {/* Tabs */}
                            <div className="flex gap-4 mb-12 overflow-x-auto pb-4 scrollbar-hide">
                                {[
                                    { id: 'registrations', label: 'My Workshops', icon: 'fa-ticket' },
                                    { id: 'favorites', label: 'Favorites', icon: 'fa-heart' },
                                    { id: 'requests', label: 'Inquiries', icon: 'fa-paper-plane' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`px-8 py-4 rounded-full flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20' : 'bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10'}`}
                                    >
                                        <i className={`fa-solid ${tab.icon}`}></i>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="animate-in fade-in duration-700">
                                {activeTab === 'registrations' && (
                                    <RegistrationsList
                                        registrations={registrations}
                                        onOpenReview={(reg) => { setSelectedWS(reg); setIsReviewOpen(true); }}
                                        onOpenRefund={(reg) => setStatusModal({ isOpen: true, workshop: reg })}
                                        onReport={(reg) => { setSelectedWS(reg); setIsReportOpen(true); }}
                                        userReviews={userReviews}
                                        reportsMap={reportsMap}
                                    />
                                )}
                                {activeTab === 'favorites' && (
                                    <FavoritesList
                                        favorites={favorites}
                                        onToggleFavorite={handleToggleFavorite}
                                    />
                                )}
                                {activeTab === 'requests' && (
                                    <div className="max-w-4xl mx-auto space-y-4">
                                        {customRequests.map(req => (
                                            <div key={req.id} className="glass-card flex justify-between items-center p-6">
                                                <div>
                                                    <h4 className="text-white font-black uppercase tracking-tight">{req.topic}</h4>
                                                    <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Budget: Rs. {req.budget}</p>
                                                </div>
                                                <span className="px-4 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase text-white">
                                                    {req.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <ReviewModal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                registration={selectedWS}
                userId={user?.uid || ""}
                existingReview={selectedWS ? userReviews[selectedWS.workshopId!] : null}
            />

            <ReportModal
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                registration={selectedWS}
                userId={user?.uid || ""}
                userName={userData.displayName || ""}
                userEmail={userData.email || ""}
            />

            {statusModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-[#121212] w-full max-w-md rounded-[2.5rem] border border-white/10 p-12 shadow-3xl">
                        <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Policy</h3>
                        <p className="text-sm text-muted-foreground mb-10 leading-relaxed">
                            Refunds are valid until <span className="text-white font-bold">{statusModal.workshop?.refundUntil || "event day"}</span>.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setStatusModal({ isOpen: false, workshop: null })} className="flex-1 py-4 text-xs font-bold text-muted-foreground">Close</button>
                            <button
                                onClick={() => {
                                    const reason = prompt("Reason for refund:");
                                    if (reason) handleRequestRefund(statusModal.workshop!, reason);
                                }}
                                className="flex-2 px-10 py-5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl"
                            >
                                Request Refund
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
