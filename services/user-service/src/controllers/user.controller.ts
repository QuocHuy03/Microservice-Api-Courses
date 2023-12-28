import bcrypt from "bcrypt";
import express, { NextFunction } from "express";
import usersService from "../services/user.service";
import { UserModel } from "../models/user.schemas";
import {
  AuthorizationRequest,
  EmailRequest,
  ForgotPasswordRequest,
  RefreshToken,
} from "../utils/interfaces";
import ProjectError from "../utils/error";
import { UserVerifyStatus } from "../utils/user.type";

export const register = async (req: express.Request, res: express.Response) => {
  const { fullname, username, email, password } = req.body;
  const ip = req.socket.localAddress;
  try {
    const result = await usersService.register({
      fullname,
      username,
      email,
      password,
      ip,
    });
    if (result) {
      res.status(200).json({
        status: true,
        message: "Đăng ký thành công",
        result,
      });
    }
  } catch (error) {
    const err = new ProjectError(`Lỗi trong quá trình đăng ký : ${error}}`);
    err.statusCode = 500;
    throw err;
  }
};

export const login = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const user: any = await UserModel.findOne({ email: email });

    if (user === null) {
      const err = new ProjectError(`Không tìm thấy người dùng`);
      err.statusCode = 500;
      throw err;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const err = new ProjectError(`Mật khẩu không hợp lệ`);
      err.statusCode = 500;
      throw err;
    }

    const userID: any = user._id;
    const ip = req.socket.localAddress;

    const result = await usersService.login(userID.toString(), user.verify, ip);

    if (result) {
      return res.status(200).json({
        status: true,
        message: "Đăng nhập thành công",
        result,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  const { refreshToken }: any = req.body;
  try {
    const result = await usersService.logout(refreshToken);
    if (result) {
      res.status(200).json(result);
    }
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: express.Request & RefreshToken,
  res: express.Response,
  next: NextFunction
) => {
  try {
    if (req.decode_refreshToken) {
      const { userID, verify, role } = req.decode_refreshToken;
      const { refreshToken } = req.body;

      const user = await UserModel.findOne({
        _id: userID,
      });

      if (!user) {
        const err = new ProjectError(`Không tìm thấy người dùng`);
        err.statusCode = 500;
        throw err;
      }

      const result = await usersService.refreshToken(
        userID,
        verify,
        role,
        refreshToken
      );

      if (result) {
        return res.status(200).json({
          status: true,
          message: "RefreshToken thành công",
          result,
        });
      }
    } else {
      const err = new ProjectError(
        `Token không hợp lệ hoặc thông tin bị thiếu`
      );
      err.statusCode = 500;
      throw err;
    }
  } catch (error: any) {
    next(error);
  }
};

export const emailVerify = async (
  req: express.Request & EmailRequest,
  res: express.Response, next: NextFunction
) => {
  if (req.decode_email_verify_token) {
    try {
      const { userID } = req.decode_email_verify_token;

      const user = await UserModel.findOne({
        _id: userID,
      });
      if (!user) {
        const err = new ProjectError(`Không tìm thấy người dùng`);
        err.statusCode = 500;
        throw err;
      }

      if (user?.email_verify_token === "") {
        const err = new ProjectError(`Email đã được xác minh trước đó`);
        err.statusCode = 500;
        throw err;
      }

      const result: any = await usersService.verifyEmail(userID);

      if (result) {
        const urlRedirect = `${process.env.CLIENT_REDIRECT_VERIFY_EMAIL}?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;
        return res.redirect(urlRedirect);
      }
    } catch (error: any) {
     next(error);
    }
  } else {
    const err = new ProjectError(`Token không hợp lệ hoặc thông tin bị thiếu`);
    err.statusCode = 500;
    throw err;
  }
};

export const resendVerifyEmail = async (
  req: express.Request & AuthorizationRequest,
  res: express.Response,
  next: NextFunction
) => {
  try {
    if (req.decoded_authorization) {
      const { userID } = req.decoded_authorization;

      const user = await UserModel.findOne({
        _id: userID,
      });

      if (!user) {
        const err = new ProjectError(`Không tìm thấy người dùng`);
        err.statusCode = 500;
        throw err;
      }

      if (user.verify === UserVerifyStatus.Verified) {
        const err = new ProjectError(`Email đã được xác minh trước đó`);
        err.statusCode = 500;
        throw err;
      }

      const result = await usersService.resendVerifyEmail(userID);

      if (result) {
        return res.status(200).json(result);
      }
    } else {
      const err = new ProjectError(
        `Token không hợp lệ hoặc thông tin bị thiếu`
      );
      err.statusCode = 500;
      throw err;
    }
  } catch (error: any) {
    next(error);
  }
};

export const forgotPassword = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  try {
    const { email }: any = req.body;
    const { user }: any = req;
    const userID: any = user._id;

    const result = await usersService.forgotPassword(
      userID.toString(),
      user.verify,
      email
    );

    if (result) {
      return res.status(200).json(result);
    }
  } catch (error: any) {
    next(error);
  }
};

export const verifyForgotPassword = async (
  req: express.Request,
  res: express.Response
) => {
  const { forgot_password_token } = req.query;
  const urlRedirect = `${process.env.CLIENT_REDIRECT_RESET_PASSWORD}?forgot_password_token=${forgot_password_token}`;

  return res.redirect(urlRedirect);
};

export const resetPassword = async (
  req: express.Request & ForgotPasswordRequest,
  res: express.Response,
  next: NextFunction
) => {
  try {
    const ip = req.socket.localAddress;

    if (req.decode_forgot_password_verify_token) {
      const { userID } = req.decode_forgot_password_verify_token;
      const { password }: any = req.body;

      const result = await usersService.resetPassword(userID, password, ip);

      if (result) {
        return res.status(200).json(result);
      }
    } else {
      const err = new ProjectError(
        `Token không hợp lệ hoặc thông tin bị thiếu`
      );
      err.statusCode = 500;
      throw err;
    }
  } catch (error: any) {
    next(error);
  }
};

export const getMeByID = async (
  req: express.Request & AuthorizationRequest,
  res: express.Response,
  next: NextFunction
) => {
  try {
    if (req.decoded_authorization) {
      const { userID } = req.decoded_authorization;
      const result = await usersService.getMeByID(userID);

      if (result) {
        return res.status(200).json(result);
      }
    } else {
      const err = new ProjectError(
        `Token không hợp lệ hoặc thông tin bị thiếu`
      );
      err.statusCode = 500;
      throw err;
    }
  } catch (error: any) {
    next(error);
  }
};

export const getAllUser = async (
  __: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  try {
    const result = await usersService.getAllUser();
    if (result) {
      return res.status(200).json(result);
    }
  } catch (error: any) {
    next(error);
  }
};

export const updateMe = async (
  req: express.Request & AuthorizationRequest,
  res: express.Response,
  next: NextFunction
) => {
  try {
    const ip = req.socket.localAddress;

    if (req.decoded_authorization) {
      const { userID } = req.decoded_authorization;
      const body = req.body;

      const user = await usersService.updateMe(userID, body, ip);

      if (user) {
        return res.status(200).json({
          status: true,
          message: "Cập nhật thông tin người dùng thành công",
          user,
        });
      }
    } else {
      const err = new ProjectError(
        `Token không hợp lệ hoặc thông tin bị thiếu`
      );
      err.statusCode = 500;
      throw err;
    }
  } catch (error: any) {
    next(error);
  }
};

export const changePassword = async (
  req: express.Request & AuthorizationRequest,
  res: express.Response,
  next: NextFunction
) => {
  const ip = req.socket.localAddress;
  if (req.decoded_authorization) {
    try {
      const { userID } = req.decoded_authorization;
      const { password }: any = req.body;
      const result = await usersService.changePassword(userID, password, ip);
      if (result) {
        return res.status(200).json(result);
      }
    } catch (error: any) {
      next(error);
    }
  } else {
    const err = new ProjectError(`Token không hợp lệ hoặc thông tin bị thiếu`);
    err.statusCode = 500;
    throw err;
  }
};

export const loginGoogle = async (
  req: express.Request,
  res: express.Response
) => {
  const { code } = req.query;
  const result: any = await usersService.google(code as string);
  if (result) {
    const urlRedirect = `${process.env.CLIENT_REDIRECT_CALLBACK_LOGIN_GOOGLE}?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}&newUser=${result.newUser}&verify=${result.verify}`;
    return res.redirect(urlRedirect);
  }
};
