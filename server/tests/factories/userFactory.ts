import bcrypt from 'bcrypt';
import User, { IUser } from '@models/User';
import { HydratedDocument } from 'mongoose';

type UserOverrides = Partial<Omit<IUser, '_id' | 'createdAt' | 'updatedAt' | 'password'>> & {
  password?: string;
};

type CreatedTestUser = {
  user: HydratedDocument<IUser>;
  plainPassword: string;
};

let userCounter = 0;

export const createTestUser = async (overrides: UserOverrides = {}): Promise<CreatedTestUser> => {
  userCounter += 1;

  const plainPassword = overrides.password || 'Password123!';
  const password = await bcrypt.hash(plainPassword, 10);

  const user = await User.create({
    firstName: overrides.firstName || 'Test',
    lastName: overrides.lastName || `User${userCounter}`,
    email: overrides.email || `user${userCounter}@example.com`,
    password,
    new: overrides.new ?? false,
    isAdmin: overrides.isAdmin ?? false,
    mobile: overrides.mobile,
    birthDate: overrides.birthDate,
    active: overrides.active ?? true,
    imageUrl: overrides.imageUrl,
  });

  return { user, plainPassword };
};
