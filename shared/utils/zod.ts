import { ZodType } from "zod";

export const zodValidate = <T>(zodObject: ZodType, data: unknown): T | false => {
  const res = zodObject.safeParse(data);
  if (!res.success) {
    // if (window) console.log(res.error);
    return false;
  }
  return res.data as T;
  // return zodObject.safeParse(data).success;
}

export const zodValidateWithError = <T>(zodObject: ZodType, data: unknown): { success: boolean; data?: T; error?: string } => {
  const res = zodObject.safeParse(data);

  if (!res.success) {
    // Map each issue to "field: message"
    const errorMessages = res.error.issues.map(issue => {
      const field = issue.path.length ? issue.path.join('.') : 'data';
      return `${field}: ${issue.message}`;
    });

    // Return all errors in a single string
    return { success: false, error: errorMessages.join('; ') };
  }

  return { success: true, data: res.data as T };
};