"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, updateDoc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebase/firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Workshop {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    imageUrl: string;
    imageBase64?: string;
    date: string;
    location: string;
    ageGroup: string;
    rating?: number;
    vendorId: string;
    refundPolicy?: string;
}

interface RegisteredWorkshop extends Workshop {
    vendorName: string;
    vendorPhone: string;
    status?: string;
    registrationId?: string;
    refundStatus?: string;
    ratingCount?: number;
    refundPolicy?: string;
}

export default function ProfilePage() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const reviewId = searchParams.get('reviewId');

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [socialLink, setSocialLink] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [favorites, setFavorites] = useState<Workshop[]>([]);
    const [registeredWorkshops, setRegisteredWorkshops] = useState<RegisteredWorkshop[]>([]);
    const [customRequests, setCustomRequests] = useState<any[]>([]);


    // Review Modal State
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedWorkshopForReview, setSelectedWorkshopForReview] = useState<RegisteredWorkshop | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");

    // Filters
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");

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
                fetchFavorites();
                fetchRegisteredWorkshops();
                fetchCustomRequests();
            }
        }
    }, [user, userData, loading, router]);

    useEffect(() => {
        if (reviewId && registeredWorkshops.length > 0) {
            const workshopToReview = registeredWorkshops.find(ws => ws.id === reviewId);
            if (workshopToReview) {
                openReviewModal(workshopToReview);
                // Clean up URL
                router.replace('/profile');
            }
        }
    }, [reviewId, registeredWorkshops, router]);

    const fetchFavorites = async () => {
        if (!userData?.favorites || userData.favorites.length === 0) return;
        const favs: Workshop[] = [];
        for (const favId of userData.favorites) {
            const docSnap = await getDoc(doc(db, "workshops", favId));
            if (docSnap.exists()) {
                favs.push({ id: docSnap.id, ...docSnap.data() } as Workshop);
            }
        }
        setFavorites(favs);
    };

    const fetchRegisteredWorkshops = async () => {
        if (!userData?.registeredWorkshops || userData.registeredWorkshops.length === 0) return;
        const registered: RegisteredWorkshop[] = [];
        for (const wsId of userData.registeredWorkshops) {
            const wsDoc = await getDoc(doc(db, "workshops", wsId));
            if (wsDoc.exists()) {
                const wsData = wsDoc.data() as Workshop;
                let vendorName = "Unknown Vendor";
                let vendorPhone = "Not Available";

                if (wsData.vendorId) {
                    const vendorDoc = await getDoc(doc(db, "users", wsData.vendorId));
                    if (vendorDoc.exists()) {
                        vendorName = vendorDoc.data().displayName || "Unknown Vendor";
                        vendorPhone = vendorDoc.data().phoneNumber || "Not Available";
                    }
                }

                let status = "pending";
                let regId = undefined;
                let refStatus = "none";

                const q = query(
                    collection(db, "registrations"),
                    where("workshopId", "==", wsId),
                    where("userId", "==", user?.uid)
                );
                const regSnap = await getDocs(q);
                if (!regSnap.empty) {
                    status = regSnap.docs[0].data().status || "pending";
                    regId = regSnap.docs[0].id;
                    refStatus = regSnap.docs[0].data().refundStatus || "none";
                }

                registered.push({ ...wsData, id: wsDoc.id, vendorName, vendorPhone, status, registrationId: regId, refundStatus: refStatus, refundPolicy: wsData.refundPolicy });
            }
        }
        setRegisteredWorkshops(registered);
    };

    const fetchCustomRequests = async () => {
        if (!user) return;
        const q = query(collection(db, "custom_requests"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        const reqs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomRequests(reqs);
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            let photoURL = photoPreview;
            if (photo) {
                const storageRef = ref(storage, `profile_photos/${user.uid}`);
                await uploadBytes(storageRef, photo);
                photoURL = await getDownloadURL(storageRef);
            }

            await updateProfile(user, { displayName: name, photoURL: photoURL });
            await updateDoc(doc(db, "users", user.uid), {
                displayName: name,
                phoneNumber: phone,
                photoURL: photoURL,
                ...(userData?.role === 'vendor' && { socialLink, businessName })
            });

            setIsEditing(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    const openReviewModal = (ws: RegisteredWorkshop) => {
        setSelectedWorkshopForReview(ws);
        setReviewRating(5);
        setReviewComment("");
        setReviewModalOpen(true);
    };

    const handleSubmitReview = async () => {
        if (!selectedWorkshopForReview || !user) return;
        try {
            await addDoc(collection(db, "reviews"), {
                workshopId: selectedWorkshopForReview.id,
                userId: user.uid,
                userName: userData?.displayName || "Anonymous",
                rating: reviewRating,
                comment: reviewComment,
                createdAt: new Date().toISOString()
            });

            const newCount = (selectedWorkshopForReview.ratingCount || 0) + 1;
            const newRating = ((selectedWorkshopForReview.rating || 0) * (selectedWorkshopForReview.ratingCount || 0) + reviewRating) / newCount;

            await updateDoc(doc(db, "workshops", selectedWorkshopForReview.id), {
                rating: newRating,
                ratingCount: newCount
            });

            setReviewModalOpen(false);
            fetchRegisteredWorkshops();
        } catch (error) {
            console.error(error);
            alert("Failed to submit review.");
        }
    };

    const filteredFavorites = favorites.filter(w =>
        w.title.toLowerCase().includes(search.toLowerCase()) &&
        (categoryFilter === "All" || w.category === categoryFilter)
    );

    if (loading) return <div className="min-h-screen pt-32 text-center text-white font-black uppercase tracking-widest text-xs animate-pulse">Loading Profile...</div>;

    return (
        <div className="min-h-screen bg-background relative overflow-hidden pb-20 pt-28">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] -z-10 rounded-full animate-vibe-float" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] -z-10 rounded-full animate-vibe-float" style={{ animationDelay: '2s' }} />

            <div className="max-w-7xl mx-auto px-6">
                {/* Profile Header Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card shadow-3xl mb-12">
                    <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-start">


                        {/* Info Section */}
                        <div className="flex-grow w-full">
                            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6 mb-10">
                                <div className="text-center md:text-left">
                                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-[0.8] mb-2">
                                        {userData?.displayName || 'Unknown User'}
                                    </h1>
                                    <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">{user?.email}</p>
                                </div>
                                <div className="flex gap-3">
                                    {!isEditing ? (
                                        <button onClick={() => setIsEditing(true)} className="btn-vibe-primary px-8 !py-3 !text-[10px]">
                                            Edit Profile
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                                            <button onClick={handleSave} disabled={saving} className="btn-vibe-primary px-6 !py-3 !text-[10px]">{saving ? "Saving..." : "Save Changes"}</button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Full Name</label>
                                    {isEditing ? (
                                        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl outline-none focus:border-primary transition-all font-bold text-sm text-foreground" placeholder="John Doe" />
                                    ) : (
                                        <p className="px-4 py-3 bg-card border border-border rounded-xl font-bold text-sm text-foreground">{name}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Phone Number</label>
                                    {isEditing ? (
                                        <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl outline-none focus:border-primary transition-all font-bold text-sm text-foreground" placeholder="+91" />
                                    ) : (
                                        <p className="px-4 py-3 bg-card border border-border rounded-xl font-bold text-sm text-foreground">{phone || "Not Set"}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Email Address</label>
                                    <p className="px-4 py-3 bg-card border border-border rounded-xl font-bold text-sm text-foreground opacity-70 cursor-not-allowed" title="Cannot be changed">{user?.email}</p>
                                </div>
                                {userData?.role === 'vendor' && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Social Link</label>
                                        {isEditing ? (
                                            <input value={socialLink} onChange={e => setSocialLink(e.target.value)} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl outline-none focus:border-primary transition-all font-bold text-sm text-foreground" placeholder="https://" />
                                        ) : (
                                            <a href={socialLink} target="_blank" className="px-4 py-3 bg-card border border-border rounded-xl font-bold text-sm text-primary hover:underline block truncate">{socialLink || "Not Set"}</a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Content Tabs / Sections */}
                {userData?.role !== 'vendor' && (
                    <div className="space-y-16">
                        {/* Registrations */}
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <i className="fa-solid fa-ticket text-primary text-xl"></i>
                                <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">My Registrations</h2>
                            </div>

                            {registeredWorkshops.length > 0 ? (
                                <div className="grid lg:grid-cols-2 gap-6">
                                    {registeredWorkshops.map((ws) => (
                                        <div key={ws.id} className="glass-card flex flex-col sm:flex-row gap-6 p-6 group hover:bg-white/5 transition-all duration-500 relative overflow-hidden">
                                            {/* Status Badge */}
                                            <div className="absolute top-4 right-4 z-10">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md shadow-xl ${ws.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    ws.status === 'refunded' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                    }`}>
                                                    {ws.status}
                                                </span>
                                            </div>



                                            <div className="flex-grow min-w-0 flex flex-col justify-between py-1">
                                                <div>
                                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tighter truncate mb-2 group-hover:text-primary transition-colors">{ws.title}</h3>
                                                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                                                        <span className="flex items-center gap-2"><i className="fa-solid fa-calendar text-primary"></i> {new Date(ws.date).toLocaleDateString()}</span>
                                                        <span className="flex items-center gap-2"><i className="fa-solid fa-user-tie text-indigo-500"></i> {ws.vendorName}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3 mt-auto">
                                                    <button onClick={() => openReviewModal(ws)} className="btn-vibe-secondary !text-[9px] !py-2 !px-4 flex items-center gap-2">
                                                        <i className="fa-solid fa-star"></i> Review
                                                    </button>

                                                    {(ws.status === 'paid' || ws.status === 'pending' || ws.status === 'approved') && ws.refundStatus === 'none' && (
                                                        <button onClick={async () => {
                                                            const policy = ws.refundPolicy || "Refunds are done outside the site. Contact vendor directly.";
                                                            if (confirm(`REFUND POLICY:\n${policy}\n\nHave you contacted the vendor and wish to mark this as 'Refund Requested'?`)) {
                                                                const { requestRefund } = await import('@/firebase/refundActions');
                                                                if (ws.registrationId) { await requestRefund(ws.registrationId); fetchRegisteredWorkshops(); }
                                                            }
                                                        }} className="px-4 py-2 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group/refund">
                                                            <i className="fa-solid fa-rotate-left group-hover/refund:-rotate-45 transition-transform"></i>
                                                            Ask for Refund
                                                        </button>
                                                    )}

                                                    {ws.refundStatus === 'refund_requested' && (
                                                        <span className="px-4 py-2 bg-amber-500/5 border border-amber-500/20 text-amber-500 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                                            <i className="fa-solid fa-clock-rotate-left animate-spin-slow"></i>
                                                            Refund Requested
                                                        </span>
                                                    )}

                                                    {ws.refundStatus === 'vendor_proof_uploaded' && (
                                                        <div className="flex flex-col gap-2 items-end">
                                                            <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">Vendor Refunded</span>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={async () => {
                                                                        const { confirmRefundReceipt } = await import('@/firebase/refundActions');
                                                                        if (ws.registrationId) { await confirmRefundReceipt(ws.registrationId, true); fetchRegisteredWorkshops(); }
                                                                    }}
                                                                    className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                                                                >
                                                                    Received
                                                                </button>
                                                                <button
                                                                    onClick={async () => {
                                                                        const { confirmRefundReceipt } = await import('@/firebase/refundActions');
                                                                        if (ws.registrationId) { await confirmRefundReceipt(ws.registrationId, false); fetchRegisteredWorkshops(); }
                                                                    }}
                                                                    className="px-3 py-1 bg-red-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-500/20"
                                                                >
                                                                    Not Received
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {ws.refundStatus === 'participant_confirmed' && (
                                                        <span className="px-4 py-2 bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                                            <i className="fa-solid fa-check-double"></i>
                                                            Confirmed
                                                        </span>
                                                    )}

                                                    {ws.refundStatus === 'participant_disputed' && (
                                                        <span className="px-4 py-2 bg-red-500/5 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                                            <i className="fa-solid fa-triangle-exclamation"></i>
                                                            Disputed
                                                        </span>
                                                    )}

                                                    {ws.status === 'refunded' && (
                                                        <span className="px-4 py-2 bg-red-500/5 border border-red-500/20 text-red-500/70 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                                            <i className="fa-solid fa-ban"></i>
                                                            Refunded
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="glass-card py-20 text-center">
                                    <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">No active workshops found.</p>
                                </div>
                            )}
                        </section>

                        {/* Custom Requests */}
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <i className="fa-solid fa-wand-magic-sparkles text-primary text-xl"></i>
                                <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">My Custom Requests</h2>
                            </div>

                            {customRequests.length > 0 ? (
                                <div className="grid lg:grid-cols-2 gap-6">
                                    {customRequests.map((req) => (
                                        <div key={req.id} className="glass-card flex flex-col gap-4 p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border mb-3 inline-block ${req.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                            req.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                        }`}>
                                                        {req.status}
                                                    </span>
                                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tighter leading-none mb-1">{req.topic}</h3>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                        Budget: LKR {req.budget} • {req.vendorId === 'all' ? 'Open Request' : 'Direct Request'}
                                                    </p>
                                                </div>
                                                {req.pdfUrl && (
                                                    <a href={req.pdfUrl} target="_blank" className="w-8 h-8 rounded-lg bg-secondary hover:bg-primary hover:text-white flex items-center justify-center transition-all text-muted-foreground">
                                                        <i className="fa-solid fa-file-pdf"></i>
                                                    </a>
                                                )}
                                            </div>
                                            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    {req.createdAt?.seconds ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                </span>
                                                {req.status === 'accepted' && (
                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                                        <i className="fa-solid fa-check-circle"></i> Vendor Accepted
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="glass-card py-20 text-center flex flex-col items-center gap-4">
                                    <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">No custom requests found.</p>
                                    <Link href="/custom-request" className="px-6 py-3 bg-secondary hover:bg-primary/20 hover:text-primary text-muted-foreground rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                        Create New Request
                                    </Link>
                                </div>
                            )}
                        </section>

                        {/* Favorites */}
                        <section>
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <i className="fa-solid fa-heart text-primary text-xl"></i>
                                    <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">My Favorites</h2>
                                </div>
                                <div className="flex gap-4">
                                    <input placeholder="Search favorites..." value={search} onChange={e => setSearch(e.target.value)} className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-bold text-white outline-none focus:border-primary transition-all w-48" />
                                </div>
                            </div>

                            {filteredFavorites.length > 0 ? (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {filteredFavorites.map((w) => (
                                        <Link href={`/register/${w.id}`} key={w.id} className="glass-card !p-0 group hover:border-primary/30 transition-all overflow-hidden flex flex-col bg-card/60">
                                            <div className="h-32 w-full relative overflow-hidden bg-secondary/50">
                                                {w.imageBase64 || w.imageUrl ? (
                                                    <img src={w.imageBase64 || w.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-muted-foreground"><i className="fa-solid fa-image text-2xl"></i></div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
                                                <div className="absolute bottom-3 left-3">
                                                    <span className="text-[9px] font-black uppercase text-white bg-primary/20 backdrop-blur-md border border-primary/30 px-2 py-1 rounded-lg tracking-widest">{w.category}</span>
                                                </div>
                                            </div>
                                            <div className="p-4 flex flex-col gap-1">
                                                <h3 className="text-sm font-black text-foreground uppercase tracking-tighter truncate group-hover:text-primary transition-colors">{w.title}</h3>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1"><i className="fa-solid fa-location-dot"></i> {w.location || "Online"}</span>
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase">Rs. {w.price}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="glass-card py-20 text-center">
                                    <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">No favorites saved.</p>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            <AnimatePresence>
                {reviewModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReviewModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="glass-card !p-10 w-full max-w-md relative z-10 shadow-3xl">
                            <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter mb-8 text-center">Write a Review</h3>
                            <div className="flex justify-center gap-3 mb-8">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button key={s} onClick={() => setReviewRating(s)} className={`text-2xl transition-all hover:scale-110 ${s <= reviewRating ? 'text-primary' : 'text-white/10'}`}>
                                        <i className="fa-solid fa-star"></i>
                                    </button>
                                ))}
                            </div>
                            <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Write your review here..." className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold text-sm outline-none focus:border-primary transition-all mb-8 resize-none" />
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setReviewModalOpen(false)} className="px-6 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                                <button onClick={handleSubmitReview} className="btn-vibe-primary !py-4 !text-[10px]">Submit Review</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
