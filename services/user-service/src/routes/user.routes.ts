import express from "express";
import {
  changePassword,
  deleteUserByID,
  emailVerify,
  forgotPassword,
  getMe,
  getMeByID,
  login,
  loginGoogle,
  logout,
  refreshToken,
  register,
  resendVerifyEmail,
  resetPassword,
  updateMe,
  updateUserByID,
  verifyForgotPassword,
} from "../controllers/user.controller";
import { isAdmin } from "../middlewares/isAuth.middleware";

const router = express.Router();
/**
 * Description: Đăng Ký,
 * Path: /register
 * Method : POST
 * Body : {
            "fullname": "Le Quoc Huy",
            "email": "qhuy.dev1@gmail.com",
            "username": "huydev1",
            "password": "19102003Huy",
            "confirm_password": "19102003Huy"
          }
 */
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
router.post("/register", resgiterValidator, register);

/**
 * Description: Đăng Nhập,
 * Path: /login
 * Method : POST
 * Body : {
            "email": "qhuy.dev@gmail.com",
            "password": "19102003Huy"
          }
 */

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
router.post("/login", loginValidator, login);

/**
 * Description: Đăng Nhập Bằng Google,
 * Path: /google
 * Method : GET
 */
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
 * Description: Đăng Xuất,
 * Path: /logout
 * Method : POST
 * Header : Authorization : Bearer <AccessToken Login>
 * Body : {
            "refreshToken": "<RefreshToken>",
          }
 */

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

router.post("/logout", accessTokenValidator, refreshTokenValidator, logout);

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
router.post("/refresh-token", refreshTokenValidator, refreshToken);

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
router.get("/verify-email", emailVerifyTokenValidator, emailVerify);
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
router.post("/resend-verify-email", accessTokenValidator, resendVerifyEmail);

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
router.post("/forgot-password", forgotPasswordValidator, forgotPassword);

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
  verfifyForgotPasswordTokenValidator,
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
router.post("/reset-password", resetPasswordValidator, resetPassword);

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
router.get("/me", accessTokenValidator, getMeByID);

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
router.get("/meAll", accessTokenValidator, isAdmin, getMe);

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
  accessTokenValidator, // kiểm tra accessToken có hay k
  verifiedUserValidator, // kiểm tra verify của token có trùng với verify đã khai báo enum
  updateMeValidator, // kiểm tra dữ liệu validation
  filterMiddleware([
    // kiểm tra dữ liệu body k cho nhập vớ vẩn bằng lodash
    "fullname",
    "username",
    "email",
    "phone",
    "city",
    "district",
    "commune",
    "address",
  ]),
  updateMe
);

/**
 * Description: Update Theo ID Đó Ở Admin
 * Path: /updateUserByID/:id
 * Method : PUT
 * Header : Authorization : Bearer <AccessToken Register Hoặc Login>
 * Body : { Dữ liệu trong schema muốn update }
 */
/**
 * @swagger
 * /updateUserByID/{id}:
 *   put:
 *     summary: Update user by ID (Admin only)
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
 *       - in: path
 *         name: id
 *         type: string
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
 *               role:
 *                 type: string
 *               verify:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin access only)
 */
router.put(
  "/updateUserByID/:id",
  accessTokenValidator, // kiểm tra accessToken có hay k
  updateMeValidator, // kiểm tra dữ liệu validation
  filterMiddleware([
    // kiểm tra dữ liệu body k cho nhập vớ vẩn bằng lodash
    "fullname",
    "username",
    "email",
    "phone",
    "city",
    "district",
    "commune",
    "address",
    "role",
    "verify",
  ]),
  updateUserByID
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
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  changePassword
);

/**
 * Description: Delete Người Dùng
 * Path: /deleteUser/:id
 * Header : Authorization : Bearer <AccessToken Register Hoặc Login>
 * Method : DELETE
 */
/**
 * @swagger
 * /deleteUser/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         format: "Bearer <AccessToken>"
 *         required: true
 *       - in: path
 *         name: id
 *         type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete("/deleteUser/:id", accessTokenValidator, deleteUserByID);

export default router;