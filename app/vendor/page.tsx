"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Firebase
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { sanitizeData } from "@/app/utils/serialize";

// Models & Controllers
import { Workshop } from "../models/Workshop";
import { Registration } from "../models/Registration";
import { WorkshopController } from "../controllers/WorkshopController";
import { RegistrationController } from "../controllers/RegistrationController";
import { RefundController } from "../controllers/RefundController";

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
  const [participantsMap, setParticipantsMap] = useState<Record<string, Registration[]>>({});
  const [allParticipants, setAllParticipants] = useState<Registration[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<any>("overview");
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
  const [directImageUrl, setDirectImageUrl] = useState("");

  // Real-time Data Listeners
  useEffect(() => {
    if (authLoading) return;
    if (!user || userData?.role !== "vendor") {
      router.push("/login?redirect=/vendor");
      return;
    }

    setLoading(true);

    // 1. Listen to Vendor's Workshops
    const q = query(collection(db, "workshops"), where("vendorId", "==", user.uid));
    const unsubscribeWorkshops = onSnapshot(q, (snapshot) => {
      const wsData = snapshot.docs.map(doc => sanitizeData({ id: doc.id, ...doc.data() }) as Workshop);
      setWorkshops(wsData);
      setLoading(false);

      if (wsData.length > 0) {
        const workshopIds = wsData.map(w => w.id);
        const regQuery = query(collection(db, "registrations"), where("workshopId", "in", workshopIds));

        const unsubscribeRegs = onSnapshot(regQuery, (regSnap) => {
          const pMap: Record<string, Registration[]> = {};
          const allPart: Registration[] = [];

          regSnap.docs.forEach((d) => {
            const reg = d.data();
            const ws = wsData.find(w => w.id === reg.workshopId);
            if (ws) {
              const participant = {
                registrationId: d.id,
                ...reg,
                workshopTitle: ws.title,
                workshopPrice: ws.price,
              } as any as Registration;

              if (!pMap[ws.id]) pMap[ws.id] = [];
              pMap[ws.id].push(participant);
              allPart.push(participant);
            }
          });
          setParticipantsMap(pMap);
          setAllParticipants(allPart);
        });

        return () => unsubscribeRegs();
      }
    });

    return () => unsubscribeWorkshops();
  }, [user, userData, authLoading, router]);

  // Actions
  const handleSaveWorkshop = async () => {
    if (!user) return;
    try {
      if (selectedWorkshop) {
        await WorkshopController.updateWorkshop(selectedWorkshop.id, {
          title, description, category, date, whatsappLink, location, capacity, ageGroup, consentRequired, fullDetails,
          imageUrl: directImageUrl, refundUntil
        }, images);
      } else {
        await WorkshopController.createWorkshop(user.uid, {
          title, description, category, date, whatsappLink, location, capacity, ageGroup, consentRequired, fullDetails,
          imageUrl: directImageUrl, refundUntil
        }, images);
      }
      setIsCreateOpen(false);
      resetForm();
    } catch (e) { alert("Failed to save workshop"); }
  };

  const handleToggleFreeze = async (workshop: Workshop) => {
    await WorkshopController.toggleFreeze(workshop.id, !workshop.isFrozen);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this workshop?")) {
      await WorkshopController.deleteWorkshop(id);
    }
  };

  const resetForm = () => {
    setSelectedWorkshop(null);
    setTitle(""); setDescription(""); setCategory("Art"); setDate(""); setWhatsappLink("");
    setImages([]); setLocation("Online"); setCapacity(0); setAgeGroup("All Ages");
    setConsentRequired(false); setFullDetails(""); setRefundUntil(""); setDirectImageUrl("");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white/5 border-r border-white/5 flex flex-col items-center lg:items-start py-8 transition-all hidden md:flex">
        <div className="px-6 mb-12 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <i className="fa-solid fa-bolt text-white text-xs"></i>
          </div>
          <span className="text-sm font-black text-white uppercase tracking-tighter hidden lg:block">Vibe Panel</span>
        </div>

        <nav className="flex-1 w-full px-4 space-y-2">
          {[
            { id: 'overview', icon: 'fa-chart-pie', label: 'Overview' },
            { id: 'workshops', icon: 'fa-calendar', label: 'Workshops' },
            { id: 'participants', icon: 'fa-users', label: 'Participants' },
            { id: 'refunds', icon: 'fa-money-bill-transfer', label: 'Refunds' },
            { id: 'customOrders', icon: 'fa-wand-magic-sparkles', label: 'Customization' },
            { id: 'reviews', icon: 'fa-star', label: 'Reviews' },
            { id: 'requests', icon: 'fa-paper-plane', label: 'Requests' },
            { id: 'reports', icon: 'fa-flag', label: 'Reports' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
            >
              <i className={`fa-solid ${item.icon} text-sm`}></i>
              <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 w-full pt-8 border-t border-white/5">
          <button onClick={() => router.push('/profile')} className="w-full flex items-center gap-4 px-4 py-3 text-muted-foreground hover:text-white rounded-xl transition-all">
            <i className="fa-solid fa-user text-sm"></i>
            <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">My Account</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-24 pb-12 px-6 lg:px-12 backdrop-blur-3xl relative">
        <div className="max-w-7xl mx-auto z-10 relative">

          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <OverviewView key="overview" workshops={workshops} allParticipants={allParticipants as any} onSwitchTab={setActiveTab} />
            )}
            {activeTab === "workshops" && (
              <WorkshopsView
                key="workshops"
                workshops={workshops}
                participantsMap={participantsMap as any}
                onCreate={() => {
                  setSelectedWorkshop(null);
                  setIsCreateOpen(true);
                }}
                onEdit={(ws) => {
                  setSelectedWorkshop(ws);
                  setIsCreateOpen(true);
                }}
                onDelete={handleDelete}
                onToggleFreeze={handleToggleFreeze}
              />
            )}

            {activeTab === "participants" && (
              <ParticipantsView
                key="participants"
                workshops={workshops}
                participantsMap={participantsMap as any}
                onUpdateStatus={RegistrationController.updateStatus}
              />
            )}

            {activeTab === "refunds" && (
              <RefundsView
                key="refunds"
                participants={allParticipants as any}
                onIssueRefund={(regId: string) => RefundController.processRefund(regId)}
                onRejectRefund={RefundController.rejectRefund}
              />
            )}

            {activeTab === "customOrders" && (
              <CustomizationView key="customization" userData={userData as any} onUpdate={() => { }} />
            )}

            {activeTab === "reviews" && (
              <ReviewsView key="reviews" />
            )}

            {activeTab === "reports" && (
              <ReportsView key="reports" />
            )}
            {activeTab === "requests" && (
              <CustomRequestsView key="requests" vendorId={user?.uid || ""} />
            )}
          </AnimatePresence>
        </div>

        {/* Modal for Create/Edit Workshop */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#121212] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-white/10 p-8 lg:p-12 shadow-3xl">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{selectedWorkshop ? 'Edit Experience' : 'New Workshop'}</h2>
                <button onClick={() => setIsCreateOpen(false)} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-6 lg:col-span-1">
                  {/* Left: Metadata */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-primary tracking-widest">Global Title</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-primary/50" placeholder="Workshop Name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-primary tracking-widest">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none">
                      <option value="Art" className="bg-[#121212]">Art & Design</option>
                      <option value="Cooking" className="bg-[#121212]">Culinary</option>
                      <option value="Music" className="bg-[#121212]">Music & Audio</option>
                      <option value="Tech" className="bg-[#121212]">Technology</option>
                      <option value="Business" className="bg-[#121212]">Professional</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-primary tracking-widest">Event Session</label>
                    <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none" />
                  </div>
                </div>

                <div className="space-y-6 lg:col-span-2">
                  {/* Right: Description & Visuals */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-primary tracking-widest">Story / Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none h-40 resize-none" placeholder="Short intro..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-primary tracking-widest">Cover Images (Up to 3)</label>
                    <input type="file" multiple onChange={e => setImages(Array.from(e.target.files || []))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-xs outline-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 border-t border-white/5 pt-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-primary tracking-widest">Location</label>
                  <input value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none" placeholder="Venue or Online" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-primary tracking-widest">Max Seats</label>
                  <input type="number" value={capacity} onChange={e => setCapacity(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-primary tracking-widest">Refund Deadline</label>
                  <input type="date" value={refundUntil} onChange={e => setRefundUntil(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none" />
                </div>
              </div>

              <div className="flex gap-4 mt-12 pt-10 border-t border-white/5">
                <button onClick={() => setIsCreateOpen(false)} className="flex-1 py-5 bg-white/5 text-muted-foreground hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Cancel</button>
                <button onClick={handleSaveWorkshop} className="flex-[2] py-5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  {selectedWorkshop ? 'Commit Updates' : 'Launch Masterclass'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VendorDashboard;
