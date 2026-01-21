import { db, storage } from "@/firebase/firebaseConfig";
import { collection, addDoc, doc, setDoc, updateDoc, increment, arrayUnion, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, StorageReference } from "firebase/storage";

// Helper for robust upload
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

    static async registerUser(
        workshopId: string,
        userId: string,
        receiptFile: File | null,
        participants: any[]
    ): Promise<void> {

        let receiptUrl = "";

        // Upload Receipt
        if (receiptFile) {
            const sanitizedName = receiptFile.name.replace(/[^a-zA-Z0-9.]/g, "_");
            const receiptRef = ref(storage, `receipts/${workshopId}/${userId}-${Date.now()}-${sanitizedName}`);
            receiptUrl = await uploadWithTimeout(receiptRef, receiptFile);
        }

        const groupId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Batch Create Registrations
        const promises = participants.map(async (p) => {
            let consentUrl = "";
            if (p.consentFile) {
                const fName = p.consentFile.name.replace(/[^a-zA-Z0-9.]/g, "_");
                const consentRef = ref(storage, `consents/${workshopId}/${userId}-${Date.now()}-${fName}`);
                consentUrl = await uploadWithTimeout(consentRef, p.consentFile);
            }

            const { consentFile, ...details } = p;

            await addDoc(collection(db, "registrations"), {
                workshopId,
                userId,
                groupId,
                receiptUrl,
                status: "pending",
                createdAt: serverTimestamp(),
                consentAccepted: true,
                participantDetails: details,
                consentUrl
            });
        });

        await Promise.all(promises);

        // Update User & Workshop Stats
        await setDoc(doc(db, "users", userId), {
            registeredWorkshops: arrayUnion(workshopId)
        }, { merge: true });

        await updateDoc(doc(db, "workshops", workshopId), {
            capacity: increment(-participants.length)
        });
    }
}
