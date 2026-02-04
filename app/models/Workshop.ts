export interface Workshop {
    id: string;
    title: string;
    description: string;
    category: string;
    imageUrl: string;
    imageUrls?: string[];
    imageBase64?: string;
    date: string;
    vendorId: string;
    whatsappLink?: string;
    location?: string;
    capacity?: number;
    ageGroup?: string;
    consentRequired?: boolean;
    rating?: number;
    ratingCount?: number;
    price?: number;
    fullDetails?: string;
    isFrozen?: boolean;
    refundUntil?: string;
}
