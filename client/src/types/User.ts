export interface User {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  roles?: string[];
  mobile?: string;
  age?: number;
  sex?: "male" | "female" | "other";
  address?: string;
  birthDate?: Date;
  active?: boolean;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}