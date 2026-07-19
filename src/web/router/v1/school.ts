import { Router } from "express";
import { SchoolController } from "../../controller/v1/school";
import { asyncHandler } from "../../middleware/async-hander";
import { requireTenantContext } from "../../middleware/auth-context";

export const newSchoolRouter = async (
    controller: SchoolController,
): Promise<Router> => {
    const router = Router();
    router.post("/", requireTenantContext, asyncHandler(controller.create));
    return router;
};
