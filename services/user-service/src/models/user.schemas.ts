import mongoose from "mongoose";
import { UserRole, UserVerifyStatus } from "../@type/user.type";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    email_verify_token: {
      type: String,
      default: null,
    },
    forgot_password_token: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: [UserRole.MEMBER, UserRole.ADMIN, UserRole.EMPLOYEE],
      default: UserRole.MEMBER,
    },
    verify: {
      type: String,
      enum: [UserVerifyStatus.Unverified, UserVerifyStatus.Banned, UserVerifyStatus.Verified],
      default: UserVerifyStatus.Unverified,
    }
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.model("Users", userSchema);