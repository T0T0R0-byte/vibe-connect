
import { db } from "./firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Report } from "@/app/models/Report";

export const reportVendor = async (
    registrationId: string,
    workshopId: string,
    vendorId: string,
    reporterId: string,
    reporterName: string,
    reason: string,
    details: string
) => {
    try {
        const reportData: Omit<Report, 'id'> = {
            registrationId,
            workshopId,
            vendorId,
            reporterId,
            reporterName,
            reason,
            details,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, "reports"), {
            ...reportData,
            timestamp: serverTimestamp() // Firestore timestamp for backend sorting
        });

        return docRef.id;
    } catch (error) {
        console.error("Error submitting report:", error);
        throw new Error("Failed to submit report. Please try again.");
    }
};
