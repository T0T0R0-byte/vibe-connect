import { db, storage } from "@/firebase/firebaseConfig";
import {
    collection, addDoc, doc, setDoc, updateDoc, increment, arrayUnion, serverTimestamp, getDoc, query, where, orderBy, getDocs
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, StorageReference } from "firebase/storage";
import { Registration } from "../models/Registration";

// Helper for robust upload with timeout
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

export class RegistrationController {

    /**
     * Register multiple participants for a workshop (Bulk Booking)
     */
    static async registerForWorkshop(
        workshopId: string,
        userId: string,
        userEmail: string,
        vendorId: string,
        paymentIntentId: string | null,
        participants: {
            fullName: string;
            age: string;
            phone: string;
            address: string;
            consentFile?: File | null;
            consentUrl?: string;
        }[]
    ): Promise<void> {

        // 1. Check if workshop is frozen
        const workshopRef = doc(db, "workshops", workshopId);
        const workshopSnap = await getDoc(workshopRef);
        if (!workshopSnap.exists()) throw new Error("Workshop not found");

        const workshopData = workshopSnap.data();
        if (workshopData.isFrozen) throw new Error("Registration is currently closed for this workshop.");

        const groupId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // 2. Process each participant (Upload consent and create doc)
        const batchPromises = participants.map(async (participant) => {
            let consentUrl = participant.consentUrl || "";

            if (!consentUrl && participant.consentFile) {
                const fName = participant.consentFile.name.replace(/[^a-zA-Z0-9.]/g, "_");
                const consentRef = ref(storage, `consents/${workshopId}/${userId}-${Date.now()}-${fName}`);
                consentUrl = await uploadWithTimeout(consentRef, participant.consentFile);
            }

            const { consentFile, ...detailsToStore } = participant;

            return addDoc(collection(db, "registrations"), {
                workshopId,
                userId,
                userEmail,
                vendorId,
                groupId,
                paymentIntentId,
                status: "confirmed",
                createdAt: serverTimestamp(),
                consentAccepted: true,
                participantDetails: detailsToStore,
                consentUrl,
            });
        });

        await Promise.all(batchPromises);

        // 3. Update User profile with registered workshop
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, {
            registeredWorkshops: arrayUnion(workshopId),
        }, { merge: true });

        // 4. Update Workshop capacity
        await updateDoc(workshopRef, {
            capacity: increment(-participants.length)
        });
    }

    /**
     * Fetch all registrations for a specific workshop (Vendor Dashboard)
     */
    static async fetchRegistrationsForWorkshop(workshopId: string): Promise<Registration[]> {
        let q = query(
            collection(db, "registrations"),
            where("workshopId", "==", workshopId),
            orderBy("createdAt", "desc")
        );

        let snapshot;
        try {
            snapshot = await getDocs(q);
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            // Fallback for missing index
            console.warn("Fetch failed, trying unsorted fallback.");
            q = query(collection(db, "registrations"), where("workshopId", "==", workshopId));
            snapshot = await getDocs(q);
        }

        return snapshot.docs.map(d => ({
            registrationId: d.id,
            ...d.data(),
            displayName: d.data().participantDetails?.fullName || "Guest",
        } as any as Registration));
    }

    /**
     * Update the status of a registration
     */
    static async updateStatus(registrationId: string, status: string): Promise<void> {
        await updateDoc(doc(db, "registrations", registrationId), { status });
    }
}
