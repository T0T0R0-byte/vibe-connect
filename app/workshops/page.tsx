"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/firebase/firebaseConfig";
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

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
}

const CATEGORIES = ["All", "Art", "Music", "Technology", "Cooking", "Sports", "Business", "Health", "Other"];

function WorkshopsPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
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
          customOrdersEnabled: data.customOrdersEnabled
        };
        return acc;
      }, {} as Record<string, Vendor>);

      setVendors(vList);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (userData?.favorites) setLocalFavorites(userData.favorites);
  }, [userData]);

  const toggleFavorite = async (wId: string) => {
    if (!user) { alert("Login to save favorites"); return; }
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
    const matchesAge = activeAgeGroup === "All" || w.ageGroup === activeAgeGroup;
    const matchesLocation = activeLocation === "All" || w.location === activeLocation;
    const matchesDate = !activeDate || w.date === activeDate;

    let matchesPrice = true;
    const p = Number(w.price);
    if (activePriceRange === "0-5000") matchesPrice = p <= 5000;
    else if (activePriceRange === "5000-15000") matchesPrice = p > 5000 && p <= 15000;
    else if (activePriceRange === "15000+") matchesPrice = p > 15000;

    const matchesCustom = !showCustomOnly || vendors[w.vendorId]?.customOrdersEnabled;

    return matchesSearch && matchesCategory && matchesAge && matchesPrice && matchesCustom && matchesDate && matchesLocation;
  });

  const uniqueLocations = Array.from(new Set(workshops.map(w => w.location))).filter(Boolean);

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 relative overflow-hidden bg-background">
      {/* Immersive Atmosphere */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-primary/5 blur-[150px] -z-10 rounded-full animate-vibe-float" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] -z-10 rounded-full animate-vibe-float" style={{ animationDelay: '2s' }} />

      <div className="max-w-7xl mx-auto space-y-16">
        <header className="text-center space-y-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/5 border border-primary/20 mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Find Your Class</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Available <br />
            <span className="text-gradient">Workshops.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground font-medium text-lg md:text-xl max-w-2xl mx-auto"
          >
            A complete directory of workshops designed to help you learn from the world's most innovative mentors.
          </motion.p>
        </header>

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
                      <img src={w.imageBase64 || w.imageUrl || undefined} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      <button
                        onClick={() => toggleFavorite(w.id)}
                        className={`absolute top-4 right-4 w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 shadow-lg border z-10
                           ${isFav ? 'bg-white/10 text-red-500 border-red-500/50 shadow-red-500/20' : 'bg-black/30 text-white border-white/20 hover:bg-black/50'}`}
                      >
                        <i className={`fa-${isFav ? 'solid' : 'regular'} fa-heart text-sm`}></i>
                      </button>

                      <div className="absolute bottom-6 left-6">
                        <span className="px-4 py-1.5 bg-primary/20 backdrop-blur-md rounded-xl text-[10px] font-black uppercase text-primary border border-primary/30 tracking-widest">{w.category}</span>
                      </div>
                    </div>

                    <div className="p-10 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-6 gap-4">
                        <h3 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors leading-tight tracking-tight line-clamp-2">{w.title}</h3>
                        <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 shadow-sm">
                          <i className="fa-solid fa-star text-[8px]"></i> {w.rating?.toFixed(1) || "NEW"}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-8 text-muted-foreground font-black text-[10px] uppercase tracking-widest">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-[10px] shadow-lg shadow-primary/10">
                          {vendors[w.vendorId]?.businessName?.[0] || vendors[w.vendorId]?.displayName?.[0] || 'V'}
                        </div>
                        <span className="group-hover:text-foreground transition-colors">By {vendors[w.vendorId]?.businessName || vendors[w.vendorId]?.displayName || "Collective Artist"}</span>
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
                        ) : (
                          <Link
                            href={`/register/${w.id}`}
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
      </div>
    </main>
  );
}

export default dynamic(() => Promise.resolve(WorkshopsPage), { ssr: false });
