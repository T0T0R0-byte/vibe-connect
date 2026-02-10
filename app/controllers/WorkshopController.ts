import { db, storage } from "@/firebase/firebaseConfig";
import {
    collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where, serverTimestamp, getDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, StorageReference } from "firebase/storage";
import { Workshop } from "../models/Workshop";
import { sanitizeData } from "@/app/utils/serialize";

// Helper for robust upload with timeout
const uploadWithTimeout = async (fileRef: StorageReference, file: File): Promise<string> => {
    try {
        const uploadTask = uploadBytes(fileRef, file);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Upload timed out")), 10000)
        );
        await Promise.race([uploadTask, timeoutPromise]);
        return await getDownloadURL(fileRef);
    } catch (e) {
        console.warn("Upload timed out/failed:", e);
        return "";
    }
};

export class WorkshopController {

    /**
     * Fetch all workshops (for discovery/home)
     */
    static async fetchAllWorkshops(): Promise<Workshop[]> {
        try {
            const q = query(collection(db, "workshops"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => sanitizeData({ id: doc.id, ...doc.data() }) as Workshop);
        } catch (error) {
            console.error("Error fetching all workshops:", error);
            return [];
        }
    }

    /**
     * Fetch workshops for a specific vendor
     */
    static async fetchVendorWorkshops(vendorId: string): Promise<Workshop[]> {
        try {
            const q = query(collection(db, "workshops"), where("vendorId", "==", vendorId));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => sanitizeData({ id: doc.id, ...doc.data() }) as Workshop);
        } catch (error) {
            console.error("Error fetching vendor workshops:", error);
            throw error;
        }
    }

    /**
     * Fetch a single workshop by ID
     */
    static async fetchWorkshopById(id: string): Promise<Workshop | null> {
        try {
            const workshopSnap = await getDoc(doc(db, "workshops", id));
            if (!workshopSnap.exists()) return null;
            return sanitizeData({ id: workshopSnap.id, ...workshopSnap.data() }) as Workshop;
        } catch (error) {
            console.error("Error fetching workshop by ID:", error);
            return null;
        }
    }

    /**
     * Create a new workshop with image uploads
     */
    static async createWorkshop(vendorId: string, data: Partial<Workshop>, imageFiles: File[]): Promise<void> {
        let imageUrls: string[] = [];

        // Upload multiple images if provided
        if (imageFiles && imageFiles.length > 0) {
            const uploadPromises = imageFiles.map(async (file, index) => {
                const imageRef = ref(storage, `workshops/${Date.now()}-${index}-${file.name}`);
                return await uploadWithTimeout(imageRef, file);
            });
            const results = await Promise.all(uploadPromises);
            imageUrls = results.filter(url => url !== "");
        }

        const workshopData = {
            vendorId,
            ...data,
            imageUrl: imageUrls[0] || data.imageUrl || "",
            imageUrls: imageUrls.length > 0 ? imageUrls : (data.imageUrls || []),
            createdAt: serverTimestamp(),
            rating: 0,
            ratingCount: 0,
            isFrozen: false,
            refundUntil: data.refundUntil || ""
        };

        // Clean up undefined fields
        Object.keys(workshopData).forEach(key => (workshopData as any)[key] === undefined && delete (workshopData as any)[key]); // eslint-disable-line @typescript-eslint/no-explicit-any

        await addDoc(collection(db, "workshops"), workshopData);
    }

    /**
     * Update an existing workshop
     */
    static async updateWorkshop(id: string, data: Partial<Workshop>, newImages?: File[]): Promise<void> {
        const updateData: any = { ...data }; // eslint-disable-line @typescript-eslint/no-explicit-any

        // Handle image updates
        if (newImages && newImages.length > 0) {
            const uploadPromises = newImages.map(async (file, index) => {
                const imageRef = ref(storage, `workshops/${Date.now()}-${index}-${file.name}`);
                return await uploadWithTimeout(imageRef, file);
            });
            const newUrls = await Promise.all(uploadPromises);
            const validUrls = newUrls.filter(u => u !== "");
            if (validUrls.length > 0) {
                updateData.imageUrls = validUrls;
                updateData.imageUrl = validUrls[0];
            }
        }

        // Remove ID and other non-updatable fields if they sneaked in
        delete updateData.id;
        delete updateData.createdAt;

        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
        await updateDoc(doc(db, "workshops", id), updateData);
    }

    /**
     * Toggle the frozen status of a workshop
     */
    static async toggleFreeze(id: string, isFrozen: boolean): Promise<void> {
        await updateDoc(doc(db, "workshops", id), { isFrozen });
    }

    /**
     * Delete a workshop
     */
    static async deleteWorkshop(id: string): Promise<void> {
        await deleteDoc(doc(db, "workshops", id));
    }
}
