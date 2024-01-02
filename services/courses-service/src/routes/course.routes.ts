import express from "express";
import { body, query } from "express-validator";
import { validateRequest } from "../utils/validateRequest";
import {
  isAdmin,
  isAuthenticated,
  verifiedUserValidator,
} from "../../../../shared/middlewares/auth.middleware";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API for user authentication
 *
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               confirm_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registration successful
 *       400:
 *         description: Bad request
 */
router.post(
  "/register",
  [
    body("fullname")
      .trim()
      .not()
      .notEmpty()
      .withMessage("Họ và tên là bắt buộc")
      .isLength({ min: 4 })
      .withMessage("Vui lòng nhập tên hợp lệ, dài tối thiểu 4 ký tự"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email là bắt buộc")
      .isEmail()
      .withMessage("Thông tin email không hợp lệ!")
      .custom(async (value: any) => {
        try {
          const status = await usersService.checkExist("email", value);
          if (status) {
            return Promise.reject("Người dùng đã tồn tại!");
          }
        } catch (err) {
          return Promise.reject(err);
        }
      }),

    body("password")
      .trim()
      .notEmpty()
      .withMessage("Mật khẩu là bắt buộc")
      .isLength({ min: 8 })
      .custom(async (password: string) => {
        try {
          const status = await usersService.isPasswordValid(password);

          if (!status) {
            return Promise.reject(
              "Nhập mật khẩu hợp lệ, có ít nhất 8 ký tự gồm 1 chữ cái nhỏ, 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt($,@,!,#,*)."
            );
          }
        } catch (err) {
          return Promise.reject(err);
        }
      }),
    body("confirmPassword")
      .trim()
      .notEmpty()
      .withMessage("Nhập lại mật khẩu là bắt buộc")
      .custom((value: String, { req }) => {
        if (value != req.body.password) {
          return Promise.reject("Mật khẩu không khớp!");
        }
        return true;
      }),
  ],
  validateRequest,
  register
);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/login",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email là bắt buộc")
      .isEmail()
      .withMessage("Thông tin email không hợp lệ!"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Mật khẩu là bắt buộc")
      .isLength({ min: 8 })
      .custom(async (password: string) => {
        try {
          const status = await usersService.isPasswordValid(password);
          if (!status) {
            return Promise.reject(
              "Nhập mật khẩu hợp lệ, có ít nhất 8 ký tự gồm 1 chữ cái nhỏ, 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt($,@,!,#,*)."
            );
          }
        } catch (err) {
          return Promise.reject(err);
        }
      })
      .withMessage("Thông tin không hợp lệ!"),
  ],
  validateRequest,
  login
);

/**
 * @swagger
 * /google:
 *   get:
 *     summary: Login with Google
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Google login successful
 *       401:
 *         description: Unauthorized
 */
router.get("/google", loginGoogle);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */

router.post("/logout", isAuthenticated, logout);

/**
 * Description: Refresh Token
 * Path: /refresh-token
 * Method : POST
 * Body : {
            "refreshToken": "<RefreshToken>",
          }
 */

/**
 * @swagger
 * /refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/refresh-token",
  [
    body("refreshToken")
      .trim()
      .notEmpty()
      .withMessage("RefreshToken là bắt buộc")
      .custom(async (value: String, { req }) => {
        try {
          const [decode_refreshToken, refreshToken] = await Promise.all([
            verifyToken(value, process.env.REFRESH_TOKEN_SECRET),
            UserModel.findOne({ refreshToken: value }),
          ]);
          if (refreshToken === null) {
            return Promise.reject("Người dùng không tồn tại");
          }
          req.decode_refreshToken = decode_refreshToken;
          return true;
        } catch (error: any) {
          if (error instanceof jwt.JsonWebTokenError) {
            return Promise.reject(error.message);
          } else {
            return Promise.reject(error.message);
          }
        }
      }),
  ],
  validateRequest,
  refreshToken
);

/**
 * Description: Xác minh email khi người dùng khách hàng nhấp vào liên kết trong email,
 * Path: /verify-email?email_verify_token=email_verify_token
 * Method : GET
 */
/**
 * @swagger
 * /verify-email:
 *   get:
 *     summary: Verify email by clicking on the link in the email
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: email_verify_token
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Bad request
 */
router.get(
  "/verify-email",
  [
    query("email_verify_token").custom(async (value: String, { req }) => {
      if (!value) {
        return Promise.reject("Mã xác minh email là bắt buộc");
      }
      try {
        const decode_email_verify_token = await verifyToken(
          value,
          process.env.EMAIL_VERIFY_TOKEN
        );

        req.decode_email_verify_token = decode_email_verify_token;
      } catch (error: any) {
        if (error instanceof jwt.JsonWebTokenError) {
          return Promise.reject(error.message);
        } else {
          return Promise.reject(error.message);
        }
      }
    }),
  ],
  validateRequest,
  emailVerify
);
/**
 * Description: Gửi lại email xác minh
 * Path: /resend-verify-email
 * Method : POST
 * Header : Authorization : Bearer <AccessToken Register>
 * Body : {}
 */
/**
 * @swagger
 * /resend-verify-email:
 *   post:
 *     summary: Resend email verification
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Email verification resent successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/resend-verify-email", isAuthenticated, resendVerifyEmail);

/**
 * Description: Gửi email để reset password , gửi email cho người dùng
 * Path: /forgot-password
 * Method : POST
 * Body : {
            "email": "qhuy.dev@gmail.com",
          }
 */
/**
 * @swagger
 * /forgot-password:
 *   post:
 *     summary: Send email to reset password
 *     tags: [Authentication]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent successfully for password reset
 *       400:
 *         description: Bad request
 */
router.post(
  "/forgot-password",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email là bắt buộc")
      .isEmail()
      .withMessage("Thông tin email không hợp lệ")
      .custom(async (value: String, { req }) => {
        const result = await UserModel.findOne({ email: value });
        if (result === null) {
          return Promise.reject("Người dùng không tồn tại");
        }
        req.user = result;
      }),
  ],
  validateRequest,
  forgotPassword
);

/**
 * Description: Xác minh email liên kết để đặt lại mật khẩu
 * Path: /verify-forgot-password?token=token
 * Method : GET
 */
/**
 * @swagger
 * /verify-forgot-password:
 *   get:
 *     summary: Verify the link to reset the password
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Password reset verification successful
 *       400:
 *         description: Bad request
 */
router.get(
  "/verify-forgot-password",
  [
    query("forgot_password_token").custom(async (value: String) => {
      if (!value) {
        return Promise.reject("Mã xác minh quên mật khẩu là bắt buộc");
      }
      try {
        const decode_forgot_password_verify_token = await verifyToken(
          value,
          process.env.FORGOT_PASSWORD_TOKEN
        );

        const { userID } = decode_forgot_password_verify_token;

        const user = await UserModel.findOne({ _id: userID });

        if (user === null) {
          return Promise.reject("Người dùng không tồn tại");
        }
        if (user?.forgot_password_token !== value) {
          return Promise.reject("Mã xác minh quên mật khẩu không hợp lệ");
        }
      } catch (error: any) {
        if (error instanceof jwt.JsonWebTokenError) {
          return Promise.reject(error.message);
        } else {
          return Promise.reject(error.message);
        }
      }
    }),
  ],
  validateRequest,
  verifyForgotPassword
);

/**
 * Description: Reset Password
 * Path: /reset-password
 * Method : POST
 * Body : {
            "forgot_password_token": "<forgot_password_token này trong bảng user DB>",
            "password": "Mật Khẩu mới",
            "confirm_password": "Nhập Lại Mật Khẩu Mới"
          }
 */
/**
 * @swagger
 * /reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Authentication]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               forgot_password_token:
 *                 type: string
 *               password:
 *                 type: string
 *               confirm_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Bad request
 */
router.post(
  "/reset-password",
  [
    body("forgot_password_token")
      .trim()
      .notEmpty()
      .withMessage("Mã xác minh quên mật khẩu là bắt buộc")
      .custom(async (value: String, { req }) => {
        try {
          const decode_forgot_password_verify_token = await verifyToken(
            value,
            process.env.FORGOT_PASSWORD_TOKEN
          );

          const { userID } = decode_forgot_password_verify_token;

          const user = await UserModel.findOne({ _id: userID });

          if (user === null) {
            return Promise.reject("Người dùng không tồn tại");
          }
          if (user?.forgot_password_token !== value) {
            return Promise.reject("Mã xác minh quên mật khẩu không hợp l");
          }
          req.decode_forgot_password_verify_token =
            decode_forgot_password_verify_token;
        } catch (error: any) {
          if (error instanceof jwt.JsonWebTokenError) {
            return Promise.reject(error.message);
          } else {
            return Promise.reject(error.message);
          }
        }
      }),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Mật khẩu là bắt buộc")
      .isLength({ min: 8 })
      .custom(async (password: string) => {
        try {
          const status = await usersService.isPasswordValid(password);
          if (!status) {
            return Promise.reject(
              "Nhập mật khẩu hợp lệ, có ít nhất 8 ký tự gồm 1 chữ cái nhỏ, 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt($,@,!,#,*)."
            );
          }
        } catch (err) {
          return Promise.reject(err);
        }
      }),

    body("confirmPassword")
      .trim()
      .notEmpty()
      .withMessage("Nhập lại mật khẩu là bắt buộc")
      .custom((value: String, { req }) => {
        if (value != req.body.password) {
          return Promise.reject("Mật khẩu không khớp!");
        }
        return true;
      }),
  ],
  validateRequest,
  resetPassword
);

/**
 * Description: Get Dữ Liệu Người Dùng Đó (Profile) Theo ID
 * Path: /me
 * Method : POST
 * Header : Authorization : Bearer <AccessToken Register Hoặc Login>
 */
/**
 * @swagger
 * /me:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         format: "Bearer <AccessToken>"
 *         required: true
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get("/me", isAuthenticated, getMeByID);

/**
 * @swagger
 * /meAll:
 *   get:
 *     summary: Get all user profiles (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - isAdmin: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         format: "Bearer <AccessToken>"
 *         required: true
 *     responses:
 *       200:
 *         description: All user profiles retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin access only)
 */
router.get("/meAll", isAuthenticated, isAdmin, getAllUser);

/**
 * Description: Update Dữ Liệu Người Dùng Đó (Profile)
 * Path: /me
 * Method : PATCH
 * Header : Authorization : Bearer <AccessToken Register Hoặc Login>
 * Body : { Dữ liệu trong schema muốn update }
 */
/**
 * @swagger
 * /me:
 *   patch:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         format: "Bearer <AccessToken>"
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               city:
 *                 type: string
 *               district:
 *                 type: string
 *               commune:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/me",
  isAuthenticated,
  verifiedUserValidator,
  [
    body("fullname").optional(true),
    body("username").optional(true),
    body("phone").optional(true),
  ],
  validateRequest,
  updateMe
);

/**
 * Description: Change Password
 * Path: /change-password
 * Header : Authorization : Bearer <AccessToken Register Hoặc Login>
 * Method : PUT
 * Body : {
            "old_password": "<old_password là mật khẩu cũ>",
            "password": "Mật Khẩu mới",
            "confirm_password": "Nhập Lại Mật Khẩu Mới"
          }
 */
/**
 * @swagger
 * /change-password:
 *   put:
 *     summary: Change user password
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         format: "Bearer <AccessToken>"
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               old_password:
 *                 type: string
 *               password:
 *                 type: string
 *               confirm_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/change-password",
  isAuthenticated,
  verifiedUserValidator,
  [
    body("old_password")
      .trim()
      .notEmpty()
      .withMessage("Mật khẩu là bắt buộc")
      .isLength({ min: 8 })
      .custom(async (value: any, { req }) => {
        try {
          const isValidPassword = await usersService.isPasswordValid(value);
          if (!isValidPassword) {
            return Promise.reject(
              "Nhập mật khẩu hợp lệ, có ít nhất 8 ký tự gồm 1 chữ cái nhỏ, 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt($,@,!,#,*)."
            );
          }

          if (req.decoded_authorization) {
            const { userID } = req.decoded_authorization;
            const user = await UserModel.findOne({ _id: userID });

            if (!user) {
              return Promise.reject("Người dùng không tồn tại");
            }

            const { password }: any = user;
            const isMatch = await bcrypt.compare(value, password);

            if (!isMatch) {
              return Promise.reject("Mật khẩu cũ không khớp");
            }

            return true;
          } else {
            return Promise.reject("Token không hợp lệ hoặc thông tin bị thiếu");
          }
        } catch (error: any) {
          return Promise.reject(error);
        }
      }),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Mật khẩu là bắt buộc")
      .isLength({ min: 8 })
      .custom(async (password: string) => {
        try {
          const status = await usersService.isPasswordValid(password);
      
          if (!status) {
            return Promise.reject(
              "Nhập mật khẩu hợp lệ, có ít nhất 8 ký tự gồm 1 chữ cái nhỏ, 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt($,@,!,#,*)."
            );
          }
        } catch (err) {
          return Promise.reject(err);
        }
      }),
      
    body("confirmPassword")
      .trim()
      .notEmpty()
      .withMessage("Nhập lại mật khẩu là bắt buộc")
      .custom((value: String, { req }) => {
        if (value != req.body.password) {
          return Promise.reject("Mật khẩu không khớp!");
        }
        return true;
      }),
  ],
  validateRequest,
  changePassword
);

export default router;
