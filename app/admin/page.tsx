"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, addDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';

interface User {
    id: string;
    uid: string;
    email: string;
    displayName: string;
    role: string;
    isVerified?: boolean;
    isSuspended?: boolean;
    businessIdUrl?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    refundRequestDate?: any;
    refundProofUrl?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    refundConfirmationDate?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt?: any;
}

export default function AdminDashboard() {
    const { user, userData, loading: authLoading } = useAuth();
    const router = useRouter();

    const [activeSection, setActiveSection] = useState<"users" | "registrations" | "overview" | "workshops" | "admins">("overview");
    const [users, setUsers] = useState<User[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [workshops, setWorkshops] = useState<any[]>([]);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [newAdminName, setNewAdminName] = useState("");
    const [newAdminEmail, setNewAdminEmail] = useState("");
    const [newAdminPassword, setNewAdminPassword] = useState("");
    const [creatingAdmin, setCreatingAdmin] = useState(false);
    const [userRoleFilter, setUserRoleFilter] = useState<"all" | "user" | "vendor" | "admin">("all");
    const [showCreateAdminForm, setShowCreateAdminForm] = useState(false);
    const [showWorkshopModal, setShowWorkshopModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingWorkshop, setEditingWorkshop] = useState<any>(null);
    const [workshopFormData, setWorkshopFormData] = useState({
        title: "", description: "", category: "Pottery", date: "", price: 0,
        location: "", imageUrl: "", maxAttendees: 10, vendorName: "Admin", vendorId: "admin"
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleOpenWorkshopModal = (workshop: any = null) => {
        if (workshop) {
            setEditingWorkshop(workshop);
            setWorkshopFormData({
                title: workshop.title || "", description: workshop.description || "", category: workshop.category || "Pottery",
                date: workshop.date || "", price: workshop.price || 0, location: workshop.location || "",
                imageUrl: workshop.imageUrl || "", maxAttendees: workshop.maxAttendees || 10,
                vendorName: workshop.vendorName || "Admin", vendorId: workshop.vendorId || "admin"
            });
        } else {
            setEditingWorkshop(null);
            setWorkshopFormData({
                title: "", description: "", category: "Pottery", date: "", price: 0,
                location: "", imageUrl: "", maxAttendees: 10, vendorName: "Admin", vendorId: "admin"
            });
        }
        setShowWorkshopModal(true);
    };

    const handleSaveWorkshop = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingWorkshop) {
                await updateDoc(doc(db, "workshops", editingWorkshop.id), workshopFormData);
            } else {
                await addDoc(collection(db, "workshops"), {
                    ...workshopFormData,
                    createdAt: new Date().toISOString(), // Using ISO string for simple sorting if needed or update to serverTimestamp later
                    vendorId: user?.uid || 'admin'
                });
            }
            setShowWorkshopModal(false);
            fetchData();
        } catch (error) {
            console.error("Error saving workshop", error);
            alert("Failed to save workshop");
        }
    };

    const handleDeleteAllWorkshops = async () => {
        if (confirm("WARNING: ARE YOU SURE YOU WANT TO DELETE ALL WORKSHOPS? This cannot be undone.")) {
            if (confirm("Double Check: Delete EVERYTHING?")) {
                const snapshot = await getDocs(collection(db, "workshops"));
                const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "workshops", d.id)));
                await Promise.all(deletePromises);
                fetchData();
            }
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push("/login"); return; }
        if (userData?.role !== 'admin') { router.push('/'); return; }
        fetchData();
    }, [user, userData, authLoading, router]);

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
        { label: "Total Users", value: users.length, icon: "fa-users", color: "text-blue-500", bg: "bg-blue-500/10", action: () => { setActiveSection('users'); setUserRoleFilter('all'); } },
        { label: "Mentors", value: users.filter(u => u.role === 'vendor').length, icon: "fa-user-tie", color: "text-purple-500", bg: "bg-purple-500/10", action: () => { setActiveSection('users'); setUserRoleFilter('vendor'); } },
        { label: "Active Bookings", value: registrations.filter(r => r.status === 'paid').length, icon: "fa-ticket", color: "text-green-500", bg: "bg-green-500/10", action: () => setActiveSection('registrations') },
        { label: "Refund Requests", value: registrations.filter(r => r.refundStatus !== 'none' && r.refundStatus !== 'admin_approved' && r.refundStatus !== 'admin_rejected').length, icon: "fa-hand-holding-dollar", color: "text-orange-500", bg: "bg-orange-500/10", action: () => setActiveSection('registrations') },
        { label: "Admins", value: users.filter(u => u.role === 'admin').length, icon: "fa-user-shield", color: "text-red-500", bg: "bg-red-500/10", action: () => { setActiveSection('users'); setUserRoleFilter('admin'); } },
    ];



    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm("Create a new Administrator account? This user will have full system access.")) return;
        setCreatingAdmin(true);

        try {
            // Dynamically import to avoid server-side issues
            const { initializeApp, getApps, deleteApp } = await import("firebase/app");
            const { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } = await import("firebase/auth");
            const { firebaseConfig } = await import("@/firebase/firebaseConfig");
            const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");

            // Initialize a secondary app instance to create user without logging out current admin
            const secondaryAppName = "secondaryApp";
            let secondaryApp = getApps().find(app => app.name === secondaryAppName);
            if (!secondaryApp) {
                secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
            }

            const secondaryAuth = getAuth(secondaryApp);
            const userCred = await createUserWithEmailAndPassword(secondaryAuth, newAdminEmail, newAdminPassword);
            const newUser = userCred.user;
            await updateProfile(newUser, { displayName: newAdminName });

            // Use MAIN DB connection to save the user doc (since we are already authenticated there as admin)
            await setDoc(doc(db, "users", newUser.uid), {
                uid: newUser.uid,
                displayName: newAdminName,
                email: newUser.email,
                role: "admin",
                createdAt: serverTimestamp(),
                favorites: [],
                registeredWorkshops: []
            });

            await signOut(secondaryAuth);
            // Optionally delete app if needed, but keeping it is fine for repeated use or clean up:
            // await deleteApp(secondaryApp); 

            alert("New Administrator Created Successfully");
            setNewAdminName("");
            setNewAdminEmail("");
            setNewAdminPassword("");
            fetchData();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
            alert("Failed to create admin: " + error.message);
        } finally {
            setCreatingAdmin(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
        return matchesSearch && matchesRole;
    });

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
                        { id: "admins", label: "Manage Admins", icon: "fa-user-shield" },
                    ].map((item) => (
                        <button
                            key={item.id}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                                {activeSection === "admins" && "System Access"}
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
                            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                                    {stats.map((stat, i) => (
                                        <div
                                            key={i}
                                            onClick={stat.action}
                                            className="glass-card !p-8 group hover:scale-[1.02] transition-transform duration-500 cursor-pointer"
                                        >
                                            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center text-2xl mb-6 transition-all duration-500 group-hover:rotate-6`}>
                                                <i className={`fa-solid ${stat.icon}`}></i>
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">{stat.label}</h4>
                                            <span className="text-4xl font-black text-foreground">{stat.value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Graphs Section */}
                                <div className="grid lg:grid-cols-2 gap-8">
                                    <div className="glass-card !p-8">
                                        <div className="mb-6">
                                            <h3 className="text-lg font-black uppercase tracking-tight">System Traffic</h3>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">New Registrations over time</p>
                                        </div>
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={registrations.slice(0, 7).map(r => ({ date: new Date(r.createdAt?.seconds * 1000).toLocaleDateString(), value: 1 }))}>
                                                    <defs>
                                                        <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    {/* Mock data visualization for now as aggregation logic needs moment/date-fns */}
                                                    <XAxis dataKey="date" hide />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                                    />
                                                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTraffic)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="glass-card !p-8">
                                        <div className="mb-6">
                                            <h3 className="text-lg font-black uppercase tracking-tight">User Distribution</h3>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Participants vs Vendors</p>
                                        </div>
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={[
                                                    { name: 'Participants', value: users.filter(u => u.role === 'user').length },
                                                    { name: 'Mentors', value: users.filter(u => u.role === 'vendor').length },
                                                    { name: 'Admins', value: users.filter(u => u.role === 'admin').length }
                                                ]}>
                                                    <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                    />
                                                    <Bar dataKey="value" fill="#ec4899" radius={[10, 10, 0, 0]} barSize={40} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
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
                            <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card !p-0 overflow-hidden border-white/10 shadow-2xl">
                                <div className="p-4 border-b border-white/5 flex flex-wrap gap-2">
                                    {[
                                        { id: 'all', label: 'All Users', icon: 'fa-users' },
                                        { id: 'user', label: 'Participants', icon: 'fa-user' },
                                        { id: 'vendor', label: 'Mentors', icon: 'fa-user-tie' },
                                        { id: 'admin', label: 'Admins', icon: 'fa-user-shield' },
                                    ].map(filter => (
                                        <button
                                            key={filter.id}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            onClick={() => setUserRoleFilter(filter.id as any)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                                                ${userRoleFilter === filter.id
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'}
                                            `}
                                        >
                                            <i className={`fa-solid ${filter.icon}`}></i> {filter.label}
                                        </button>
                                    ))}
                                </div>
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
                            <motion.div key="workshops" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card !p-0 overflow-hidden border-white/10 shadow-2xl">
                                <div className="p-8 bg-purple-500/5 border-b border-white/5 flex justify-between items-center">
                                    <div className="flex items-center gap-4 text-purple-500">
                                        <i className="fa-solid fa-calendar-days text-2xl"></i>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tight">Active Workshops</h3>
                                            <p className="text-[10px] font-bold text-purple-500/70 uppercase tracking-widest">Managing {workshops.length} total workshops</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => handleDeleteAllWorkshops()} className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                            <i className="fa-solid fa-trash mr-2"></i> Clear All
                                        </button>
                                        <button onClick={() => handleOpenWorkshopModal()} className="px-4 py-2 bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20">
                                            <i className="fa-solid fa-plus mr-2"></i> Add Workshop
                                        </button>
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
                                                                {w.imageUrl ? (
                                                                    <img src={w.imageUrl} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                                        <i className="fa-solid fa-image text-white/20"></i>
                                                                    </div>
                                                                )}
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
                                                        <div className="flex gap-2 justify-end">
                                                            <button
                                                                onClick={() => handleOpenWorkshopModal(w)}
                                                                className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl text-[9px] font-black uppercase hover:bg-blue-500/20 transition-all"
                                                            >
                                                                Edit
                                                            </button>
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
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === "registrations" && (
                            <motion.div key="registrations" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card !p-0 overflow-hidden border-white/10 shadow-2xl">
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
                                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest w-fit border ${r.refundStatus === 'participant_confirmed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                                r.refundStatus === 'participant_disputed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                                    r.refundStatus === 'vendor_proof_uploaded' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                                                        r.refundStatus === 'refund_requested' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                                            'bg-white/5 text-muted-foreground border-white/10'
                                                                }`}>
                                                                {r.refundStatus ? r.refundStatus.replace(/_/g, " ") : "NONE"}
                                                            </span>
                                                            {r.refundProofUrl && (
                                                                <a href={r.refundProofUrl} target="_blank" className="text-[9px] font-black text-sky-400 hover:text-sky-300 transition-colors uppercase tracking-widest flex items-center gap-1">
                                                                    <i className="fa-solid fa-paperclip"></i> View Proof
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
                                                                <button
                                                                    onClick={() => handleRefundAction(r.id, "approve")}
                                                                    className={`px-4 py-2 border rounded-xl text-[9px] font-black uppercase transition-all ${r.refundStatus === 'participant_confirmed' || r.refundStatus === 'participant_disputed'
                                                                        ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20'
                                                                        : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                                                                        }`}
                                                                    title={r.refundStatus === 'participant_confirmed' ? 'Safe to Refund' : 'Proceed with caution'}
                                                                >
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
                        {activeSection === "admins" && (
                            <motion.div key="admins" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="space-y-8">
                                {!showCreateAdminForm ? (
                                    <div className="glass-card !p-0 overflow-hidden border-red-500/20 shadow-2xl">
                                        <div className="p-8 bg-red-900/10 border-b border-red-500/20 flex justify-between items-center">
                                            <div className="flex items-center gap-4 text-red-500">
                                                <i className="fa-solid fa-user-shield text-2xl"></i>
                                                <div>
                                                    <h3 className="text-xl font-black uppercase tracking-tight">System Administrators</h3>
                                                    <p className="text-[10px] font-bold text-red-500/70 uppercase tracking-widest">Active Commanders</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowCreateAdminForm(true)}
                                                className="px-6 py-3 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 hover:-translate-y-1"
                                            >
                                                <i className="fa-solid fa-plus mr-2"></i> Deploy New Admin
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-secondary/50 border-b border-white/5 uppercase text-[10px] font-black tracking-widest text-muted-foreground">
                                                    <tr>
                                                        <th className="px-8 py-6">Administrator</th>
                                                        <th className="px-8 py-6">Role</th>
                                                        <th className="px-8 py-6">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {users.filter(u => u.role === 'admin').map(admin => (
                                                        <tr key={admin.id} className="hover:bg-white/5 transition-all">
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 font-bold border border-red-500/20">
                                                                        {admin.displayName?.[0]?.toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-foreground">{admin.displayName}</p>
                                                                        <p className="text-[10px] font-bold text-muted-foreground">{admin.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20">
                                                                    Super Admin
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className="flex items-center gap-2 text-[9px] font-black text-green-500 uppercase tracking-widest">
                                                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                                    Active
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-xl mx-auto">
                                        <button
                                            onClick={() => setShowCreateAdminForm(false)}
                                            className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <i className="fa-solid fa-arrow-left"></i> Back to List
                                        </button>
                                        <div className="glass-card !p-10 border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                                            <div className="text-center mb-10">
                                                <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-2xl flex items-center justify-center mb-4 border border-red-500/20">
                                                    <i className="fa-solid fa-user-plus text-3xl text-red-500"></i>
                                                </div>
                                                <h2 className="text-2xl font-black text-foreground uppercase tracking-widest">Deploy Administrator</h2>
                                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em] mt-2">Grant Full System Privileges</p>
                                            </div>

                                            <form onSubmit={handleCreateAdmin} className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Admin Name</label>
                                                    <input
                                                        value={newAdminName}
                                                        onChange={e => setNewAdminName(e.target.value)}
                                                        className="w-full px-5 py-4 bg-secondary/50 border border-border rounded-xl text-foreground outline-none focus:border-red-500 transition-all font-bold text-sm"
                                                        required
                                                        placeholder="Commander Name"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Secure Email</label>
                                                    <input
                                                        type="email"
                                                        value={newAdminEmail}
                                                        onChange={e => setNewAdminEmail(e.target.value)}
                                                        className="w-full px-5 py-4 bg-secondary/50 border border-border rounded-xl text-foreground outline-none focus:border-red-500 transition-all font-bold text-sm"
                                                        required
                                                        placeholder="admin@vibe.io"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Password</label>
                                                    <input
                                                        type="password"
                                                        value={newAdminPassword}
                                                        onChange={e => setNewAdminPassword(e.target.value)}
                                                        className="w-full px-5 py-4 bg-secondary/50 border border-border rounded-xl text-foreground outline-none focus:border-red-500 transition-all font-bold text-sm"
                                                        required
                                                        placeholder="••••••••"
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={creatingAdmin}
                                                    className="w-full py-5 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-red-500/20 mt-4 disabled:opacity-50"
                                                >
                                                    {creatingAdmin ? "Deploying..." : "Grant Access"}
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Workshop Modal */}
                        <AnimatePresence>
                            {showWorkshopModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                        className="bg-[#0f0f13] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-vibe shadow-2xl"
                                    >
                                        <div className="p-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#0f0f13] z-10">
                                            <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
                                                {editingWorkshop ? 'Edit Workshop' : 'Create Workshop'}
                                            </h3>
                                            <button onClick={() => setShowWorkshopModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                                                <i className="fa-solid fa-xmark"></i>
                                            </button>
                                        </div>
                                        <form onSubmit={handleSaveWorkshop} className="p-8 space-y-6">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Title</label>
                                                    <input required value={workshopFormData.title} onChange={e => setWorkshopFormData({ ...workshopFormData, title: e.target.value })} className="w-full bg-secondary/30 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-colors" placeholder="Workshop Title" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Category</label>
                                                    <select value={workshopFormData.category} onChange={e => setWorkshopFormData({ ...workshopFormData, category: e.target.value })} className="w-full bg-secondary/30 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-colors">
                                                        <option>Pottery</option>
                                                        <option>Music</option>
                                                        <option>Art</option>
                                                        <option>Tech</option>
                                                        <option>Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Description</label>
                                                <textarea required value={workshopFormData.description} onChange={e => setWorkshopFormData({ ...workshopFormData, description: e.target.value })} className="w-full bg-secondary/30 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-colors min-h-[100px]" placeholder="Brief description..." />
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Price (Rs)</label>
                                                    <input type="number" required value={workshopFormData.price} onChange={e => setWorkshopFormData({ ...workshopFormData, price: Number(e.target.value) })} className="w-full bg-secondary/30 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-colors" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Max Attendees</label>
                                                    <input type="number" required value={workshopFormData.maxAttendees} onChange={e => setWorkshopFormData({ ...workshopFormData, maxAttendees: Number(e.target.value) })} className="w-full bg-secondary/30 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-colors" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Date</label>
                                                    <input type="date" required value={workshopFormData.date} onChange={e => setWorkshopFormData({ ...workshopFormData, date: e.target.value })} className="w-full bg-secondary/30 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-colors" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Location</label>
                                                    <input required value={workshopFormData.location} onChange={e => setWorkshopFormData({ ...workshopFormData, location: e.target.value })} className="w-full bg-secondary/30 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-colors" placeholder="Venue Address" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Image URL</label>
                                                <input required value={workshopFormData.imageUrl} onChange={e => setWorkshopFormData({ ...workshopFormData, imageUrl: e.target.value })} className="w-full bg-secondary/30 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-colors" placeholder="https://..." />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Vendor/Host Name</label>
                                                <input required value={workshopFormData.vendorName} onChange={e => setWorkshopFormData({ ...workshopFormData, vendorName: e.target.value })} className="w-full bg-secondary/30 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-colors" placeholder="Host Name" />
                                            </div>

                                            <button type="submit" className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 mt-4">
                                                {editingWorkshop ? 'Update Workshop' : 'Create Workshop'}
                                            </button>
                                        </form>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
