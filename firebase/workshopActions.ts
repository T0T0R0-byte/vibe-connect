import { db, storage } from "./firebaseConfig";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  setDoc,
  increment,
} from "firebase/firestore";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface WorkshopData {
  title: string;
  description: string;
  price: number;
  date: string;
  category: string;
  image?: File | null;
  images?: File[]; // New: Array of images
  whatsappLink?: string;
  location?: string;
  capacity?: number;
  ageGroup?: string;
  consentRequired?: boolean;
  refundPolicy?: string; // Missing field
  bankDetails?: string;
}

// CREATE WORKSHOP
export const createWorkshop = async (vendorId: string, data: WorkshopData) => {
  let imageUrl = "";
  let imageBase64 = "";
  let imageUrls: string[] = []; // Store multiple URLs

  console.log("createWorkshop: Starting creation for", data.title);

  // 1. Handle Multiple Images (Priority)
  if (data.images && data.images.length > 0) {
    console.log(`createWorkshop: Processing ${data.images.length} images...`);

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
    console.log("createWorkshop: Processing single image...", data.image.name);

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
    price: data.price,
    category: data.category,
    date: data.date,
    whatsappLink: data.whatsappLink || "",
    location: data.location || "Online",
    capacity: data.capacity || 0,
    ageGroup: data.ageGroup || "All Ages",
    consentRequired: data.consentRequired || false,
    bankDetails: data.bankDetails || "",
    imageUrl, // Main image
    imageUrls, // All images (up to 3)
    imageBase64,
    createdAt: serverTimestamp(),
  });
  console.log("createWorkshop: Document created.");
};

// GET ALL WORKSHOPS FOR A VENDOR
export const getVendorWorkshops = async (vendorId: string) => {
  const q = query(collection(db, "workshops"), where("vendorId", "==", vendorId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// UPDATE WORKSHOP
export const updateWorkshop = async (workshopId: string, data: Partial<WorkshopData>) => {
  const updateData: any = {
    title: data.title,
    description: data.description,
    price: data.price,
    category: data.category,
    date: data.date,
    whatsappLink: data.whatsappLink,
    location: data.location,
    capacity: data.capacity,
    ageGroup: data.ageGroup,
    consentRequired: data.consentRequired,
    bankDetails: data.bankDetails,
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
  console.log("updateWorkshop: Workshop updated.");
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

// REGISTER FOR WORKSHOP (Bulk)
export const registerForWorkshop = async (
  workshopId: string,
  userId: string,
  receiptFile: File | null,
  participants: {
    fullName: string;
    age: string;
    phone: string;
    address: string;
    consentFile?: File | null; // Allow file
  }[]
) => {
  console.log("registerForWorkshop: Starting bulk registration...");
  let receiptUrl = "";
  let receiptBase64 = "";

  // Upload Receipt (Once for the whole batch)
  if (receiptFile) {
    console.log("registerForWorkshop: Processing receipt...", receiptFile.name);

    if (receiptFile.size < 700 * 1024) {
      try {
        receiptBase64 = await fileToBase64(receiptFile);
      } catch (err) {
        console.error("registerForWorkshop: Base64 conversion failed:", err);
      }
    }

    if (!receiptBase64) {
      try {
        const sanitizedName = receiptFile.name.replace(/[^a-zA-Z0-9.]/g, "_");
        const receiptRef = ref(
          storage,
          `receipts/${workshopId}/${userId}-${Date.now()}-${sanitizedName}`
        );
        await uploadBytes(receiptRef, receiptFile);
        receiptUrl = await getDownloadURL(receiptRef);
      } catch (storageErr) {
        console.error("registerForWorkshop: Storage upload failed:", storageErr);
        throw new Error("Failed to upload receipt. Please check your connection.");
      }
    }
  }

  // Create a unique Group ID for this batch
  const groupId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Create Registration Documents (One per participant)
  const batchPromises = participants.map(async (participant) => {
    let consentUrl = "";

    // Upload Consent File if present
    if (participant.consentFile) {
      try {
        const fName = participant.consentFile.name.replace(/[^a-zA-Z0-9.]/g, "_");
        const consentRef = ref(storage, `consents/${workshopId}/${userId}-${Date.now()}-${fName}`);
        await uploadBytes(consentRef, participant.consentFile);
        consentUrl = await getDownloadURL(consentRef);
      } catch (e) {
        console.error("Failed to upload consent", e);
        // Proceed without it? Or fail? Let's proceed but log it.
      }
    }

    // Prepare participant data without the File object (Firestore can't store File)
    const { consentFile, ...detailsToStore } = participant;

    await addDoc(collection(db, "registrations"), {
      workshopId,
      userId,
      groupId,
      receiptUrl,
      receiptBase64,
      status: "pending",
      createdAt: serverTimestamp(),
      consentAccepted: true,
      participantDetails: detailsToStore,
      consentUrl, // Save URL
    });
  });

  await Promise.all(batchPromises);
  console.log(`registerForWorkshop: Created ${participants.length} registration docs.`);

  // Update User's Registered Workshops
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, {
    registeredWorkshops: arrayUnion(workshopId),
  }, { merge: true });

  // Decrement Workshop Capacity
  const workshopRef = doc(db, "workshops", workshopId);
  await updateDoc(workshopRef, {
    capacity: increment(-participants.length)
  });

  console.log("registerForWorkshop: Complete.");
};
