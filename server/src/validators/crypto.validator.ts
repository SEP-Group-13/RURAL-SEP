import { z } from "zod";
import { zodValidate } from "@shared/utils/zod.js";
// import { _userId, _username } from "@/validators/user.validator.js";


const jwtToken = z.object({
  jwt: z.string()
})
export type JwtToken = z.infer<typeof jwtToken>;
export function validateJwtToken(data: unknown) {
  return zodValidate<JwtToken>(jwtToken, data);
}


const jwtPayload = z.object({
  // userId: _userId,
  exp: z.number().int()
  // expiresIn: z.number()
  // iat: z.number().int().optional(),
})
export type JwtPayload = z.infer<typeof jwtPayload>;
export function validateJwtPayload(data: unknown) {
  return zodValidate<JwtPayload>(jwtPayload, data);
}