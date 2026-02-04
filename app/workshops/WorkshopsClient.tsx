"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/firebaseConfig";
import { collection, query, where, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, QuerySnapshot, DocumentData, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { getWorkshopImage } from "@/app/utils/workshopUtils";
import { AnimatePresence, motion } from "framer-motion";
import { sanitizeData } from "@/app/utils/serialize";

// Types matching the ones in your data structure
interface Workshop {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    imageUrl: string;
    imageBase64?: string;
    date: string;
    vendorId: string;
    location: string;
    ageGroup: string;
    rating?: number;
    ratingCount?: number;
    ratings?: Record<string, number>;
    capacity?: number;
    isFrozen?: boolean;
}

interface Vendor {
    id: string;
    displayName: string;
    businessName?: string;
    customOrdersEnabled?: boolean;
    phoneNumber?: string;
    socialLink?: string;
}

const CATEGORIES = ["All", "Art", "Music", "Technology", "Cooking", "Sports", "Business", "Health", "Other"];

const FeaturedCarousel = ({ workshops }: { workshops: Workshop[] }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (workshops.length <= 1) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % workshops.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [workshops.length]);

    if (workshops.length === 0) return null;
    const workshop = workshops[index];

    return (
        <div className="relative w-full h-[45vh] md:h-[55vh] rounded-[2.5rem] overflow-hidden mb-12 group shadow-3xl">
            <AnimatePresence mode="wait">
                <motion.div
                    key={workshop.id}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute inset-0"
                >
                    <img
                        src={getWorkshopImage(workshop)}
                        alt={workshop.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full md:w-3/4 flex flex-col items-start gap-4 z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={workshop.id + "content"}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 30 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex flex-col items-start gap-4"
                    >
                        <div className="flex items-center gap-3 mb-1">
                            <span className="px-3 py-1 bg-primary text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl shadow-primary/40">Exclusive Offering</span>
                            <span className="text-white/70 font-black text-[9px] uppercase tracking-[0.3em]">{workshop.category}</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white leading-[0.85] tracking-tighter drop-shadow-2xl uppercase italic">{workshop.title}</h1>
                        <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                            <i className="fa-solid fa-star"></i>
                            <span>{workshop.rating ? workshop.rating.toFixed(1) : "5.0"}</span>
                        </div>
                        <p className="text-sm md:text-base text-white/80 line-clamp-2 max-w-xl font-medium leading-relaxed drop-shadow-md">{workshop.description}</p>

                        <div className="flex flex-wrap gap-4 mt-2">
                            <Link href={`/register/${workshop.id}`} className="px-8 py-3.5 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all duration-500 flex items-center gap-2 shadow-xl">
                                <i className="fa-solid fa-bolt"></i> Register
                            </Link>
                            <Link
                                href={`/register/${workshop.id}`}
                                className="px-8 py-3.5 bg-white/10 backdrop-blur-2xl text-white border border-white/20 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all flex items-center gap-2"
                            >
                                <i className="fa-solid fa-circle-info"></i> Details
                            </Link>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Slide Indicators */}
            <div className="absolute right-10 bottom-10 flex gap-2 z-20">
                {workshops.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`h-1 transition-all duration-500 rounded-full ${i === index ? 'w-12 bg-primary' : 'w-4 bg-white/20'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default function WorkshopsClient({ initialWorkshops, initialVendors }: { initialWorkshops: Workshop[], initialVendors: Record<string, Vendor> }) {
    const { user, userData } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [workshops] = useState<Workshop[]>(initialWorkshops);
    const [vendors] = useState<Record<string, Vendor>>(initialVendors);

    // Filter States
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [activePriceRange, setActivePriceRange] = useState("All");
    const [activeAgeGroup, setActiveAgeGroup] = useState("All");
    const [activeDate, setActiveDate] = useState("");
    const [activeLocation, setActiveLocation] = useState("All");
    const [showCustomOnly, setShowCustomOnly] = useState(false);

    const [localFavorites, setLocalFavorites] = useState<string[]>([]);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [registrationStatuses, setRegistrationStatuses] = useState<Record<string, string>>({});

    // Review State
    const [reviewModalWorkshopId, setReviewModalWorkshopId] = useState<string | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [workshopReviews, setWorkshopReviews] = useState<any[]>([]);

    const selectedWorkshopForReview = workshops.find(w => w.id === reviewModalWorkshopId);

    // Sync Registrations & Statuses
    useEffect(() => {
        if (!user) {
            setRegistrationStatuses({});
            return;
        }

        const q = query(collection(db, "registrations"), where("userId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
            const statuses: Record<string, string> = {};
            snapshot.docs.forEach(docSnap => {
                const data = docSnap.data();
                const currentStatus = statuses[data.workshopId];
                const newStatus = data.status;
                if (['approved', 'paid', 'confirmed', 'participant_confirmed'].includes(newStatus)) {
                    statuses[data.workshopId] = newStatus;
                } else if (!currentStatus || currentStatus === 'refunded' || currentStatus === 'rejected') {
                    statuses[data.workshopId] = newStatus;
                }
            });
            setRegistrationStatuses(statuses);
        });

        return () => unsubscribe();
    }, [user]);

    // Listen to Reviews for selected workshop
    useEffect(() => {
        if (!reviewModalWorkshopId) {
            setWorkshopReviews([]);
            return;
        }

        const q = query(collection(db, "reviews"), where("workshopId", "==", reviewModalWorkshopId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => sanitizeData({ id: doc.id, ...doc.data() }));
            setWorkshopReviews(list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        });

        return () => unsubscribe();
    }, [reviewModalWorkshopId]);

    const handleSubmitReview = async () => {
        if (!user || !reviewModalWorkshopId || !reviewComment.trim()) return;
        setIsSubmittingReview(true);
        try {
            const targetWorkshop = workshops.find(w => w.id === reviewModalWorkshopId);
            if (!targetWorkshop) return;

            await addDoc(collection(db, "reviews"), {
                workshopId: reviewModalWorkshopId,
                workshopTitle: targetWorkshop.title,
                userId: user.uid,
                userName: userData?.displayName || "Anonymous",
                userEmail: user.email,
                rating: reviewRating,
                comment: reviewComment,
                createdAt: serverTimestamp()
            });

            const currentCount = targetWorkshop.ratingCount || 0;
            const currentRating = targetWorkshop.rating || 5;
            const newCount = currentCount + 1;
            const newRating = ((currentRating * currentCount) + reviewRating) / newCount;

            await updateDoc(doc(db, "workshops", reviewModalWorkshopId), {
                rating: newRating,
                ratingCount: newCount
            });

            alert("Review posted successfully!");
            setReviewComment("");
            setReviewRating(5);
        } catch (e) {
            console.error(e);
            alert("Failed to post review.");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Sync Search Params
    useEffect(() => {
        const category = searchParams?.get("category");
        if (category && CATEGORIES.includes(category) && category !== activeCategory) {
            setActiveCategory(category);
        }
    }, [searchParams, activeCategory]);

    // Sync Favorites
    useEffect(() => {
        if (userData?.favorites && JSON.stringify(userData.favorites) !== JSON.stringify(localFavorites)) {
            setLocalFavorites(userData.favorites);
        }
    }, [userData?.favorites, localFavorites]);

    const toggleFavorite = async (wId: string) => {
        if (!user) {
            router.push("/login");
            return;
        }
        const isFav = localFavorites.includes(wId);
        setLocalFavorites(p => isFav ? p.filter(id => id !== wId) : [...p, wId]);
        try {
            const uRef = doc(db, "users", user.uid);
            await updateDoc(uRef, { favorites: isFav ? arrayRemove(wId) : arrayUnion(wId) });
        } catch (e) {
            setLocalFavorites(p => isFav ? [...p, wId] : p.filter(id => id !== wId));
        }
    };

    const filtered = workshops.filter((w) => {
        const matchesSearch = w.title.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === "All" || w.category === activeCategory;
        const matchesAge = activeAgeGroup === "All" || (w.ageGroup || "").includes(activeAgeGroup);
        const matchesLocation = activeLocation === "All" || w.location === activeLocation;
        const matchesDate = !activeDate || w.date === activeDate;

        let matchesPrice = true;
        const p = Number(w.price);
        if (activePriceRange === "0-5000") matchesPrice = p <= 5000;
        else if (activePriceRange === "5000-15000") matchesPrice = p > 5000 && p <= 15000;
        else if (activePriceRange === "15000+") matchesPrice = p > 15000;

        const matchesCustom = !showCustomOnly || vendors[w.vendorId]?.customOrdersEnabled;

        return matchesSearch && matchesCategory && matchesAge && matchesPrice && matchesCustom && matchesDate && matchesLocation;
    }).sort((a, b) => {
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.ratingCount || 0) - (a.ratingCount || 0);
    });

    const uniqueLocations = Array.from(new Set(workshops.map(w => w.location))).filter(Boolean);

    return (
        <main className="min-h-screen pt-32 pb-32 px-6 relative overflow-hidden bg-transparent">
            <div className="max-w-[1400px] mx-auto">

                {/* SECTION 2: Featured Hero Carousel */}
                {workshops.length > 0 && (
                    <div className="mb-20">
                        <FeaturedCarousel workshops={workshops.slice(0, 5)} />
                    </div>
                )}

                {/* SECTION 3: Filter Island */}
                <div className="glass-card !bg-background/20 p-10 mb-20 shadow-3xl backdrop-blur-[40px] border-white/10 ring-1 ring-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -mr-16 -mt-16" />

                    <div className="flex flex-col xl:flex-row gap-8 items-end">
                        <div className="flex-1 w-full space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary ml-2">Search Catalog</label>
                            <div className="relative group">
                                <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors text-lg"></i>
                                <input
                                    placeholder="What are you looking to master today?"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-16 pr-8 py-6 bg-background/50 border border-white/10 rounded-[2rem] outline-none font-black text-lg focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-foreground placeholder:text-muted-foreground/30"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 w-full xl:w-auto">
                            {[
                                { label: "Category", val: activeCategory, set: setActiveCategory, icon: "fa-layer-group", options: CATEGORIES },
                                { label: "Location", val: activeLocation, set: setActiveLocation, icon: "fa-location-dot", options: ["All", ...uniqueLocations] },
                                { label: "Price", val: activePriceRange, set: setActivePriceRange, icon: "fa-tag", options: ["All Prices", "0-5000", "5000-15000", "15000+"] },
                                { label: "Ages", val: activeAgeGroup, set: setActiveAgeGroup, icon: "fa-users", options: ["All Ages", "Kids", "Teens", "Adults"] },
                            ].map((filter, i) => (
                                <div key={i} className="space-y-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{filter.label}</span>
                                    <div className="relative group">
                                        <select
                                            value={filter.val === "All Prices" ? "All" : filter.val}
                                            onChange={(e) => filter.set(e.target.value)}
                                            className="w-full bg-background/50 border border-white/10 rounded-2xl pl-4 pr-10 py-4 text-[10px] font-black uppercase tracking-widest outline-none transition-all focus:border-primary text-foreground appearance-none cursor-pointer"
                                        >
                                            {filter.options.map(opt => (<option key={opt} value={opt} className="bg-background">{opt}</option>))}
                                        </select>
                                        <i className={`fa-solid ${filter.icon} absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] pointer-events-none group-hover:text-primary transition-colors`}></i>
                                    </div>
                                </div>
                            ))}

                            <div className="flex items-end">
                                <button
                                    disabled={!(search || activeCategory !== 'All' || activePriceRange !== 'All' || activeAgeGroup !== 'All' || showCustomOnly || activeDate || activeLocation !== 'All')}
                                    onClick={() => { setSearch(""); setActiveCategory("All"); setActivePriceRange("All"); setActiveAgeGroup("All"); setShowCustomOnly(false); setActiveDate(""); setActiveLocation("All"); }}
                                    className="w-full h-[58px] bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-destructive/20 flex items-center gap-2 justify-center disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    <i className="fa-solid fa-rotate-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 4: Workshop Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map((w) => {
                        const isFav = localFavorites.includes(w.id);
                        return (
                            <div
                                key={w.id}
                                className="glass-card !p-0 flex flex-col group relative overflow-hidden border-white/5 hover:border-primary transition-all duration-500 hover:shadow-3xl hover:shadow-primary/10 hover:-translate-y-4 bg-background/40"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="h-44 relative overflow-hidden">
                                    <img
                                        src={getWorkshopImage(w)}
                                        alt={w.title}
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                    <button
                                        onClick={() => toggleFavorite(w.id)}
                                        className={`absolute top-3 right-3 w-8 h-8 rounded-xl backdrop-blur-3xl flex items-center justify-center transition-all z-10 border border-white/20 ${isFav ? 'bg-primary text-white scale-110 shadow-xl shadow-primary/40' : 'bg-black/30 text-white hover:bg-white hover:text-primary'
                                            }`}
                                    >
                                        <i className={`fa-${isFav ? 'solid' : 'regular'} fa-heart text-[10px]`}></i>
                                    </button>

                                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                        <span className="px-3 py-1 bg-primary text-white rounded-lg text-[7px] font-black uppercase tracking-[0.2em] shadow-xl">
                                            {w.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 flex flex-col flex-1 relative z-10">
                                    <div className="flex flex-col gap-1.5 mb-5">
                                        <h3 className="text-sm font-black text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors tracking-tight uppercase">
                                            {w.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <div className="flex text-amber-500 text-[10px]">
                                                {[1, 2, 3, 4, 5].map(s => <i key={s} className="fa-solid fa-star"></i>)}
                                            </div>
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pt-0.5">
                                                {w.rating ? w.rating.toFixed(1) : "5.0"}
                                            </span>
                                            <button
                                                onClick={(e) => { e.preventDefault(); setReviewModalWorkshopId(w.id); }}
                                                className="text-[8px] font-black text-primary hover:text-white bg-primary/10 hover:bg-primary px-3 py-1 rounded-lg uppercase tracking-widest transition-all ml-1 border border-primary/20"
                                            >
                                                See Reviews
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5 mb-5 p-2 bg-primary/5 rounded-xl border border-primary/10">
                                        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-[10px] font-black shadow-lg">
                                            {vendors[w.vendorId]?.businessName?.[0] || 'V'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[7px] font-black text-primary uppercase tracking-[0.2em]">Instructor</span>
                                            <span className="text-[10px] text-foreground font-black tracking-tight uppercase truncate max-w-[120px]">
                                                {vendors[w.vendorId]?.businessName || vendors[w.vendorId]?.displayName || "Vibe Artist"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 text-[8px] font-black text-muted-foreground mb-6">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 rounded-lg border border-white/5">
                                            <i className="fa-solid fa-user-group text-primary"></i>
                                            <span className="uppercase tracking-widest">{w.ageGroup || "All Ages"}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 rounded-lg border border-white/5">
                                            <i className="fa-solid fa-marker text-primary"></i>
                                            <span className="uppercase tracking-widest">{w.location || "On-Vibe"}</span>
                                        </div>
                                        {vendors[w.vendorId]?.customOrdersEnabled && (
                                            <Link
                                                href={`/custom-request?vendorId=${w.vendorId}&vendorName=${encodeURIComponent(vendors[w.vendorId]?.businessName || vendors[w.vendorId]?.displayName || "Vibe Artist")}`}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20 hover:bg-primary hover:text-white transition-all"
                                            >
                                                <i className="fa-solid fa-wand-magic-sparkles"></i>
                                                <span className="uppercase tracking-widest font-black">Custom</span>
                                            </Link>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-5 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[7px] uppercase text-primary font-black tracking-[0.3em] mb-0.5">Standard Entry</span>
                                            <div className="flex items-baseline gap-0.5">
                                                <span className="text-[10px] font-black text-foreground">Rs.</span>
                                                <span className="text-xl font-black text-foreground tracking-tighter">{w.price || 0}</span>
                                            </div>
                                        </div>

                                        {registrationStatuses[w.id] && !['refunded', 'rejected'].includes(registrationStatuses[w.id]) ? (
                                            <Link href={`/register/${w.id}`} className="px-5 py-2.5 rounded-xl bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-500/20 hover:bg-green-500 hover:text-white transition-all">
                                                {registrationStatuses[w.id] === 'pending' ? 'Pending..' : 'Status ✓'}
                                            </Link>
                                        ) : (
                                            w.isFrozen ? (
                                                <button disabled className="px-6 py-3.5 rounded-xl bg-gray-500/20 text-gray-500 text-[10px] font-black uppercase tracking-widest cursor-not-allowed border border-gray-500/20">
                                                    Registration Closed
                                                </button>
                                            ) : (
                                                <Link href={`/register/${w.id}`} className="btn-vibe-primary px-6 py-3.5 !rounded-xl !text-[10px] shadow-2xl shadow-primary/30">
                                                    Secure Spot
                                                </Link>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="col-span-full py-40 text-center glass-card !bg-background/20 border-dashed border-2 border-primary/20 rounded-[4rem]">
                            <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-10 animate-vibe-float">
                                <i className="fa-solid fa-binoculars text-6xl text-primary/40"></i>
                            </div>
                            <h3 className="text-5xl font-black text-foreground mb-6">Uncharted Territory</h3>
                            <p className="text-muted-foreground text-sm font-black uppercase tracking-[0.4em] mb-12 max-w-md mx-auto leading-relaxed">We couldn&apos;t find any vibes matching those specific filters. Reach for something new?</p>
                            <button
                                onClick={() => { setSearch(""); setActiveCategory("All"); setActivePriceRange("All"); setActiveAgeGroup("All"); setShowCustomOnly(false); }}
                                className="btn-vibe-primary px-16 py-6"
                            >
                                Reset Universe
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            <AnimatePresence>
                {reviewModalWorkshopId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-[12px]"
                    >
                        <div
                            onClick={() => setReviewModalWorkshopId(null)}
                            className="absolute inset-0"
                        />
                        <motion.div
                            initial={{ scale: 0.95, y: 10, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 10, opacity: 0 }}
                            className="relative w-full max-w-xl bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[85vh] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
                        >
                            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Vibe Reviews</h2>
                                    <p className="text-[9px] text-muted-foreground font-bold tracking-[0.2em] uppercase mt-0.5 opacity-60 truncate max-w-[300px]">{selectedWorkshopForReview?.title}</p>
                                </div>
                                <button onClick={() => setReviewModalWorkshopId(null)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/5 text-muted-foreground hover:text-white">
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Student Stories</h3>
                                        <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">{workshopReviews.length} Total</span>
                                    </div>

                                    {workshopReviews.length === 0 ? (
                                        <div className="py-12 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-[2rem]">
                                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <i className="fa-solid fa-feather-pointed text-lg text-white/20"></i>
                                            </div>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-10 leading-relaxed text-center">Be the first to script your mastery journey here.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {workshopReviews.map((r: any) => (
                                                <div key={r.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl space-y-3 hover:border-white/10 transition-all">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-black border border-primary/20">
                                                                {r.userName?.[0] || "?"}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <p className="text-[11px] font-black text-white uppercase tracking-tight">{r.userName}</p>
                                                                <div className="flex text-amber-500 text-[6px] gap-0.5">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <i key={i} className={`fa-solid fa-star ${i < r.rating ? 'opacity-100' : 'opacity-10'}`}></i>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">{r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}</span>
                                                    </div>
                                                    <p className="text-[11px] text-white/70 font-medium italic leading-relaxed pl-1">&quot;{r.comment}&quot;</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {user && (
                                    <div className="pt-4">
                                        {(() => {
                                            const targetWs = workshops.find(w => w.id === reviewModalWorkshopId);
                                            const isParticipant = registrationStatuses[reviewModalWorkshopId!] && ['approved', 'paid', 'confirmed', 'participant_confirmed'].includes(registrationStatuses[reviewModalWorkshopId!]);
                                            const isPast = targetWs && new Date(targetWs.date) < new Date();

                                            if (!isParticipant) {
                                                return (
                                                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Only confirmed participants can leave reviews.</p>
                                                    </div>
                                                );
                                            }

                                            if (!isPast) {
                                                return (
                                                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Reviews are enabled after the workshop concludes.</p>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="p-6 bg-primary/10 border border-primary/20 rounded-[2rem] space-y-6 relative overflow-hidden group/form">
                                                    <div className="flex justify-between items-center relative z-10">
                                                        <h3 className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Share Your Experience</h3>
                                                        <div className="flex gap-1.5 p-1.5 bg-black/40 rounded-xl border border-white/5">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <button
                                                                    key={star}
                                                                    onClick={() => setReviewRating(star)}
                                                                    className={`transition-all hover:scale-110 ${reviewRating >= star ? 'text-amber-500' : 'text-white/10 opacity-30'}`}
                                                                >
                                                                    <i className="fa-solid fa-star text-xs"></i>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4 relative z-10">
                                                        <textarea
                                                            value={reviewComment}
                                                            onChange={(e) => setReviewComment(e.target.value)}
                                                            placeholder="Describe your evolution in this vibe..."
                                                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-[11px] text-white placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-all resize-none h-24 font-medium"
                                                        />
                                                        <button
                                                            disabled={isSubmittingReview || !reviewComment.trim()}
                                                            onClick={handleSubmitReview}
                                                            className="w-full py-4 bg-primary text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                                                        >
                                                            {isSubmittingReview ? <i className="fa-solid fa-circle-notch animate-spin"></i> : "Submit Mastery Story"}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Request Modal */}
            {selectedVendor && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        onClick={() => setSelectedVendor(null)}
                        className="absolute inset-0 bg-black/95 backdrop-blur-[20px]"
                    />
                    <div
                        className="relative w-full max-w-lg bg-card border border-white/10 rounded-[3rem] overflow-hidden shadow-3xl p-12 text-center"
                    >
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                            <i className="fa-solid fa-wand-magic-sparkles text-4xl text-primary"></i>
                        </div>
                        <h2 className="text-4xl font-black text-foreground mb-4 uppercase tracking-tighter">{selectedVendor.businessName}</h2>
                        <p className="text-muted-foreground font-black text-xs uppercase tracking-widest mb-10">This master artist accepts custom vibe requests.</p>

                        <div className="p-8 bg-secondary/50 rounded-3xl border border-white/5 mb-10">
                            <p className="text-foreground font-medium leading-relaxed italic">&quot;Let&apos;s create something unique that fits your specific vision and Mastery path.&quot;</p>
                        </div>

                        <button onClick={() => setSelectedVendor(null)} className="btn-vibe-primary w-full py-6">
                            Connect with Master
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
