import { db, storage } from "@/firebase/firebaseConfig";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, arrayUnion, arrayRemove } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { User } from "../models/User";
import { Workshop } from "../models/Workshop";
import { sanitizeData } from "@/app/utils/serialize";

export class UserController {

    /**
     * Fetch user profile data from Firestore
     */
    static async fetchUserData(uid: string): Promise<User | null> {
        try {
            const userSnap = await getDoc(doc(db, "users", uid));
            if (!userSnap.exists()) return null;
            return sanitizeData({ uid, ...userSnap.data() }) as User;
        } catch (error) {
            console.error("Error fetching user data:", error);
            return null;
        }
    }

    /**
     * Update user profile (Photo, Display Name, Business Info)
     */
    static async updateUserData(uid: string, data: Partial<User>, photoFile?: File | null): Promise<void> {
        const updateData: any = { ...data };

        // 1. Handle Photo Upload
        if (photoFile) {
            const photoRef = ref(storage, `profiles/${uid}/${Date.now()}-${photoFile.name}`);
            await uploadBytes(photoRef, photoFile);
            const photoURL = await getDownloadURL(photoRef);
            updateData.photoURL = photoURL;
        }

        // 2. Update Firestore
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, updateData);

        // 3. Optional: Sync with Firebase Auth display name if provided
        if (data.displayName) {
            const { getAuth } = await import("firebase/auth");
            const authUser = getAuth().currentUser;
            if (authUser) {
                await updateProfile(authUser, {
                    displayName: data.displayName,
                    photoURL: updateData.photoURL || authUser.photoURL
                });
            }
        }
    }

    /**
     * Fetch user's favorite workshops
     */
    static async fetchFavorites(favoriteIds: string[]): Promise<Workshop[]> {
        if (!favoriteIds || favoriteIds.length === 0) return [];
        try {
            const promises = favoriteIds.map(id => getDoc(doc(db, "workshops", id)));
            const snapshots = await Promise.all(promises);
            return snapshots
                .filter(s => s.exists())
                .map(s => sanitizeData({ id: s.id, ...s.data() }) as Workshop);
        } catch (error) {
            console.error("Error fetching favorites:", error);
            return [];
        }
    }

    /**
     * Toggle a workshop in user's favorites
     */
    static async toggleFavorite(uid: string, workshopId: string, isFavorite: boolean): Promise<void> {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            favorites: isFavorite ? arrayUnion(workshopId) : arrayRemove(workshopId)
        });
    }

    /**
     * Fetch all custom requests for a user
     */
    static async fetchCustomRequests(uid: string): Promise<any[]> {
        const q = query(collection(db, "custom_requests"), where("userId", "==", uid));
        const snap = await getDocs(q);
        return snap.docs.map(doc => sanitizeData({ id: doc.id, ...doc.data() }));
    }
}
