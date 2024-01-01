const { ObjectId } = require("mongoose");
import { UserModel } from "../models/course.schemas";

import { UserRole, UserVerifyStatus } from "../utils/user.type";
const axios = require("axios");
import { Types } from "mongoose";
import ProjectError from "../utils/error";
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
      process.env.EMAIL_VERIFY_TOKEN,
      process.env.EMAIL_VERIFY_LIFE
    );
    const { fullname, username, email, password, ip } = data;
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
      process.env.ACCESS_TOKEN_SECRET,
      process.env.ACCESS_TOKEN_LIFE
    );
    let refreshToken = await generateToken(
      {
        userID: userID,
        verify: UserVerifyStatus.Unverified,
        role: UserRole.MEMBER,
      },
      process.env.REFRESH_TOKEN_SECRET,
      process.env.REFRESH_TOKEN_LIFE
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

  async isPasswordValid(password: String) {
    let flag = 0;
    if (
      password.indexOf("!") == -1 &&
      password.indexOf("@") == -1 &&
      password.indexOf("#") == -1 &&
      password.indexOf("$") == -1 &&
      password.indexOf("*") == -1
    ) {
      return false;
    }
    for (let ind = 0; ind < password.length; ind++) {
      let ch = password.charAt(ind);
      if (ch >= "a" && ch <= "z") {
        flag = 1;
        break;
      }
      flag = 0;
    }
    if (!flag) {
      return false;
    }
    flag = 0;
    for (let ind = 0; ind < password.length; ind++) {
      let ch = password.charAt(ind);
      if (ch >= "A" && ch <= "Z") {
        flag = 1;
        break;
      }
      flag = 0;
    }
    if (!flag) {
      return false;
    }
    flag = 0;
    for (let ind = 0; ind < password.length; ind++) {
      let ch = password.charAt(ind);
      if (ch >= "0" && ch <= "9") {
        flag = 1;
        break;
      }
      flag = 0;
    }
    if (flag) {
      return true;
    }
    return false;
  }

  async login(userID: string, verify: string, ip: any) {
    console.log(userID)
    let user = await UserModel.findOne({ _id: userID });
    if (user) {
      const accessToken = await generateToken(
        {
          userID: user._id,
          verify: verify,
          role: user.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        process.env.ACCESS_TOKEN_LIFE
      );
      let refreshToken = await generateToken(
        {
          userID: user._id,
          verify: verify,
          role: user.role,
        },
        process.env.REFRESH_TOKEN_SECRET,
        process.env.REFRESH_TOKEN_LIFE
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

      return {
        accessToken,
        refreshToken,
      };
    } else {
      return null;
    }
  }

  async google(code: string) {
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
        const err = new ProjectError("Gmail chưa được xác minh");
        err.statusCode = 500;
        throw err;
      }
      const user = await UserModel.findOne({ email: result.data.email });

      if (user) {
        // Tạo accessToken và refreshToken
        const accessToken = await generateToken(
          {
            userID: user._id,
            verify: user.verify,
            role: user.role,
          },
          process.env.ACCESS_TOKEN_SECRET,
          process.env.ACCESS_TOKEN_LIFE
        );

        let refreshToken = user.refreshToken;

        if (!refreshToken) {
          refreshToken = await generateToken(
            {
              userID: user._id,
              verify: user.verify,
              role: user.role,
            },
            process.env.REFRESH_TOKEN_SECRET,
            process.env.REFRESH_TOKEN_LIFE
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
      const err = new ProjectError(
        "An error occurred during Google login:" + error
      );
      err.statusCode = 500;
      throw err;
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
          message: "Đăng xuất thành công",
        };
      } else {
        return {
          status: false,
          message: "Đăng xuất thất bại",
        };
      }
    } catch (error) {
      const err = new ProjectError("Lỗi máy chủ :" + error);
      err.statusCode = 500;
      throw err;
    }
  }

  async verifyEmail(userID: string) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(userID);
    if (!isValidObjectId) {
      const err = new ProjectError("Invalid userID :" + userID);
      err.statusCode = 500;
      throw err;
    }
    const [accessToken, refreshToken] = await Promise.all([
      await generateToken(
        {
          userID: userID,
          verify: UserVerifyStatus.Verified,
        },
        process.env.ACCESS_TOKEN_SECRET,
        process.env.ACCESS_TOKEN_LIFE
      ),
      await generateToken(
        {
          userID: userID,
          verify: UserVerifyStatus.Verified,
        },
        process.env.REFRESH_TOKEN_SECRET,
        process.env.REFRESH_TOKEN_LIFE
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
      process.env.EMAIL_VERIFY_TOKEN,
      process.env.EMAIL_VERIFY_LIFE
    );

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
      message: "Gửi lại email xác minh thành công",
    };
  }

  async forgotPassword(userID: string, verify: string, email: string) {
    const forgot_password_token = await generateToken(
      {
        userID: userID,
        verify: verify,
      },
      process.env.FORGOT_PASSWORD_TOKEN,
      process.env.FORGOT_PASSWORD_TOKEN_LIFE
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
      message: "Kiểm tra email để đặt lại mật khẩu",
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

    if (result) {
      return {
        status: true,
        message: "Đặt lại mật khẩu thành công",
      };
    } else {
      return {
        status: false,
        message: "Đặt lại mật khẩu thất bại",
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
      .select(
        "-password -refreshToken -email_verify_token -forgot_password_token"
      )
      .exec();

    return {
      status: true,
      message: "Lấy thông tin người dùng thành công",
      result,
    };
  }

  async getAllUser() {
    const result = await UserModel.find()
      .sort({ createdAt: -1 })
      .select(
        "-password -refreshToken -email_verify_token -forgot_password_token"
      )
      .exec();

    return {
      status: true,
      message: "Lấy tất cả thông tin người dùng thành công",
      result,
    };
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
    return user;
  }

  async changePassword(userID: string, password: any, ip: any) {
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

    return {
      status: true,
      message: "Cập nhật mật khẩu mới thành công",
    };
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
        process.env.ACCESS_TOKEN_SECRET,
        process.env.ACCESS_TOKEN_LIFE
      ),
      await generateToken(
        {
          userID: userID,
          verify: verify,
          role: role,
        },
        process.env.REFRESH_TOKEN_SECRET,
        process.env.REFRESH_TOKEN_LIFE
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
