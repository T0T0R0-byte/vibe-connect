export interface Workshop {
    id: string;
    title: string;
    description: string;
    price: number;
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
    refundPolicy?: string;
    bankDetails?: string;
    rating?: number;
    ratingCount?: number;
}
