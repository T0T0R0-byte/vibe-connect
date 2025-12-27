"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";

interface User {
    id: string;
    uid: string;
    email: string;
    displayName: string;
    role: string;
    isVerified?: boolean;
    isSuspended?: boolean;
    businessIdUrl?: string;
    createdAt?: any;
}

interface Registration {
    id: string;
    workshopId: string;
    userId: string;
    status: string;
    participantDetails?: {
        fullName: string;
        email?: string;
    };
    workshopTitle?: string;
    workshopDate?: string;
    vendorName?: string;
    consentUrl?: string;
    refundStatus?: string;
    refundRequestDate?: any;
    refundProofUrl?: string;
    refundConfirmationDate?: any;
}

export default function AdminDashboard() {
    const { user, userData, loading: authLoading } = useAuth();
    const router = useRouter();

    const [activeSection, setActiveSection] = useState<"users" | "registrations" | "overview" | "workshops">("overview");
    const [users, setUsers] = useState<User[]>([]);
    const [workshops, setWorkshops] = useState<any[]>([]);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (authLoading) return;
        // if (userData?.role !== 'admin') router.push('/'); // Strict enforcement
        fetchData();
    }, [user, authLoading]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersSnap, regSnap, workshopsSnap] = await Promise.all([
                getDocs(collection(db, "users")),
                getDocs(query(collection(db, "registrations"), orderBy("createdAt", "desc"))),
                getDocs(collection(db, "workshops"))
            ]);

            const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(usersList);

            const allWorkshops = workshopsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWorkshops(allWorkshops);

            const workshopMap: Record<string, { title: string, date: string, vendorName: string, price: number }> = {};
            workshopsSnap.forEach(doc => {
                const data = doc.data();
                workshopMap[doc.id] = { title: data.title, date: data.date, vendorName: data.vendorName, price: data.price };
            });

            const regList: Registration[] = regSnap.docs.map(d => {
                const data = d.data();
                const wsInfo = workshopMap[data.workshopId];
                return {
                    id: d.id,
                    ...data,
                    workshopTitle: wsInfo ? wsInfo.title : "Unknown Workshop",
                    workshopDate: wsInfo ? wsInfo.date : "",
                    vendorName: wsInfo ? wsInfo.vendorName : "Unknown Vendor",
                    refundStatus: data.refundStatus || "none",
                } as Registration;
            });

            setRegistrations(regList);
        } catch (error) {
            console.error("Admin Load Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyVendor = async (userId: string) => {
        if (confirm("Allow this vendor to host workshops?")) {
            try {
                await updateDoc(doc(db, "users", userId), { isVerified: true });
                setUsers(users.map(u => u.id === userId ? { ...u, isVerified: true } : u));
            } catch (e) { alert("Error verifying vendor"); }
        }
    };

    const handleSuspendUser = async (userId: string, currentStatus: boolean | undefined) => {
        if (confirm(`Are you sure you want to ${currentStatus ? 'unsuspend' : 'suspend'} this user?`)) {
            try {
                await updateDoc(doc(db, "users", userId), { isSuspended: !currentStatus });
                setUsers(users.map(u => u.id === userId ? { ...u, isSuspended: !currentStatus } : u));
            } catch (e) { alert("Error updating status"); }
        }
    };

    const handleRefundAction = async (regId: string, action: "approve" | "reject") => {
        if (!confirm(`Finalize this refund ${action}?`)) return;
        try {
            const { finalizeRefund } = await import("../../firebase/refundActions");
            await finalizeRefund(regId, action);
            fetchData();
        } catch (e) { alert("Action failed"); }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const handleConfirmPayment = async (id: string) => {
        try {
            await updateDoc(doc(db, "registrations", id), { status: "paid" });
            fetchData();
        } catch (e) { console.error(e); alert("Failed to confirm payment"); }
    };

    const stats = [
        { label: "Total Users", value: users.length, icon: "fa-users", color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Mentors", value: users.filter(u => u.role === 'vendor').length, icon: "fa-user-tie", color: "text-purple-500", bg: "bg-purple-500/10" },
        { label: "Active Bookings", value: registrations.filter(r => r.status === 'paid').length, icon: "fa-ticket", color: "text-green-500", bg: "bg-green-500/10" },
        { label: "Refund Requests", value: registrations.filter(r => r.refundStatus !== 'none' && r.refundStatus !== 'admin_approved' && r.refundStatus !== 'admin_rejected').length, icon: "fa-hand-holding-dollar", color: "text-orange-500", bg: "bg-orange-500/10" },
    ];

    const filteredUsers = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen sidebar-layout bg-background overflow-hidden relative">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10 rounded-full animate-vibe-float" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] -z-10 rounded-full animate-vibe-float" />

            {/* Sidebar */}
            <aside className="w-72 border-r border-white/5 bg-black/20 backdrop-blur-3xl hidden md:flex flex-col p-8 fixed h-full z-20">
                <div className="mb-12">
                    <h2 className="text-2xl font-black text-foreground tracking-tighter">ADMIN<span className="text-primary">DASHBOARD</span></h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">Administration</p>
                </div>

                <nav className="space-y-2 flex-grow">
                    {[
                        { id: "overview", label: "Overview", icon: "fa-chart-pie" },
                        { id: "users", label: "Users", icon: "fa-users-gear" },
                        { id: "workshops", label: "Workshops", icon: "fa-calendar-days" },
                        { id: "registrations", label: "Refunds & Payments", icon: "fa-receipt" },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id as any)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all duration-300 ${activeSection === item.id
                                ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]"
                                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
                        >
                            <i className={`fa-solid ${item.icon} text-lg w-6`}></i>
                            <span className="text-sm">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="pt-8 border-t border-white/5">
                    <button onClick={() => router.push('/')} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-muted-foreground hover:bg-white/5 transition-all">
                        <i className="fa-solid fa-arrow-right-from-bracket text-lg w-6"></i>
                        <span className="text-sm">Back to Home</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-72 p-8 md:p-12 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-12">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter leading-[0.8] mb-2 uppercase">
                                {activeSection === "overview" && "System Overview"}
                                {activeSection === "users" && "User Management"}
                                {activeSection === "registrations" && "Payments"}
                            </h1>
                            <p className="text-sm font-bold text-muted-foreground">Managing {users.length} users and {registrations.length} events</p>
                        </div>
                        <div className="relative w-full md:w-80">
                            <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
                            <input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search by name or email..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:border-primary focus:bg-white/10 outline-none transition-all shadow-xl"
                            />
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeSection === "overview" && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {stats.map((stat, i) => (
                                        <div key={i} className="glass-card !p-8 group hover:scale-[1.02] transition-transform duration-500">
                                            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center text-2xl mb-6 transition-all duration-500 group-hover:rotate-6`}>
                                                <i className={`fa-solid ${stat.icon}`}></i>
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">{stat.label}</h4>
                                            <span className="text-4xl font-black text-foreground">{stat.value}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid lg:grid-cols-2 gap-8">
                                    <div className="glass-card !p-0 overflow-hidden">
                                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                            <h3 className="text-xl font-black text-foreground">Recent Users</h3>
                                            <button onClick={() => setActiveSection('users')} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View All</button>
                                        </div>
                                        <div className="divide-y divide-white/5">
                                            {users.slice(0, 5).map((u) => (
                                                <div key={u.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold bg-gradient-to-br ${u.role === 'vendor' ? 'from-purple-500 to-pink-500' : 'from-blue-500 to-cyan-600'}`}>
                                                            {u.displayName?.[0]?.toUpperCase() || "C"}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-foreground">{u.displayName}</p>
                                                            <p className="text-xs font-bold text-muted-foreground">{u.email}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${u.role === 'vendor' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                                                        {u.role}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="glass-card !p-0 overflow-hidden">
                                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                            <h3 className="text-xl font-black text-foreground">Critical Alerts</h3>
                                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                                        </div>
                                        <div className="p-8 space-y-4">
                                            {registrations.filter(r => r.refundStatus === 'participant_disputed').length > 0 ? (
                                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-500">
                                                    <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                                                    <p className="text-xs font-bold">You have active refund disputes requiring intervention.</p>
                                                </div>
                                            ) : (
                                                <div className="p-12 text-center text-muted-foreground">
                                                    <i className="fa-solid fa-shield-check text-4xl mb-4 text-green-500/40"></i>
                                                    <p className="text-sm font-bold uppercase tracking-widest">Systems Clear</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === "users" && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card !p-0 overflow-hidden border-white/10 shadow-2xl">
                                <div className="overflow-x-auto overflow-y-auto max-h-[70vh] scrollbar-vibe">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-secondary/80 backdrop-blur-3xl z-10 border-b border-white/5 uppercase text-[10px] font-black tracking-widest text-muted-foreground">
                                            <tr>
                                                <th className="px-8 py-6">User</th>
                                                <th className="px-8 py-6">Role / Status</th>
                                                <th className="px-8 py-6">Verification</th>
                                                <th className="px-8 py-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredUsers.map(u => (
                                                <tr key={u.id} className="hover:bg-white/5 transition-all group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white bg-gradient-to-br ${u.isSuspended ? 'from-gray-600 to-gray-800 opacity-50' : 'from-primary to-indigo-600 shadow-lg shadow-primary/20'}`}>
                                                                {u.displayName?.[0]?.toUpperCase() || "U"}
                                                            </div>
                                                            <div>
                                                                <p className={`text-sm font-black ${u.isSuspended ? 'text-muted-foreground line-through' : 'text-foreground hover:text-primary transition-colors cursor-pointer'}`}>{u.displayName}</p>
                                                                <p className="text-[10px] font-bold text-muted-foreground">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest w-fit border ${u.role === 'vendor' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                                                {u.role}
                                                            </span>
                                                            {u.isSuspended && <span className="text-[8px] font-black uppercase text-red-500 tracking-[0.2em] px-1 animate-pulse">Suspended</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        {u.role === 'vendor' ? (
                                                            <div className="space-y-2">
                                                                {u.isVerified ? (
                                                                    <div className="text-[9px] font-black text-green-500 bg-green-500/5 px-3 py-1 rounded-lg border border-green-500/10 flex items-center gap-2 w-fit">
                                                                        <i className="fa-solid fa-check-circle"></i> VERIFIED
                                                                    </div>
                                                                ) : (
                                                                    <button onClick={() => handleVerifyVendor(u.id)} className="text-[9px] font-black text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg transition-transform hover:scale-105 shadow-lg shadow-green-500/20 uppercase tracking-widest">
                                                                        Approve Vendor
                                                                    </button>
                                                                )}
                                                                {u.businessIdUrl && (
                                                                    <a href={u.businessIdUrl} target="_blank" className="block text-[10px] font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
                                                                        <i className="fa-solid fa-file-contract mr-1"></i> Review ID
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ) : <span className="text-white/10">-</span>}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                                                            <button onClick={() => handleSuspendUser(u.id, u.isSuspended)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${u.isSuspended ? 'bg-white/5 border-white/20 text-foreground hover:bg-white/10' : 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20'}`}>
                                                                {u.isSuspended ? "Release" : "Freeze"}
                                                            </button>
                                                            <button onClick={async () => { if (confirm("Permanently delete this user?")) { await deleteDoc(doc(db, "users", u.id)); fetchData(); } }} className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase hover:bg-red-500/20 transition-all">
                                                                <i className="fa-solid fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === "workshops" && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card !p-0 overflow-hidden border-white/10 shadow-2xl">
                                <div className="p-8 bg-purple-500/5 border-b border-white/5">
                                    <div className="flex items-center gap-4 text-purple-500">
                                        <i className="fa-solid fa-calendar-days text-2xl"></i>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tight">Active Workshops</h3>
                                            <p className="text-[10px] font-bold text-purple-500/70 uppercase tracking-widest">Managing {workshops.length} total workshops</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto overflow-y-auto max-h-[70vh] scrollbar-vibe">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-secondary/80 backdrop-blur-3xl z-10 border-b border-white/5 uppercase text-[10px] font-black tracking-widest text-muted-foreground">
                                            <tr>
                                                <th className="px-8 py-6">Workshop</th>
                                                <th className="px-8 py-6">Mentor</th>
                                                <th className="px-8 py-6">Date</th>
                                                <th className="px-8 py-6">Price</th>
                                                <th className="px-8 py-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {workshops.map(w => (
                                                <tr key={w.id} className="hover:bg-white/5 transition-all">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 shrink-0">
                                                                <img src={w.imageUrl} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-foreground">{w.title}</p>
                                                                <p className="text-[10px] font-bold text-muted-foreground">{w.category}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <p className="text-xs font-black text-foreground hover:text-primary transition-colors cursor-pointer">{w.vendorName}</p>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="text-xs font-bold text-muted-foreground">{new Date(w.date).toLocaleDateString()}</span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="text-xs font-black text-emerald-500">Rs. {w.price}</span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm("Delete this workshop? This action cannot be undone.")) {
                                                                    await deleteDoc(doc(db, "workshops", w.id));
                                                                    fetchData();
                                                                }
                                                            }}
                                                            className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase hover:bg-red-500/20 transition-all"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === "registrations" && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card !p-0 overflow-hidden border-white/10 shadow-2xl">
                                <div className="p-8 bg-orange-500/5 border-b border-white/5">
                                    <div className="flex items-center gap-4 text-orange-500">
                                        <i className="fa-solid fa-gavel text-2xl"></i>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tight">Payments</h3>
                                            <p className="text-[10px] font-bold text-orange-500/70 uppercase tracking-widest">Confirming a refund permanently removes the participant entry</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto overflow-y-auto max-h-[70vh] scrollbar-vibe">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-secondary/80 backdrop-blur-3xl z-10 border-b border-white/5 uppercase text-[10px] font-black tracking-widest text-muted-foreground">
                                            <tr>
                                                <th className="px-8 py-6">Participant</th>
                                                <th className="px-8 py-6">Workshop</th>
                                                <th className="px-8 py-6">Status</th>
                                                <th className="px-8 py-6">Refund Status</th>
                                                <th className="px-8 py-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {registrations.map(r => (
                                                <tr key={r.id} className="hover:bg-white/5 transition-all">
                                                    <td className="px-8 py-6">
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-black text-foreground">{r.participantDetails?.fullName || "Guest"}</p>
                                                            <p className="text-[10px] font-bold text-muted-foreground">ID: {r.id.slice(0, 8)}</p>
                                                            {r.consentUrl && (
                                                                <a href={r.consentUrl} target="_blank" className="text-[9px] font-black text-primary hover:underline uppercase tracking-widest">
                                                                    View Contract
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <p className="text-sm font-black text-foreground">{r.workshopTitle}</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground">{new Date(r.workshopDate || "").toLocaleDateString()}</p>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${r.status === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest w-fit border ${r.refundStatus === 'none' ? 'bg-white/5 text-muted-foreground border-white/10' : 'bg-sky-500/10 text-sky-500 border-sky-500/20'}`}>
                                                                {r.refundStatus ? r.refundStatus.replace(/_/g, " ") : "NONE"}
                                                            </span>
                                                            {r.refundProofUrl && (
                                                                <a href={r.refundProofUrl} target="_blank" className="text-[9px] font-black text-sky-400 hover:text-sky-300 transition-colors uppercase tracking-widest">
                                                                    <i className="fa-solid fa-paperclip mr-1"></i> Proof
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        {r.status !== 'paid' && (
                                                            <button
                                                                onClick={() => handleConfirmPayment(r.id)}
                                                                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 mr-2"
                                                            >
                                                                Confirm Payment
                                                            </button>
                                                        )}
                                                        {(r.refundStatus && r.refundStatus !== 'none' && r.refundStatus !== 'admin_approved' && r.refundStatus !== 'admin_rejected') ? (
                                                            <div className="flex flex-col gap-2 items-end">
                                                                <button onClick={() => handleRefundAction(r.id, "approve")} className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-[9px] font-black uppercase hover:bg-green-500/20 transition-all">
                                                                    Finalize Refund
                                                                </button>
                                                                <button onClick={() => handleRefundAction(r.id, "reject")} className="text-[8px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest">
                                                                    Deny Request
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button onClick={async () => { if (confirm("Delete this entry entirely?")) { await deleteDoc(doc(db, "registrations", r.id)); fetchData(); } }} className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase hover:bg-red-500/20 transition-all">
                                                                Delete
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
