import React from "react";
import { Workshop } from "@/app/models/Workshop";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

interface FavoritesListProps {
    favorites: Workshop[];
    onToggleFavorite: (workshopId: string) => void;
}

export const FavoritesList: React.FC<FavoritesListProps> = ({ favorites, onToggleFavorite }) => {
    if (favorites.length === 0) {
        return (
            <div className="glass-card !p-16 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fa-solid fa-heart text-2xl text-muted-foreground"></i>
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">No Favorites Yet</h3>
                <p className="text-sm font-bold text-muted-foreground">Save the workshops you love to find them later.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
                {favorites.map((fav, idx) => (
                    <motion.div
                        key={fav.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.05 }}
                        className="glass-card !p-0 group overflow-hidden"
                    >
                        <div className="relative h-60">
                            <Image
                                src={fav.imageUrl || "https://images.unsplash.com/photo-1513364776144-60967b0f800f"}
                                alt={fav.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>

                            <button
                                onClick={() => onToggleFavorite(fav.id)}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-primary transition-all hover:bg-white/20"
                            >
                                <i className="fa-solid fa-heart"></i>
                            </button>

                            <div className="absolute bottom-6 left-6 right-6">
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary mb-2 block">{fav.category}</span>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight">{fav.title}</h3>
                            </div>
                        </div>

                        <div className="p-6 flex flex-col gap-6">
                            <p className="text-xs font-medium text-muted-foreground line-clamp-2 leading-relaxed">
                                {fav.description}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <span className="text-sm font-black text-white tracking-widest uppercase">Rs. {fav.price || 0}</span>
                                <Link
                                    href={`/workshops?id=${fav.id}`}
                                    className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 group/btn"
                                >
                                    View Details
                                    <i className="fa-solid fa-arrow-right group-hover/btn:translate-x-1 transition-transform"></i>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
