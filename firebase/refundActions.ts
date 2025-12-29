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

    // Upload Proof
    const proofRef = ref(storage, `refund_proofs/${registrationId}-${Date.now()}-${proofFile.name}`);
    await uploadBytes(proofRef, proofFile);
    const proofUrl = await getDownloadURL(proofRef);

    await updateDoc(regRef, {
        refundStatus: "vendor_proof_uploaded",
        refundProofUrl: proofUrl,
        refundProofDate: serverTimestamp(),
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
