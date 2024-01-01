import { NextFunction, Request, Response } from "express";
import ProjectError from "../utils/error";
import { UserRole, UserVerifyStatus } from "../utils/user.type";
import { verifyToken } from "../utils/jwt";
import { AuthorizationRequest, DecodedToken } from "../utils/interfaces";

export const verifiedUserValidator = (
  req: Request & AuthorizationRequest,
  __: Response,
  next: NextFunction
) => {
  if (req.decoded_authorization) {
    const { verify } = req.decoded_authorization;
    if (verify != UserVerifyStatus.Verified) {
      const err = new ProjectError(
        "Người dùng chưa xác minh email, vui lòng check email nhé!"
      );
      err.statusCode = 401;
      throw err;
    }
    next();
  }
};

export const isAuthenticated = async (
  req: Request & any,
  __: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.get("Authorization");

    if (!authHeader) {
      const err = new ProjectError("Chưa được xác thực!");
      err.statusCode = 401;
      throw err;
    }

    const token = authHeader.split(" ")[1];
    try {
      const decodedToken: DecodedToken = await verifyToken(
        token,
        process.env.ACCESS_TOKEN_SECRET
      );

      if (!decodedToken) {
        const err = new ProjectError("Chưa được xác thực!");
        err.statusCode = 401;
        throw err;
      }

      req.decoded_authorization = decodedToken;
      next();
    } catch (error) {
      next(error);
    }
  } catch (error) {
    next(error);
  }
};

export const isAdmin = async (
  req: Request & AuthorizationRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.decoded_authorization) {
      const { verify, role } = req.decoded_authorization;

      if (verify === UserVerifyStatus.Verified) {
        const err = new ProjectError("Email đã được xác minh trước đó");
        err.statusCode = 500;
        throw err;
      }
      if (role === UserRole.ADMIN) {
        next();
        return; 
      } else {
        const err = new ProjectError(
          "Truy cập bị từ chối. Bạn không phải là quản trị viên."
        );
        err.statusCode = 400;
        throw err;
      }
    } else {
      const err = new ProjectError(
        "Token không hợp lệ hoặc thông tin bị thiếu"
      );
      err.statusCode = 500;
      throw err;
    }
  } catch (error: any) {
    console.error("Error :", error);
    return res.status(error.statusCode || 500).json({
      status: false,
      message: error.message || "Đã xảy ra lỗi",
    });
  }
};
