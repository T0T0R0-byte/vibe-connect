export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: "user" | "admin" | "vendor" | "dev_admin";
    phoneNumber?: string;
    description?: string;
    businessName?: string;
    bankDetails?: string;
    socialLink?: string;
    customOrdersEnabled?: boolean;
    registeredWorkshops?: string[];
    createdAt?: any;
}
