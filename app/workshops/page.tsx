import { db } from "@/firebase/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAllWorkshops } from "@/firebase/workshopActions";
import WorkshopsClient from "./WorkshopsClient";
import { Suspense } from "react";

export const revalidate = 60; // Cache for 60 seconds

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
