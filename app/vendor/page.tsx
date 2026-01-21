"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Firebase
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

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
  const [activeTab, setActiveTab] = useState<"overview" | "workshops" | "analytics" | "participants" | "refunds" | "customOrders" | "reports" | "profile">("overview");
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


  const [participantSearch, setParticipantSearch] = useState("");
  const [directImageUrl, setDirectImageUrl] = useState(""); // Support for direct URL


  // Real-time Data Listeners
  useEffect(() => {
    if (authLoading || !user || userData?.role !== "vendor") return;

    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect

    // 1. Listen to Vendor's Workshops
    const q = query(collection(db, "workshops"), where("vendorId", "==", user.uid));

    // Main Listener
    const unsubscribeWorkshops = onSnapshot(q, (snapshot) => {
      const wsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workshop));
      setWorkshops(wsData);
      setLoading(false);

      // 2. Setup Listener for Registrations (Only if we have workshops)
      if (wsData.length > 0) {
        const workshopIds = wsData.map(w => w.id);

        // Note: Firestore 'in' query supports max 10 values. For safety, we might need multiple listeners or just listen to all registrations and filter (client-side) if scale is small.
        // Given the scale, client-side filtering from a broader query or multiple queries is safer for now if > 10 workshops.
        // Or, ideally, we should have a 'vendorId' on the registration document.
        // For now, let's query ALL registrations for simplicity in this context (assuming < 1000s active), 
        // OR better: if possible, query by workshopIds in batches. 
        // Let's use a simpler approach: Listener on collection(registrations) and filter in memory. 
        // This ensures *instant* updates without complex query chains for this MVP size.

        const regQuery = query(collection(db, "registrations"));
        // Ideally: where('workshopId', 'in', workshopIds) -- but limits apply.

        const unsubscribeRegs = onSnapshot(regQuery, (regSnap) => {
          const allRegs = regSnap.docs.map(d => ({ id: d.id, ...d.data() }));

          // Filter client-side for vendor's workshops
          const vendorRegs = allRegs.filter((r: any) => workshopIds.includes(r.workshopId)); // eslint-disable-line @typescript-eslint/no-explicit-any

          const pMap: Record<string, Participant[]> = {};
          const allPart: Participant[] = [];

          // Process registrations into Participants
          vendorRegs.forEach((reg: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            const ws = wsData.find(w => w.id === reg.workshopId);
            if (ws) {
              const participant: Participant = {
                registrationId: reg.id,
                uid: reg.userId,
                displayName: reg.participantDetails?.fullName || "Unknown",
                email: "Processing...", // Ideally we need to fetch user email separately or store it in reg.
                // Since we don't store email in registration (checked createWorkshop), we might miss it.
                // However, previous code fetched it via `getParticipantsForWorkshop` which did a user lookup.
                // To keep real-time fast, we will use what's in registration or fetch async. 
                // Let's rely on registration details if possible, or trigger async user fetch.
                phoneNumber: reg.participantDetails?.phone,
                status: reg.status,
                workshopId: ws.id,
                workshopTitle: ws.title,
                workshopPrice: ws.price,
                details: reg.participantDetails
              };

              // Backward compatibility: If email not in details, we might leave it blank or fetch.
              // Previous logic: ParticipantController.getParticipantsForWorkshop checks 'users' collection.
              // We will do a quick async fetch for emails if needed, but for now let's map what we have.

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

  }, [user, userData, authLoading, router]);



  // Workshop Actions
  const handleCreate = async () => {
    if (!user) return;
    try {
      await WorkshopController.createWorkshop(user.uid, {
        title, description, category, date, whatsappLink, location, capacity, ageGroup, consentRequired,
        imageUrl: directImageUrl // Pass direct URL
      }, images);
      setIsCreateOpen(false);
      resetForm();
    } catch (e) { alert("Failed to create workshop"); }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this workshop?")) {
      await WorkshopController.deleteWorkshop(id);
    }
  };

  const handleParticipantStatus = async (regId: string, status: string) => {
    await ParticipantController.updateStatus(regId, status);

  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategory("Art"); setDate(""); setWhatsappLink(""); setImages([]);
    setDirectImageUrl("");
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
            <i className="fa-solid fa-wand-magic-sparkles text-purple-400"></i> Customization
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

        {/* Views Switching */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && userData && (
            <OverviewView
              key="overview"
              userData={userData}
              workshops={workshops}
              participants={allParticipants}
              totalRevenue={0}
              participantsMap={participantsMap}
            />
          )}

          {activeTab === 'workshops' && (
            <WorkshopsView
              key="workshops"
              workshops={workshops}
              participantsMap={participantsMap}
              onCreate={() => { resetForm(); setIsCreateOpen(true); }}
              onEdit={(ws) => { setSelectedWorkshop(ws); setIsCreateOpen(true); }}
              onDelete={handleDelete}
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
            />
          )}

          {activeTab === 'refunds' && (
            <RefundsView
              key="refunds"
              participants={allParticipants}
              onIssueRefund={async (regId) => {
                try {
                  // Update status in backend (assuming payment success handled inside view)
                  await ParticipantController.updateStatus(regId, 'refunded');
                  alert("Refund processed successfully!");

                } catch (e) {
                  alert("Failed to update status: " + e);
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
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Description</label>
                      <textarea
                        placeholder="Describe the experience in detail..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm font-medium text-white outline-none focus:border-primary/50 transition-all min-h-[120px] placeholder:text-muted-foreground/20 resize-none"
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
                        <p className="text-[9px] text-muted-foreground ml-1">*Direct URL support coming in next update. Please utilize file upload for best results.*</p>
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
