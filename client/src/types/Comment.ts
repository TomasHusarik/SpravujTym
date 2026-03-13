import type { TeamEvent } from "./TeamEvent";
import type { User } from "./User";

export interface Comment {
    _id?: string;
    content?: string;
    author?: User;
    event?: string | TeamEvent;
    createdAt?: Date;
    updatedAt?: Date;
}