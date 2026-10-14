import { z } from 'zod';
import { zodValidate } from '@shared/utils/zod.js';

const apiError = z.object({
  error: z.string().max(100).optional(),
  redirect: z.string().optional()
});
export type ApiError = z.infer<typeof apiError>;
export function validateApiError(data: unknown) {
  return zodValidate<ApiError>(apiError, data);
}

export function newApiError(msg?: string, redirect?: string): ApiError {
  return {
    // error: { code, msg },
    error: msg,
    redirect
  };
}