import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { z } from "zod";

interface ValidateSchemas {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

/**
 * Parses body/params/query with zod. On success req.body and req.params are
 * replaced by the parsed data (unknown keys stripped). `req.query` is
 * writable in Express 4 but a read-only getter in Express 5, so every parsed
 * result is also kept in `res.locals.validated` (read it with `validatedBody`
 * / `validatedQuery`; the schema is never run a second time). On failure responds 400 with
 * `{ error: <first problem> }`, the same shape the app and the existing tests
 * expect (no extra `details` field: existing tests deepEqual the whole body).
 */
export function validate(schemas: ValidateSchemas): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const details: { field: string; message: string }[] = [];

    const run = (schema: z.ZodType | undefined, input: unknown): unknown => {
      if (!schema) return undefined;
      const result = schema.safeParse(input);
      if (result.success) return result.data;
      for (const issue of result.error.issues) {
        details.push({ field: issue.path.join("."), message: issue.message });
      }
      return undefined;
    };

    // Order: params, query, body -> the first reported problem is deterministic.
    const params = run(schemas.params, req.params);
    const query = run(schemas.query, req.query);
    const body = run(schemas.body, req.body);

    if (details.length > 0) {
      res.status(400).json({ error: details[0].message });
      return;
    }

    // Store each parsed result exactly once; the helpers below only read it.
    // Merge with a previous validate() on the same route: earlier keys survive.
    const validated: ValidatedStore = { ...(res.locals.validated as ValidatedStore | undefined) };
    if (schemas.params) {
      req.params = params as Request["params"];
      validated.params = { schema: schemas.params, value: params };
    }
    if (schemas.body) {
      req.body = body;
      validated.body = { schema: schemas.body, value: body };
    }
    if (schemas.query) validated.query = { schema: schemas.query, value: query };
    res.locals.validated = validated;
    next();
  };
}

/** Parsed results stored by `validate`; a key exists only if its schema was given. */
interface ValidatedEntry {
  schema: z.ZodType;
  value: unknown;
}
interface ValidatedStore {
  body?: ValidatedEntry;
  params?: ValidatedEntry;
  query?: ValidatedEntry;
}

/**
 * Single typed conversion point. `validate` stored the output together with
 * the schema that produced it; the caller must pass that same schema, so the
 * value really is `z.output<S>`. The schema is NOT executed again. Throws
 * (-> 500 via asyncHandler) if the route did not run `validate` for `key` or
 * if the schema differs from the one used by the route.
 */
function readValidated<S extends z.ZodType>(
  res: Response | undefined,
  key: keyof ValidatedStore,
  schema: S
): z.output<S> {
  const store = res?.locals.validated as ValidatedStore | undefined;
  const stored = store?.[key];
  if (!stored) {
    throw new Error(`validate({ ${key} }) middleware missing on this route`);
  }
  if (stored.schema !== schema) {
    throw new Error(`validated ${key} schema differs from the one used by validate() on this route`);
  }
  return stored.value as z.output<S>;
}

/** The body parsed by `validate({ body: schema })`. */
export function validatedBody<S extends z.ZodType>(req: Request, schema: S): z.output<S> {
  return readValidated(req.res, "body", schema);
}

/** The query parsed by `validate({ query: schema })`. */
export function validatedQuery<S extends z.ZodType>(res: Response, schema: S): z.output<S> {
  return readValidated(res, "query", schema);
}
