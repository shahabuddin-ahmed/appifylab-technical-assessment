import { Request } from "express";

export interface AuthenticatedRequest extends Request {
    tenantId?: number;
    userId?: number;
}
