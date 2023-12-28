import { UserRole, UserVerifyStatus } from "../utils/user.type";

export interface ReturnResponse {
  status: true | false;
  message: String;
  result?: {} | [];
}

export interface EmailRequest {
  decode_email_verify_token?: {
    userID: string;
    verify: UserVerifyStatus;
    role: UserRole;
  };
}

export interface RefreshToken {
  decode_refreshToken?: {
    userID: string;
    verify: UserVerifyStatus;
    role: UserRole;
    exp: number;
  };
}


export interface AuthorizationRequest {
  decoded_authorization?: {
      userID: string;
      verify: UserVerifyStatus;
      role: UserRole;
  };
}

export interface ForgotPasswordRequest {
  decode_forgot_password_verify_token?: {
      userID: string;
      verify: UserVerifyStatus;
      role: UserRole;
  };
}

export interface DecodedToken {
  userID: string;
  verify: UserVerifyStatus;
  role: UserRole;
  iat: number;
  exp: number;
}
