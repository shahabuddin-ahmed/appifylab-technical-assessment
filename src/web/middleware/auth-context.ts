import { NextFunction, Request, Response } from "express";
import { ERROR_CODES } from "../../constant/error";
import { AuthenticatedRequest } from "../../types/request";
import { BadRequestException } from "../exception/bad-request-exception";

const parsePositiveInteger = (
    rawValue: string | undefined,
    headerName: string,
    required: boolean
): number | undefined => {
    if (!rawValue) {
        if (required) {
            throw new BadRequestException(
                ERROR_CODES.E_INVALID_DATA,
                `Missing required header: ${headerName}`
            );
        }
        return undefined;
    }

    const parsed = Number(rawValue);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new BadRequestException(
            ERROR_CODES.E_INVALID_DATA,
            `Invalid header value for ${headerName}`
        );
    }

    return parsed;
};

const resolveRequestAuth = (
    req: Request,
    options?: { requireUserId?: boolean }
): { tenantId: number; userId?: number } => {
    const tenantId = parsePositiveInteger(
        req.header("x-tenant-id"),
        "x-tenant-id",
        true
    ) as number;
    const userId = parsePositiveInteger(
        req.header("x-user-id"),
        "x-user-id",
        options?.requireUserId ?? false
    );

    return {
        tenantId,
        userId,
    };
};

const authMiddleware =
    (options?: { requireUserId?: boolean }) =>
    (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
        try {
            const auth = resolveRequestAuth(req, options);
            req.tenantId = auth.tenantId;
            req.userId = auth.userId;
            next();
        } catch (error) {
            next(error);
        }
    };

export const requireTenantContext = authMiddleware();
export const requireStudentContext = authMiddleware({ requireUserId: true });
