import type { Venue } from "./Venue";

export interface Team { 
    _id?: string;
    name?: string;
    shortName?: string;
    city?: string;
    venue?: Venue;
    iban?: string;
    currency?: string;
    createdAt?: Date;
    updatedAt?: Date;
}