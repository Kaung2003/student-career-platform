import type { z } from "zod";

/** An error with an HTTP status that the error handler turns into a JSON response. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Machine-readable reason the client can react to, e.g. "EMAIL_NOT_VERIFIED". */
    public readonly code?: string,
  ) {
    super(message);
  }
}

/** Validates a request body (or query) and throws a 400 with the first readable problem. */
export function parse<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input ?? {});
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path.join(".");
    throw new HttpError(400, field ? `${field}: ${issue?.message}` : (issue?.message ?? "Invalid request"));
  }
  return result.data;
}
