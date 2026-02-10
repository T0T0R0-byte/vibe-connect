import React, { useEffect, useState } from 'react';
import { GlassCard } from "@/app/components/ui/GlassCard";
import { db } from "@/firebase/firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface ReviewsViewProps {
    workshopId?: string;
}

export const ReviewsView: React.FC<ReviewsViewProps> = ({ workshopId }) => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let q = query(collection(db, "reviews"));
        if (workshopId) {
            q = query(collection(db, "reviews"), where("workshopId", "==", workshopId));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            setReviews(list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [workshopId]);

    const avgRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : "5.0";

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Student Feedback</h2>
                    <p className="text-sm text-muted-foreground font-medium mt-1 uppercase tracking-widest">Reviews from your workshop sessions</p>
                </div>
                <div className="text-center px-6 py-3 bg-white/5 rounded-2xl border border-white/10 hidden md:block">
                    <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Avg Rating</span>
                    <span className="text-2xl font-black text-amber-500 flex items-center gap-2">
                        {avgRating} <i className="fa-solid fa-star text-sm"></i>
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="p-20 flex justify-center"><i className="fa-solid fa-circle-notch animate-spin text-primary text-3xl"></i></div>
            ) : reviews.length === 0 ? (
                <GlassCard className="p-20 text-center border-dashed border-2 border-white/10 bg-transparent">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No reviews yet.</p>
                </GlassCard>
            ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {reviews.map((review) => (
                        <GlassCard key={review.id} className="p-8 space-y-4 hover:border-primary/30 transition-all group bg-[#121212] rounded-[2rem] border border-white/5">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs uppercase">
                                        {review.userName?.[0] || "?"}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <h4 className="text-sm font-black text-white uppercase tracking-tight truncate">{review.userName || "Anonymous"}</h4>
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest truncate">{review.workshopTitle || "Workshop"}</p>
                                    </div>
                                </div>
                                <div className="flex text-amber-500 gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <i key={i} className={`fa-solid fa-star text-[8px] ${i < review.rating ? 'opacity-100' : 'opacity-20'}`}></i>
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs font-medium text-white/80 leading-relaxed italic line-clamp-4">
                                "{review.comment}"
                            </p>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
};
