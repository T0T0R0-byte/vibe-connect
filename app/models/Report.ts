
export interface Report {
    id?: string;
    registrationId: string;
    workshopId: string;
    vendorId: string; // The vendor being reported
    reporterId: string; // The user reporting
    reporterName: string;
    reason: string;
    details: string;
    status: 'pending' | 'resolved' | 'dismissed';
    createdAt: string;
}
