import express, { NextFunction } from "express";
import categoriesService from "../services/category.service";

export const getAllCategory = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  try {
    const result = await categoriesService.getAll();
    if (result) {
      res.status(200).json(result);
    }
  } catch (error: any) {
    next(error);
  }
};

export const getCategoryByID = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const result = await categoriesService.getByID(id);
    if (result) {
      res.status(200).json(result);
    }
  } catch (error: any) {
    next(error);
  }
};

export const getCategoryBySlug = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  const { slug } = req.params;
  try {
    const result = await categoriesService.getBySlug(slug);
    if (result) {
      res.status(200).json(result);
    }
  } catch (error: any) {
    next(error);
  }
};

export const createCategory = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  try {
    const result = await categoriesService.create(req.body);
    if (result) {
      return res.status(200).json(result);
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const updateCategory = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  try {
    const existingCategory = await categoriesService.checkExist(
      `slug`,
      req.params.slug
    );
    if (!existingCategory) {
      return res
        .status(500)
        .json({ status: false, message: "Danh mục không tồn tại" });
    }

    const result = await categoriesService.update(req.params.slug, req.body);
    if (result) {
      return res.status(200).json(result);
    }
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  try {
    const result = await categoriesService.delete(req.params.id);
    if (result) {
      return res.status(200).json(result);
    }
  } catch (error) {
    next(error);
  }
};
