import { db, storage } from "./firebaseConfig";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  setDoc,
  increment,
  arrayRemove,
} from "firebase/firestore";

import { ref, uploadBytes, getDownloadURL, StorageReference } from "firebase/storage";

interface WorkshopData {
  title: string;
  description: string;

  date: string;
  category: string;
  image?: File | null;
  images?: File[]; // New: Array of images
  whatsappLink?: string;
  location?: string;
  capacity?: number;
  ageGroup?: string;
  consentRequired?: boolean;
  price?: number;
}

// CREATE WORKSHOP
export const createWorkshop = async (vendorId: string, data: WorkshopData) => {
  let imageUrl = "";
  let imageBase64 = "";
  let imageUrls: string[] = []; // Store multiple URLs



  // 1. Handle Multiple Images (Priority)
  if (data.images && data.images.length > 0) {


    const uploadPromises = data.images.map(async (file, index) => {
      try {
        const imageRef = ref(storage, `workshops/${Date.now()}-${index}-${file.name}`);
        await uploadBytes(imageRef, file);
        return await getDownloadURL(imageRef);
      } catch (e) {
        console.error(`Failed to upload image ${index}`, e);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    imageUrls = results.filter(url => url !== null) as string[];

    // Set the first image as the main imageUrl for backward compatibility
    if (imageUrls.length > 0) {
      imageUrl = imageUrls[0];
    }
  }
  // 2. Fallback to single image logic if no array provided
  else if (data.image) {


    if (data.image.size < 700 * 1024) {
      try {
        imageBase64 = await fileToBase64(data.image);
      } catch (err) {
        console.error("createWorkshop: Base64 conversion failed:", err);
      }
    }

    if (!imageBase64) {
      try {
        const imageRef = ref(storage, `workshops/${Date.now()}-${data.image.name}`);
        await uploadBytes(imageRef, data.image);
        imageUrl = await getDownloadURL(imageRef);
      } catch (error) {
        console.error("createWorkshop: Image upload failed:", error);
      }
    }
    if (imageUrl) imageUrls.push(imageUrl);
  }

  // Store fields
  await addDoc(collection(db, "workshops"), {
    vendorId,
    title: data.title,
    description: data.description,

    category: data.category,
    date: data.date,
    whatsappLink: data.whatsappLink || "",
    location: data.location || "Online",
    capacity: data.capacity || 0,
    ageGroup: data.ageGroup || "All Ages",
    consentRequired: data.consentRequired || false,
    price: data.price || 0,

    imageUrl, // Main image
    imageUrls, // All images (up to 3)
    imageBase64,
    createdAt: serverTimestamp(),
  });

};

// GET ALL WORKSHOPS FOR A VENDOR
export const getVendorWorkshops = async (vendorId: string) => {
  const q = query(collection(db, "workshops"), where("vendorId", "==", vendorId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// GET ALL WORKSHOPS (For Homepage)
export const getAllWorkshops = async () => {
  const q = query(collection(db, "workshops"));
  const querySnapshot = await getDocs(q);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any));
};

// UPDATE WORKSHOP
export const updateWorkshop = async (workshopId: string, data: Partial<WorkshopData>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    title: data.title,
    description: data.description,

    category: data.category,
    date: data.date,
    whatsappLink: data.whatsappLink,
    location: data.location,
    capacity: data.capacity,
    ageGroup: data.ageGroup,
    consentRequired: data.consentRequired,
    price: data.price,

  };

  // Handle Image Updates
  if (data.images && data.images.length > 0) {
    const uploadPromises = data.images.map(async (file, index) => {
      const imageRef = ref(storage, `workshops/${Date.now()}-${index}-${file.name}`);
      await uploadBytes(imageRef, file);
      return await getDownloadURL(imageRef);
    });
    const newUrls = await Promise.all(uploadPromises);
    updateData.imageUrls = newUrls;
    if (newUrls.length > 0) updateData.imageUrl = newUrls[0];
  } else if (data.image) {
    const imageRef = ref(storage, `workshops/${Date.now()}-${data.image.name}`);
    await uploadBytes(imageRef, data.image);
    const url = await getDownloadURL(imageRef);
    updateData.imageUrl = url;
    updateData.imageUrls = [url];
  }

  // Remove undefined fields
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  await updateDoc(doc(db, "workshops", workshopId), updateData);

};

// DELETE WORKSHOP
export const deleteWorkshop = async (id: string) => {
  const refDoc = doc(db, "workshops", id);
  await deleteDoc(refDoc);
};

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Helper for robust upload (5s timeout)
const uploadWithTimeout = async (fileRef: StorageReference, file: File): Promise<string> => {
  try {
    const uploadTask = uploadBytes(fileRef, file);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Upload timed out")), 5000)
    );

    await Promise.race([uploadTask, timeoutPromise]);
    return await getDownloadURL(fileRef);
  } catch (e) {
    console.warn("Upload failed or timed out, skipping file url.", e);
    return "";
  }
};

// REGISTER FOR WORKSHOP (Bulk)
export const registerForWorkshop = async (
  workshopId: string,
  userId: string,
  paymentIntentId: string | null,
  participants: {
    fullName: string;
    age: string;
    phone: string;
    address: string;
    consentFile?: File | null;
  }[]
) => {


  const groupId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const batchPromises = participants.map(async (participant) => {
    let consentUrl = "";

    if (participant.consentFile) {
      const fName = participant.consentFile.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const consentRef = ref(storage, `consents/${workshopId}/${userId}-${Date.now()}-${fName}`);
      consentUrl = await uploadWithTimeout(consentRef, participant.consentFile);
    }

    const { consentFile, ...detailsToStore } = participant;

    await addDoc(collection(db, "registrations"), {
      workshopId,
      userId,
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

  const userRef = doc(db, "users", userId);
  await setDoc(userRef, {
    registeredWorkshops: arrayUnion(workshopId),
  }, { merge: true });

  const workshopRef = doc(db, "workshops", workshopId);
  await updateDoc(workshopRef, {
    capacity: increment(-participants.length)
  });


};

// REQUEST REFUND (User Action)
export const requestRefund = async (registrationId: string, reason: string) => {
  const regRef = doc(db, "registrations", registrationId);
  const refundId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  await updateDoc(regRef, {
    status: "refund_requested",
    refundReason: reason,
    refundId: refundId,
    requestedAt: serverTimestamp()
  });
  return { success: true };
};

// PROCESS REFUND (Vendor/Admin Action - Triggers Stripe)
export const processRefund = async (registrationId: string) => {
  const regRef = doc(db, "registrations", registrationId);
  const regSnap = await getDoc(regRef);

  if (!regSnap.exists()) throw new Error("Registration not found");

  const data = regSnap.data();
  if (data.status === "refunded") throw new Error("Already refunded");

  // 1. If paid, trigger Stripe Refund API
  if (data.paymentIntentId) {
    const res = await fetch("/api/refund", {
      method: "POST",
      body: JSON.stringify({ paymentIntentId: data.paymentIntentId }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.details || "Refund failed");
    }
  }

  // 2. Update Registration Status
  await updateDoc(regRef, { status: "refunded", refundedAt: serverTimestamp() });

  // 3. Restore Capacity
  const workshopRef = doc(db, "workshops", data.workshopId);
  await updateDoc(workshopRef, {
    capacity: increment(1)
  });

  // 4. Cleanup User Profile (Allow Re-joining)
  // Check if user has other ACTIVE registrations for this workshop
  const q = query(
    collection(db, "registrations"),
    where("userId", "==", data.userId),
    where("workshopId", "==", data.workshopId)
  );

  const snapshot = await getDocs(q);
  const hasOtherActive = snapshot.docs.some(doc => {
    // Exclude the one we just refunded (it is now 'refunded' in DB, but let's be safe)
    if (doc.id === registrationId) return false;
    const status = doc.data().status;
    return ['confirmed', 'pending', 'refund_requested', 'refund_rejected'].includes(status);
  });

  if (!hasOtherActive) {
    const userRef = doc(db, "users", data.userId);
    await updateDoc(userRef, {
      registeredWorkshops: arrayRemove(data.workshopId) // allow user to see "Register" button again
    });
  }

  return { success: true };
};

// REJECT REFUND (Vendor Action)
export const rejectRefund = async (registrationId: string, reason: string) => {
  const regRef = doc(db, "registrations", registrationId);
  await updateDoc(regRef, {
    status: "refund_rejected",
    rejectionReason: reason,
    rejectedAt: serverTimestamp()
  });
};

