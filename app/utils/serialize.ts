
/**
 * Deeply sanitizes an object to ensure it only contains plain data types
 * suitable for Next.js serialization between Server and Client Components.
 * Converts Firestore Timestamps to ISO strings or numbers.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeData(data: any): any {
    if (data === null || data === undefined) return data;

    // Handle Firestore Timestamps
    if (data.toDate && typeof data.toDate === 'function') {
        return data.toDate().toISOString();
    }

    // Handle {seconds, nanoseconds} plain objects (often how Timestamps are received in some contexts)
    if (typeof data === 'object' && 'seconds' in data && 'nanoseconds' in data && Object.keys(data).length === 2) {
        return new Date(data.seconds * 1000).toISOString();
    }

    // Handle Arrays
    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }

    // Handle Objects
    if (typeof data === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sanitized: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                sanitized[key] = sanitizeData(data[key]);
            }
        }
        return sanitized;
    }

    return data;
}
