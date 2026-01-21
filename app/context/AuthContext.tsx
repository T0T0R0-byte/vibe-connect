"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/firebase/firebaseConfig";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface UserData {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    phoneNumber?: string;
    role: "user" | "vendor" | "admin";
    favorites?: string[];
    registeredWorkshops?: string[];
    socialLink?: string;
    businessIdUrl?: string;
    businessName?: string;
    customOrdersEnabled?: boolean;
    bankDetails?: string;
    isVerified?: boolean;
}

interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    loading: true,
    logout: async () => { },
    refreshUserData: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                setUser(currentUser);
                // Real-time listener for user data
                const userDocRef = doc(db, "users", currentUser.uid);

                // Set up the listener
                const unsubscribeUserDoc = onSnapshot(userDocRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        setUserData(docSnap.data() as UserData);
                    } else {
                        // Create a default user document if it doesn't exist
                        console.warn("User document not found in Firestore. Creating default document...");
                        const defaultUserData: UserData = {
                            uid: currentUser.uid,
                            displayName: currentUser.displayName || "User",
                            email: currentUser.email || "",
                            role: "user",
                            favorites: [],
                            registeredWorkshops: [],
                        };
                        try {
                            await setDoc(userDocRef, {
                                ...defaultUserData,
                                createdAt: serverTimestamp(),
                            });
                            // Listener will fire again after setDoc
                        } catch (e) {
                            console.error("Error creating default user data", e);
                        }
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error listening to user data:", error);
                    setLoading(false);
                });

                // Return a cleanup function that unsubscribes primarily from the user doc listener
                // Note: The onAuthStateChanged unsubscribe is handled by the outer return
                return () => unsubscribeUserDoc();

            } else {
                setUser(null);
                setUserData(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setUserData(null);
        router.push("/login");
    };

    const refreshUserData = async () => {
        if (!user) return;
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                setUserData(userDoc.data() as UserData);
            }
        } catch (error) {
            console.error("Error refreshing user data:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, logout, refreshUserData }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
