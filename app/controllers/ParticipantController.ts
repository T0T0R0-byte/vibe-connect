import { db, storage } from "@/firebase/firebaseConfig";
import {
    collection, doc, updateDoc, getDocs, query, where, serverTimestamp, orderBy
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, StorageReference } from "firebase/storage";
import { Participant } from "../models/Participant";
import { processRefund } from "@/firebase/workshopActions";

// Helper for robust upload (reuse or import if shared)
const uploadWithTimeout = async (fileRef: StorageReference, file: File): Promise<string> => {
    try {
        const uploadTask = uploadBytes(fileRef, file);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Upload timed out")), 5000)
        );
        await Promise.race([uploadTask, timeoutPromise]);
        return await getDownloadURL(fileRef);
    } catch (e) {
        console.warn("Upload timed out/failed:", e);
        return "";
    }
};

export class ParticipantController {

    static async getParticipantsForVendor(vendorId: string): Promise<Participant[]> {
        // This is complex because participants are nested or linked. 
        // Based on current logic, we query registrations by workshopIds belonging to vendor.
        // For efficiency, we assume the caller passes the workshop IDs or we fetch them first.
        return []; // Placeholder, logic is complex and might need `getParticipantsForWorkshop`
    }

    static async getParticipantsForWorkshop(workshopId: string): Promise<Participant[]> {
        let q = query(
            collection(db, "registrations"),
            where("workshopId", "==", workshopId),
            orderBy("createdAt", "desc")
        );

        let snapshot;
        try {
            snapshot = await getDocs(q);
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            // Fallback: If index is missing, fetch without sorting
            if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
                console.warn("Using fallback query (unsorted) due to missing index.");
                q = query(
                    collection(db, "registrations"),
                    where("workshopId", "==", workshopId)
                );
                snapshot = await getDocs(q);
            } else {
                throw error;
            }
        }
        return snapshot.docs.map(d => {
            const data = d.data();
            return {
                uid: data.userId,
                displayName: data.participantDetails?.fullName || "Guest",
                email: "N/A", // Often in user doc, need join if critical
                registrationId: d.id,
                status: data.status,
                ...data
            } as any as Participant; // eslint-disable-line @typescript-eslint/no-explicit-any
        });
    }

    static async updateStatus(registrationId: string, status: string): Promise<void> {
        await updateDoc(doc(db, "registrations", registrationId), { status });
    }

    static async issueRefund(registrationId: string): Promise<void> {
        await processRefund(registrationId);
    }
}
