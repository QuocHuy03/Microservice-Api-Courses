import { DecodedToken } from "../utils/interfaces";

declare module Express {
  interface Request {
    decodedToken?: DecodedToken;
  }
}