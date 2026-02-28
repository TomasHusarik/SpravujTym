import { UserPermissions } from '@utils/specialTypes';
import { IUser } from '@models/User';
export {};

declare global {
  namespace Express {
    interface Request {
      loggedUser?: IUser;
      permissions?: UserPermissions;
    }
  }
}