import { Request, Response, NextFunction, RequestHandler } from "express";
import { validationResult } from "express-validator";

import ProjectError from "./error";

const validateRequest: RequestHandler = (
  req: Request,
  __: Response,
  next: NextFunction
) => {
  // console.log(res)
  try {
    const validationError = validationResult(req);
    if (!validationError.isEmpty()) {
      const err = new ProjectError("Validation failed!");
      err.statusCode = 422;
      err.data = validationError.array();
      throw err;
    }
    next();
  } catch (error) {
    next(error);
  }
};

export { validateRequest };
