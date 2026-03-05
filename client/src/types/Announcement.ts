import type { User } from "./User";

export interface Announcement {
    _id: string;
    author?: User;
    title: string;
    content: string;
    visibility: 'public' | 'private';
    pinned?: boolean;
    createdAt?: string;
    updatedAt?: string;
}
