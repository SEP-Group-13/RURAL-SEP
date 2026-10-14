import type { Request, Response, NextFunction, RequestHandler } from 'express-serve-static-core';


export function asyncHandler(controller: RequestHandler): RequestHandler {
  return function (req: Request, res: Response, next: NextFunction) {
    Promise
      .resolve(controller(req, res, next))
      .catch(next);
  };
}
