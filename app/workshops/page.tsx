"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { db } from "@/firebase/firebaseConfig";
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllWorkshops } from "@/firebase/workshopActions";

// Types
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

// --- Components ---

const FeaturedHero = ({ workshop }: { workshop: Workshop | null }) => {
  if (!workshop) return null;

  return (
    <div className="relative w-full h-[65vh] md:h-[75vh] rounded-[3.5rem] overflow-hidden mb-20 group shadow-3xl">
      <img
        src={workshop.imageUrl || "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071&auto=format&fit=crop"}
        alt={workshop.title}
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />

      <div className="absolute bottom-0 left-0 p-10 md:p-20 w-full md:w-3/4 flex flex-col items-start gap-6 z-10">
        <div className="flex items-center gap-4 mb-2">
          <span className="px-4 py-1.5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl shadow-primary/40">Exclusive Offering</span>
          <span className="text-white/70 font-black text-xs uppercase tracking-[0.3em]">{workshop.category}</span>
        </div>
        <h1 className="text-5xl md:text-8xl font-black text-white leading-[0.85] tracking-tighter drop-shadow-2xl">{workshop.title}</h1>
        <div className="flex items-center gap-2 text-amber-400 font-black text-lg">
          <i className="fa-solid fa-star"></i>
          <span>{workshop.rating ? workshop.rating.toFixed(1) : "Pioneering"}</span>
        </div>
        <p className="text-xl text-white/80 line-clamp-2 md:line-clamp-3 max-w-2xl font-medium leading-relaxed drop-shadow-md">{workshop.description}</p>

        <div className="flex flex-wrap gap-5 mt-6">
          <Link href={`/register/${workshop.id}`} className="px-12 py-5 bg-white text-black rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-primary hover:text-white transition-all duration-500 flex items-center gap-3 shadow-xl">
            <i className="fa-solid fa-bolt"></i> Register Now
          </Link>
          <button className="px-12 py-5 bg-white/10 backdrop-blur-2xl text-white border border-white/20 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-white/20 transition-all flex items-center gap-3">
            <i className="fa-solid fa-circle-info"></i> Full Details
          </button>
        </div>
      </div>
    </div>
  );
};

function WorkshopsPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [vendors, setVendors] = useState<Record<string, Vendor>>({});
  const [loading, setLoading] = useState(true);

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

  // Sync Search Params
  useEffect(() => {
    const category = searchParams?.get("category");
    if (category && CATEGORIES.includes(category) && category !== activeCategory) {
      setActiveCategory(category);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Sync Favorites
  useEffect(() => {
    if (userData?.favorites && JSON.stringify(userData.favorites) !== JSON.stringify(localFavorites)) {
      setLocalFavorites(userData.favorites);
    }
  }, [userData?.favorites, localFavorites]);

  // Fetch Data (Optimized)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const workshopList = await getAllWorkshops() as any as Workshop[]; // eslint-disable-line @typescript-eslint/no-explicit-any
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
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
  const featuredWorkshop = workshops.length > 0 ? workshops[Math.floor(Math.random() * workshops.length)] : null;

  return (
    <main className="min-h-screen pt-32 pb-32 px-6 relative overflow-hidden bg-transparent">
      <div className="max-w-[1400px] mx-auto">

        {/* SECTION 1: Category Quick Bar */}
        <div className="flex items-center gap-4 overflow-x-auto pb-8 mb-12 scrollbar-hide no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-4 rounded-2xl whitespace-nowrap text-xs font-black uppercase tracking-widest transition-all ${activeCategory === cat
                ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/40 scale-105"
                : "glass border-white/5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                }`}
            >
              <i className={`fa-solid ${cat === "All" ? "fa-border-all" :
                cat === "Art" ? "fa-palette" :
                  cat === "Music" ? "fa-music" :
                    cat === "Technology" ? "fa-laptop-code" :
                      "fa-vibe"
                } mr-2`}></i>
              {cat}
            </button>
          ))}
        </div>

        {/* SECTION 2: Featured Hero */}
        {!loading && featuredWorkshop && (
          <div className="mb-20">
            <FeaturedHero workshop={featuredWorkshop} />
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
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[1, 2, 3, 4, 5, 6].map(n => <div key={n} className="h-[550px] skeleton rounded-[3rem]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filtered.map((w) => {
              const isFav = localFavorites.includes(w.id);
              return (
                <div
                  key={w.id}
                  className="glass-card !p-0 flex flex-col group relative overflow-hidden border-white/5 hover:border-primary transition-all duration-500 hover:shadow-3xl hover:shadow-primary/10 hover:-translate-y-4 bg-background/40"
                >
                  {/* Category Border Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Image Area */}
                  <div className="h-72 relative overflow-hidden">
                    <img
                      src={w.imageBase64 || w.imageUrl || "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071&auto=format&fit=crop"}
                      alt={w.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                    {/* Action Hub */}
                    <button
                      onClick={() => toggleFavorite(w.id)}
                      className={`absolute top-6 right-6 w-12 h-12 rounded-2xl backdrop-blur-3xl flex items-center justify-center transition-all z-10 border border-white/20 ${isFav ? 'bg-primary text-white scale-110 shadow-xl shadow-primary/40' : 'bg-black/30 text-white hover:bg-white hover:text-primary'
                        }`}
                    >
                      <i className={`fa-${isFav ? 'solid' : 'regular'} fa-heart text-sm`}></i>
                    </button>

                    <div className="absolute bottom-6 left-6 flex items-center gap-3">
                      <span className="px-4 py-1.5 bg-primary text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-xl">
                        {w.category}
                      </span>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-10 flex flex-col flex-1 relative z-10">
                    <div className="flex flex-col gap-2 mb-8">
                      <h3 className="text-2xl font-black text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors tracking-tight uppercase">
                        {w.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="flex text-amber-500 text-[10px]">
                          {[1, 2, 3, 4, 5].map(s => <i key={s} className="fa-solid fa-star"></i>)}
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pt-0.5">
                          {w.rating ? w.rating.toFixed(1) : "Early Access"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-black shadow-lg shadow-primary/30">
                        {vendors[w.vendorId]?.businessName?.[0] || 'V'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Instructor</span>
                        <span className="text-xs text-foreground font-black tracking-tight uppercase truncate max-w-[150px]">
                          {vendors[w.vendorId]?.businessName || vendors[w.vendorId]?.displayName || "Vibe Artist"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[10px] font-black text-muted-foreground mb-10">
                      <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-full border border-white/5">
                        <i className="fa-solid fa-user-group text-primary"></i>
                        <span className="uppercase tracking-widest">{w.ageGroup || "All Ages"}</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-full border border-white/5">
                        <i className="fa-solid fa-marker text-primary"></i>
                        <span className="uppercase tracking-widest">{w.location || "On-Vibe"}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-primary font-black tracking-[0.3em] mb-1">Standard Entry</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-black text-foreground">Rs.</span>
                          <span className="text-3xl font-black text-foreground tracking-tighter">{w.price || 0}</span>
                        </div>
                      </div>

                      {userData?.registeredWorkshops?.includes(w.id) ? (
                        <div className="px-8 py-4 rounded-2xl bg-green-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-green-500/20">
                          Joined ✓
                        </div>
                      ) : (
                        <Link href={`/register/${w.id}`} className="btn-vibe-primary px-10 py-5 !rounded-2xl !text-[10px] shadow-2xl shadow-primary/30">
                          Secure Spot
                        </Link>
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
        )}

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
      </div>
    </main>
  );
}

export default dynamic(() => Promise.resolve(WorkshopsPage), { ssr: false });
