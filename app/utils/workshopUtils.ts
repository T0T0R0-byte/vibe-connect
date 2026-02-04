import { Workshop } from "@/app/models/Workshop";

export const CATEGORY_IMAGES: Record<string, string> = {
    "Art": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071",
    "Music": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2070",
    "Technology": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2070",
    "Cooking": "https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2070",
    "Sports": "https://images.unsplash.com/photo-1461896756970-8af3726fe9f1?q=80&w=2070",
    "Business": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070",
    "Health": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2070",
    "Other": "https://images.unsplash.com/photo-1501139083538-0139583c060f?q=80&w=2070",
    "All": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071"
};

export const getWorkshopImage = (w: Workshop | null | undefined) => {
    if (!w) return CATEGORY_IMAGES["Other"];
    if (w.imageBase64) return w.imageBase64;
    if (w.imageUrl) return w.imageUrl;
    return CATEGORY_IMAGES[w.category] || CATEGORY_IMAGES["Other"];
};
