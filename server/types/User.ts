import { Types } from "mongoose";

export interface User {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles?: string[];
  mobile?: string;
  age?: number;
  sex?: "male" | "female" | "other";
  address?: string;
  birthDate?: Date;
  active: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}