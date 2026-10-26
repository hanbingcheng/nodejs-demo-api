import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";
import { resetDb } from "../helpers/reset-db.js";

const app = createApp();

// 各テストの前にデータを消す → テストの順番に依存しない
beforeEach(async () => {
  await resetDb();
});

describe("Users API（結合テスト）", () => {
  it("POST /api/users は 201 で作成し、DB に保存する", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ email: "Taro@Example.com", name: " 山田 太郎 " });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      email: "taro@example.com", // toLowerCase() が効いている
      name: "山田 太郎", // trim() が効いている
      role: "USER", // default が補われている
    });
    expect(res.headers.location).toBe(`/api/users/${res.body.data.id}`);

    // API のレスポンスだけでなく、DB に本当に入ったかを確認する
    const saved = await prisma.user.findUnique({
      where: { id: res.body.data.id },
    });
    expect(saved?.email).toBe("taro@example.com");
  });

  it("同じ email の再登録は 409 DUPLICATE_ENTRY", async () => {
    await prisma.user.create({
      data: { email: "dup@example.com", name: "1人目" },
    });

    const res = await request(app)
      .post("/api/users")
      .send({ email: "dup@example.com", name: "2人目" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DUPLICATE_ENTRY");
  });

  it("GET /api/users はページングと総件数を返す", async () => {
    await prisma.user.createMany({
      data: [
        { email: "a@example.com", name: "A" },
        { email: "b@example.com", name: "B" },
        { email: "c@example.com", name: "C" },
      ],
    });

    const res = await request(app).get("/api/users?page=1&limit=2");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
  });

  it("GET /api/users?q=... は email / name を部分一致で検索する", async () => {
    await prisma.user.createMany({
      data: [
        { email: "taro@example.com", name: "山田 太郎" },
        { email: "hanako@example.com", name: "山田 花子" },
      ],
    });

    const res = await request(app).get("/api/users?q=hanako");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].email).toBe("hanako@example.com");
  });

  it("PATCH /api/users/:id は更新し、GET で反映を確認できる", async () => {
    const created = await request(app).post("/api/users").send({
      email: "patch@example.com",
      name: "変更前",
    });

    const res = await request(app)
      .patch(`/api/users/${created.body.data.id}`)
      .send({ name: "変更後" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("変更後");

    const fetched = await request(app).get(
      `/api/users/${created.body.data.id}`,
    );
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.name).toBe("変更後");
  });

  it("DELETE /api/users/:id は 204 を返し、DB から消える", async () => {
    const created = await prisma.user.create({
      data: { email: "delete@example.com", name: "削除対象" },
    });

    const res = await request(app).delete(`/api/users/${created.id}`);
    expect(res.status).toBe(204);

    expect(
      await prisma.user.findUnique({ where: { id: created.id } }),
    ).toBeNull();

    // 2 回目はもう存在しないので 404
    const again = await request(app).delete(`/api/users/${created.id}`);
    expect(again.status).toBe(404);
  });

  it("存在しない ID は 404 USER_NOT_FOUND", async () => {
    const res = await request(app).get(
      "/api/users/00000000-0000-4000-8000-000000000000",
    );

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("USER_NOT_FOUND");
  });
});
