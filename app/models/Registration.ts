export interface Registration {
    uid: string;
    createdAt?: any;
    displayName: string;
    email: string;
    phoneNumber?: string;
    address?: string; // Contact Info Sync
    consentUrl?: string; // Added for vendor visibility
    status?: "pending" | "approved" | "rejected" | "failed" | "refund_requested" | "refunded" | "refund_rejected" | "confirmed" | "paid";
    registrationId?: string;
    workshopId?: string;
    workshopTitle?: string;
    workshopPrice?: number;
    refundId?: string;
    refundReason?: string;
    rejectionReason?: string;
    refundUntil?: string; // Policy info
    details?: {
        fullName: string;
        age: string;
        phone: string;
        address: string;
        consentUrl?: string;
    };
}
