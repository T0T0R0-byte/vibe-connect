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

export default function SeedPage() {
    const { user, userData } = useAuth();
    const [status, setStatus] = useState("Idle");

    const handleSeed = async () => {
        if (!user) {
            setStatus("Error: You must be logged in to seed your dashboard.");
            return;
        }

        setStatus("Seeding...");
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
                console.log("Promoted user to Vendor.");
            }

            // 2. Create Workshops for THIS User
            const createdWorkshopIds = [];

            // Workshop 1: Active & Popular
            const ws1 = await addDoc(collection(db, "workshops"), {
                vendorId: user.uid,
                title: "Advanced Photography Masterclass",
                description: "Master the art of lighting and composition in this intensive weekend workshop.",
                price: 7500,
                category: "Photography",
                date: "2024-12-25",
                imageUrl: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80",
                location: "Colombo Fort",
                capacity: 20,
                createdAt: serverTimestamp(),
                rating: 4.8,
                ratingCount: 12
            });
            createdWorkshopIds.push(ws1.id);

            // Workshop 2: Cooking (Has Refunds)
            const ws2 = await addDoc(collection(db, "workshops"), {
                vendorId: user.uid,
                title: "Italian Pasta from Scratch",
                description: "Learn to make authentic tagliatelle and ravioli securely.",
                price: 5000,
                category: "Cooking",
                date: "2024-12-30",
                imageUrl: "https://images.unsplash.com/photo-1556910103-1c02745a30bf?w=800&q=80",
                location: "Galle Face",
                capacity: 10,
                createdAt: serverTimestamp(),
                rating: 5.0,
                ratingCount: 3
            });
            createdWorkshopIds.push(ws2.id);

            // 3. Create Registrations (Participants)
            // WS1 Participants (Mostly Paid)
            for (let i = 0; i < 5; i++) {
                await addDoc(collection(db, "registrations"), {
                    workshopId: ws1.id,
                    userId: `mock_user_${i}`,
                    status: i === 0 ? 'pending' : 'paid',
                    participantDetails: {
                        fullName: MOCK_PARTICIPANTS[i].name,
                        email: MOCK_PARTICIPANTS[i].email,
                        phone: MOCK_PARTICIPANTS[i].phone,
                        age: "25"
                    },
                    paymentId: `pay_mock_${i}`,
                    amount: 7500,
                    createdAt: serverTimestamp()
                });
            }

            // WS2 Participants (Includes Refund Requests)
            // Refund Requested
            await addDoc(collection(db, "registrations"), {
                workshopId: ws2.id,
                userId: `mock_user_refund_1`,
                status: 'paid',
                participantDetails: { fullName: "John Wick", email: "john@continental.com", phone: "+94 77 666 7777", age: "40" },
                paymentId: `pay_mock_ref_1`,
                amount: 5000,
                refundStatus: 'refund_requested',
                refundRequestDate: serverTimestamp(),
                createdAt: serverTimestamp()
            });

            // Refunded
            await addDoc(collection(db, "registrations"), {
                workshopId: ws2.id,
                userId: `mock_user_refund_2`,
                status: 'refunded',
                participantDetails: { fullName: "Sarah Connor", email: "sarah@skynet.com", phone: "+94 77 101 1010", age: "35" },
                paymentId: `pay_mock_ref_2`,
                amount: 5000,
                refundStatus: 'admin_approved',
                refundedAt: serverTimestamp(),
                createdAt: serverTimestamp()
            });

            setStatus(`Success! Added workshops and ${MOCK_PARTICIPANTS.length + 2} participants to your dashboard.`);
        } catch (error) {
            console.error(error);
            setStatus("Error: " + (error as Error).message);
        }
    };

    return (
        <div className="min-h-screen pt-32 flex flex-col items-center justify-center text-white bg-black">
            <h1 className="text-4xl font-bold mb-4">Dashboard Migrator</h1>
            <p className="mb-8 text-gray-400 max-w-md text-center">
                Click below to populate your <b>current account</b> with sample Workshops, Participants, and Refund Requests.
                This simulates migrating "old data" to the new system.
            </p>

            {user ? (
                <div className="text-center space-y-4">
                    <p className="text-sm text-indigo-400">Logged in as: {user.email}</p>
                    <button
                        onClick={handleSeed}
                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                    >
                        <i className="fa-solid fa-database mr-2"></i>
                        Restore Data
                    </button>
                    <p className="mt-4 font-mono text-emerald-400 h-8">{status}</p>
                </div>
            ) : (
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400 font-bold">Please Login First</p>
                    <a href="/login" className="text-xs underline text-red-300 mt-2 block">Go to Login</a>
                </div>
            )}
        </div>
    );
}
