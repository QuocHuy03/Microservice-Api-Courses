import express from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategory,
  getCategoryByID,
  getCategoryBySlug,
  updateCategory,
} from "../controllers/category.controller";
import {
  isAdmin,
  isAuthenticated,
  verifiedUserValidator,
} from "../../../../shared/middlewares/auth.middleware";
import { validateRequest } from "../utils/validateRequest";
import { body, param } from "express-validator";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Category
 *   description: Operations related to product categories
 */

/**
 * @swagger
 * /getAllCategories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve all product categories.
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: Successful response
 *       403:
 *         description: Forbidden
 */
router.get("/getAll", getAllCategory);

/**
 * @swagger
 * /getCategoryById/{id}:
 *   get:
 *     summary: Get category by ID
 *     description: Retrieve a product category by its ID.
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Successful response
 *       403:
 *         description: Forbidden
 */
router.get(
  "/getById/:id",
  [param("id").trim().notEmpty().withMessage("ID là bắt buộc")],
  getCategoryByID
);

/**
 * @swagger
 * /getCategoryBySlug/{slug}:
 *   get:
 *     summary: Get category by slug
 *     description: Retrieve a product category by its slug.
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Category slug
 *     responses:
 *       200:
 *         description: Successful response
 *       403:
 *         description: Forbidden
 */
router.get(
  "/getBySlug/:slug",
  [param("slug").trim().notEmpty().withMessage("Slug là bắt buộc")],
  getCategoryBySlug
);

/**
 * @swagger
 * /create:
 *   post:
 *     summary: Add a new category
 *     description: Add a new product category.
 *     tags: [Category]
 *     responses:
 *       201:
 *         description: Category added successfully
 */
router.post(
  "/create",
  isAuthenticated,
  verifiedUserValidator,
  isAdmin,
  [body("title").trim().notEmpty().withMessage("Title là bắt buộc")],
  validateRequest,
  createCategory
);

/**
 * @swagger
 * /updateCategory/{slug}:
 *   patch:
 *     summary: Update category by slug
 *     description: Update a product category by its slug.
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Category slug
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       403:
 *         description: Forbidden
 */
router.patch(
  "/update/:slug",
  isAuthenticated,
  verifiedUserValidator,
  isAdmin,
  [param("slug").trim().notEmpty().withMessage("Slug là bắt buộc")],
  updateCategory
);

/**
 * @swagger
 * /delete/{id}:
 *   delete:
 *     summary: Delete category by ID
 *     description: Delete a product category by its ID.
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       204:
 *         description: Category deleted successfully
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/delete/:id",
  [param("id").trim().notEmpty().withMessage("ID là bắt buộc")],
  isAuthenticated,
  verifiedUserValidator,
  isAdmin,
  deleteCategory
);

export default router;
