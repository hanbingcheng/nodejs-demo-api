import type { RequestHandler } from "express";
import { z, type ZodType } from "zod";
import { HttpError } from "../lib/http-error.js";

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        new HttpError(
          400,
          "VALIDATION_ERROR",
          "リクエストボディが不正です",
          z.flattenError(result.error),
        ),
      );
      return;
    }
    req.body = result.data;
    next();
  };
}
