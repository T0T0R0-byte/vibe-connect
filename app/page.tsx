"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Home() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.4], [1, 0.9]);
  const y = useTransform(scrollYProgress, [0, 0.4], [0, 50]);

  const categories = [
    { label: "Art", icon: "🎨", count: "120+", color: "from-pink-500/20 to-rose-500/20" },
    { label: "Tech", icon: "💻", count: "85+", color: "from-blue-500/20 to-cyan-500/20" },
    { label: "Music", icon: "🎸", count: "40+", color: "from-purple-500/20 to-indigo-500/20" },
    { label: "Business", icon: "📈", count: "65+", color: "from-amber-500/20 to-orange-500/20" },
  ];

  return (
    <div className="flex flex-col items-center justify-center overflow-x-hidden pt-20">

      {/* HERO SECTION - Immersive Hub */}
      <section ref={targetRef} className="relative w-full min-h-[85vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">

        {/* Background Atmosphere */}
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full animate-vibe-float" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full animate-vibe-float" style={{ animationDelay: '3s' }} />
        </div>

        <motion.div style={{ opacity, scale, y }} className="max-w-5xl mx-auto z-10 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full glass border-white/5 mb-10 shadow-xl shadow-primary/5"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">Live Workshop Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-6xl md:text-9xl font-black mb-8 tracking-tighter leading-[0.9] text-gradient"
          >
            Find Your <br />
            <span className="text-foreground">Passion.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-2xl text-muted-foreground/80 max-w-2xl mb-12 leading-relaxed font-medium"
          >
            The modern sanctuary for creative souls. Learn, collaborate, and master new crafts with the world's finest mentors.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-5 w-full justify-center"
          >
            <Link href="/workshops" className="btn-vibe-primary px-10 py-5 text-sm flex items-center justify-center gap-3">
              Browse Workshops
              <i className="fa-solid fa-compass animate-spin-slow"></i>
            </Link>
            <Link href="/vendor" className="btn-vibe-secondary px-10 py-5 text-sm flex items-center justify-center gap-3">
              Host a Workshop
              <i className="fa-solid fa-plus-circle"></i>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* CATEGORY EXPLORER */}
      <section className="w-full pb-24 px-6 relative z-10 -mt-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((cat, i) => (
              <Link href={`/workshops?category=${cat.label}`} key={cat.label} className="contents">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -10 }}
                  className={`glass-card p-6 !bg-gradient-to-br ${cat.color} border-white/5 flex flex-col items-center gap-3 group cursor-pointer hover:border-white/20 transition-all`}
                >
                  <span className="text-4xl group-hover:scale-125 transition-transform duration-500">{cat.icon}</span>
                  <h3 className="font-black text-xs uppercase tracking-widest">{cat.label}</h3>
                  <span className="text-[10px] font-bold text-muted-foreground">{cat.count} listings</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE BENTO GRID */}
      <section className="w-full py-24 px-6 bg-white/[0.02] dark:bg-black/20 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="md:col-span-2 glass-card flex flex-col justify-end p-10 bg-[url('https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071&auto=format&fit=crop')] bg-cover relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent group-hover:via-black/20 transition-all duration-700" />
            <div className="relative z-10">
              <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-2 block">Premium Curation</span>
              <h3 className="text-4xl font-black text-white leading-tight">Hand-picked mentorship <br /> for total growth.</h3>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card flex flex-col items-center justify-center p-10 text-center border-primary/20 bg-card/60 backdrop-blur-xl"
          >
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl shadow-2xl shadow-primary/50 mb-6">
              <i className="fa-solid fa-shield-check"></i>
            </div>
            <h3 className="text-xl font-black text-foreground mb-4 capitalize tracking-tight">Verified Mentors Only</h3>
            <p className="text-sm text-muted-foreground/80 font-medium">We vet every mentor to ensure you get professional-grade education.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card flex flex-col p-10 justify-between items-start bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20"
          >
            <i className="fa-solid fa-paper-plane text-3xl text-indigo-500"></i>
            <div>
              <h3 className="text-xl font-black text-foreground mb-2">Live Classes</h3>
              <p className="text-sm text-muted-foreground/80">Join real-time WhatsApp groups post-booking for instant support.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 glass-card flex items-center gap-10 p-10 bg-gradient-to-r from-zinc-900 to-black overflow-hidden relative"
          >
            <div className="flex-1 space-y-4">
              <h3 className="text-4xl font-black text-white">Join 10,000+ Creators</h3>
              <p className="text-zinc-400 font-medium max-w-sm">Level up your craft and build relationships that last a lifetime.</p>
              <Link href="/register" className="text-xs font-black uppercase text-primary tracking-widest hover:underline flex items-center gap-2">Create Account <i className="fa-solid fa-arrow-right"></i></Link>
            </div>
            <div className="flex flex-col gap-4 opacity-50 absolute -right-10 rotate-12">
              {[1, 2, 3].map(n => <div key={n} className="w-32 h-32 rounded-3xl bg-zinc-800 animate-pulse" />)}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6 border-t border-white/5 bg-secondary/10">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-black text-foreground">Ready to Get Started?</h2>
          <p className="text-muted-foreground max-w-2xl text-lg">Join our community of learners and mentors. Start your journey today.</p>
          <Link href="/register/demo" className="btn-vibe-primary px-12 py-6 text-sm">
            Find a Workshop
          </Link>
        </div>
      </section>

    </div>
  );
}
