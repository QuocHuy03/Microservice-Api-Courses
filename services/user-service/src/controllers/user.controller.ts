import bcrypt from "bcrypt";
import express from "express";
import usersService from "../services/user.service";
import { UserModel } from "../models/user.schemas";
import {
  AuthorizationRequest,
  EmailRequest,
  ForgotPasswordRequest,
  RefreshToken,
} from "../models/requests/request";

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
      const io = getIOS();
      io.emit(
        SOCKET_USER.REGISTER_USER,
        `Register [ ${fullname} ] successfully`
      );
      res.status(200).json({
        status: true,
        message: USER_MESSAGE.REGISTER_SUCESSS,
        result,
      });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ status: false, message: "Lỗi trong quá trình đăng ký" });
  }
};

export const login = async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;
  const user: any = await UserModel.findOne({ email: email });
  if (user === null) {
    return res.status(200).json({
      status: false,
      message: USER_MESSAGE.USER_NOT_FOUND,
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(200).json({
      status: false,
      message: USER_MESSAGE.INVALID_PASSWORD,
    });
  }
  const userID: IUser = user._id;
  const ip = req.socket.localAddress;
  try {
    const result = await usersService.login(userID.toString(), user.verify, ip);
    if (result) {
      const io = getIOS();
      io.emit(SOCKET_USER.LOGIN_USER, `Login [ ${email} ] successfully`);
      return res.status(200).json({
        status: true,
        message: USER_MESSAGE.LOGIN_SUCESSS,
        result,
      });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, message: "Lỗi trong quá trình đăng nhập", err });
  }
};

export const logout = async (req: express.Request, res: express.Response) => {
  const { refreshToken }: any = req.body;
  try {
    const result = await usersService.logout(refreshToken);
    if (result) {
      res.status(200).json(result);
    }
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, message: "Lỗi trong quá trình đăng xuất" });
  }
};

export const refreshToken = async (
  req: express.Request & RefreshToken,
  res: express.Response
) => {
  if (req.decode_refreshToken) {
    try {
      const { userID, verify, role } = req.decode_refreshToken;
      const { refreshToken } = req.body;

      const user = await UserModel.findOne({
        _id: userID,
      });

      if (!user) {
        return res.status(500).json({
          status: false,
          message: USER_MESSAGE.USER_NOT_FOUND,
        });
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
          message: USER_MESSAGE.REFRESH_TOKEN_SUCCESS,
          result,
        });
      }
    } catch (error: any) {
      console.error("Error :", error);
      return res.status(500).json({ status: false, message: error });
    }
  } else {
    return res.status(500).json({
      status: false,
      message: USER_MESSAGE.ERROR_TOKEN_OR_PAYLOAD,
    });
  }
};

export const emailVerify = async (
  req: express.Request & EmailRequest,
  res: express.Response
) => {
  if (req.decode_email_verify_token) {
    try {
      const { userID } = req.decode_email_verify_token;

      const user = await UserModel.findOne({
        _id: userID,
      });
      if (!user) {
        return res.status(500).json({
          status: false,
          message: USER_MESSAGE.USER_NOT_FOUND,
        });
      }

      if (user?.email_verify_token === "") {
        return res.status(200).json({
          status: false,
          message: USER_MESSAGE.EMAIL_ALREADY_VERIFIED_BEFORE,
        });
      }

      const result: any = await usersService.verifyEmail(userID);

      if (result) {
        const urlRedirect = `${process.env.CLIENT_REDIRECT_VERIFY_EMAIL}?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;
        return res.redirect(urlRedirect);
      }
    } catch (error: any) {
      console.error("Error :", error);
      return res.status(500).json({ status: false, message: error });
    }
  } else {
    return res.status(500).json({
      status: false,
      message: USER_MESSAGE.ERROR_TOKEN_OR_PAYLOAD,
    });
  }
};

export const resendVerifyEmail = async (
  req: express.Request & AuthorizationRequest,
  res: express.Response
) => {
  if (req.decoded_authorization) {
    try {
      const { userID } = req.decoded_authorization;

      const user = await UserModel.findOne({
        _id: userID,
      });

      if (!user) {
        return res.status(500).json({
          status: false,
          message: USER_MESSAGE.USER_NOT_FOUND,
        });
      }

      if (user.verify === UserVerifyStatus.Verified) {
        return res.status(200).json({
          status: false,
          message: USER_MESSAGE.EMAIL_ALREADY_VERIFIED_BEFORE,
        });
      }
      const result = await usersService.resendVerifyEmail(userID);
      if (result) {
        return res.status(200).json(result);
      }
    } catch (error: any) {
      console.error("Error :", error);
      return res.status(500).json({ status: false, message: error });
    }
  } else {
    return res.status(500).json({
      status: false,
      message: USER_MESSAGE.ERROR_TOKEN_OR_PAYLOAD,
    });
  }
};

export const forgotPassword = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { email }: any = req.body;
    const { user }: any = req;
    const userID: IUser = user._id;
    const result = await usersService.forgotPassword(
      userID.toString(),
      user.verify,
      email
    );
    if (result) {
      const io = getIOS();
      io.emit(
        SOCKET_USER.FOTGOT_PASSWORD,
        `Fotgot Password [ ${email} ] successfully`
      );
      return res.status(200).json(result);
    }
  } catch (error: any) {
    console.error("Error :", error);
    return res.status(500).json({ status: false, message: error });
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
  res: express.Response
) => {
  const ip = req.socket.localAddress;
  if (req.decode_forgot_password_verify_token) {
    try {
      const { userID } = req.decode_forgot_password_verify_token;
      const { password }: any = req.body;
      const result = await usersService.resetPassword(userID, password, ip);
      if (result) {
        return res.status(200).json(result);
      }
    } catch (error) {
      console.error("Error :", error);
      return res.status(500).json({ status: false, message: error });
    }
  } else {
    return res.status(500).json({
      status: false,
      message: USER_MESSAGE.ERROR_TOKEN_OR_PAYLOAD,
    });
  }
};

export const getMeByID = async (
  req: express.Request & AuthorizationRequest,
  res: express.Response
) => {
  if (req.decoded_authorization) {
    try {
      const { userID } = req.decoded_authorization;
      const result = await usersService.getMeByID(userID);
      if (result) {
        return res.status(200).json(result);
      }
    } catch (error: any) {
      console.error("Error :", error);
      return res.status(500).json({ status: false, message: error });
    }
  } else {
    return res.status(500).json({
      status: false,
      message: USER_MESSAGE.ERROR_TOKEN_OR_PAYLOAD,
    });
  }
};

export const getMe = async (req: express.Request, res: express.Response) => {
  try {
    const result = await usersService.getMe();
    if (result) {
      return res.status(200).json(result);
    }
  } catch (error: any) {
    console.error("Error :", error);
    return res.status(500).json({ status: false, message: error });
  }
};

export const updateMe = async (
  req: express.Request & AuthorizationRequest,
  res: express.Response
) => {
  const ip = req.socket.localAddress;
  if (req.decoded_authorization) {
    try {
      const { userID } = req.decoded_authorization;
      const body = req.body;
      const user = await usersService.updateMe(userID, body, ip);
      if (user) {
        return res.status(200).json({
          status: true,
          message: USER_MESSAGE.UPDATE_ME_SUCCESS,
          user,
        });
      }
    } catch (error: any) {
      console.error("Error :", error);
      return res.status(500).json({ status: false, message: error });
    }
  } else {
    return res.status(500).json({
      status: false,
      message: USER_MESSAGE.ERROR_TOKEN_OR_PAYLOAD,
    });
  }
};

export const updateUserByID = async (
  req: express.Request,
  res: express.Response
) => {
  const ip = req.socket.localAddress;
  try {
    const existing = await usersService.checkExist(`_id`, req.params.id);
    if (!existing) {
      return res
        .status(500)
        .json({ status: false, message: USER_MESSAGE.USER_NOT_FOUND });
    }
    const user = await usersService.updateMe(req.params.id, req.body, ip);
    if (user) {
      return res.status(200).json({
        status: true,
        message: USER_MESSAGE.UPDATE_ME_SUCCESS,
        user,
      });
    }
  } catch (error: any) {
    console.error("Error :", error);
    return res.status(500).json({ status: false, message: error });
  }
};

export const changePassword = async (
  req: express.Request & AuthorizationRequest,
  res: express.Response
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
      console.error("Error :", error);
      return res.status(500).json({ status: false, message: error });
    }
  } else {
    return res.status(500).json({
      status: false,
      message: USER_MESSAGE.ERROR_TOKEN_OR_PAYLOAD,
    });
  }
};

export const loginGoogle = async (
  req: express.Request,
  res: express.Response
) => {
  const { code } = req.query;
  const result: any = await usersService.loginGoogle(code as string);
  if (result) {
    const urlRedirect = `${process.env.CLIENT_REDIRECT_CALLBACK_LOGIN_GOOGLE}?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}&newUser=${result.newUser}&verify=${result.verify}`;
    return res.redirect(urlRedirect);
  }
};

export const deleteUserByID = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const result = await usersService.deleteUserByID(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, message: USER_MESSAGE.ERROR_DELETE_USER });
  }
};