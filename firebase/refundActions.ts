import { db, storage } from "./firebaseConfig";
import {
    doc,
    updateDoc,
    getDoc,
    serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Refund Status Enum
export type RefundStatus =
    | "none"
    | "refund_requested"
    | "vendor_proof_uploaded"
    | "participant_confirmed"
    | "participant_disputed"
    | "vendor_approved" // Manual vendor approval
    | "admin_approved" // Final State
    | "admin_rejected"; // Final State

// 1. PARTICIPANT: Request Refund
export const requestRefund = async (registrationId: string) => {
    const regRef = doc(db, "registrations", registrationId);
    const regSnap = await getDoc(regRef);

    if (!regSnap.exists()) throw new Error("Registration not found");

    const data = regSnap.data();
    if (data.refundStatus && data.refundStatus !== "none") {
        throw new Error("Refund already requested");
    }

    await updateDoc(regRef, {
        refundStatus: "refund_requested",
        refundRequestDate: serverTimestamp(),
    });
};

// 2. VENDOR: Upload Refund Proof
export const uploadRefundProof = async (registrationId: string, proofFile: File) => {
    const regRef = doc(db, "registrations", registrationId);

    let proofUrl: string | null = null;

    try {
        // Upload Proof with Timeout (10s) to prevent hanging
        const proofRef = ref(storage, `refund_proofs/${registrationId}-${Date.now()}-${proofFile.name}`);

        const uploadPromise = uploadBytes(proofRef, proofFile);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Upload timed out")), 10000));

        await Promise.race([uploadPromise, timeoutPromise]);
        proofUrl = await getDownloadURL(proofRef);
    } catch (error) {
        console.warn("Refund proof upload failed or timed out. Proceeding with status update only.", error);
        // We allow the process to continue even if the image upload fails, 
        // effectively "forcing" the acceptance as requested by the user.
    }

    await updateDoc(regRef, {
        refundStatus: "vendor_proof_uploaded",
        ...(proofUrl ? { refundProofUrl: proofUrl } : {}),
        lastUpdated: serverTimestamp()
    });
};


// 3. PARTICIPANT: Confirm or Dispute Refund
export const confirmRefundReceipt = async (registrationId: string, received: boolean) => {
    const regRef = doc(db, "registrations", registrationId);

    await updateDoc(regRef, {
        refundStatus: received ? "participant_confirmed" : "participant_disputed",
        refundConfirmationDate: serverTimestamp(),
    });
};

// 4. VENDOR: Finalize Refund
export const vendorFinalizeRefund = async (registrationId: string) => {
    const regRef = doc(db, "registrations", registrationId);
    const regSnap = await getDoc(regRef);

    if (!regSnap.exists()) throw new Error("Registration not found");

    const data = regSnap.data();
    if (data.status === "refunded") return; // Already refunded

    // 1. Update Registration Status
    await updateDoc(regRef, {
        status: "refunded",
        refundStatus: "admin_approved",
        refundApprovedAt: serverTimestamp(),
    });

    // 2. Return Capacity to Workshop
    const workshopRef = doc(db, "workshops", data.workshopId);
    const { increment } = await import("firebase/firestore");
    await updateDoc(workshopRef, {
        capacity: increment(1)
    });
};

// 5. ADMIN: Finalize Refund
export const finalizeRefund = async (registrationId: string, decision: "approve" | "reject") => {
    const regRef = doc(db, "registrations", registrationId);

    if (decision === "reject") {
        await updateDoc(regRef, {
            refundStatus: "admin_rejected",
        });
        return;
    }

    await vendorFinalizeRefund(registrationId);
};
