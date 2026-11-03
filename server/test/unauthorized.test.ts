import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { api, startServer, stopServer, JWT_SECRET } from "./helpers.js";

before(async () => {
  await startServer();
});
after(async () => {
  await stopServer();
});

const ID = "00000000-0000-0000-0000-000000000000";
const routes: [string, string][] = [
  ["GET", "/api/workouts/library/exercises"],
  ["POST", "/api/workouts/library/exercises"],
  ["DELETE", `/api/workouts/library/exercises/${ID}`],
  ["GET", "/api/workouts"],
  ["POST", "/api/workouts"],
  ["PUT", `/api/workouts/${ID}`],
  ["DELETE", `/api/workouts/${ID}`],
  ["POST", `/api/workouts/${ID}/exercises`],
  ["PUT", `/api/workouts/${ID}/exercises/${ID}`],
  ["DELETE", `/api/workouts/${ID}/exercises/${ID}`],
  ["POST", `/api/workouts/${ID}/exercises/${ID}/sets`],
  ["PUT", `/api/workouts/${ID}/exercises/${ID}/sets/${ID}`],
  ["DELETE", `/api/workouts/${ID}/exercises/${ID}/sets/${ID}`],
  ["GET", "/api/meals/library/foods"],
  ["POST", "/api/meals/library/foods"],
  ["DELETE", `/api/meals/library/foods/${ID}`],
  ["GET", "/api/meals"],
  ["POST", "/api/meals"],
  ["PUT", `/api/meals/${ID}`],
  ["DELETE", `/api/meals/${ID}`],
  ["POST", `/api/meals/${ID}/items`],
  ["PUT", `/api/meals/${ID}/items/${ID}`],
  ["DELETE", `/api/meals/${ID}/items/${ID}`],
  ["GET", "/api/water"],
  ["POST", "/api/water"],
];

const MISSING = { error: "Missing or invalid authorization header" };
const INVALID = { error: "Invalid or expired token" };

const variants: { name: string; headers: Record<string, string>; expected: object }[] = [
  { name: "no header", headers: {}, expected: MISSING },
  {
    name: "header without Bearer",
    headers: { Authorization: jwt.sign({ userId: ID }, JWT_SECRET) },
    expected: MISSING,
  },
  { name: "Basic scheme", headers: { Authorization: "Basic abc" }, expected: MISSING },
  { name: "garbage token", headers: { Authorization: "Bearer not.a.jwt" }, expected: INVALID },
  {
    name: "token signed with another secret",
    headers: {
      Authorization:
        "Bearer " + jwt.sign({ userId: ID }, "another-secret-another-secret-another-1234"),
    },
    expected: INVALID,
  },
  {
    name: "expired token",
    headers: {
      Authorization: "Bearer " + jwt.sign({ userId: ID }, JWT_SECRET, { expiresIn: -10 }),
    },
    expected: INVALID,
  },
];

for (const v of variants) {
  test(`401 on every protected route: ${v.name}`, async () => {
    for (const [method, path] of routes) {
      const res = await api(method, path, {
        headers: v.headers,
        body: method === "POST" || method === "PUT" ? {} : undefined,
      });
      assert.equal(res.status, 401, `${method} ${path}`);
      assert.deepEqual(res.body, v.expected, `${method} ${path}`);
    }
  });
}
