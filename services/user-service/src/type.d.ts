import { UserVerifyStatus } from "./@type/user.type";


declare namespace Express {
  interface Request {
    headers?: any;
    user?: any;
    decoded_email_verify_token?: any;
    decoded_authorization?: {
      payload: {
        verify: UserVerifyStatus;
      }
    }
  }
}