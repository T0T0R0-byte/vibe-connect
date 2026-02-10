"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Firebase
import { collection, query, where, onSnapshot, getDoc, doc, updateDoc, increment, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { sanitizeData } from "@/app/utils/serialize";

// Models
import { Workshop } from "../models/Workshop";
import { Participant } from "../models/Participant";

// Controllers
import { WorkshopController } from "../controllers/WorkshopController";
import { ParticipantController } from "../controllers/ParticipantController";

// Views
import { OverviewView } from "../components/views/VendorDashboard/OverviewView";
import { WorkshopsView } from "../components/views/VendorDashboard/WorkshopsView";
import { ParticipantsView } from "../components/views/VendorDashboard/ParticipantsView";
import { RefundsView } from "../components/views/VendorDashboard/RefundsView";
import { CustomizationView } from "../components/views/VendorDashboard/CustomizationView";
import { ReviewsView } from "../components/views/VendorDashboard/ReviewsView";
import { CustomRequestsView } from "../components/views/VendorDashboard/CustomRequestsView";
import { ReportsView } from "../components/views/VendorDashboard/ReportsView";


const VendorDashboard: React.FC = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  // Data State
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [participantsMap, setParticipantsMap] = useState<Record<string, Participant[]>>({});
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<"overview" | "workshops" | "analytics" | "participants" | "refunds" | "customOrders" | "reports" | "profile" | "reviews" | "requests">("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Workshop Management State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Art");
  const [date, setDate] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [location, setLocation] = useState("Online");
  const [capacity, setCapacity] = useState(0);
  const [ageGroup, setAgeGroup] = useState("All Ages");
  const [consentRequired, setConsentRequired] = useState(false);
  const [fullDetails, setFullDetails] = useState("");
  const [refundUntil, setRefundUntil] = useState("");



  const [participantSearch, setParticipantSearch] = useState("");
  const [directImageUrl, setDirectImageUrl] = useState(""); // Support for direct URL


  // Real-time Data Listeners
  useEffect(() => {
    if (authLoading) return;
    if (!user || (userData && userData.role !== "vendor")) {
      router.push("/login?redirect=/vendor");
      return;
    }

    setLoading(true);

    // 1. Listen to Vendor's Workshops
    const q = query(collection(db, "workshops"), where("vendorId", "==", user.uid));

    // Main Listener
    const unsubscribeWorkshops = onSnapshot(q, (snapshot) => {
      const wsData = snapshot.docs.map(doc => sanitizeData({ id: doc.id, ...doc.data() }) as Workshop);
      setWorkshops(wsData);
      setLoading(false);

      // 2. Setup Listener for Registrations (Only if we have workshops)
      if (wsData.length > 0) {
        const workshopIds = wsData.map(w => w.id);

        // Optimized: Query registrations more efficiently
        // If we have <= 10 workshops, use 'in' query, otherwise listen to all and filter client-side
        let regQuery;
        if (workshopIds.length <= 10) {
          regQuery = query(
            collection(db, "registrations"),
            where("workshopId", "in", workshopIds)
          );
        } else {
          // For vendors with many workshops, listen to all and filter
          regQuery = query(collection(db, "registrations"));
        }

        const unsubscribeRegs = onSnapshot(regQuery, (regSnap) => {
          const pMap: Record<string, Participant[]> = {};
          const allPart: Participant[] = [];

          const currentWorkshopIds = wsData.map(w => w.id);

          regSnap.docs.forEach((d) => {
            const reg = sanitizeData({ id: d.id, ...d.data() });

            // Filter client-side if we're listening to all registrations
            if (!currentWorkshopIds.includes(reg.workshopId)) return;

            const ws = wsData.find(w => w.id === reg.workshopId);
            if (ws) {
              const participant: Participant = {
                registrationId: reg.id,
                uid: reg.userId,
                createdAt: reg.createdAt,
                displayName: reg.participantDetails?.fullName || "Unknown",
                email: reg.participantDetails?.email || reg.userEmail || reg.email || "N/A",
                phoneNumber: reg.participantDetails?.phone,
                address: reg.participantDetails?.address,
                consentUrl: reg.participantDetails?.consentUrl || reg.consentUrl,
                status: reg.status,
                refundReason: reg.refundReason,
                refundId: reg.refundId,
                rejectionReason: reg.rejectionReason,
                workshopId: ws.id,
                workshopTitle: ws.title,
                workshopPrice: ws.price,
                details: reg.participantDetails
              };

              if (!pMap[ws.id]) pMap[ws.id] = [];
              pMap[ws.id].push(participant);
              allPart.push(participant);
            }
          });

          setParticipantsMap(pMap);
          setAllParticipants(allPart);
        });

        return () => unsubscribeRegs();
      } else {
        setParticipantsMap({});
        setAllParticipants([]);
      }
    });

    return () => unsubscribeWorkshops();

  }, [user, userData, authLoading]);



  // Workshop Actions
  const handleCreate = async () => {
    if (!user) return;
    try {
      if (selectedWorkshop) {
        await WorkshopController.updateWorkshop(selectedWorkshop.id, {
          title, description, category, date, whatsappLink, location, capacity, ageGroup, consentRequired, fullDetails,
          imageUrl: directImageUrl, refundUntil: refundUntil || undefined
        }, images);
      } else {
        await WorkshopController.createWorkshop(user.uid, {
          title, description, category, date, whatsappLink, location, capacity, ageGroup, consentRequired, fullDetails,
          imageUrl: directImageUrl, refundUntil: refundUntil || undefined
        }, images);
      }
      setIsCreateOpen(false);
      resetForm();
    } catch (e) { alert("Failed to save workshop"); }
  };

  const handleToggleFreeze = async (workshop: Workshop) => {
    if (!confirm(`Are you sure you want to ${workshop.isFrozen ? 'unfreeze' : 'freeze'} this workshop? \n\n${workshop.isFrozen ? 'Registrations will be enabled again.' : 'No new registrations will be allowed.'}`)) return;

    try {
      await WorkshopController.updateWorkshop(workshop.id, { isFrozen: !workshop.isFrozen });
      // Optimistic update
      setWorkshops(p => p.map(w => w.id === workshop.id ? { ...w, isFrozen: !workshop.isFrozen } : w));
    } catch (e) {
      console.error(e);
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this workshop?")) {
      await WorkshopController.deleteWorkshop(id);
    }
  };

  const handleParticipantStatus = async (regId: string, status: string) => {
    await ParticipantController.updateStatus(regId, status);
  };

  const handleRemoveParticipant = async (regId: string) => {
    if (confirm("Permanently remove this participant from the workspace? This cannot be undone and will not issue a refund.")) {
      try {
        const regSnap = await getDoc(doc(db, "registrations", regId));
        if (regSnap.exists()) {
          const workshopId = regSnap.data().workshopId;
          // Restore capacity
          await updateDoc(doc(db, "workshops", workshopId), {
            capacity: increment(1)
          });
          await deleteDoc(doc(db, "registrations", regId));
          alert("Participant removed successfully.");
        }
      } catch (e) {
        alert("Failed to remove participant.");
      }
    }
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategory("Art"); setDate(""); setWhatsappLink(""); setImages([]);
    setDirectImageUrl(""); setFullDetails(""); setLocation("Online"); setCapacity(0); setAgeGroup("All Ages");
    setConsentRequired(false); setSelectedWorkshop(null); setRefundUntil("");
  };

  // Render Loading
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-transparent text-foreground overflow-hidden font-sans selection:bg-primary/20">
      {/* Sidebar */}
      <aside className="fixed left-0 top-24 bottom-6 ml-6 w-72 glass-morphism rounded-[2.5rem] z-40 hidden lg:flex flex-col p-6 overflow-y-auto">
        <nav className="space-y-2 flex-1 mt-4">
          {[
            { id: 'overview', icon: 'fa-grid-2', label: 'Overview' },
            { id: 'workshops', icon: 'fa-layer-group', label: 'My Workshops' },
            { id: 'participants', icon: 'fa-users', label: 'Participants' },
            { id: 'reviews', icon: 'fa-star', label: 'Reviews', color: 'text-amber-500' },
            { id: 'requests', icon: 'fa-wand-magic-sparkles', label: 'Custom Requests', color: 'text-purple-400' },
            { id: 'refunds', icon: 'fa-money-bill-transfer', label: 'Refunds', color: 'text-orange-500' },
            { id: 'reports', icon: 'fa-triangle-exclamation', label: 'Reports', color: 'text-red-500' },


          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
              className={`sidebar-item w-full ${activeTab === item.id ? 'active' : ''}`}
            >
              <i className={`fa-solid ${item.icon} ${item.color || ''}`}></i> {item.label}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('customOrders')}
            className={`sidebar-item w-full ${activeTab === 'customOrders' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-gear text-slate-400"></i> Settings
          </button>
        </nav>
        <div className="pt-6 border-t border-white/5 relative group">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-left">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">{userData?.displayName?.[0]}</div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-black truncate">{userData?.displayName}</span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase">Vendor</span>
            </div>
            <i className="fa-solid fa-chevron-up text-xs text-muted-foreground"></i>
          </button>

          <div className="absolute bottom-full left-0 w-full mb-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-xl overflow-hidden hidden group-hover:block transition-all">
            <button onClick={() => router.push('/')} className="w-full text-left px-5 py-3 text-xs font-bold text-muted-foreground hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
              <i className="fa-solid fa-house"></i> Go to Homepage
            </button>
            <button onClick={() => router.push('/profile')} className="w-full text-left px-5 py-3 text-xs font-bold text-muted-foreground hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
              <i className="fa-solid fa-user"></i> My Profile
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-80 min-h-screen relative p-6 lg:p-10 transition-all">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-foreground mb-1">
              Welcome back, <span className="text-primary">{userData?.displayName?.split(' ')[0] || 'Creator'}</span>
            </h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Your academy is growing.</p>
          </div>
          {/* Mobile Menu Toggle */}
          <div className="lg:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <i className="fa-solid fa-bars text-xl"></i>
            </button>
          </div>
        </header>

        {/* Verification Notice */}
        {!userData?.isVerified && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                <i className="fa-solid fa-user-lock"></i>
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-500 uppercase tracking-tight">Identity Pending Verification</h4>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Our team is reviewing your documentation. Creation features are currently restricted.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('customOrders')}
              className="px-4 py-2 bg-amber-500 text-black text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-400 transition-all"
            >
              Update Documents
            </button>
          </motion.div>
        )}

        {/* Views Switching */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && userData && (
            <OverviewView
              key="overview"
              userData={userData}
              workshops={workshops}
              participants={allParticipants}
              totalRevenue={allParticipants.reduce((acc, p) => {
                // Revenue Logic: Include pending refunds. Only subtract when actually refunded.
                if (['paid', 'approved', 'confirmed', 'refund_requested', 'refund_rejected'].includes(p.status || '')) {
                  return acc + (p.workshopPrice || 0);
                }
                return acc;
              }, 0)}
              participantsMap={participantsMap}
              onCreate={() => {
                if (!userData?.isVerified) {
                  alert("Restricted Access: You must verify your Business ID with an administrator before creating workshops.");
                  return;
                }
                resetForm();
                setIsCreateOpen(true);
              }}
            />
          )}

          {activeTab === 'workshops' && (
            <WorkshopsView
              key="workshops"
              workshops={workshops}
              participantsMap={participantsMap}
              onCreate={() => {
                if (!userData?.isVerified) {
                  alert("Restricted Access: You must verify your Business ID with an administrator before creating workshops.");
                  return;
                }
                resetForm();
                setIsCreateOpen(true);
              }}
              onEdit={(ws) => {
                setSelectedWorkshop(ws);
                setTitle(ws.title);
                setDescription(ws.description);
                setCategory(ws.category);
                setDate(ws.date);
                setWhatsappLink(ws.whatsappLink || "");
                setLocation(ws.location || "Online");
                setCapacity(ws.capacity || 0);
                setAgeGroup(ws.ageGroup || "All Ages");
                setFullDetails(ws.fullDetails || "");
                setConsentRequired(ws.consentRequired || false);
                setDirectImageUrl(ws.imageUrl || "");
                setRefundUntil(ws.refundUntil || "");
                setIsCreateOpen(true);
              }}
              onDelete={handleDelete}
              onRemoveParticipant={handleRemoveParticipant}
              onToggleFreeze={handleToggleFreeze}
            />
          )}

          {activeTab === 'participants' && (
            <ParticipantsView
              key="participants"
              participants={allParticipants}
              workshops={workshops}
              participantSearch={participantSearch}
              setParticipantSearch={setParticipantSearch}
              onStatusChange={handleParticipantStatus}
              onIssueRefund={async (regId) => {
                if (confirm("Confirm refund? This will return the payment via Stripe.")) {
                  await ParticipantController.issueRefund(regId);
                  alert("Refund processed!");

                }
              }}
              onRemoveParticipant={handleRemoveParticipant}
            />
          )}

          {activeTab === 'requests' && user && (
            <CustomRequestsView key="requests" vendorId={user.uid} />
          )}

          {activeTab === 'reviews' && (
            <ReviewsView key="reviews" participants={allParticipants} />
          )}

          {activeTab === 'refunds' && (
            <RefundsView
              key="refunds"
              participants={allParticipants}
              onIssueRefund={async (regId) => {
                try {
                  if (confirm("Confirm refund? This will reverse the payment via Stripe.")) {
                    await ParticipantController.issueRefund(regId);
                    alert("Refund processed successfully!");
                  }
                } catch (e) {
                  alert("Failed to process refund: " + e);
                }
              }}
            />
          )}

          {activeTab === 'customOrders' && (
            <CustomizationView
              key="customization"
              userData={userData}
              onUpdate={() => {
                // userData is updated via useAuth if it listens to real-time changes
                // if not, we might need a manual refresh or just wait for auth refresh
              }}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView />
          )}


        </AnimatePresence>

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {isCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-[#121212] w-full max-w-3xl rounded-[2.5rem] border border-white/10 flex flex-col max-h-[90vh] shadow-3xl overflow-hidden"
              >
                {/* Modal Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#121212]">
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                      {selectedWorkshop ? 'Edit Vibe' : 'Create New Vibe'}
                    </h2>
                    <p className="text-xs font-bold text-muted-foreground mt-1">
                      {selectedWorkshop ? 'Update your existing workshop details.' : 'Launch a new experience to the world.'}
                    </p>
                  </div>
                  <button onClick={() => setIsCreateOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <i className="fa-solid fa-xmark text-white"></i>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar">

                  {/* Section 1: Basic Info */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                      <i className="fa-solid fa-circle-info"></i> Basic Details
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Title</label>
                        <input
                          placeholder="e.g., Neon Photography Masterclass"
                          value={title}
                          onChange={e => setTitle(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Category</label>
                        <div className="relative">
                          <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                          >
                            {["Art", "Music", "Technology", "Cooking", "Sports", "Business", "Health", "Other"].map(c => (
                              <option key={c} value={c} className="bg-[#121212]">{c}</option>
                            ))}
                          </select>
                          <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-xs"></i>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Short Description</label>
                      <textarea
                        placeholder="Brief overview (appears on cards)..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm font-medium text-white outline-none focus:border-primary/50 transition-all min-h-[80px] placeholder:text-muted-foreground/20 resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Full Experience Details</label>
                      <textarea
                        placeholder="Explain exactly what participants will do, learn, and experience in detail..."
                        value={fullDetails}
                        onChange={e => setFullDetails(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm font-medium text-white outline-none focus:border-primary/50 transition-all min-h-[160px] placeholder:text-muted-foreground/20 resize-none"
                      />
                    </div>
                  </div>

                  {/* Section 2: Logistics */}
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <i className="fa-solid fa-map-location-dot"></i> Logistics & Pricing
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Capacity</label>
                        <input
                          type="number"
                          placeholder="Max Participants"
                          value={capacity}
                          onChange={e => setCapacity(Number(e.target.value))}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-indigo-400/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Date</label>
                        <input
                          type="date"
                          value={date}
                          onChange={e => setDate(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-indigo-400/50 transition-all uppercase tracking-widest"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Refund Policy Limit</label>
                        <input
                          type="date"
                          value={refundUntil}
                          onChange={e => setRefundUntil(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-amber-500 outline-none focus:border-amber-500/50 transition-all uppercase tracking-widest"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Location</label>
                        <input
                          placeholder="City or 'Online'"
                          value={location}
                          onChange={e => setLocation(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-indigo-400/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Connectivity */}
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <i className="fa-brands fa-whatsapp"></i> Connectivity & Media
                    </h3>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">WhatsApp Group Link</label>
                      <input
                        placeholder="https://chat.whatsapp.com/..."
                        value={whatsappLink}
                        onChange={e => setWhatsappLink(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-emerald-400 outline-none focus:border-emerald-400/50 transition-all placeholder:text-muted-foreground/20"
                      />
                      <p className="text-[9px] text-muted-foreground ml-1">Participants will see this link after successful registration.</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Cover Image</label>

                      {/* Option A: File Upload */}
                      <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:bg-white/5 transition-all group relative overflow-hidden">
                        <input type="file" multiple onChange={e => setImages(Array.from(e.target.files || []))} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className="relative z-0">
                          <i className="fa-solid fa-cloud-arrow-up text-3xl text-muted-foreground mb-3 group-hover:text-primary transition-colors"></i>
                          <p className="text-xs font-bold text-white uppercase tracking-widest">
                            {images.length > 0 ? `${images.length} Files Selected` : "Drag & Drop or Click"}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">Supports JPG, PNG, WEBP</p>
                        </div>
                      </div>

                      {/* Option B: Direct URL */}
                      <div className="flex items-center gap-4">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">OR</span>
                        <div className="h-px bg-white/10 flex-1"></div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Paste Image URL</label>
                        <input
                          placeholder="https://..."
                          value={directImageUrl}
                          onChange={e => setDirectImageUrl(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-purple-500/50 transition-all placeholder:text-muted-foreground/20"
                        />
                        <p className="text-[9px] text-muted-foreground ml-1">Enter a direct image link from Unsplash, Pexels, etc.</p>
                      </div>
                    </div>
                  </div>



                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-white/5 flex justify-end gap-4 bg-[#121212]">
                  <button
                    onClick={() => setIsCreateOpen(false)}
                    className="px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-600/20"
                  >
                    {selectedWorkshop ? 'Save Changes' : 'Launch Vibe'}
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
};

export default VendorDashboard;
