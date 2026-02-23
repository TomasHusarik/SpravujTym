import mongoose, { Types } from "mongoose";

export enum UserRole {
  Player = "player",
  Coach = "coach",
  Admin = "admin"
}

export interface IUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles?: UserRole[];
  mobile?: string;
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
    birthDate: { type: Date },
    active: { type: Boolean, default: true },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", UserSchema);
export default User;