"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/firebase/firebaseConfig";
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatedBackground } from "@/app/components/AnimatedBackground";
import Image from "next/image";

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

function WorkshopsPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [vendors, setVendors] = useState<Record<string, Vendor>>({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activePriceRange, setActivePriceRange] = useState("All");
  const [activeAgeGroup, setActiveAgeGroup] = useState("All");
  const [activeDate, setActiveDate] = useState("");
  const [activeLocation, setActiveLocation] = useState("All");
  const [showCustomOnly, setShowCustomOnly] = useState(false);
  const [localFavorites, setLocalFavorites] = useState<string[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    const category = searchParams?.get("category");
    if (category && CATEGORIES.includes(category) && category !== activeCategory) {
      // eslint-disable-next-line
      setActiveCategory(category);
    }
  }, [searchParams, activeCategory]);

  useEffect(() => {
    const fetchData = async () => {
      const workshopSnap = await getDocs(collection(db, "workshops"));
      const workshopList = workshopSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Workshop[];
      setWorkshops(workshopList);

      const vQuery = query(collection(db, "users"), where("role", "==", "vendor"));
      const vSnap = await getDocs(vQuery);
      const vList = vSnap.docs.reduce((acc, doc) => {
        const data = doc.data();
        acc[doc.id] = {
          id: doc.id,
          displayName: data.displayName,
          businessName: data.businessName,
          customOrdersEnabled: data.customOrdersEnabled,
          phoneNumber: data.phoneNumber,
          socialLink: data.socialLink
        };
        return acc;
      }, {} as Record<string, Vendor>);

      setVendors(vList);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (userData?.favorites && JSON.stringify(userData.favorites) !== JSON.stringify(localFavorites)) {
      // eslint-disable-next-line
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
    <main className="min-h-screen pt-32 pb-24 px-6 relative overflow-hidden bg-background">
      {/* Immersive Atmosphere */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-primary/5 blur-[150px] -z-10 rounded-full animate-vibe-float" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] -z-10 rounded-full animate-vibe-float" style={{ animationDelay: '2s' }} />

      <div className="max-w-7xl mx-auto space-y-16">

        <div className="relative mb-20 py-20 px-6 rounded-[3rem] overflow-hidden">
          <AnimatedBackground />
          <div className="relative z-10 text-center space-y-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_currentColor] text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">
                Explore The Vibe
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl md:text-8xl font-black tracking-tighter text-foreground leading-[0.9]"
            >
              Discover <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-500 animate-gradient-x">
                New Experiences.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground font-medium text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
            >
              Join the collective. Master new skills. Connect with visionary vendors in a world built for creators.
            </motion.p>
          </div>
        </div>

        {/* Refined Filter Infrastructure */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Main Search & Reset Link */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-1 group">
              <i className="fa-solid fa-search absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"></i>
              <input
                placeholder="Search by title, artist, or vibe..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-14 pr-8 py-4 bg-card border border-border rounded-xl outline-none font-bold text-sm focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all shadow-xl"
              />
            </div>

            {(search || activeCategory !== 'All' || activePriceRange !== 'All' || activeAgeGroup !== 'All' || showCustomOnly || activeDate || activeLocation !== 'All') && (
              <button
                onClick={() => { setSearch(""); setActiveCategory("All"); setActivePriceRange("All"); setActiveAgeGroup("All"); setShowCustomOnly(false); setActiveDate(""); setActiveLocation("All"); }}
                className="px-6 py-4 bg-secondary hover:bg-red-500/10 hover:text-red-500 text-muted-foreground rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-border/50 flex items-center gap-2 justify-center"
              >
                <i className="fa-solid fa-rotate-right"></i>
                Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Category Select */}
            <div className="relative group">
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full bg-card border border-border rounded-xl pl-4 pr-10 py-3 text-[10px] font-black uppercase tracking-widest outline-none transition-all focus:border-primary/40 text-foreground appearance-none cursor-pointer shadow-sm hover:border-primary/30"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <i className="fa-solid fa-layer-group absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] pointer-events-none group-hover:text-primary transition-colors"></i>
            </div>

            {/* Date Input */}
            <input
              type="date"
              value={activeDate}
              onChange={(e) => setActiveDate(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none transition-all focus:border-primary/40 text-foreground placeholder:text-muted-foreground shadow-sm hover:border-primary/30"
            />

            {/* Location Select */}
            <div className="relative group">
              <select
                value={activeLocation}
                onChange={(e) => setActiveLocation(e.target.value)}
                className="w-full bg-card border border-border rounded-xl pl-4 pr-10 py-3 text-[10px] font-black uppercase tracking-widest outline-none transition-all focus:border-primary/40 text-foreground appearance-none cursor-pointer shadow-sm hover:border-primary/30"
              >
                <option value="All">All Locations</option>
                {uniqueLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <i className="fa-solid fa-location-dot absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] pointer-events-none group-hover:text-primary transition-colors"></i>
            </div>

            {/* Price Select */}
            <div className="relative group">
              <select
                value={activePriceRange}
                onChange={(e) => setActivePriceRange(e.target.value)}
                className="w-full bg-card border border-border rounded-xl pl-4 pr-10 py-3 text-[10px] font-black uppercase tracking-widest outline-none transition-all focus:border-primary/40 text-foreground appearance-none cursor-pointer shadow-sm hover:border-primary/30"
              >
                <option value="All">All Prices</option>
                <option value="0-5000">Under Rs. 5k</option>
                <option value="5000-15000">Rs. 5k - 15k</option>
                <option value="15000+">Premium (15k+)</option>
              </select>
              <i className="fa-solid fa-tag absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] pointer-events-none group-hover:text-primary transition-colors"></i>
            </div>

            {/* Age Group Select */}
            <div className="relative group">
              <select
                value={activeAgeGroup}
                onChange={(e) => setActiveAgeGroup(e.target.value)}
                className="w-full bg-card border border-border rounded-xl pl-4 pr-10 py-3 text-[10px] font-black uppercase tracking-widest outline-none transition-all focus:border-primary/40 text-foreground appearance-none cursor-pointer shadow-sm hover:border-primary/30"
              >
                <option value="All">All Ages</option>
                <option value="Kids">Kids (0-12)</option>
                <option value="Teens">Teens (13-19)</option>
                <option value="Adults">Adults (20+)</option>
                <option value="Seniors">Seniors (55+)</option>
              </select>
              <i className="fa-solid fa-users absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] pointer-events-none group-hover:text-primary transition-colors"></i>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-10">
            {[1, 2, 3].map(n => <div key={n} className="h-[500px] skeleton rounded-[3rem]" />)}
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((w, idx) => {
                const isFav = localFavorites.includes(w.id);
                return (
                  <motion.div
                    layout
                    key={w.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-card !p-0 flex flex-col group relative overflow-hidden border-border hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 bg-gradient-to-b from-card to-card/90"
                  >
                    <div className="h-72 relative overflow-hidden">
                      <Image
                        src={w.imageBase64 || w.imageUrl || "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071&auto=format&fit=crop"}
                        alt={w.title}
                        fill
                        priority={idx < 4}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      <button
                        onClick={() => toggleFavorite(w.id)}
                        className={`absolute top-4 right-4 w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 shadow-lg border z-10
                           ${isFav ? 'bg-white/10 text-red-500 border-red-500/50 shadow-red-500/20' : 'bg-black/30 text-white border-white/20 hover:bg-black/50'}`}
                      >
                        <i className={`fa-${isFav ? 'solid' : 'regular'} fa-heart text-sm`}></i>
                      </button>

                      <div className="absolute bottom-6 left-6 grid gap-2">
                        <span className="w-fit px-4 py-1.5 bg-primary/20 backdrop-blur-md rounded-xl text-[10px] font-black uppercase text-primary border border-primary/30 tracking-widest">{w.category}</span>
                        {w.ageGroup && (
                          <span className="w-fit px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[9px] font-bold text-white uppercase tracking-widest border border-white/10">
                            <i className="fa-solid fa-child-reaching mr-1"></i> {w.ageGroup}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-10 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-6 gap-4">
                        <h3 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors leading-tight tracking-tight line-clamp-2">{w.title}</h3>
                        <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 shadow-sm">
                          <i className="fa-solid fa-star text-[8px]"></i> {w.rating?.toFixed(1) || "NEW"}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-3 text-muted-foreground font-black text-[10px] uppercase tracking-widest flex-wrap">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-[10px] shadow-lg shadow-primary/10">
                            {vendors[w.vendorId]?.businessName?.[0] || vendors[w.vendorId]?.displayName?.[0] || 'V'}
                          </div>
                          <span className="group-hover:text-foreground transition-colors">By {vendors[w.vendorId]?.businessName || vendors[w.vendorId]?.displayName || "Collective Artist"}</span>
                          {vendors[w.vendorId]?.customOrdersEnabled && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedVendor(vendors[w.vendorId]);
                              }}
                              className="w-fit px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                              <i className="fa-solid fa-wand-magic-sparkles"></i> Custom Request
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="flex items-center gap-3 text-muted-foreground p-3 bg-secondary/30 rounded-2xl border border-border/50">
                          <i className="fa-solid fa-calendar text-primary text-sm"></i>
                          <span className="text-[10px] font-black uppercase tracking-tighter">{new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground p-3 bg-secondary/30 rounded-2xl border border-border/50">
                          <i className="fa-solid fa-location-dot text-primary text-sm"></i>
                          <span className="text-[10px] font-black uppercase tracking-tighter truncate">{w.location}</span>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-8 border-t border-border/50">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">Access Pass</span>
                          <span className="text-3xl font-black text-foreground">Rs. {w.price.toLocaleString()}</span>
                        </div>
                        {userData?.registeredWorkshops?.includes(w.id) ? (
                          <div className="grid grid-cols-2 gap-3">
                            <Link
                              href="/profile"
                              className="px-2 py-3 bg-secondary text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary/80 transition-all flex items-center justify-center gap-2"
                            >
                              <i className="fa-solid fa-check-circle"></i> Joined
                            </Link>
                            <Link
                              href={`/profile?reviewId=${w.id}`}
                              className="px-2 py-3 bg-white/5 text-muted-foreground border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                              <i className="fa-solid fa-star text-amber-500"></i> Rate
                            </Link>
                          </div>
                        ) : userData?.role === 'vendor' ? (
                          <button
                            disabled
                            className="px-6 py-4 bg-white/5 text-muted-foreground/50 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed border border-white/5"
                            title="Vendors cannot register for workshops"
                          >
                            <i className="fa-solid fa-ban mr-2"></i> Vendor Account
                          </button>
                        ) : (
                          <Link
                            href={user ? `/register/${w.id}` : "/login"}
                            className="btn-vibe-primary !py-4 !px-10 text-[10px]"
                          >
                            Join Experience
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filtered.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 text-center glass-card border-dashed">
                <i className="fa-solid fa-folder-open text-4xl text-muted-foreground/30 mb-6"></i>
                <h3 className="text-2xl font-black text-foreground mb-2">No workshops found</h3>
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mb-8">Try adjusting your filters</p>
                <button
                  onClick={() => { setSearch(""); setActiveCategory("All"); setActivePriceRange("All"); setActiveAgeGroup("All"); setShowCustomOnly(false); }}
                  className="btn-vibe-secondary"
                >
                  Reset Filters
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Custom Request Modal */}
        <AnimatePresence>
          {selectedVendor && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedVendor(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
              >
                <div className="h-24 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative">
                  <button
                    onClick={() => setSelectedVendor(null)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                  <div className="absolute -bottom-8 left-8 w-20 h-20 rounded-2xl bg-[#121212] p-1.5">
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-3xl text-white font-black">
                      {selectedVendor.businessName?.[0] || selectedVendor.displayName[0]}
                    </div>
                  </div>
                </div>

                <div className="pt-12 px-8 pb-8 space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-white">{selectedVendor.businessName || selectedVendor.displayName}</h2>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Accepting Custom Requests</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                      <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(workshops.filter(w => w.vendorId === selectedVendor.id).map(w => w.category))).map(cat => (
                          <span key={cat} className="px-3 py-1 bg-primary/20 text-primary text-[9px] font-bold uppercase tracking-widest rounded-lg border border-primary/20">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {selectedVendor.phoneNumber && (
                        <a
                          href={`https://wa.me/${selectedVendor.phoneNumber.replace(/\+/g, '').replace(/\s/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center gap-2 group hover:bg-emerald-500/20 transition-all cursor-pointer"
                        >
                          <i className="fa-brands fa-whatsapp text-2xl text-emerald-500 group-hover:scale-110 transition-transform"></i>
                          <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">WhatsApp</span>
                        </a>
                      )}
                      {selectedVendor.socialLink && (
                        <a
                          href={selectedVendor.socialLink.startsWith('http') ? selectedVendor.socialLink : `https://${selectedVendor.socialLink}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center gap-2 group hover:bg-indigo-500/20 transition-all cursor-pointer"
                        >
                          <i className="fa-solid fa-link text-2xl text-indigo-500 group-hover:scale-110 transition-transform"></i>
                          <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Portfolio</span>
                        </a>
                      )}
                    </div>

                    <Link
                      href={`/custom-request?vendorId=${selectedVendor.id}`}
                      className="w-full py-4 bg-primary text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <i className="fa-solid fa-file-signature"></i> Start Official Request
                    </Link>
                  </div>


                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default dynamic(() => Promise.resolve(WorkshopsPage), { ssr: false });
