import { Request, Response, NextFunction, RequestHandler } from "express";
import { validationResult } from "express-validator";

const validateRequest: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationError = validationResult(req);
    if (!validationError.isEmpty()) {
      // Return validation errors in the response data
      return res.status(422).json({
        status: false,
        message: "Validation failed",
        result: validationError.array(),
      });
    }
    next();
  } catch (error) {
    next(error);
  }
  return; // Add this line to satisfy TypeScript
};

export { validateRequest };
