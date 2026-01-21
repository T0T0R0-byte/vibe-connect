import { db, storage } from "./firebaseConfig";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { processRefund, rejectRefund } from "./workshopActions";

export const uploadRefundProof = async (registrationId: string, file: File) => {
    const storageRef = ref(storage, `refunds/${registrationId}_proof_${Date.now()}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await updateDoc(doc(db, "registrations", registrationId), {
        refundProofUrl: url,
        refundStatus: 'vendor_proof_uploaded',
        updatedAt: serverTimestamp()
    });
    return url;
};

export const finalizeRefund = async (registrationId: string, action: "approve" | "reject") => {
    if (action === "approve") {
        await processRefund(registrationId);
    } else {
        await rejectRefund(registrationId, "Admin decision");
    }
};
