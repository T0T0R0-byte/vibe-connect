import { db } from "@/firebase/firebaseConfig";
import { collection, addDoc, serverTimestamp, query, getDocs, doc, updateDoc } from "firebase/firestore";
import { Report } from "../models/Report";
import { sanitizeData } from "@/app/utils/serialize";

export class ReportController {

    /**
     * Submit a new report against a vendor
     */
    static async submitReport(reportData: Omit<Report, 'id' | 'status' | 'createdAt'>): Promise<string> {
        try {
            const docRef = await addDoc(collection(db, "reports"), {
                ...reportData,
                status: 'pending',
                createdAt: new Date().toISOString(),
                timestamp: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error submitting report:", error);
            throw new Error("Failed to submit report.");
        }
    }

    /**
     * Fetch all reports (For Admin)
     */
    static async fetchAllReports(): Promise<Report[]> {
        const q = query(collection(db, "reports"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => sanitizeData({ id: d.id, ...d.data() }) as Report);
    }

    /**
     * Update report status
     */
    static async updateStatus(reportId: string, status: Report['status']): Promise<void> {
        await updateDoc(doc(db, "reports", reportId), { status });
    }
}
