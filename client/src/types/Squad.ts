import type { League } from "./League";
import type { SquadMembership } from "./SquadMembership";
import type { Team } from "./Team";

export interface Squad { 
    _id?: string;
    name?: string;
    league?: League;
    team?: string | Team;
    memberships?: SquadMembership[];
    createdAt?: Date;
    updatedAt?: Date;
}