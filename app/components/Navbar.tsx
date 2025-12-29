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
                            <button className="flex items-center gap-3 pl-3 pr-1 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group-hover:border-primary/20">
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none truncate max-w-[100px]">{userData?.displayName || "Account"}</span>
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-500 p-[2px]">
                                    <div className="w-full h-full rounded-[0.6rem] bg-background overflow-hidden relative">
                                        {userData?.photoURL ? (
                                            <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white font-black text-xs uppercase tracking-tighter">
                                                {userData?.displayName?.[0] || "?"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>

                            {/* Dropdown */}
                            <div className="absolute right-0 top-full mt-4 w-60 glass-card !p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right translate-y-2 group-hover:translate-y-0 shadow-3xl">
                                <div className="px-4 py-3 border-b border-white/5 mb-2">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Logged in as</p>
                                    <p className="text-[11px] font-bold text-foreground truncate">{user.email}</p>
                                </div>
                                <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/5 transition-colors">
                                    <i className="fa-regular fa-user text-primary"></i> Profile
                                </Link>
                                {userData?.role === "vendor" && (
                                    <Link href="/vendor" className="flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/5 transition-colors">
                                        <i className="fa-solid fa-store text-indigo-400"></i> Vendor Dashboard
                                    </Link>
                                )}
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {(userData?.email === "admin@vibe.com" || (userData as any)?.role === 'admin') && (
                                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/5 transition-colors text-red-400">
                                        <i className="fa-solid fa-shield-halved"></i> Admin Dashboard
                                    </Link>
                                )}
                                <div className="h-px bg-white/5 my-2"></div>
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 rounded-xl hover:bg-red-500/10 transition-colors"
                                >
                                    <i className="fa-solid fa-right-from-bracket"></i> Log Out
                                </button>
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
                                <>
                                    <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="px-5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-white/5">Profile</Link>
                                    {userData?.role === "vendor" && (
                                        <Link href="/vendor" onClick={() => setIsMenuOpen(false)} className="px-5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-white/5">Vendor Dashboard</Link>
                                    )}
                                    <button onClick={() => { logout(); setIsMenuOpen(false); }} className="px-5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 text-left hover:bg-red-500/5 transition-all">Log Out</button>
                                </>
                            ) : (
                                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="btn-vibe-primary text-center !py-4">Log In</Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
