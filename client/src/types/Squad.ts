import type { League } from "./League";

export interface Squad { 
    _id?: string;
    name?: string;
    league?: League;
    createdAt?: Date;
    updatedAt?: Date;
}