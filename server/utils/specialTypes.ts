export interface IEmail {
  from?: string;
  to?: string;
  subject?: string;
  context?: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
    cid: string;
    contentType: string;
  }[];
}

export type UserPermissions = {
  isAdmin: boolean;
  coachSquadIds: string[];
  playerSquadId: string | null;
};