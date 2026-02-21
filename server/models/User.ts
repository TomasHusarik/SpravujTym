import mongoose, { Types } from "mongoose";

export enum UserRole {
  Player = "player",
  Coach = "coach",
  Admin = "admin"
}

export enum UserSex {
  Male = "male",
  Female = "female",
  Other = "other"
}

export interface IUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles?: UserRole[];
  mobile?: string;
  age?: number;
  sex?: UserSex;
  address?: string;
  birthDate?: Date;
  active: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
} 

const UserSchema = new mongoose.Schema<IUser>(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, select: false },
    roles: [{ type: String, enum: Object.values(UserRole) }],
    mobile: { type: String },
    age: { type: Number, min: 0 },
    sex: { type: String, enum: Object.values(UserSex) },
    address: { type: String },
    birthDate: { type: Date },
    active: { type: Boolean, default: true },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);