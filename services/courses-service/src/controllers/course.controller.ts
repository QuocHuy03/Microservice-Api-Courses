import express, { NextFunction } from "express";
import coursesService from "../services/course.service";

export const getAllCourse = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  try {
    const result = await coursesService.getAll();
    if (result) {
      res.status(200).json(result);
    }
  } catch (error: any) {
    next(error);
  }
};

export const getCourseByID = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const result = await coursesService.getByID(id);
    if (result) {
      res.status(200).json(result);
    }
  } catch (error: any) {
    next(error);
  }
};

export const getCourseBySlug = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  const { slug } = req.params;
  try {
    const result = await coursesService.getBySlug(slug);
    if (result) {
      res.status(200).json(result);
    }
  } catch (error: any) {
    next(error);
  }
};

export const createCourse = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  try {
    const result = await coursesService.create(req.body);

    if (result) {
      return res.status(200).json(result);
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const updateCourse = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  try {
    const existingCourse = await coursesService.checkExist(
      `slug`,
      req.params.slug
    );
    if (!existingCourse) {
      return res
        .status(500)
        .json({ status: false, message: "Danh mục không tồn tại" });
    }

    const result = await coursesService.update(req.params.slug, req.body);
    if (result) {
      return res.status(200).json(result);
    }
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  try {
    const result = await coursesService.delete(req.params.id);
    if (result) {
      return res.status(200).json(result);
    }
  } catch (error) {
    next(error);
  }
};
