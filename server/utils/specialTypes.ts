export interface IEmail {
  from?: string;
  to?: string;
  subject?: string;
  context?: string;
}

export type UserPermissions = {
  isAdmin: boolean;
  coachSquadIds: string[];
  playerSquadId: string | null;
};