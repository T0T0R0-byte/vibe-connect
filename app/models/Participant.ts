export interface Participant {
    uid: string;
    displayName: string;
    email: string;
    phoneNumber?: string;
    receiptUrl?: string;
    consentUrl?: string;
    receiptBase64?: string;
    refundProofUrl?: string;
    status?: "pending" | "approved" | "rejected" | "paid" | "failed" | "refunded";
    registrationId?: string;
    refundStatus?: string;
    workshopId?: string;
    price?: number;
    workshopTitle?: string;
    details?: {
        fullName: string;
        age: string;
        phone: string;
        address: string;
        consentUrl?: string;
    };
}
