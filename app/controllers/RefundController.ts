import { db } from "@/firebase/firebaseConfig";
import { doc, getDoc, updateDoc, serverTimestamp, query, collection, where, getDocs, increment, arrayRemove } from "firebase/firestore";

export class RefundController {

    /**
     * User requests a refund for a registration
     */
    static async requestRefund(registrationId: string, reason: string): Promise<{ success: boolean }> {
        const regRef = doc(db, "registrations", registrationId);
        const regSnap = await getDoc(regRef);

        if (!regSnap.exists()) {
            throw new Error("Registration not found");
        }

        const regData = regSnap.data();

        // Check Refund Policy
        const workshopRef = doc(db, "workshops", regData.workshopId);
        const workshopSnap = await getDoc(workshopRef);

        if (workshopSnap.exists()) {
            const workshopData = workshopSnap.data();
            if (workshopData.refundUntil) {
                const refundDeadline = new Date(workshopData.refundUntil);
                // Set timeline to end of the refund date
                refundDeadline.setHours(23, 59, 59, 999);

                if (new Date() > refundDeadline) {
                    throw new Error(`Refund period expired on ${refundDeadline.toLocaleDateString()}`);
                }
            }
        }

        const refundId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        await updateDoc(regRef, {
            status: "refund_requested",
            refundReason: reason,
            refundId: refundId,
            requestedAt: serverTimestamp()
        });

        return { success: true };
    }

    /**
     * Vendor/Admin rejects a refund request
     */
    static async rejectRefund(registrationId: string, reason: string): Promise<void> {
        const regRef = doc(db, "registrations", registrationId);
        await updateDoc(regRef, {
            status: "refund_rejected",
            rejectionReason: reason,
            rejectedAt: serverTimestamp()
        });
    }

    /**
     * Vendor/Admin approves and processes a refund (Triggers Stripe API)
     */
    static async processRefund(registrationId: string): Promise<{ success: boolean }> {
        const regRef = doc(db, "registrations", registrationId);
        const regSnap = await getDoc(regRef);

        if (!regSnap.exists()) throw new Error("Registration not found");

        const data = regSnap.data();
        if (data.status === "refunded") throw new Error("Already refunded");

        // 1. If paid, trigger Stripe Refund API via internal route
        if (data.paymentIntentId) {
            const res = await fetch("/api/refund", {
                method: "POST",
                body: JSON.stringify({ paymentIntentId: data.paymentIntentId }),
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.details || "Stripe refund failed");
            }
        }

        // 2. Update Registration Status
        await updateDoc(regRef, {
            status: "refunded",
            refundedAt: serverTimestamp()
        });

        // 3. Restore Workshop Capacity
        const workshopRef = doc(db, "workshops", data.workshopId);
        await updateDoc(workshopRef, {
            capacity: increment(1)
        });

        // 4. Cleanup User Profile (Allow Re-joining the same workshop if no other active seats)
        const q = query(
            collection(db, "registrations"),
            where("userId", "==", data.userId),
            where("workshopId", "==", data.workshopId)
        );

        const snapshot = await getDocs(q);
        const hasOtherActive = snapshot.docs.some(doc => {
            if (doc.id === registrationId) return false;
            const status = doc.data().status;
            return ['confirmed', 'pending', 'refund_requested', 'refund_rejected'].includes(status);
        });

        if (!hasOtherActive) {
            const userRef = doc(db, "users", data.userId);
            await updateDoc(userRef, {
                registeredWorkshops: arrayRemove(data.workshopId)
            });
        }

        return { success: true };
    }

    /**
     * Upload proof of refund (Vendor custom action)
     */
    static async uploadRefundProof(registrationId: string, file: File): Promise<string> {
        const { storage } = await import("@/firebase/firebaseConfig");
        const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");

        const storageRef = ref(storage, `refunds/${registrationId}_proof_${Date.now()}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        const regRef = doc(db, "registrations", registrationId);
        await updateDoc(regRef, {
            refundProofUrl: url,
            refundStatus: 'vendor_proof_uploaded',
            updatedAt: serverTimestamp()
        });

        return url;
    }
}
