import mongoose from "mongoose";
import { User } from "../types/User";


const userSchema = new mongoose.Schema<User>(
  {
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
        type: String,
        trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    mobile: {
      type: String,
    },
    age: {
      type: Number,
      min: 0,
    },
    sex: {
      type: String,
      enum: ["male", "female", "other"],
    },
    address: {
      type: String,
    },
    birthDate: {
      type: Date,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);