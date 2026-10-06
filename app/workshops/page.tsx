import { db } from "@/firebase/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAllWorkshops } from "@/firebase/workshopActions";
import WorkshopsClient from "./WorkshopsClient";
import { Suspense } from "react";

export const revalidate = 60; // Cache for 60 seconds

const DEMO_VENDORS = {
  "demo-vendor": {
    id: "demo-vendor",
    displayName: "Maya Perera",
    businessName: "Vibe Studio",
    customOrdersEnabled: true,
    phoneNumber: "+94 77 000 0000",
    socialLink: "https://instagram.com/"
  },
  "demo-vendor-2": {
    id: "demo-vendor-2",
    displayName: "Nethmi Silva",
    businessName: "Clay House",
    customOrdersEnabled: true,
    phoneNumber: "+94 77 000 0001",
    socialLink: "https://instagram.com/"
  },
  "demo-vendor-3": {
    id: "demo-vendor-3",
    displayName: "Akeel Rahman",
    businessName: "Build Lab",
    customOrdersEnabled: true,
    phoneNumber: "+94 77 000 0002",
    socialLink: "https://instagram.com/"
  }
};

export default async function WorkshopsPage() {
  // 1. Fetch Workshops
  const workshopList = await getAllWorkshops();

  // 2. Fetch Vendors
  const vQuery = query(collection(db, "users"), where("role", "==", "vendor"));
  const vSnap = await getDocs(vQuery);
  const vList = vSnap.docs.reduce((acc, doc) => {
    const data = doc.data();
    acc[doc.id] = {
      id: doc.id,
      displayName: data.displayName,
      businessName: data.businessName,
      customOrdersEnabled: data.customOrdersEnabled,
      phoneNumber: data.phoneNumber,
      socialLink: data.socialLink
    };
    return acc;
  }, {} as Record<string, any>);

  return (
    <Suspense fallback={<div className="min-h-screen pt-32 text-center text-white">Loading Workshops...</div>}>
      <WorkshopsClient initialWorkshops={workshopList} initialVendors={vList} />
    </Suspense>
  );
}
