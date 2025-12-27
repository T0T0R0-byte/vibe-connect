"use client";

import React, { useEffect, useState } from "react";
import {
  createWorkshop,
  getVendorWorkshops,
  deleteWorkshop,
  updateWorkshop,
} from "../../firebase/workshopActions";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs, query, where, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { vendorFinalizeRefund } from "@/firebase/refundActions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface Workshop {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  imageUrls?: string[];
  imageBase64?: string;
  date: string;
  vendorId: string;
  whatsappLink?: string;
  location?: string;
  capacity?: number;
  ageGroup?: string;
  consentRequired?: boolean;
  refundPolicy?: string;
}

interface Participant {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  receiptUrl?: string;
  consentUrl?: string;
  receiptBase64?: string;
  refundProofUrl?: string;
  status?: "pending" | "approved" | "rejected" | "paid" | "failed" | "refunded";
  registrationId?: string;
  refundStatus?: string;
  details?: {
    fullName: string;
    age: string;
    phone: string;
    address: string;
    consentUrl?: string;
  };
}

const CATEGORIES = ["Art", "Music", "Technology", "Cooking", "Sports", "Business", "Health", "Other"];

const VendorDashboard: React.FC = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [participantsMap, setParticipantsMap] = useState<Record<string, Participant[]>>({});

  // Navigation State
  const [activeTab, setActiveTab] = useState<"overview" | "workshops" | "analytics" | "participants" | "customOrders">("overview");

  // Selection States
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState("Art");
  const [date, setDate] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [location, setLocation] = useState("Online");
  const [capacity, setCapacity] = useState(0);
  const [ageGroup, setAgeGroup] = useState("All Ages");
  const [consentRequired, setConsentRequired] = useState(false);
  const [refundPolicy, setRefundPolicy] = useState("");
  const [customOrdersEnabled, setCustomOrdersEnabled] = useState(false);
  const [customOrders, setCustomOrders] = useState<any[]>([]);

  useEffect(() => {
    if (userData?.customOrdersEnabled !== undefined) {
      setCustomOrdersEnabled(userData.customOrdersEnabled);
    }
  }, [userData]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    if (userData?.role !== "vendor") { router.push("/"); return; }
    fetchData();
  }, [user, userData, authLoading, router]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getVendorWorkshops(user.uid);
      setWorkshops(data as Workshop[]);
      const pMap: Record<string, Participant[]> = {};
      for (const ws of data as Workshop[]) {
        const q = query(collection(db, "registrations"), where("workshopId", "==", ws.id));
        const snap = await getDocs(q);
        const participants: Participant[] = [];
        for (const regDoc of snap.docs) {
          const regData = regDoc.data();
          const userSnap = await getDoc(doc(db, "users", regData.userId));
          if (userSnap.exists()) {
            const uData = userSnap.data();
            participants.push({
              uid: uData.uid,
              displayName: regData.participantDetails?.fullName || uData.displayName,
              email: uData.email,
              phoneNumber: uData.phoneNumber,
              receiptUrl: regData.receiptUrl,
              refundProofUrl: regData.refundProofUrl,
              status: regData.status || "pending",
              registrationId: regDoc.id,
              refundStatus: regData.refundStatus || "none",
              consentUrl: regData.consentUrl,
              details: regData.participantDetails
            });
          }
        }
        pMap[ws.id] = participants;
      }
      setParticipantsMap(pMap);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !title || !description || !date) { alert("Fill all fields"); return; }
    try {
      await createWorkshop(user.uid, { title, description, price, category, date, whatsappLink, images, image: images[0], location, capacity, ageGroup, consentRequired, refundPolicy });
      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (err) { alert("Error creating workshop"); }
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setPrice(0); setCategory("Art"); setDate(""); setWhatsappLink(""); setImages([]); setImagePreviews([]); setLocation("Online"); setCapacity(0); setAgeGroup("All Ages"); setConsentRequired(false); setRefundPolicy(""); setSelectedWorkshop(null);
  };

  const calculateRevenue = () => workshops.reduce((acc, ws) => acc + (ws.price * (participantsMap[ws.id]?.filter(p => p.status === 'paid' || p.status === 'approved').length || 0)), 0);
  const totalParticipants = Object.values(participantsMap).reduce((acc, list) => acc + list.filter(p => p.status !== 'refunded').length, 0);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop Only */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-card/30 backdrop-blur-xl border-r border-white/5 z-50 hidden lg:flex flex-col p-6">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/30">V</div>
          <span className="text-xl font-black tracking-tight text-gradient">Vibe Connect</span>
        </div>

        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab("overview")} className={`sidebar-item w-full ${activeTab === 'overview' ? 'active' : ''}`}>
            <i className="fa-solid fa-grid-2"></i> Overview
          </button>
          <button onClick={() => setActiveTab("workshops")} className={`sidebar-item w-full ${activeTab === 'workshops' ? 'active' : ''}`}>
            <i className="fa-solid fa-layer-group"></i> My Workshops
          </button>
          <button onClick={() => setActiveTab("analytics")} className={`sidebar-item w-full ${activeTab === 'analytics' ? 'active' : ''}`}>
            <i className="fa-solid fa-chart-line"></i> Analytics
          </button>
          <button onClick={() => setActiveTab("participants")} className={`sidebar-item w-full ${activeTab === 'participants' ? 'active' : ''}`}>
            <i className="fa-solid fa-users"></i> Participants
          </button>
          <button onClick={() => setActiveTab("customOrders")} className={`sidebar-item w-full ${activeTab === 'customOrders' ? 'active' : ''}`}>
            <i className="fa-solid fa-file-invoice text-primary"></i> Custom Requests
          </button>
        </nav>

        <div className="pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
              {userData?.displayName?.[0] || 'V'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-black text-foreground truncate">{userData?.displayName || 'Vendor'}</span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Active Vendor</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-h-screen relative p-6 lg:p-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-foreground mb-1">
              Welcome back, <span className="text-primary">{userData?.displayName?.split(' ')[0] || 'Creator'}</span>
            </h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Your academy is growing.</p>
          </div>
          <button
            onClick={() => { resetForm(); setIsCreateOpen(true); }}
            className="btn-vibe-primary flex items-center gap-3"
          >
            <i className="fa-solid fa-plus text-sm"></i>
            Launch Workshop
          </button>
        </header>

        {/* Dynamic Section Rendering */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card group relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-xl border border-indigo-500/10">
                      <i className="fa-solid fa-gem"></i>
                    </div>
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">+12% this month</span>
                  </div>
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Revenue</h3>
                  <p className="text-3xl font-black text-foreground">Rs. {calculateRevenue().toLocaleString()}</p>
                </div>

                <div className="glass-card group relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xl border border-emerald-500/10">
                      <i className="fa-solid fa-users-rays"></i>
                    </div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{totalParticipants} Active</span>
                  </div>
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Students</h3>
                  <p className="text-3xl font-black text-foreground">{totalParticipants.toLocaleString()}</p>
                </div>

                <div className="glass-card group relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 text-xl border border-amber-500/10">
                      <i className="fa-solid fa-rocket"></i>
                    </div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{workshops.length} Live</span>
                  </div>
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Active Workshops</h3>
                  <p className="text-3xl font-black text-foreground">{workshops.length.toLocaleString()}</p>
                </div>

                <div className="glass-card group relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border transition-all ${customOrdersEnabled ? 'bg-primary/10 text-primary border-primary/20' : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/10'}`}>
                      <i className="fa-solid fa-bolt-lightning"></i>
                    </div>
                    <button
                      onClick={async () => {
                        if (!user) return;
                        const newValue = !customOrdersEnabled;
                        setCustomOrdersEnabled(newValue);
                        await updateDoc(doc(db, "users", user.uid), { customOrdersEnabled: newValue });
                      }}
                      className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${customOrdersEnabled ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-500'}`}
                    >
                      {customOrdersEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Custom Orders</h3>
                  <p className="text-3xl font-black text-foreground">{customOrdersEnabled ? 'ACTIVE' : 'OFFLINE'}</p>
                  <div className={`absolute bottom-0 left-0 h-1 transition-all duration-500 ${customOrdersEnabled ? 'bg-primary w-full' : 'bg-transparent w-0'}`} />
                </div>
              </div>

              {/* Recent Activity / Workshops Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-foreground">Featured Listings</h2>
                    <button onClick={() => setActiveTab("workshops")} className="text-xs font-black uppercase text-primary tracking-widest hover:underline">View All</button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    {workshops.slice(0, 4).map((ws, i) => (
                      <div key={ws.id} className="glass-card overflow-hidden !p-0 group border-white/5">
                        <div className="h-40 relative group-hover:h-32 transition-all duration-500">
                          <img src={ws.imageBase64 || ws.imageUrl || undefined} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                          <div className="absolute bottom-3 left-3">
                            <span className="px-2 py-1 bg-primary/20 backdrop-blur-md rounded-lg text-[8px] font-black uppercase text-primary border border-primary/20 tracking-tighter">{ws.category}</span>
                            <h4 className="text-white font-black text-sm mt-1 truncate max-w-[150px]">{ws.title}</h4>
                          </div>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {[...Array(Math.min(3, participantsMap[ws.id]?.length || 0))].map((_, idx) => (
                              <div key={idx} className="w-6 h-6 rounded-full border-2 border-[#121212] bg-zinc-800" />
                            ))}
                            {(participantsMap[ws.id]?.length || 0) > 3 && (
                              <div className="w-6 h-6 rounded-full border-2 border-[#121212] bg-primary flex items-center justify-center text-[8px] font-bold text-white">
                                +{(participantsMap[ws.id]?.length || 0) - 3}
                              </div>
                            )}
                          </div>
                          <button onClick={() => { setSelectedWorkshop(ws); setActiveTab("participants"); }} className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all">
                            <i className="fa-solid fa-arrow-right text-xs"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-xl font-black text-foreground">Revenue Flow</h2>
                  <div className="glass-card h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={workshops.slice(0, 5).map(ws => ({
                          name: ws.title.substring(0, 5) + '...',
                          rev: ws.price * (participantsMap[ws.id]?.length || 0)
                        }))}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: 'transparent' }}
                          contentStyle={{ background: '#000', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                        />
                        <Bar dataKey="rev" radius={[10, 10, 10, 10]}>
                          {workshops.map((_, i) => <Cell key={i} fill={`hsl(250, 100%, ${60 + (i * 5)}%)`} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "workshops" && (
            <motion.div
              key="workshops"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {workshops.map(ws => (
                  <div key={ws.id} className="glass-card flex flex-col group card-glow">
                    <div className="h-48 rounded-2xl overflow-hidden mb-6 relative">
                      <img src={ws.imageBase64 || ws.imageUrl || undefined} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button onClick={() => { setSelectedWorkshop(ws); setIsEditOpen(true); }} className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-primary transition-colors text-xs">
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button onClick={async () => { if (confirm("Delete this workshop?")) { await deleteWorkshop(ws.id); fetchData(); } }} className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500 transition-colors text-xs">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">{ws.title}</h3>
                    <div className="flex items-center gap-4 text-muted-foreground text-xs font-bold uppercase tracking-widest mb-6">
                      <span className="flex items-center gap-1.5"><i className="fa-solid fa-calendar text-primary"></i> {new Date(ws.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><i className="fa-solid fa-user-group text-primary"></i> {participantsMap[ws.id]?.length || 0} Students</span>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-foreground">Rs. {ws.price.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Per Head</span>
                      </div>
                      <button
                        onClick={() => { setSelectedWorkshop(ws); setActiveTab("participants"); }}
                        className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
                      >
                        Manage Students <i className="fa-solid fa-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "participants" && (
            <motion.div
              key="participants"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="space-y-6"
            >
              <div className="glass-card !p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl">
                    <i className="fa-solid fa-users-viewfinder"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground">Participant Manager</h2>
                    <select
                      value={selectedWorkshop?.id || ""}
                      onChange={(e) => setSelectedWorkshop(workshops.find(w => w.id === e.target.value) || null)}
                      className="text-xs font-bold text-muted-foreground uppercase bg-transparent outline-none focus:text-primary transition-colors"
                    >
                      <option value="">Select Workshop to filter</option>
                      {workshops.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="relative w-full md:w-80">
                  <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-xs"></i>
                  <input
                    placeholder="Search students..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm outline-none focus:border-primary/50 transition-all font-bold placeholder:text-muted-foreground/30"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {(selectedWorkshop ? participantsMap[selectedWorkshop.id] : Object.values(participantsMap).flat())
                  ?.filter(p => (p.details?.fullName || p.displayName).toLowerCase().includes(participantSearch.toLowerCase()))
                  .map((p, i) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={p.registrationId || i}
                      className={`glass-card flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 !p-6 relative group overflow-hidden ${p.status === 'refunded' ? 'opacity-50 ring-1 ring-red-500/20' : ''}`}
                    >
                      {p.status === 'refunded' && (
                        <div className="absolute top-0 right-0 px-4 py-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-bl-xl">Refunded / Removed</div>
                      )}

                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                          {p.displayName[0]}
                        </div>
                        <div>
                          <h4 className="font-black text-foreground text-lg uppercase tracking-tight">{p.displayName}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">ID: {p.registrationId?.slice(-8).toUpperCase()}</span>
                            {p.refundStatus === 'refund_requested' && (
                              <span className="px-3 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-amber-500/20 animate-pulse flex items-center gap-2">
                                <i className="fa-solid fa-circle-exclamation"></i> Refund Requested
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {p.receiptUrl && (
                            <a href={p.receiptUrl} target="_blank" className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-sm group/icon" title="View Receipt">
                              <i className="fa-solid fa-receipt text-xs"></i>
                            </a>
                          )}
                          {p.consentUrl && (
                            <a href={p.consentUrl} target="_blank" className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all shadow-sm group/icon" title="View Consent Form">
                              <i className="fa-solid fa-file-contract text-xs"></i>
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:flex items-center gap-10 flex-1">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Contact Info</span>
                          <span className="text-xs font-bold text-foreground">{p.email}</span>
                          <span className="text-[10px] text-muted-foreground">{p.phoneNumber}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status</span>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-lg border uppercase w-fit ${p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            p.status === 'refunded' ? 'bg-zinc-500/10 text-muted-foreground border-zinc-500/20' :
                              'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>{p.status}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Refund</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">Off</span>
                            <button
                              onClick={async () => {
                                if (!p.registrationId) return;
                                if (p.status === 'refunded') return;
                                if (confirm("Process Refund? This will return 1 spot to capacity and deduct fee from revenue.")) {
                                  await vendorFinalizeRefund(p.registrationId);
                                  fetchData();
                                }
                              }}
                              className={`w-12 h-6 rounded-full relative transition-all duration-500 ${p.status === 'refunded' ? 'bg-red-500' : 'bg-secondary border border-border'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 rounded-full shadow-md transition-all duration-500 ${p.status === 'refunded' ? 'right-1 bg-white' : 'left-1 bg-muted-foreground'}`} />
                            </button>
                            <span className={`text-[10px] font-black uppercase ${p.status === 'refunded' ? 'text-red-500' : 'text-muted-foreground'}`}>Refunded</span>
                          </div>
                          {p.refundStatus === 'refund_requested' && (
                            <button
                              onClick={async () => {
                                if (p.registrationId && confirm("Approve this refund request?")) {
                                  await vendorFinalizeRefund(p.registrationId);
                                  fetchData();
                                }
                              }}
                              className="w-full mt-2 px-3 py-1 bg-amber-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center justify-center gap-2 animate-pulse"
                            >
                              <i className="fa-solid fa-check"></i> Approve Refund
                            </button>
                          )}
                        </div>

                        <div className="h-10 w-px bg-border mx-2 hide-mobile" />

                        <div className="flex items-center gap-2">
                          <select
                            value={p.status}
                            onChange={async (e) => {
                              if (!p.registrationId) return;
                              if (e.target.value === 'refunded') {
                                if (confirm("Process Refund?")) {
                                  await vendorFinalizeRefund(p.registrationId);
                                  fetchData();
                                }
                                return;
                              }
                              await updateDoc(doc(db, "registrations", p.registrationId), { status: e.target.value });
                              fetchData();
                            }}
                            className="bg-secondary border border-border rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary/40 transition-all cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="approved">Approved</option>
                            <option value="refunded" disabled={p.status === 'refunded'}>Refunded</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          )}
          {activeTab === "customOrders" && (
            <motion.div
              key="customOrders"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-8"
            >
              <div className="glass-card !p-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary text-2xl shadow-inner">
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground leading-[0.9]">Custom Requests</h2>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2">Manage bespoke workshop requests</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-2 bg-secondary/50 rounded-3xl border border-border">
                  <span className="pl-4 text-[10px] font-black uppercase text-muted-foreground">Accepting Request</span>
                  <button
                    onClick={async () => {
                      if (!user) return;
                      const newValue = !customOrdersEnabled;
                      setCustomOrdersEnabled(newValue);
                      await updateDoc(doc(db, "users", user.uid), { customOrdersEnabled: newValue });
                    }}
                    className={`w-14 h-8 rounded-2xl relative transition-all duration-500 ${customOrdersEnabled ? 'bg-primary' : 'bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-xl shadow-md transition-all duration-500 ${customOrdersEnabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              {customOrders.length === 0 ? (
                <div className="glass-card py-32 text-center space-y-4">
                  <div className="w-20 h-20 bg-secondary rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 opacity-20">
                    <i className="fa-solid fa-ghost text-4xl"></i>
                  </div>
                  <h3 className="text-xl font-black text-foreground">No Custom Requests Yet</h3>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest max-w-md mx-auto">When users request specialized workshops, they will appear here.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Custom Order Cards Map would go here */}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Background Effects */}
        <div className="fixed top-1/4 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10 rounded-full animate-vibe-float" />
        <div className="fixed bottom-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] -z-10 rounded-full animate-vibe-float" style={{ animationDelay: '3s' }} />
      </main>

      {/* Overlays / Modals */}
      <AnimatePresence>
        {(isCreateOpen || isEditOpen) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-card border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2">
                <h2 className="text-2xl font-black text-foreground">
                  {isEditOpen ? "Edit Workshop" : "Launch New Workshop"}
                </h2>
                <button onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); }} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-colors">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Workshop Images (Max 3)</label>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {imagePreviews.map((src, idx) => (
                        <div key={idx} className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden group border border-white/10">
                          <img src={src} className="w-full h-full object-cover" />
                          <button
                            onClick={() => {
                              setImages(prev => prev.filter((_, i) => i !== idx));
                              setImagePreviews(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      ))}
                      {images.length < 3 && (
                        <label className="w-24 h-24 flex-shrink-0 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all gap-2">
                          <i className="fa-solid fa-plus text-muted-foreground"></i>
                          <span className="text-[9px] font-black uppercase text-muted-foreground">Add Img</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files) {
                                const newFiles = Array.from(e.target.files);
                                const totalFiles = [...images, ...newFiles].slice(0, 3);
                                setImages(totalFiles);
                                const newPreviews = totalFiles.map(f => URL.createObjectURL(f));
                                setImagePreviews(newPreviews);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Workshop Title</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all" placeholder="Enter Title..." />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Date & Time</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Location</label>
                    <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all" placeholder="e.g. Online, Colombo 7" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Price per Head (LKR)</label>
                    <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all" placeholder="Rs. 2500" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Target Audience</label>
                    <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all">
                      <option value="All Ages">All Ages</option>
                      <option value="Kids">Kids (0-12)</option>
                      <option value="Teens">Teens (13-19)</option>
                      <option value="Adults">Adults (20+)</option>
                      <option value="Seniors">Seniors (55+)</option>
                    </select>
                  </div>
                  <div className="space-y-4 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all h-32 resize-none" placeholder="What will they learn?" />
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-white/2 flex justify-end gap-4">
                <button onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); }} className="btn-vibe-secondary">Discard</button>
                <button onClick={isEditOpen ? () => { } : handleCreate} className="btn-vibe-primary px-10">
                  {isEditOpen ? "Update Workshop" : "Publish Workshop"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default VendorDashboard;
