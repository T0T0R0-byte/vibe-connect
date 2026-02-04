"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";

export default function Navbar() {
    const { user, userData, logout, loading } = useAuth();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [logoClickCount, setLogoClickCount] = useState(0);
    const router = useRouter();

    const handleLogoClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newCount = logoClickCount + 1;
        setLogoClickCount(newCount);
        if (newCount >= 5) {
            router.push('/admin/login');
            setLogoClickCount(0);
        }
    };

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navItems = [
        { name: "Home", path: "/" },
        { name: "Workshops", path: "/workshops" },
        { name: "Guide", path: "/faq" },
    ];

    return (
        <header
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl transition-all duration-500 rounded-[2.5rem] px-8 py-3
                ${scrolled ? "glass-nav shadow-3xl border-white/10" : "bg-transparent border-transparent"}
            `}
        >
            <nav className="flex justify-between items-center relative">
                <Link href="/" className="flex items-center gap-3 group">
                    <div onClick={handleLogoClick} className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20 group-hover:rotate-12 transition-all cursor-pointer">
                        V
                    </div>
                    <span className="text-2xl font-black tracking-tighter uppercase leading-[0.8] text-foreground group-hover:text-primary transition-colors">
                        Vibe<span className="text-primary">Connect</span>
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex gap-1 items-center bg-white/5 px-2 py-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                href={item.path}
                                className={`relative px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                    ${isActive ? "text-white" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}
                                `}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 bg-primary/20 rounded-xl"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className="hidden md:flex items-center gap-6">
                    <ThemeToggle />

                    {loading ? (
                        <div className="w-10 h-10 bg-white/5 rounded-full animate-pulse"></div>
                    ) : user ? (
                        <div className="relative group">
                            <button className="flex items-center gap-2 pl-4 pr-2 py-1.5 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-full transition-all group-hover:border-primary/30 group-hover:bg-white/[0.08]">
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none truncate max-w-[100px] text-foreground/90">{userData?.displayName || "Account"}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary via-indigo-500 to-purple-500 p-[1px] shadow-lg shadow-primary/10">
                                        <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px] uppercase tracking-tighter relative overflow-hidden">
                                            <span>{userData?.displayName?.[0] || "?"}</span>
                                            {userData?.photoURL && (
                                                <img
                                                    src={userData.photoURL}
                                                    alt="Profile"
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <i className="fa-solid fa-chevron-down text-[8px] text-muted-foreground group-hover:text-primary transition-colors mr-1"></i>
                                </div>
                            </button>

                            {/* Dropdown */}
                            <div className="absolute right-0 top-full mt-3 w-64 glass-card-premium !p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 transform origin-top-right translate-y-4 group-hover:translate-y-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/10">
                                <div className="px-4 py-4 border-b border-white/5 mb-2 bg-white/[0.02] rounded-t-2xl">
                                    <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mb-1">Authenticated Account</p>
                                    <p className="text-xs font-bold text-foreground truncate">{user.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase rounded-md border border-primary/20 tracking-tighter">
                                            {userData?.role || "Participant"}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Link href="/profile" className="flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all hover:translate-x-1 group/item">
                                        <span className="flex items-center gap-3"><i className="fa-solid fa-id-card text-primary/70 group-hover/item:text-primary"></i> My Profile</span>
                                        <i className="fa-solid fa-arrow-right text-[8px] opacity-0 group-hover/item:opacity-100 transition-all"></i>
                                    </Link>
                                    {userData?.role === "vendor" && (
                                        <Link href="/vendor" className="flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all hover:translate-x-1 group/item">
                                            <span className="flex items-center gap-3"><i className="fa-solid fa-chart-line text-indigo-400 group-hover/item:text-indigo-300"></i> Vendor Dashboard</span>
                                            <i className="fa-solid fa-arrow-right text-[8px] opacity-0 group-hover/item:opacity-100 transition-all"></i>
                                        </Link>
                                    )}
                                    {(userData?.email === "admin@vibe.com" || (userData as any)?.role === 'admin') && (
                                        <Link href="/admin" className="flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500/5 transition-all hover:translate-x-1 group/item text-red-400">
                                            <span className="flex items-center gap-3"><i className="fa-solid fa-shield-halved"></i> Control Center</span>
                                            <i className="fa-solid fa-arrow-right text-[8px] opacity-0 group-hover/item:opacity-100 transition-all"></i>
                                        </Link>
                                    )}
                                    <div className="h-px bg-white/5 my-2 mx-2"></div>
                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-500/80 rounded-xl hover:bg-red-500/10 transition-all hover:px-5"
                                    >
                                        <span className="flex items-center gap-3"><i className="fa-solid fa-power-off text-sm"></i> Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="px-8 py-3 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95"
                        >
                            Log In
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <div className="flex items-center gap-4 md:hidden">
                    <ThemeToggle />
                    <button
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-foreground hover:bg-white/10 transition"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <i className={`fa-solid ${isMenuOpen ? "fa-times" : "fa-bars"}`}></i>
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="absolute top-full left-0 right-0 mt-4 glass-card p-4 md:hidden shadow-3xl"
                    >
                        <div className="flex flex-col gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`px-5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pathname === item.path ? "bg-primary/20 text-white" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                            <div className="h-px bg-white/5 my-2"></div>
                            {user ? (
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-4 px-5 py-6 mb-2 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-indigo-500 p-[2px] shadow-lg shadow-primary/10 shrink-0">
                                            <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg uppercase relative overflow-hidden">
                                                <span>{userData?.displayName?.[0] || "?"}</span>
                                                {userData?.photoURL && (
                                                    <img
                                                        src={userData.photoURL}
                                                        alt="Profile"
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-base font-black text-white leading-tight truncate">{userData?.displayName || "Member"}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate mb-1">{user.email}</p>
                                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase rounded-md border border-primary/20 tracking-tighter">
                                                {userData?.role || "Participant"}
                                            </span>
                                        </div>
                                    </div>
                                    <Link
                                        href="/profile"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="px-5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-white/5 flex items-center gap-3"
                                    >
                                        <i className="fa-solid fa-id-card text-primary text-sm w-5"></i> My Profile
                                    </Link>
                                    {userData?.role === "vendor" && (
                                        <Link
                                            href="/vendor"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="px-5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-white/5 flex items-center gap-3"
                                        >
                                            <i className="fa-solid fa-chart-line text-sm w-5"></i> Vendor Dashboard
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => { logout(); setIsMenuOpen(false); }}
                                        className="px-5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 text-left hover:bg-red-500/5 transition-all flex items-center gap-3"
                                    >
                                        <i className="fa-solid fa-power-off text-sm w-5"></i> Sign Out
                                    </button>
                                </div>
                            ) : (
                                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="btn-vibe-primary text-center !py-4 shadow-xl shadow-primary/20">Log In</Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
