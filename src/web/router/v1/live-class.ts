import { Router } from "express";
import { LiveClassController } from "../../controller/v1/live-class";
import { asyncHandler } from "../../middleware/async-hander";
import {
    requireStudentContext,
    requireTenantContext,
} from "../../middleware/auth-context";

export const newLiveClassRouter = async (
    controller: LiveClassController
): Promise<Router> => {
    const router = Router();

    router.post("/", requireTenantContext, asyncHandler(controller.create));
    router.post(
        "/:liveClassId/enroll",
        requireStudentContext,
        asyncHandler(controller.enroll)
    );
    router.delete(
        "/:liveClassId/enroll",
        requireStudentContext,
        asyncHandler(controller.cancelEnrollment)
    );
    router.get(
        "/:liveClassId/roster",
        requireTenantContext,
        asyncHandler(controller.getRoster)
    );

    return router;
};
