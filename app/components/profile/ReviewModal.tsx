import React, { useState } from "react";
import { db } from "@/firebase/firebaseConfig";
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { Registration } from "@/app/models/Registration";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    registration: Registration | null;
    userId: string;
    existingReview?: any;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, registration, userId, existingReview }) => {
    const [rating, setRating] = useState(existingReview?.rating || 5);
    const [comment, setReviewComment] = useState(existingReview?.comment || "");
    const [saving, setSaving] = useState(false);

    if (!isOpen || !registration) return null;

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const reviewData = {
                workshopId: registration.workshopId,
                workshopTitle: registration.workshopTitle || "Untitled",
                registrationId: registration.registrationId,
                userId,
                userName: registration.displayName || "Anonymous",
                rating,
                comment,
                updatedAt: serverTimestamp(),
            };

            if (existingReview?.id) {
                // Update
                await updateDoc(doc(db, "reviews", existingReview.id), reviewData);
            } else {
                // Create
                await addDoc(collection(db, "reviews"), {
                    ...reviewData,
                    createdAt: serverTimestamp(),
                });
            }

            // Sync with workshop rating? (Optional logic can be added here)
            window.location.reload(); // Quick refresh for now
        } catch (e) {
            console.error(e);
            alert("Failed to submit review.");
        } finally {
            setSaving(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#121212] w-full max-w-sm rounded-[2rem] border border-white/10 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                    {existingReview ? 'Edit Review' : 'Write Review'}
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">Rate your experience</p>

                <div className="flex gap-2 mb-8 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`text-2xl transition-all ${star <= rating ? 'text-amber-500 scale-110' : 'text-white/10'}`}
                        >
                            <i className="fa-solid fa-star"></i>
                        </button>
                    ))}
                </div>

                <textarea
                    value={comment}
                    onChange={e => setReviewComment(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-primary/50 mb-6 h-32 resize-none"
                    placeholder="Share your thoughts about this workshop..."
                />

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-white transition-all">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        {saving ? <i className="fa-solid fa-circle-notch animate-spin"></i> : 'Submit Review'}
                    </button>
                </div>
            </div>
        </div>
    );
};
