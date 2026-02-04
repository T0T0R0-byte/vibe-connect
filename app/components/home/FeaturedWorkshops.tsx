"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { getAllWorkshops } from "@/firebase/workshopActions";
import { getWorkshopImage } from "@/app/utils/workshopUtils";
import { Workshop } from "@/app/models/Workshop";

export const FeaturedWorkshops = ({ initialWorkshops }: { initialWorkshops?: Workshop[] }) => {
    const [workshops, setWorkshops] = useState<Workshop[]>(initialWorkshops || []);
    const [loading, setLoading] = useState(!initialWorkshops);

    useEffect(() => {
        if (initialWorkshops) return;
        const fetchWorkshops = async () => {
            try {
                const data = await getAllWorkshops();
                setWorkshops(data);
            } catch (error) {
                console.error("Error fetching workshops for home:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchWorkshops();
    }, [initialWorkshops]);

    if (loading) return (
        <div className="w-full py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (workshops.length === 0) return null;

    return (
        <section className="w-full py-32 relative overflow-hidden bg-white/[0.01]">
            <div className="px-6 max-w-7xl mx-auto mb-16">
                <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                            <i className="fa-solid fa-fire text-primary text-[10px]"></i>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Trending Vibe</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter leading-none uppercase italic">
                            CURATED <br /> <span className="text-primary">EXPERIENCES.</span>
                        </h2>
                    </div>
                    <Link href="/workshops" className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3">
                        View All Workshops
                        <i className="fa-solid fa-arrow-right-long text-primary"></i>
                    </Link>
                </div>
            </div>

            {/* Infinite Carousel */}
            <div className="relative overflow-hidden w-full">
                <motion.div
                    className="flex gap-8 px-6"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{
                        duration: 40,
                        ease: "linear",
                        repeat: Infinity
                    }}
                >
                    {/* Triple the workshops to ensure no gaps */}
                    {[...workshops, ...workshops, ...workshops].map((ws, i) => (
                        <div
                            key={`${ws.id}-${i}`}
                            className="group relative min-w-[350px] md:min-w-[450px] h-[550px] rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/5 bg-background/20"
                        >
                            <Image
                                src={getWorkshopImage(ws)}
                                alt={ws.title}
                                fill
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/95 transition-opacity group-hover:opacity-90" />
                            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            <div className="absolute inset-0 p-10 flex flex-col justify-end gap-6">
                                <div className="space-y-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white border border-white/10">
                                            {ws.category}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-amber-400 font-black text-xs">
                                            <i className="fa-solid fa-star"></i>
                                            <span>{ws.rating ? ws.rating.toFixed(1) : "5.0"}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-4xl font-black text-white leading-none tracking-tight uppercase italic truncate">
                                        {ws.title}
                                    </h3>
                                    <p className="text-sm text-white/60 line-clamp-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 italic">
                                        {ws.description}
                                    </p>
                                </div>

                                <div className="flex gap-3 opacity-0 group-hover:opacity-100 translate-y-10 group-hover:translate-y-0 transition-all duration-500 delay-200">
                                    <Link
                                        href={`/register/${ws.id}`}
                                        className="flex-1 py-5 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary hover:text-white transition-all text-center flex items-center justify-center gap-2"
                                    >
                                        <i className="fa-solid fa-bolt"></i> Register
                                    </Link>
                                    <Link
                                        href={`/register/${ws.id}`}
                                        className="px-8 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all gap-2"
                                    >
                                        <i className="fa-solid fa-circle-info text-xs"></i>
                                        <span>Details</span>
                                    </Link>
                                </div>
                            </div>

                            <div className="absolute top-8 right-8 px-6 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-white font-black text-sm z-10 group-hover:scale-110 transition-transform">
                                LKR {ws.price?.toLocaleString() || "TBA"}
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};
