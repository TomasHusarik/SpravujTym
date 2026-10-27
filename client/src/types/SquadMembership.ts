import type { Squad } from './Squad';
import type { User } from './User';

export type SquadRole = 'player' | 'coach';

export type PlayerPosition = 'goalkeeper' | 'defender' | 'forward';

export interface SquadMembership {
  _id?: string;
  squad?: Squad;
  user?: User;
  roles?: SquadRole[];
  position?: PlayerPosition;
  jerseyNumber?: number;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
