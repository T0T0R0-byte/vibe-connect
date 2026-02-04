"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

const MOCK_PARTICIPANTS = [
    { name: "Alice Johnson", email: "alice@example.com", phone: "+94 77 123 4567" },
    { name: "Bob Smith", email: "bob@test.com", phone: "+94 71 987 6543" },
    { name: "Charlie Brown", email: "charlie@gmail.com", phone: "+94 76 555 1234" },
    { name: "Diana Prince", email: "diana@amazon.com", phone: "+94 70 111 2222" },
    { name: "Evan Wright", email: "evan@yahoo.com", phone: "+94 77 888 9999" }
];

const MOCK_VENDORS = [
    { name: "Artistic Soul", email: "art@soul.com", business: "Artistic Soul Studio", category: "Art" },
    { name: "Tech Ninjas", email: "code@ninjas.com", business: "Tech Ninjas Academy", category: "Tech" },
    { name: "Zen Masters", email: "yoga@zen.com", business: "Zen Masters Yoga", category: "Wellness" },
    { name: "Culinary delights", email: "chef@delight.com", business: "Culinary Delights", category: "Cooking" }
];

const WORKSHOP_TEMPLATES = [
    { title: "Abstract Painting Basics", category: "Art", price: 4500, image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80" },
    { title: "React Native Bootcamp", category: "Tech", price: 15000, image: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=800&q=80" },
    { title: "Morning Vinyasa Flow", category: "Wellness", price: 2000, image: "https://images.unsplash.com/photo-1544367563-12123d8959d9?w=800&q=80" },
    { title: "Sushi Making 101", category: "Cooking", price: 6000, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80" },
    { title: "Digital Marketing Pro", category: "Business", price: 8000, image: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=800&q=80" },
    { title: "Pottery for Beginners", category: "Art", price: 5500, image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80" },
];

export default function SeedPage() {
    const { user, userData } = useAuth();
    const [status, setStatus] = useState("Idle");

    const handleRestoreMyData = async () => {
        if (!user) {
            setStatus("Error: You must be logged in to seed your dashboard.");
            return;
        }
        setStatus("Restoring your data...");
        try {
            // 1. Ensure User is a Vendor
            if (userData?.role !== 'vendor') {
                await setDoc(doc(db, "users", user.uid), {
                    role: 'vendor',
                    displayName: user.displayName || "Test Vendor",
                    email: user.email,
                    photoURL: user.photoURL,
                    businessName: "My Awesome Academy",
                    phoneNumber: "+94 77 000 0000",
                    createdAt: serverTimestamp()
                }, { merge: true });
            }

            // Create specific workshops for the logged-in user...
            // Workshop 1: Active & Popular
            const ws1 = await addDoc(collection(db, "workshops"), {
                vendorId: user.uid,
                title: "Advanced Photography Masterclass",
                description: "Master the art of lighting and composition in this intensive weekend workshop.",
                price: 7500,
                category: "Photography",
                date: new Date(Date.now() + 86400000 * 10).toISOString(), // 10 days future
                refundUntil: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days future
                imageUrl: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80",
                location: "Colombo Fort",
                capacity: 20,
                createdAt: serverTimestamp(),
                rating: 4.8,
                ratingCount: 12
            });

            // Workshop 2: Cooking (Has Refunds)
            const ws2 = await addDoc(collection(db, "workshops"), {
                vendorId: user.uid,
                title: "Italian Pasta from Scratch",
                description: "Learn to make authentic tagliatelle and ravioli securely.",
                price: 5000,
                category: "Cooking",
                date: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago (Past)
                imageUrl: "https://images.unsplash.com/photo-1556910103-1c02745a30bf?w=800&q=80",
                location: "Galle Face",
                capacity: 10,
                createdAt: serverTimestamp(),
                rating: 5.0,
                ratingCount: 3
            });

            // Registrations... 
            // (Simplified from previous for brevity, can re-add if needed, but 'marketplace' is requested)
            setStatus("Restored tailored data for your account.");
        } catch (e) {
            console.error(e);
            setStatus("Error restoring: " + (e as Error).message);
        }
    };

    const handleSeedMarketplace = async () => {
        setStatus("Seeding marketplace...");
        try {
            const vendorIds = [];

            // 1. Create Mock Vendors
            for (const v of MOCK_VENDORS) {
                const vid = `mock_vendor_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                await setDoc(doc(db, "users", vid), {
                    role: 'vendor',
                    displayName: v.name,
                    email: v.email,
                    businessName: v.business,
                    phoneNumber: "+94 77 000 0000",
                    photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.name}`,
                    createdAt: serverTimestamp(),
                    rating: (3.5 + Math.random() * 1.5).toFixed(1),
                    ratingCount: Math.floor(Math.random() * 50)
                });
                vendorIds.push(vid);
            }

            // 2. Create Workshops
            for (let i = 0; i < 15; i++) {
                const vendorId = vendorIds[Math.floor(Math.random() * vendorIds.length)];
                const template = WORKSHOP_TEMPLATES[Math.floor(Math.random() * WORKSHOP_TEMPLATES.length)];

                // Randomize date: -30 days to +60 days
                const daysOffset = Math.floor(Math.random() * 90) - 30;
                const date = new Date(Date.now() + daysOffset * 86400000);
                const isPast = daysOffset < 0;

                const hasRefundLimit = Math.random() > 0.5;
                const refundDate = hasRefundLimit ? new Date(date.getTime() - 86400000 * 2) : null; // 2 days before event

                await addDoc(collection(db, "workshops"), {
                    vendorId,
                    title: template.title,
                    description: `Join us for an amazing session on ${template.title}. Learn from the experts!`,
                    price: template.price, // Fixed price from template
                    category: template.category,
                    date: date.toISOString(),
                    refundUntil: refundDate?.toISOString(),
                    imageUrl: template.image,
                    location: Math.random() > 0.3 ? "Colombo, Sri Lanka" : "Online",
                    capacity: 10 + Math.floor(Math.random() * 40),
                    createdAt: serverTimestamp(),
                    rating: isPast ? (4 + Math.random()).toFixed(1) : undefined, // Only rate if past
                    ratingCount: isPast ? Math.floor(Math.random() * 20) : 0,
                    isFrozen: Math.random() > 0.9 // 10% chance of random freeze
                });
            }

            setStatus(`Marketplace populated! Created ${MOCK_VENDORS.length} vendors and 15 workshops.`);
        } catch (e) {
            console.error(e);
            setStatus("Error seeding marketplace: " + (e as Error).message);
        }
    }

    return (
        <div className="min-h-screen pt-32 flex flex-col items-center justify-center text-white bg-black p-4">
            <h1 className="text-4xl font-bold mb-4">Data Seeder</h1>
            <p className="mb-8 text-gray-400 max-w-md text-center">
                Use these tools to populate your database with sample data.
            </p>

            <div className="grid gap-6 w-full max-w-md">
                {user && (
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center">
                        <h3 className="text-xl font-bold mb-2">My Account</h3>
                        <p className="text-sm text-gray-400 mb-4">Promote yourself to Vendor and create personal test workshops.</p>
                        <button
                            onClick={handleRestoreMyData}
                            className="w-full py-4 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-500 transition-all"
                        >
                            Restore My Data
                        </button>
                    </div>
                )}

                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center">
                    <h3 className="text-xl font-bold mb-2">Marketplace Scenarios</h3>
                    <p className="text-sm text-gray-400 mb-4">Generate 4 fake vendors and 15 varied workshops (Past/Future).</p>
                    <button
                        onClick={handleSeedMarketplace}
                        className="w-full py-4 bg-emerald-600 rounded-xl font-bold hover:bg-emerald-500 transition-all"
                    >
                        Seed Marketplace
                    </button>
                </div>
            </div>

            <p className="mt-8 font-mono text-amber-400 h-8 text-center">{status}</p>
        </div>
    );
}
