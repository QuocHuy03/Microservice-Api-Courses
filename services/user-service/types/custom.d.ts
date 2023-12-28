
declare module Express {
  interface Request {
    decodedToken?: any;
  }
}