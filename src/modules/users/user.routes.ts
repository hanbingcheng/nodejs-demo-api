import { Router } from "express";
import { HttpError } from "../../lib/http-error.js";
import { validateBody } from "../../middleware/validate.js";
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from "./user.schema.js";
import { userService } from "./user.service.js";

export const usersRouter = Router();

usersRouter.get("/", async (req, res) => {
  const query = listUsersQuerySchema.parse(req.query);
  const result = await userService.list(query);

  res.json({
    data: result.items,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

usersRouter.get("/:id", async (req, res) => {
  const { id } = userIdParamSchema.parse(req.params);
  const user = await userService.findById(id);

  if (!user)
    throw new HttpError(404, "USER_NOT_FOUND", "ユーザーが見つかりません");
  res.json({ data: user });
});

usersRouter.post("/", validateBody(createUserSchema), async (req, res) => {
  const user = await userService.create(req.body);
  res.status(201).location(`/api/users/${user.id}`).json({ data: user });
});

usersRouter.patch("/:id", validateBody(updateUserSchema), async (req, res) => {
  const { id } = userIdParamSchema.parse(req.params);
  const user = await userService.update(id, req.body);

  if (!user)
    throw new HttpError(404, "USER_NOT_FOUND", "ユーザーが見つかりません");
  res.json({ data: user });
});

usersRouter.delete("/:id", async (req, res) => {
  const { id } = userIdParamSchema.parse(req.params);
  const deleted = await userService.remove(id);

  if (!deleted)
    throw new HttpError(404, "USER_NOT_FOUND", "ユーザーが見つかりません");
  res.status(204).send();
});
