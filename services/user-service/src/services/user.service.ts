const { ObjectId } = require("mongoose");
import bcrypt from "bcrypt";
import { UserModel } from "../models/schemas/User.schemas";
import { LogModel } from "../models/schemas/Log.schemas";
import { generateToken } from "../utils/jwt";
import { jwtConfig } from "../constants/jwt";
import { UserRole, UserVerifyStatus } from "../types/user.type";
import { USER_MESSAGE } from "../constants/message";
import { createError } from "../utils/error";
const axios = require("axios");
import { Types } from "mongoose";
import { emailSMPT } from "../helpers/email.helper";
import ordersService from "./order.service";
import commentsService from "./comment.service";
import couponUsersService from "./couponUser.service";
import chatsService from "./chat.service";
const mongoose = require("mongoose");

class UsersService {
  async register(data: {
    fullname: string;
    username: string;
    email: string;
    password: any;
    ip: any;
  }) {
    const userID = new Types.ObjectId().toString();
    let email_verify_token = await generateToken(
      {
        userID: userID,
        verify: UserVerifyStatus.Unverified,
        role: UserRole.MEMBER,
      },
      process.env.EMAIL_VERIFY_TOKEN || jwtConfig.emailVerifyToken,
      process.env.EMAIL_VERIFY_LIFE || jwtConfig.emailVerifyTokenLife
    );
    const { fullname, username, email, password, ip } = data;
    // console.log("Email verify token :", email_verify_token);
    emailSMPT.sendEmail(
      email,
      "Xác thực tài khoản",
      `<html>
      <head>
        <style>
          .reset-button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #007bff;
            text-decoration: none;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <h2>Verify Email</h2>
        <a class="reset-button" style="color: #fff;"  href="${process.env.CLIENT_URL}/auth/verify-email?email_verify_token=${email_verify_token}">Verify Email</a>
      </body>
    </html>`
    );
    const hashedPassword = await bcrypt.hash(password, 10);
    const accessToken = await generateToken(
      {
        userID: userID,
        verify: UserVerifyStatus.Unverified,
        role: UserRole.MEMBER,
      },
      process.env.ACCESS_TOKEN_SECRET || jwtConfig.accessTokenSecret,
      process.env.ACCESS_TOKEN_LIFE || jwtConfig.accessTokenLife
    );
    let refreshToken = await generateToken(
      {
        userID: userID,
        verify: UserVerifyStatus.Unverified,
        role: UserRole.MEMBER,
      },
      process.env.REFRESH_TOKEN_SECRET || jwtConfig.refreshTokenSecret,
      process.env.REFRESH_TOKEN_LIFE || jwtConfig.refreshTokenLife
    );
    await UserModel.create({
      _id: userID,
      email_verify_token: email_verify_token,
      refreshToken: refreshToken,
      fullname: fullname,
      username: username,
      email: email,
      password: hashedPassword,
    });
    await LogModel.create({
      userID,
      ip,
      action: `${fullname} ` + USER_MESSAGE.REGISTER_SUCESSS,
    });
    return {
      accessToken,
      refreshToken,
    };
  }

  async checkExist(key: string, value: string) {
    const query = { [key]: value };
    const user = await UserModel.findOne(query);
    return Boolean(user);
  }

  async login(userID: string, verify: string, ip: any) {
    let user = await UserModel.findOne({ _id: userID });
    if (user) {
      const accessToken = await generateToken(
        {
          userID: user._id,
          verify: verify,
          role: user.role,
        },
        process.env.ACCESS_TOKEN_SECRET || jwtConfig.accessTokenSecret,
        process.env.ACCESS_TOKEN_LIFE || jwtConfig.accessTokenLife
      );
      let refreshToken = await generateToken(
        {
          userID: user._id,
          verify: verify,
          role: user.role,
        },
        process.env.REFRESH_TOKEN_SECRET || jwtConfig.refreshTokenSecret,
        process.env.REFRESH_TOKEN_LIFE || jwtConfig.refreshTokenLife
      ); // tạo 1 refresh token ngẫu nhiên
      if (!user.refreshToken) {
        await UserModel.updateOne(
          { _id: user.id },
          {
            $set: {
              refreshToken: refreshToken,
            },
          }
        );
      } else {
        refreshToken = user.refreshToken;
      }
      await LogModel.create({
        userID,
        ip,
        action: `${user.fullname} ` + USER_MESSAGE.LOGIN_SUCESSS,
      });
      return {
        accessToken,
        refreshToken,
      };
    }
  }

  async loginGoogle(code: string) {
    try {
      const body = {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      };

      // Gửi yêu cầu để lấy token từ Google
      const { data } = await axios.post(
        "https://oauth2.googleapis.com/token",
        body,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (data.error) {
        console.error("Google API error:", data.error_description);
        throw new Error(data.error_description || "Google API error");
      }

      // Gửi yêu cầu để lấy thông tin người dùng từ Google
      const result = await axios.get(
        "https://www.googleapis.com/oauth2/v1/userinfo",
        {
          params: {
            access_token: data.access_token,
            alt: "json",
          },
          headers: {
            Authorization: `Bearer ${data.id_token}`,
          },
        }
      );

      if (!result.data.verified_email) {
        throw new Error(USER_MESSAGE.GMAIL_NOT_VERIFIED);
      }

      // Tìm người dùng trong cơ sở dữ liệu hoặc đăng ký nếu chưa tồn tại
      const user = await UserModel.findOne({ email: result.data.email });

      if (user) {
        // Tạo accessToken và refreshToken
        const accessToken = await generateToken(
          {
            userID: user._id,
            verify: user.verify,
            role: user.role,
          },
          process.env.ACCESS_TOKEN_SECRET || jwtConfig.accessTokenSecret,
          process.env.ACCESS_TOKEN_LIFE || jwtConfig.accessTokenLife
        );

        let refreshToken = user.refreshToken;

        if (!refreshToken) {
          refreshToken = await generateToken(
            {
              userID: user._id,
              verify: user.verify,
              role: user.role,
            },
            process.env.REFRESH_TOKEN_SECRET || jwtConfig.refreshTokenSecret,
            process.env.REFRESH_TOKEN_LIFE || jwtConfig.refreshTokenLife
          );
          await UserModel.updateOne({ _id: user._id }, { refreshToken });
        }
        return {
          accessToken,
          refreshToken,
          newUser: 0,
          verify: user.verify,
        };
      } else {
        // Đăng ký người dùng mới nếu không tồn tại
        const password = Math.random().toString(36).substring(2, 15);
        const data = await this.register({
          fullname: result.data.name,
          username: result.data.given_name,
          email: result.data.email,
          password: password,
          ip: ":1",
        });

        return { ...data, newUser: 1, verify: UserVerifyStatus.Unverified };
      }
    } catch (error) {
      console.error("An error occurred during Google login:", error);
    }
  }

  async logout(token: string) {
    try {
      const result = await UserModel.findOneAndUpdate(
        { refreshToken: token },
        { $set: { refreshToken: "" } }
      );

      if (result) {
        return {
          status: true,
          message: USER_MESSAGE.LOGOUT_SUCCESS,
        };
      } else {
        return {
          status: false,
          message: USER_MESSAGE.LOGOUT_FAILURE,
        };
      }
    } catch (error) {
      createError(USER_MESSAGE.SERVER_ERROR, 500);
    }
  }

  async verifyEmail(userID: string) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(userID);
    if (!isValidObjectId) {
      return console.error("Invalid userID:", userID);
    }
    const [accessToken, refreshToken] = await Promise.all([
      await generateToken(
        {
          userID: userID,
          verify: UserVerifyStatus.Verified,
        },
        process.env.ACCESS_TOKEN_SECRET || jwtConfig.accessTokenSecret,
        process.env.ACCESS_TOKEN_LIFE || jwtConfig.accessTokenLife
      ),
      await generateToken(
        {
          userID: userID,
          verify: UserVerifyStatus.Verified,
        },
        process.env.REFRESH_TOKEN_SECRET || jwtConfig.refreshTokenSecret,
        process.env.REFRESH_TOKEN_LIFE || jwtConfig.refreshTokenLife
      ),

      await UserModel.updateOne(
        { _id: userID },
        {
          $set: {
            email_verify_token: "",
            verify: UserVerifyStatus.Verified,
            updatedAt: new Date(),
          },
        }
      ),
    ]);
    if (refreshToken) {
      await UserModel.updateOne(
        { _id: userID },
        {
          $set: {
            refreshToken,
            updatedAt: new Date(),
          },
        }
      );
    }
    return {
      accessToken,
      refreshToken,
    };
  }

  async resendVerifyEmail(userID: string) {
    const email_verify_token = await generateToken(
      {
        userID: userID,
        verify: UserVerifyStatus.Unverified,
      },
      process.env.EMAIL_VERIFY_TOKEN || jwtConfig.emailVerifyToken,
      process.env.EMAIL_VERIFY_LIFE || jwtConfig.emailVerifyTokenLife
    );
    console.log("Rensend verify email : ", email_verify_token);

    await UserModel.updateOne(
      { _id: new ObjectId(userID) },
      {
        $set: {
          email_verify_token,
          updatedAt: new Date(),
        },
      }
    );
    return {
      status: true,
      message: USER_MESSAGE.RESEND_VERIFY_EMAIL_SUCCESS,
    };
  }

  async forgotPassword(userID: string, verify: string, email: string) {
    const forgot_password_token = await generateToken(
      {
        userID: userID,
        verify: verify,
      },
      process.env.FORGOT_PASSWORD_TOKEN || jwtConfig.forgotPasswordToken,
      process.env.FORGOT_PASSWORD_TOKEN_LIFE ||
        jwtConfig.forgotPasswordTokenLife
    );

    emailSMPT.sendEmail(
      email,
      "Lấy lại mật khẩu",
      `<html>
      <head>
        <style>
          /* Thêm CSS cho nút "Reset Password" */
          .reset-button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #007bff;
            text-decoration: none;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <h2>Reset Password</h2>
        <p>A password change has been requested for your account. If this was you, please click the button below to reset your password:</p>
        <a class="reset-button" style="color: #fff;"  href="${process.env.CLIENT_URL}/auth/verify-forgot-password?forgot_password_token=${forgot_password_token}">Reset Password</a>
      </body>
    </html>`
    );
    console.log(
      "Forgot password token đến người dùng : ",
      forgot_password_token
    );

    await UserModel.updateOne(
      { _id: userID },
      {
        $set: {
          forgot_password_token,
          updatedAt: new Date(),
        },
      }
    );

    return {
      status: true,
      message: USER_MESSAGE.CHECK_EMAIL_TO_RESET_PASSWORD,
    };
  }

  async resetPassword(userID: string, password: string, ip: any) {
    let user: any = await UserModel.findOne({ _id: userID });
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await UserModel.updateOne(
      { _id: userID },
      {
        $set: {
          forgot_password_token: "",
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );
    await LogModel.create({
      userID,
      ip,
      action: `${user.fullname} ` + USER_MESSAGE.RESET_PASSWORD_SUCCESS,
    });
    if (result) {
      return {
        status: true,
        message: USER_MESSAGE.RESET_PASSWORD_SUCCESS,
      };
    }
  }

  async getMeByID(userID: string) {
    const result = await UserModel.findOne(
      { _id: userID },
      {
        projection: {
          password: 0,
          refreshToken: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
        },
      }
    )
      .sort({ createdAt: -1 })
      .select(
        "-password -refreshToken -email_verify_token -forgot_password_token"
      )
      .exec();

    if (result) {
      return {
        status: true,
        message: USER_MESSAGE.GET_ME_SUCCESS,
        result,
      };
    }
  }

  async getMe() {
    const result = await UserModel.find()
      .sort({ createdAt: -1 })
      .select(
        "-password -refreshToken -email_verify_token -forgot_password_token"
      )
      .exec();
    if (result) {
      return {
        status: true,
        message: USER_MESSAGE.GET_ME_SUCCESS,
        result,
      };
    }
  }

  async updateMe(userID: string, body: any, ip: any) {
    const user: any = await UserModel.findOneAndUpdate(
      { _id: userID },
      {
        $set: {
          ...body,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
        projection: {
          password: 0,
          refreshToken: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
        },
      }
    );
    // await LogModel.create({
    //   userID,
    //   ip,
    //   action: `${user.fullname} ` + USER_MESSAGE.UPDATE_ME_SUCCESS,
    // });
    return user;
  }

  async changePassword(userID: string, password: any, ip: any) {
    let user: any = await UserModel.findOne({ _id: userID });
    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.updateOne(
      { _id: userID },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );
    await LogModel.create({
      userID,
      ip,
      action: `${user.fullname} ` + USER_MESSAGE.CHANGE_PASSWORD_SUCCESS,
    });
    return {
      status: true,
      message: USER_MESSAGE.CHANGE_PASSWORD_SUCCESS,
    };
  }

  async deleteUserByID(id: string) {
    try {
      const exsitUser = await ordersService.checkExist(`userID`, id);
      const exsitComment = await commentsService.checkExist(`userID`, id);
      const exsitCoupon = await couponUsersService.checkExist(`userID`, id);
      const exsitChat = await chatsService.checkExist(`userID`, id);

      if (exsitUser) {
        return {
          status: false,
          message:
            "Không thể xóa người dùng vì nó được sử dụng trong đặt hàng!",
        };
      }

      if (exsitComment) {
        return {
          status: false,
          message:
            "Không thể xóa người dùng vì nó được sử dụng trong đánh giá & bình luận!",
        };
      }

      if (exsitCoupon) {
        return {
          status: false,
          message:
            "Không thể xóa người dùng vì nó được sử dụng trong áp dụng khuyến mãi!",
        };
      }

      if (exsitChat) {
        return {
          status: false,
          message:
            "Không thể xóa người dùng vì nó được sử dụng trong đoạn chat!",
        };
      }

      // Nếu người dùng không được sử dụng trong bảng khác, thực hiện xóa
      await UserModel.deleteOne({ _id: id });
      return {
        status: true,
        message: USER_MESSAGE.DELETE_USER_SUCCESS,
      };
    } catch (error) {
      console.error(error);
      return {
        status: false,
        message: "Đã xảy ra lỗi khi thực hiện xóa người dùng.",
      };
    }
  }

  async refreshToken(
    userID: string,
    verify: UserVerifyStatus,
    role: UserRole,
    refreshToken: string
  ) {
    const [new_accessToken, new_refreshToken] = await Promise.all([
      await generateToken(
        {
          userID: userID,
          verify: verify,
          role: role,
        },
        process.env.ACCESS_TOKEN_SECRET || jwtConfig.accessTokenSecret,
        process.env.ACCESS_TOKEN_LIFE || jwtConfig.accessTokenLife
      ),
      await generateToken(
        {
          userID: userID,
          verify: verify,
          role: role,
        },
        process.env.REFRESH_TOKEN_SECRET || jwtConfig.refreshTokenSecret,
        process.env.REFRESH_TOKEN_LIFE || jwtConfig.refreshTokenLife
      ),
      await UserModel.updateOne(
        { refreshToken: refreshToken },
        {
          $set: {
            refreshToken: "",
            updatedAt: new Date(),
          },
        }
      ),
    ]);
    return {
      accessToken: new_accessToken,
      refreshToken: new_refreshToken,
    };
  }
}

const usersService = new UsersService();
export default usersService;