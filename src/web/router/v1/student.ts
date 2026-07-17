import { Router } from "express";
import { StudentController } from "../../controller/v1/student";
import { asyncHandler } from "../../middleware/async-hander";
import {
    requireStudentContext,
    requireTenantContext,
} from "../../middleware/auth-context";

export const newStudentRouter = async (
    controller: StudentController
): Promise<Router> => {
    const router = Router();
    router.post("/", requireTenantContext, asyncHandler(controller.create));
    router.get(
        "/me/enrollments",
        requireStudentContext,
        asyncHandler(controller.listEnrollments)
    );
    return router;
};
