import type { League } from "./League";
import type { SquadMembership } from "./SquadMembership";

export interface Squad { 
    _id?: string;
    name?: string;
    league?: League;
    memberships?: SquadMembership[];
    createdAt?: Date;
    updatedAt?: Date;
}