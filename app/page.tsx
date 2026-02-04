import Link from "next/link";
import Image from "next/image";
import { FeaturedWorkshops } from "@/app/components/home/FeaturedWorkshops";
import { getAllWorkshops } from "@/firebase/workshopActions";

// export const revalidate = 60; // Disabled to prevent hydration mismatch in dev

export default async function Home() {
  const workshops = await getAllWorkshops();

  const categories = [
    { label: "Art", icon: "🎨", count: "120+", color: "from-pink-500/20 to-rose-500/20" },
    { label: "Tech", icon: "💻", count: "85+", color: "from-blue-500/20 to-cyan-500/20" },
    { label: "Music", icon: "🎸", count: "40+", color: "from-purple-500/20 to-indigo-500/20" },
    { label: "Business", icon: "📈", count: "65+", color: "from-amber-500/20 to-orange-500/20" },
  ];

  return (
    <div className="flex flex-col items-center justify-center overflow-x-hidden pt-20">

      {/* HERO SECTION - Immersive Hub */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">

        <div className="max-w-6xl mx-auto z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full glass border-white/10 mb-8 shadow-xl shadow-primary/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">The Ultimate Workshop Hub</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.85] text-gradient">
            VIBE <br />
            <span className="text-foreground block">CONNECT.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mb-12 leading-relaxed font-medium">
            Discover hand-picked expert-led experiences. Join a community where <span className="text-primary font-bold">passion</span> meets <span className="text-foreground font-bold">mastery</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 w-full justify-center mb-20">
            <Link href="/workshops" className="btn-vibe-primary px-12 py-5 text-sm flex items-center justify-center gap-3">
              Explore Experiences
              <i className="fa-solid fa-compass"></i>
            </Link>
            <Link href="/register?role=vendor" className="btn-vibe-secondary px-12 py-5 text-sm flex items-center justify-center gap-3">
              Become a Vendor
              <i className="fa-solid fa-plus-circle"></i>
            </Link>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 pt-10 border-t border-white/5 w-full max-w-4xl">
            {[
              { label: "Active Users", val: "10K+" },
              { label: "Top Vendors", val: "200+" },
              { label: "Success Rate", val: "99%" },
              { label: "Live Vibes", val: "50+" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-2xl md:text-3xl font-black text-foreground tracking-tighter">{stat.val}</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORY EXPLORER */}
      <section className="w-full pb-24 px-6 relative z-10 -mt-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((cat, i) => (
              <Link href={`/workshops?category=${cat.label}`} key={cat.label} className="contents">
                <div className={`glass-card p-6 !bg-gradient-to-br ${cat.color} border-white/5 flex flex-col items-center gap-3 group cursor-pointer hover:border-white/20 transition-all`}>
                  <span className="text-4xl group-hover:scale-110 transition-transform duration-500">{cat.icon}</span>
                  <h3 className="font-black text-xs uppercase tracking-widest">{cat.label}</h3>
                  <span className="text-[10px] font-bold text-muted-foreground">{cat.count} listings</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Workshops Section */}
      <FeaturedWorkshops initialWorkshops={workshops} />

      {/* SECTION 5: TESTIMONIALS */}
      <section className="w-full py-32 px-6 bg-white/[0.02] dark:bg-black/20 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-xl">
              <h2 className="text-5xl md:text-6xl font-black text-foreground tracking-tighter leading-none mb-6">Built by creators, <br /> for creators.</h2>
              <p className="text-muted-foreground font-medium text-lg">Hear from the humans building their dreams on VibeConnect.</p>
            </div>
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-muted-foreground hover:bg-white hover:text-black transition-all cursor-pointer"><i className="fa-solid fa-arrow-left"></i></div>
              <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-muted-foreground hover:bg-white hover:text-black transition-all cursor-pointer"><i className="fa-solid fa-arrow-right"></i></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Alex Rivera", role: "UI Designer", text: "VibeConnect changed how I learn. The workshops are actually intensive and high-value. No more half-baked tutorials.", avatar: "https://i.pravatar.cc/150?u=alex" },
              { name: "Sarah Chen", role: "Pottery Artist", text: "Selling my workshops became so easy. The platform handles everything, letting me focus on the art itself.", avatar: "https://i.pravatar.cc/150?u=sarah" },
              { name: "Marcus Thorne", role: "DevOps Lead", text: "Found an expert who helped me double my salary. The networking here is unparalleled.", avatar: "https://i.pravatar.cc/150?u=marcus" },
            ].map((t, i) => (
              <div
                key={i}
                className="glass-card p-10 flex flex-col gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 relative">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <h4 className="font-black text-foreground">{t.name}</h4>
                    <p className="text-[10px] uppercase font-black tracking-widest text-primary">{t.role}</p>
                  </div>
                </div>
                <p className="text-lg font-medium text-foreground/80 leading-relaxed italic">&quot;{t.text}&quot;</p>
                <div className="flex gap-1 text-amber-500 text-xs">
                  {[1, 2, 3, 4, 5].map(s => <i key={s} className="fa-solid fa-star"></i>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: READY TO START (UNIFIED GLASS) */}
      <section className="py-40 px-6 relative overflow-hidden bg-transparent">
        <div className="max-w-4xl mx-auto glass-card !p-16 md:!p-24 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-indigo-500/5 -z-10" />
          <div className="space-y-8">
            <h2 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter leading-tight">Join the <br /> Revolution.</h2>
            <p className="text-muted-foreground max-w-sm text-lg font-medium mx-auto opacity-80">Your journey to becoming a master of your craft starts with a single click. Join 10,000+ creators today.</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link href="/register" className="btn-vibe-primary px-16 py-6 text-sm">
                Create Account
              </Link>
              <Link href="/workshops" className="btn-vibe-secondary px-16 py-6 text-sm">
                Find Workshop
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-20 px-6 border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          <div className="col-span-1 md:col-span-2 space-y-8">
            <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">Vibe<span className="text-primary">Connect.</span></h2>
            <p className="text-muted-foreground max-w-sm font-medium leading-relaxed">
              Empowering creators and learners through immersive, vendor-led workshops. Building the world&apos;s largest sanctuary for craft and community.
            </p>
            <div className="flex gap-4">
              {['instagram', 'twitter', 'linkedin', 'facebook'].map(s => (
                <div key={s} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all cursor-pointer">
                  <i className={`fa-brands fa-${s}`}></i>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-foreground">Explore</h4>
            <ul className="space-y-4 text-sm font-bold text-muted-foreground">
              <li><Link href="/workshops" className="hover:text-primary transition-colors">Browse Workshops</Link></li>
              <li><Link href="/custom-request" className="hover:text-primary transition-colors">Custom Requests</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">Help Center & Guide</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-foreground">Community</h4>
            <ul className="space-y-4 text-sm font-bold text-muted-foreground">
              <li><Link href="/register?role=vendor" className="hover:text-primary transition-colors">Join as Vendor</Link></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">User Login</Link></li>
              <li><Link href="/register" className="hover:text-primary transition-colors">Create Account</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Partner with Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">© 2026 VibeConnect. All Rights Reserved.</p>
          <div className="flex items-center gap-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <span className="flex items-center gap-2"><i className="fa-solid fa-lock text-primary"></i> Secure Payments by Stripe</span>
            <span className="flex items-center gap-2"><i className="fa-solid fa-shield-check text-primary"></i> Verified Vibe</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
