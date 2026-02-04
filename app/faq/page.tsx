"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedBackground } from "@/app/components/AnimatedBackground";

export default function FAQPage() {
    const faqData = [
        { q: "How do I join a workshop?", a: "Simply browse our workshops, pick one that matches your vibe, and click 'Register'. Once paid, you'll receive a confirmation email with all details." },
        { q: "Is my payment secure?", a: "Yes, we use Stripe for all transactions. Your payment information is never stored on our servers and is handled with industry-standard encryption." },
        { q: "Can I host my own workshop?", a: "Absolutely! If you're an expert in your craft, click on 'Become a Vendor' to set up your profile and start listing today." },
        { q: "What is your refund policy?", a: "Refunds can be requested up to 24 hours before the workshop starts. Once requested, the vendor will process it through their dashboard." },
        { q: "How do I become a vendor?", a: "Click on 'Become a Vendor' in the navigation or home page, fill in your business details, and upload your identification documents. Once verified, you can start creating workshops." },
        { q: "Can I request a custom workshop?", a: "Yes! Most of our vendors accept custom requests for private events, corporate teams, or one-on-one sessions. Look for the 'Custom Request' feature in the vendor's profile." }
    ];

    const howItWorks = [
        { step: "01", title: "Explore Skills", desc: "Browse through hundreds of unique workshops curated by industry experts.", icon: "fa-compass" },
        { step: "02", title: "Secure Spot", desc: "Book your experience with our seamless and secure payment gateway.", icon: "fa-ticket" },
        { step: "03", title: "Level Up", desc: "Join live sessions and become part of a global community of creators.", icon: "fa-bolt" },
    ];

    return (
        <div className="min-h-screen bg-background pt-32 pb-20 px-6 relative overflow-hidden">
            <AnimatedBackground />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <header className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-full glass border-white/10 mb-8"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Support & Guide</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-8xl font-black text-foreground tracking-tighter leading-none mb-8"
                    >
                        THE <span className="text-primary">KNOWLEDGE</span> <br /> BASE.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-muted-foreground text-xl max-w-2xl mx-auto font-medium"
                    >
                        Everything you need to know about the VibeConnect ecosystem. From booking your first session to hosting global events.
                    </motion.p>
                </header>

                {/* How It Works Section */}
                <section className="mb-32">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-foreground tracking-tight mb-2 uppercase italic">The Journey</h2>
                        <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.3em]">Master your craft in three simple steps</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {howItWorks.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card relative p-12 flex flex-col items-center text-center group border-white/5"
                            >
                                <div className="absolute top-6 left-6 text-4xl font-black text-primary/10 group-hover:text-primary/20 transition-colors uppercase">{item.step}</div>
                                <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">
                                    <i className={`fa-solid ${item.icon}`}></i>
                                </div>
                                <h3 className="text-2xl font-black text-foreground mb-4">{item.title}</h3>
                                <p className="text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-foreground tracking-tight mb-2 uppercase italic">Common Queries</h2>
                        <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.3em]">Quick answers to get you vibing</p>
                    </div>

                    <div className="space-y-4">
                        {faqData.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="glass rounded-3xl p-8 border-white/5 hover:border-primary/20 transition-all cursor-pointer group"
                            >
                                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center justify-between">
                                    {item.q}
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
                                        <i className="fa-solid fa-plus text-[10px] group-hover:rotate-45 transition-transform"></i>
                                    </div>
                                </h3>
                                <p className="text-muted-foreground text-sm font-medium leading-relaxed opacity-80">{item.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
}
