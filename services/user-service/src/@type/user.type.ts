export enum UserRole {
  MEMBER = "MEMBER",
  ADMIN = "ADMIN",
  EMPLOYEE = "EMPLOYEE",
}

export enum UserVerifyStatus {
  Unverified = 0, // chưa xác thực email mặc định = 0
  Verified = 1, // đã xác thực email
  Banned = 2, // khóa
}
