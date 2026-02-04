export interface Report {
    id?: string;
    registrationId: string;
    workshopId: string;
    workshopTitle?: string;
    purchasePrice?: number;
    vendorId: string; // The vendor being reported
    reporterId: string; // The user reporting
    reporterName: string;
    reporterEmail?: string;
    reporterPhone?: string;
    reason: string;
    details: string;
    status: 'pending' | 'resolved' | 'dismissed';
    createdAt: string;
}
