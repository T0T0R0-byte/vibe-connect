export interface Participant {
    uid: string;
    displayName: string;
    email: string;
    phoneNumber?: string;
    consentUrl?: string;
    status?: "pending" | "approved" | "rejected" | "failed" | "refund_requested" | "refunded" | "refund_rejected";
    registrationId?: string;
    workshopId?: string;
    workshopTitle?: string;
    workshopPrice?: number;
    refundId?: string;
    refundReason?: string;
    rejectionReason?: string;
    details?: {
        fullName: string;
        age: string;
        phone: string;
        address: string;
        consentUrl?: string;
    };
}
