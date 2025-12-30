"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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
import FinanceTab from "../components/vendor/FinanceTab";

const VendorDashboard: React.FC = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  // Data State
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [participantsMap, setParticipantsMap] = useState<Record<string, Participant[]>>({});
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<"overview" | "workshops" | "analytics" | "participants" | "customOrders" | "profile" | "finance">("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Workshop Management State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState("Art");
  const [date, setDate] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // proper plural
  const [location, setLocation] = useState("Online");
  const [capacity, setCapacity] = useState(0);
  const [ageGroup, setAgeGroup] = useState("All Ages");
  const [consentRequired, setConsentRequired] = useState(false);
  const [refundPolicy, setRefundPolicy] = useState("");
  const [bankDetails, setBankDetails] = useState("");

  const [participantSearch, setParticipantSearch] = useState("");
  const [directImageUrl, setDirectImageUrl] = useState(""); // Support for direct URL

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
      // 1. Fetch Workshops via Controller
      const wsData = await WorkshopController.fetchVendorWorkshops(user.uid);
      setWorkshops(wsData);

      // 2. Fetch Participants 
      const pMap: Record<string, Participant[]> = {};
      const allPart: Participant[] = [];

      for (const ws of wsData) {
        const parts = await ParticipantController.getParticipantsForWorkshop(ws.id);
        pMap[ws.id] = parts;
        allPart.push(...parts.map(p => ({ ...p, workshopTitle: ws.title, workshopId: ws.id })));
      }
      setParticipantsMap(pMap);
      setAllParticipants(allPart);

    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Workshop Actions
  const handleCreate = async () => {
    if (!user) return;
    try {
      await WorkshopController.createWorkshop(user.uid, {
        title, description, price, category, date, whatsappLink, location, capacity, ageGroup, consentRequired, refundPolicy, bankDetails,
        imageUrl: directImageUrl // Pass direct URL
      }, images);
      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (e) { alert("Failed to create workshop"); }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this workshop?")) {
      await WorkshopController.deleteWorkshop(id);
      fetchData();
    }
  };

  const handleParticipantStatus = async (regId: string, status: string) => {
    await ParticipantController.updateStatus(regId, status);
    fetchData();
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setPrice(0); setCategory("Art"); setDate(""); setWhatsappLink(""); setImages([]); setImagePreviews([]);
    setRefundPolicy("Standard Policy"); setBankDetails(""); setDirectImageUrl("");
  };

  // Render Loading
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary/20">
      {/* Sidebar */}
      <aside className="fixed left-0 top-24 bottom-0 w-72 bg-card/30 backdrop-blur-xl border-r border-white/5 z-40 hidden lg:flex flex-col p-6 overflow-y-auto">
        <nav className="space-y-2 flex-1 mt-4">
          {[
            { id: 'overview', icon: 'fa-grid-2', label: 'Overview' },
            { id: 'workshops', icon: 'fa-layer-group', label: 'My Workshops' },
            { id: 'participants', icon: 'fa-users', label: 'Participants' },
            { id: 'finance', icon: 'fa-wallet', label: 'Finance & Refunds', color: 'text-amber-500' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`sidebar-item w-full ${activeTab === item.id ? 'active' : ''}`}
            >
              <i className={`fa-solid ${item.icon} ${item.color || ''}`}></i> {item.label}
            </button>
          ))}
        </nav>
        <div className="pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">{userData?.displayName?.[0]}</div>
            <div className="flex flex-col"><span className="text-xs font-black truncate">{userData?.displayName}</span><span className="text-[10px] text-muted-foreground font-bold uppercase">Vendor</span></div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 min-h-screen relative p-6 lg:p-10 transition-all">

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
          {activeTab === 'overview' && (
            <OverviewView
              key="overview"
              userData={userData}
              workshops={workshops}
              participants={allParticipants}
              totalRevenue={workshops.reduce((acc, ws) => acc + (ws.price * (participantsMap[ws.id]?.filter(p => p.status === 'paid').length || 0)), 0)}
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
            />
          )}

          {activeTab === 'finance' && (
            <FinanceTab
              participants={allParticipants}
              fetchData={fetchData}
            />
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
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Price (Rs.)</label>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">Rs.</span>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={price}
                            onChange={e => setPrice(Number(e.target.value))}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-white outline-none focus:border-indigo-400/50 transition-all"
                          />
                        </div>
                      </div>
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

                  {/* Section 4: Policies */}
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <i className="fa-solid fa-file-contract"></i> Policy & Bank Details
                    </h3>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Bank Details (For Manual Payments)</label>
                      <textarea
                        placeholder="Bank Name, Account Number, Branch..."
                        value={bankDetails}
                        onChange={e => setBankDetails(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm font-medium text-white outline-none focus:border-amber-500/50 transition-all h-24 resize-none placeholder:text-muted-foreground/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Refund Policy</label>
                      <div className="relative">
                        <select
                          value={refundPolicy}
                          onChange={e => setRefundPolicy(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-amber-500/50 transition-all appearance-none cursor-pointer"
                        >
                          <option value="Standard Policy" className="bg-[#121212]">Standard (7 Days before event)</option>
                          <option value="No Refunds" className="bg-[#121212]">No Refunds</option>
                          <option value="Flexible" className="bg-[#121212]">Flexible (24 Hours before event)</option>
                        </select>
                        <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-xs"></i>
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
