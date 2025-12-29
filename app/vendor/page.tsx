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
import { uploadRefundProof } from "@/firebase/refundActions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Legend
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
  bankDetails?: string;
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
  const [activeTab, setActiveTab] = useState<"overview" | "workshops" | "analytics" | "participants" | "customOrders" | "profile">("overview");

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [customOrders, setCustomOrders] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState("");
  const [profileBusinessName, setProfileBusinessName] = useState("");
  const [profileBankDetails, setProfileBankDetails] = useState("");
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileSocialLink, setProfileSocialLink] = useState("");

  // Refund Proof Modal State
  const [refundProofModalOpen, setRefundProofModalOpen] = useState(false);
  const [selectedRefundReg, setSelectedRefundReg] = useState<{ id: string, name: string } | null>(null);
  const [refundProofFile, setRefundProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  useEffect(() => {
    if (userData?.customOrdersEnabled !== undefined) {
      setCustomOrdersEnabled(userData.customOrdersEnabled);
    }
    if (userData?.businessName) setProfileBusinessName(userData.businessName);
    if (userData?.bankDetails) setProfileBankDetails(userData.bankDetails);
    if (userData?.displayName) setProfileDisplayName(userData.displayName);
    if (userData?.phoneNumber) setProfilePhone(userData.phoneNumber);
    if (userData?.socialLink) setProfileSocialLink(userData.socialLink);
  }, [userData]);

  useEffect(() => {
    if (selectedWorkshop && isEditOpen) {
      setTitle(selectedWorkshop.title);
      setDescription(selectedWorkshop.description);
      setPrice(selectedWorkshop.price);
      setCategory(selectedWorkshop.category);
      setDate(selectedWorkshop.date);
      setWhatsappLink(selectedWorkshop.whatsappLink || "");
      if (selectedWorkshop.imageUrls && selectedWorkshop.imageUrls.length > 0) {
        setImagePreviews(selectedWorkshop.imageUrls);
      } else if (selectedWorkshop.imageUrl) {
        setImagePreviews([selectedWorkshop.imageUrl]);
      } else if (selectedWorkshop.imageBase64) {
        setImagePreviews([selectedWorkshop.imageBase64]);
      }
      setLocation(selectedWorkshop.location || "Online");
      setCapacity(selectedWorkshop.capacity || 0);
      setAgeGroup(selectedWorkshop.ageGroup || "All Ages");
      setConsentRequired(selectedWorkshop.consentRequired || false);
      setRefundPolicy(selectedWorkshop.refundPolicy || "");
      setBankDetails(selectedWorkshop.bankDetails || "");
    }
  }, [selectedWorkshop, isEditOpen]);

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

      // Fetch Custom Requests
      const customQ = query(
        collection(db, "custom_requests"),
        where("vendorId", "in", [user.uid, "all"]),
        where("status", "!=", "completed") // Optional: hide completed? or just show all. Let's show all for now, maybe sort by date
      );
      // Note: Inequality filter property and first sort order must be the same field and other constraints...
      // Simpler query:
      const customQSimple = query(collection(db, "custom_requests"), where("vendorId", "in", [user.uid, "all"]));
      const customSnap = await getDocs(customQSimple);
      const cList = customSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCustomOrders(cList);

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
      await createWorkshop(user.uid, { title, description, price, category, date, whatsappLink, images, image: images[0], location, capacity, ageGroup, consentRequired, refundPolicy, bankDetails: bankDetails || profileBankDetails });
      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (err) { alert("Error creating workshop"); }
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setPrice(0); setCategory("Art"); setDate(""); setWhatsappLink(""); setImages([]); setImagePreviews([]); setLocation("Online"); setCapacity(0); setAgeGroup("All Ages"); setConsentRequired(false);
    setRefundPolicy(`Refunds are done outside the site. Please contact me on WhatsApp: ${profilePhone || ""}`);
    setBankDetails(""); setSelectedWorkshop(null);
  };

  const handleUploadProof = async () => {
    if (!selectedRefundReg || !refundProofFile) return;
    setUploadingProof(true);
    try {
      await uploadRefundProof(selectedRefundReg.id, refundProofFile);
      setRefundProofModalOpen(false);
      setRefundProofFile(null);
      setSelectedRefundReg(null);
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Failed to upload proof");
    } finally {
      setUploadingProof(false);
    }
  };

  const calculateRevenue = () => workshops.reduce((acc, ws) => acc + (ws.price * (participantsMap[ws.id]?.filter(p => p.status === 'paid').length || 0)), 0);
  const totalParticipants = Object.values(participantsMap).reduce((acc, list) => acc + list.filter(p => p.status !== 'refunded').length, 0);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading Dashboard...</p>
      </div>
    </div>
  );

  if (!userData?.isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg glass-card !p-10 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <i className="fa-solid fa-lock text-4xl text-amber-500"></i>
          </div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Access Restricted</h1>
          <p className="text-muted-foreground font-medium text-lg leading-relaxed">
            Your vendor account is currently pending administrative approval.
          </p>
          <div className="bg-secondary/50 p-4 rounded-2xl border border-white/5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <i className="fa-solid fa-circle-info mr-2 text-primary"></i>
            You will receive access once verified.
          </div>
          <button onClick={() => router.push('/')} className="btn-vibe-secondary w-full">
            Return Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary/20">
      {/* Sidebar - Desktop Only */}
      <aside className="fixed left-0 top-24 bottom-0 w-72 bg-card/30 backdrop-blur-xl border-r border-white/5 z-40 hidden lg:flex flex-col p-6 overflow-y-auto">
        {/* Navigation */}
        <nav className="space-y-2 flex-1 mt-4">
          <button onClick={() => setActiveTab("overview")} className={`sidebar-item w-full ${activeTab === 'overview' ? 'active' : ''}`}>
            <i className="fa-solid fa-grid-2"></i> Overview
          </button>
          <button onClick={() => setActiveTab("profile")} className={`sidebar-item w-full ${activeTab === 'profile' ? 'active' : ''}`}>
            <i className="fa-solid fa-store"></i> Profile
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
      <main className="flex-1 lg:ml-72 min-h-screen relative p-6 lg:p-10 transition-all">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-foreground mb-1">
              Welcome back, <span className="text-primary">{userData?.displayName?.split(' ')[0] || 'Creator'}</span>
            </h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Your academy is growing.</p>
          </div>
          <button
            onClick={() => { resetForm(); setIsCreateOpen(true); }}
            className="btn-vibe-primary flex items-center gap-3 shadow-lg shadow-primary/20"
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
                <div className="glass-card group relative hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-xl border border-indigo-500/10">
                      <i className="fa-solid fa-gem"></i>
                    </div>
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">+12% this month</span>
                  </div>
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Revenue</h3>
                  <p className="text-3xl font-black text-foreground">Rs. {calculateRevenue().toLocaleString()}</p>
                </div>

                <div className="glass-card group relative hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xl border border-emerald-500/10">
                      <i className="fa-solid fa-users-rays"></i>
                    </div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{totalParticipants} Active</span>
                  </div>
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Students</h3>
                  <p className="text-3xl font-black text-foreground">{totalParticipants.toLocaleString()}</p>
                </div>

                <div className="glass-card group relative hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 text-xl border border-amber-500/10">
                      <i className="fa-solid fa-rocket"></i>
                    </div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{workshops.length} Live</span>
                  </div>
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Active Workshops</h3>
                  <p className="text-3xl font-black text-foreground">{workshops.length.toLocaleString()}</p>
                </div>

                <div className="glass-card group relative overflow-hidden hover:-translate-y-1 transition-transform duration-300">
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
                      <div key={ws.id} className="glass-card overflow-hidden !p-0 group border-white/5 cursor-pointer" onClick={() => { setSelectedWorkshop(ws); setActiveTab("participants"); }}>
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
                            {(participantsMap[ws.id] || []).length > 0 ? (
                              <>
                                {(participantsMap[ws.id] || []).slice(0, 3).map((p, idx) => (
                                  <div key={idx} className="w-6 h-6 rounded-full border-2 border-[#121212] bg-indigo-500 flex items-center justify-center text-[8px] font-black text-white" title={p.displayName}>
                                    {p.displayName[0]}
                                  </div>
                                ))}
                                {(participantsMap[ws.id]?.length || 0) > 3 && (
                                  <div className="w-6 h-6 rounded-full border-2 border-[#121212] bg-primary flex items-center justify-center text-[8px] font-bold text-white">
                                    +{(participantsMap[ws.id]?.length || 0) - 3}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-bold italic opacity-50">No students yet</span>
                            )}
                          </div>
                          <button className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all">
                            <i className="fa-solid fa-arrow-right text-xs"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-xl font-black text-foreground">Revenue Flow</h2>
                  <div className="glass-card h-80 flex items-center justify-center relative z-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={workshops.slice(0, 5).map(ws => ({
                          name: ws.title.substring(0, 5) + '...',
                          rev: ws.price * (participantsMap[ws.id]?.length || 0)
                        }))}>
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: 'transparent' }}
                          contentStyle={{ background: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                          labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                          itemStyle={{ color: '#aaa' }}
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

          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-8"
            >
              {/* Header Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex items-center justify-between relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Earnings</p>
                    <h3 className="text-3xl font-black text-foreground">Rs. {calculateRevenue().toLocaleString()}</h3>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md mt-2 inline-block">+24% vs last month</span>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-2xl flex items-center justify-center text-emerald-500 text-2xl group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-sack-dollar"></i>
                  </div>
                </div>

                <div className="glass-card p-6 flex items-center justify-between relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Enrollments</p>
                    <h3 className="text-3xl font-black text-foreground">{totalParticipants}</h3>
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-md mt-2 inline-block">Active Students</span>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-2xl flex items-center justify-center text-indigo-500 text-2xl group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-graduation-cap"></i>
                  </div>
                </div>

                <div className="glass-card p-6 flex items-center justify-between relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Avg. Ticket Price</p>
                    <h3 className="text-3xl font-black text-foreground">
                      Rs. {(workshops.reduce((acc, w) => acc + w.price, 0) / (workshops.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </h3>
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md mt-2 inline-block">Per Workshop</span>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-transparent rounded-2xl flex items-center justify-center text-amber-500 text-2xl group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-ticket"></i>
                  </div>
                </div>
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Trend */}
                <div className="glass-card !p-8 flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-black text-foreground">Revenue Trend</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Growth over time</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
                      <i className="fa-solid fa-ellipsis"></i>
                    </div>
                  </div>
                  <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={workshops.map(w => ({
                          name: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                          revenue: w.price * (participantsMap[w.id]?.filter(p => p.status === 'paid' || p.status === 'approved').length || 0)
                        })).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())}
                      >
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} tickFormatter={(value) => `Rs.${value / 1000}k`} />
                        <Tooltip
                          contentStyle={{ background: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Workshop Performance */}
                <div className="glass-card !p-8 flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-black text-foreground">Top Performing Workshops</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">By enrollment volume</p>
                    </div>
                  </div>
                  <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={workshops
                          .map(w => ({ name: w.title, count: participantsMap[w.id]?.length || 0 }))
                          .sort((a, b) => b.count - a.count)
                          .slice(0, 5)
                        }
                      >
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: 'transparent' }}
                          contentStyle={{ background: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                          {workshops.map((_, i) => <Cell key={i} fill={`hsl(260, 100%, ${60 + (i * 5)}%)`} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Demographics & Recent Tx */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Demographics */}
                <div className="glass-card !p-8">
                  <h3 className="text-lg font-black text-foreground mb-1">Audience Age</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-8">Demographic breakdown</p>

                  <div className="h-[250px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Kids (0-12)', value: Object.values(participantsMap).flat().filter(p => p.details && parseInt(p.details.age) <= 12).length },
                            { name: 'Teens (13-19)', value: Object.values(participantsMap).flat().filter(p => p.details && parseInt(p.details.age) > 12 && parseInt(p.details.age) <= 19).length },
                            { name: 'Adults (20+)', value: Object.values(participantsMap).flat().filter(p => p.details && parseInt(p.details.age) > 19).length },
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#ef4444" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#3b82f6" />
                        </Pie>
                        <Tooltip contentStyle={{ background: '#121212', borderRadius: '8px', border: 'none', fontSize: '10px' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <span className="text-2xl font-black text-foreground">{totalParticipants}</span>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Students</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="lg:col-span-2 glass-card !p-0 overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-white/5">
                    <h3 className="text-lg font-black text-foreground mb-1">Recent Enrollments</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Latest student activity</p>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    {Object.values(participantsMap).flat()
                      .filter(p => p.status === 'paid' || p.status === 'approved')
                      .slice(0, 5)
                      .map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-6 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-black">
                              {p.displayName[0]}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-foreground">{p.displayName}</h4>
                              <p className="text-[10px] text-muted-foreground font-medium">{p.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-emerald-500 block">+ Paid</span>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase">{p.status}</span>
                          </div>
                        </div>
                      ))}
                    {Object.values(participantsMap).flat().length === 0 && (
                      <div className="p-10 text-center text-muted-foreground text-xs font-bold uppercase tracking-widest">No recent transactions</div>
                    )}
                  </div>
                </div>
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
                            {p.refundStatus === 'refund_requested' || p.refundStatus === 'vendor_proof_uploaded' ? (
                              <button
                                onClick={() => {
                                  setSelectedRefundReg({ id: p.registrationId!, name: p.displayName || 'Unknown' });
                                  setRefundProofModalOpen(true);
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${p.refundStatus === 'vendor_proof_uploaded' ? 'bg-emerald-500 text-white' : 'bg-secondary hover:bg-primary hover:text-white'}`}
                                title="Upload Refund Proof"
                              >
                                {p.refundStatus === 'vendor_proof_uploaded' ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-upload"></i>}
                              </button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-bold">-</span>
                            )}
                          </div>
                        </div>

                        <div className="h-10 w-px bg-border mx-2 hide-mobile" />

                        <div className="flex items-center gap-2">
                          <select
                            value={p.status}
                            onChange={async (e) => {
                              if (!p.registrationId) return;
                              await updateDoc(doc(db, "registrations", p.registrationId), { status: e.target.value });
                              fetchData();
                            }}
                            className="bg-secondary border border-border rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary/40 transition-all cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
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
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {customOrders.map((order: any) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card !p-0 relative overflow-hidden flex flex-col group border-white/5 hover:border-primary/20 transition-all"
                    >
                      <div className={`h-2 absolute top-0 left-0 right-0 ${order.status === 'accepted' ? 'bg-gradient-to-r from-green-400 to-emerald-600' :
                        order.status === 'rejected' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                          'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
                        }`} />

                      <div className="p-8 space-y-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3 inline-block">
                              {order.vendorId === 'all' ? 'Open Request' : 'Direct Request'}
                            </span>
                            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight leading-none mb-1">{order.topic}</h3>
                            <p className="text-xs font-bold text-muted-foreground">From {order.userName}</p>
                          </div>
                          {order.pdfUrl && (
                            <a
                              href={order.pdfUrl}
                              target="_blank"
                              className="w-10 h-10 rounded-xl bg-secondary hover:bg-primary hover:text-white flex items-center justify-center transition-all shadow-lg"
                              title="Download Requirement"
                            >
                              <i className="fa-solid fa-file-pdf"></i>
                            </a>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-secondary/30 border border-white/5">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Budget</p>
                            <p className="text-lg font-black text-emerald-500">LKR {order.budget}</p>
                          </div>
                          <div className="p-4 rounded-2xl bg-secondary/30 border border-white/5">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Attendees</p>
                            <p className="text-lg font-black text-foreground">{order.attendees || "N/A"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                          {order.status === 'pending' ? (
                            <>
                              <button
                                onClick={async () => {
                                  if (confirm("Accept this request? You should contact the user after this.")) {
                                    await updateDoc(doc(db, "custom_requests", order.id), { status: 'accepted' });
                                    fetchData();
                                  }
                                }}
                                className="flex-1 py-3 bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-green-500 hover:text-white transition-all"
                              >
                                Accept
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm("Reject this request?")) {
                                    await updateDoc(doc(db, "custom_requests", order.id), { status: 'rejected' });
                                    fetchData();
                                  }
                                }}
                                className="flex-1 py-3 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <div className="w-full text-center py-2">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${order.status === 'accepted' ? 'text-green-500' : 'text-red-500'
                                }`}>
                                {order.status === 'accepted' ? <><i className="fa-solid fa-check-circle mr-2"></i> Accepted</> : <><i className="fa-solid fa-ban mr-2"></i> Rejected</>}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                  }
                </div>
              )}
            </motion.div>
          )}



          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="glass-card !p-0 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                  <div className="absolute -bottom-12 left-10 w-24 h-24 rounded-3xl bg-card border-4 border-card flex items-center justify-center overflow-hidden shadow-2xl">
                    {user?.photoURL ? (
                      <img src={user.photoURL} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center text-3xl font-black text-muted-foreground">
                        {profileDisplayName[0]}
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-16 pb-10 px-10 flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-black text-foreground">{profileDisplayName}</h2>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">{user?.email}</p>
                  </div>
                  <span className="px-4 py-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-500/20">
                    Verified Vendor
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal / Contact Info */}
                <div className="glass-card !p-8 space-y-6 h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <i className="fa-solid fa-id-card"></i>
                    </div>
                    <h3 className="text-lg font-black text-foreground">Identity & Contact</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Display Name</label>
                      <input
                        value={profileDisplayName}
                        onChange={(e) => setProfileDisplayName(e.target.value)}
                        className="w-full px-5 py-4 bg-secondary/30 border border-white/5 rounded-2xl text-sm font-bold text-foreground focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/20"
                        placeholder="Your Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Email Address</label>
                      <input
                        value={user?.email || ""}
                        disabled
                        className="w-full px-5 py-4 bg-secondary/10 border border-white/5 rounded-2xl text-sm font-bold text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Phone Number</label>
                      <input
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full px-5 py-4 bg-secondary/30 border border-white/5 rounded-2xl text-sm font-bold text-foreground focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/20"
                        placeholder="+94 77 123 4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Social / Portfolio Link</label>
                      <input
                        value={profileSocialLink}
                        onChange={(e) => setProfileSocialLink(e.target.value)}
                        className="w-full px-5 py-4 bg-secondary/30 border border-white/5 rounded-2xl text-sm font-bold text-foreground focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/20"
                        placeholder="Instagram, Google Drive, Website..."
                      />
                    </div>
                  </div>
                </div>

                {/* Business Info */}
                <div className="glass-card !p-8 space-y-6 h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <i className="fa-solid fa-briefcase"></i>
                    </div>
                    <h3 className="text-lg font-black text-foreground">Business Details</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Business Name</label>
                      <input
                        value={profileBusinessName}
                        onChange={(e) => setProfileBusinessName(e.target.value)}
                        className="w-full px-5 py-4 bg-secondary/30 border border-white/5 rounded-2xl text-sm font-bold text-foreground focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/20"
                        placeholder="e.g. The Art Collective"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Bank / Payment Details</label>
                      <textarea
                        value={profileBankDetails}
                        onChange={(e) => setProfileBankDetails(e.target.value)}
                        className="w-full px-5 py-4 bg-secondary/30 border border-white/5 rounded-2xl text-xs font-bold text-foreground focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/20 min-h-[120px] resize-none leading-relaxed"
                        placeholder="Bank Name: ...&#10;Account No: ...&#10;Branch: ..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={async () => {
                    if (!user) return;
                    try {
                      await updateDoc(doc(db, "users", user.uid), {
                        displayName: profileDisplayName,
                        phoneNumber: profilePhone,
                        businessName: profileBusinessName,
                        bankDetails: profileBankDetails,
                        socialLink: profileSocialLink
                      });
                      alert("Profile updated successfully!");
                      // Force a reload or context update could be nice here, but alert confirms action.
                    } catch (e) {
                      alert("Failed to update profile.");
                    }
                  }}
                  className="btn-vibe-primary px-12 py-4 shadow-xl shadow-primary/20 text-sm"
                >
                  Save Profile Changes
                </button>
              </div>
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
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-4xl bg-[#121212] border border-white/10 rounded-[2rem] overflow-hidden shadow-3xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2 backdrop-blur-sm">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {isEditOpen ? "Edit Workshop" : "Launch New Workshop"}
                  </h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    {isEditOpen ? "Modify your listing details" : "Share your skill with the world"}
                  </p>
                </div>
                <button onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-colors">
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                  {/* Left Column - Media & Basic Info */}
                  <div className="lg:col-span-7 space-y-8">
                    {/* Image Upload Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
                          <i className="fa-solid fa-image"></i> Workshop Gallery
                        </label>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{imagePreviews.length}/3 Images</span>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        {/* Image Previews */}
                        {imagePreviews.map((src, idx) => (
                          <div key={idx} className="aspect-square relative rounded-2xl overflow-hidden group border border-white/10 shadow-lg">
                            <img src={src} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={`Preview ${idx}`} />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={() => {
                                  setImages(prev => prev.filter((_, i) => i !== idx));
                                  setImagePreviews(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform"
                              >
                                <i className="fa-solid fa-trash text-xs"></i>
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Add Button */}
                        {images.length < 3 && (
                          <label className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all gap-3 group relative overflow-hidden">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:bg-white/10">
                              <i className="fa-solid fa-plus text-lg text-muted-foreground group-hover:text-primary transition-colors"></i>
                            </div>
                            <span className="text-[9px] font-black uppercase text-muted-foreground group-hover:text-foreground transition-colors">Upload</span>
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
                                  setImagePreviews(prev => [...prev, ...newPreviews].slice(0, 3));
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Title Input */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] pl-1">Title</label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-5 py-4 bg-zinc-900/50 border border-white/10 rounded-2xl text-lg font-bold text-white placeholder:text-muted-foreground/30 focus:border-primary/50 focus:bg-zinc-900 outline-none transition-all"
                        placeholder="e.g. Masterclass in Oil Painting..."
                      />
                    </div>

                    {/* Description Input */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] pl-1">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-5 py-4 bg-zinc-900/50 border border-white/10 rounded-2xl text-sm font-medium text-zinc-300 placeholder:text-muted-foreground/30 focus:border-primary/50 focus:bg-zinc-900 outline-none transition-all h-40 resize-none leading-relaxed"
                        placeholder="Describe what participants will learn, bring, and experience..."
                      />
                    </div>
                  </div>

                  {/* Right Column - Details & Logistics */}
                  <div className="lg:col-span-5 space-y-8">
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-6">
                      <h4 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2 mb-4">
                        <i className="fa-solid fa-list-check text-primary"></i> Logistics
                      </h4>

                      {/* Price */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Price (LKR)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">Rs.</span>
                          <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white font-bold focus:border-primary/50 outline-none transition-all"
                            placeholder="2500"
                          />
                        </div>
                      </div>

                      {/* Date */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Date</label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white font-bold focus:border-primary/50 outline-none transition-all appearance-none"
                        />
                      </div>

                      {/* Custom Selects */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Category</label>
                          <div className="relative">
                            <select
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-primary/50 outline-none appearance-none cursor-pointer"
                            >
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none"></i>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Audience</label>
                          <div className="relative">
                            <select
                              value={ageGroup}
                              onChange={(e) => setAgeGroup(e.target.value)}
                              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-primary/50 outline-none appearance-none cursor-pointer"
                            >
                              <option value="All Ages">All Ages</option>
                              <option value="Kids">Kids (0-12)</option>
                              <option value="Teens">Teens (13-19)</option>
                              <option value="Adults">Adults (20+)</option>
                              <option value="Seniors">Seniors (55+)</option>
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"></i>
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Location</label>
                        <input
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm font-bold focus:border-primary/50 outline-none transition-all"
                          placeholder="e.g. Online / Colombo 7"
                        />
                      </div>
                      {/* Bank Details */}
                      <div className="space-y-2 col-span-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
                          <i className="fa-solid fa-money-bill-transfer"></i> Bank / Payment Details
                        </label>
                        <textarea
                          value={bankDetails}
                          onChange={(e) => setBankDetails(e.target.value)}
                          className="w-full px-5 py-4 bg-zinc-900/50 border border-white/10 rounded-2xl text-xs font-bold text-white placeholder:text-muted-foreground/30 focus:border-primary/50 focus:bg-zinc-900 outline-none transition-all h-24 resize-none leading-relaxed"
                          placeholder="Enter your Bank Name, Account Number, Branch, etc. These details will be shown to users for manual transfer."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/5 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between">
                <button
                  onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); }}
                  className="text-xs font-black uppercase text-muted-foreground hover:text-white transition-colors tracking-widest px-4 py-2"
                >
                  Cancel
                </button>
                <div className="flex gap-4">
                  <button onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); }} className="px-6 py-3 rounded-xl bg-white/5 border border-white/5 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
                    Save Draft
                  </button>
                  <button
                    onClick={isEditOpen ? () => {
                      if (!selectedWorkshop) return;
                      updateWorkshop(selectedWorkshop.id, {
                        title, description, price, category, date, whatsappLink,
                        images: images.length > 0 ? images : undefined,
                        location, capacity, ageGroup, consentRequired, refundPolicy, bankDetails
                      });
                      setIsEditOpen(false);
                      resetForm();
                      fetchData();
                    } : handleCreate}
                    className="px-8 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <i className="fa-solid fa-rocket"></i>
                    {isEditOpen ? "Update Listing" : "Publish Workshop"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {refundProofModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRefundProofModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-card w-full max-w-md relative z-10 !p-8">
              <h3 className="text-xl font-black text-foreground mb-4">Upload Refund Proof</h3>
              <p className="text-sm text-muted-foreground mb-6">Upload a screenshot or receipt of the refund transaction for <b>{selectedRefundReg?.name}</b>.</p>

              <div className="space-y-4">
                <div className="relative h-32 bg-secondary/30 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center group hover:border-primary/50 transition-all">
                  <input type="file" onChange={e => setRefundProofFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,application/pdf" />
                  <i className={`fa-solid ${refundProofFile ? 'fa-check text-emerald-500' : 'fa-cloud-upload text-muted-foreground'} text-2xl mb-2`}></i>
                  <span className="text-xs font-black uppercase text-muted-foreground">{refundProofFile ? refundProofFile.name : "Click to Upload"}</span>
                </div>

                <button onClick={handleUploadProof} disabled={uploadingProof || !refundProofFile} className="btn-vibe-primary w-full">
                  {uploadingProof ? "Uploading..." : "Submit Proof"}
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
