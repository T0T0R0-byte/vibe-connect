import Link from "next/link";

export default function Home() {
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
            Discover hand-picked mentorship experiences. Join a community where <span className="text-primary font-bold">passion</span> meets <span className="text-foreground font-bold">mastery</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 w-full justify-center mb-20">
            <Link href="/workshops" className="btn-vibe-primary px-12 py-5 text-sm flex items-center justify-center gap-3">
              Explore Experiences
              <i className="fa-solid fa-compass"></i>
            </Link>
            <Link href="/vendor" className="btn-vibe-secondary px-12 py-5 text-sm flex items-center justify-center gap-3">
              Become a Mentor
              <i className="fa-solid fa-plus-circle"></i>
            </Link>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 pt-10 border-t border-white/5 w-full max-w-4xl">
            {[
              { label: "Active Users", val: "10K+" },
              { label: "Top Mentors", val: "200+" },
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

      {/* SECTION 4: HOW IT WORKS */}
      <section className="w-full py-32 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-foreground tracking-tighter mb-4">Journey to Mastery.</h2>
            <p className="text-muted-foreground font-bold text-xs uppercase tracking-[0.3em]">Three steps to your next break-through</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full">
            {[
              { step: "01", title: "Explore Skills", desc: "Browse through hundreds of unique workshops curated by industry experts.", icon: "fa-compass" },
              { step: "02", title: "Secure Spot", desc: "Book your experience with our seamless and secure payment gateway.", icon: "fa-ticket" },
              { step: "03", title: "Level Up", desc: "Join live sessions and become part of a global community of creators.", icon: "fa-bolt" },
            ].map((item, i) => (
              <div key={i} className="glass-card relative p-12 flex flex-col items-center text-center group">
                <div className="absolute top-6 left-6 text-4xl font-black text-primary/10 group-hover:text-primary/20 transition-colors uppercase">{item.step}</div>
                <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">
                  <i className={`fa-solid ${item.icon}`}></i>
                </div>
                <h3 className="text-2xl font-black text-foreground mb-4">{item.title}</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              { name: "Marcus Thorne", role: "DevOps Lead", text: "Found a mentor who helped me double my salary. The networking here is unparalleled.", avatar: "https://i.pravatar.cc/150?u=marcus" },
            ].map((t, i) => (
              <div
                key={i}
                className="glass-card p-10 flex flex-col gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
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

      {/* SECTION 7: FAQ */}
      <section className="w-full py-32 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-foreground tracking-tight mb-4 uppercase">Got Questions?</h2>
            <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Everything you need to know about the vibenation</p>
          </div>

          <div className="space-y-4">
            {[
              { q: "How do I join a workshop?", a: "Simply browse our workshops, pick one that matches your vibe, and click 'Register'. Once paid, you'll receive a confirmation email with all details." },
              { q: "Is my payment secure?", a: "Yes, we use Stripe for all transactions. Your payment information is never stored on our servers and is handled with industry-standard encryption." },
              { q: "Can I host my own workshop?", a: "Absolutely! If you're an expert in your craft, click on 'Become a Mentor' to set up your vendor profile and start listing today." },
              { q: "What is your refund policy?", a: "Refunds can be requested up to 24 hours before the workshop starts. Once requested, the vendor will process it through their dashboard." },
            ].map((item, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 border-white/5 hover:border-white/10 transition-all cursor-pointer group"
              >
                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center justify-between">
                  {item.q}
                  <i className="fa-solid fa-plus text-xs text-primary group-hover:rotate-45 transition-transform"></i>
                </h3>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8: NEWSLETTER */}
      <section className="w-full py-24 px-6 mb-20">
        <div className="max-w-6xl mx-auto glass-card !bg-gradient-to-r from-primary/10 to-indigo-500/10 p-12 md:p-20 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32" />

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-4xl font-black text-foreground mb-4">Stay in the Loop.</h2>
            <p className="text-muted-foreground font-medium text-lg">Weekly drops of the best workshops and creator tips, straight to your inbox.</p>
          </div>

          <div className="flex-1 w-full max-w-md">
            <div className="relative group">
              <input
                type="email"
                placeholder="you@vibe.io"
                className="w-full pl-6 pr-32 py-5 bg-black/20 border border-white/10 rounded-2xl font-bold text-sm text-foreground outline-none focus:border-primary/50 transition-all backdrop-blur-md"
              />
              <button className="absolute right-2 top-2 bottom-2 px-6 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:opacity-90 transition-opacity">
                Subscribe
              </button>
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
              Empowering creators and learners through immersive, mentorship-driven workshops. Building the world&apos;s largest sanctuary for craft and community.
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
              <li><Link href="/faq" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-foreground">Community</h4>
            <ul className="space-y-4 text-sm font-bold text-muted-foreground">
              <li><Link href="/vendor" className="hover:text-primary transition-colors">Join as Mentor</Link></li>
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
