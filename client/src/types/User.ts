export interface User {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  new?: boolean;
  mobile?: string;
  isAdmin?: boolean;
  birthDate?: Date;
  active?: boolean;
  imageUrl?: string;
  // User wants to receive notifications also by e-mail
  emailNotifications?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}