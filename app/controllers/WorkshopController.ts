import { db, storage } from "@/firebase/firebaseConfig";
import {
    collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where, serverTimestamp, increment
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, StorageReference } from "firebase/storage";
import { Workshop } from "../models/Workshop";

// Helper for robust upload
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

    // Fetch Vendor Workshops
    static async fetchVendorWorkshops(vendorId: string): Promise<Workshop[]> {
        try {
            const q = query(collection(db, "workshops"), where("vendorId", "==", vendorId));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workshop));
        } catch (error) {
            console.error("Error fetching workshops:", error);
            throw error;
        }
    }

    // Create Workshop
    static async createWorkshop(vendorId: string, data: Partial<Workshop>, imageFiles: File[]): Promise<void> {
        let imageUrls: string[] = [];

        // Upload Images
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
            imageUrl: typeof data.imageUrl === 'string' && data.imageUrl.startsWith('http') ? data.imageUrl : (imageUrls[0] || ""),
            imageUrls: imageUrls.length > 0 ? imageUrls : (data.imageUrls || []),
            createdAt: serverTimestamp(),
            rating: 0,
            ratingCount: 0
        };

        // Clean undefined
        Object.keys(workshopData).forEach(key => (workshopData as any)[key] === undefined && delete (workshopData as any)[key]);

        await addDoc(collection(db, "workshops"), workshopData);
    }

    // Update Workshop
    static async updateWorkshop(id: string, data: Partial<Workshop>, newImages?: File[]): Promise<void> {
        const updateData: any = { ...data };

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

        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
        await updateDoc(doc(db, "workshops", id), updateData);
    }

    // Delete Workshop
    static async deleteWorkshop(id: string): Promise<void> {
        await deleteDoc(doc(db, "workshops", id));
    }
}
