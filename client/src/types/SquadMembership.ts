import type { Squad } from './Squad';
import type { User } from './User';

export type SquadRole = 'player' | 'coach';

export interface SquadMembership {
  _id?: string;
  squad?: Squad;
  user?: User;
  roles?: SquadRole[];
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
