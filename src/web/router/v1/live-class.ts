import { Router } from "express";
import { LiveClassController } from "../../controller/v1/live-class";
import { asyncHandler } from "../../middleware/async-hander";

export const newLiveClassRouter = async (
    controller: LiveClassController
): Promise<Router> => {
    const router = Router();

    router.post("/", asyncHandler(controller.create));
    router.post("/:liveClassId/enrollments", asyncHandler(controller.enroll));
    router.delete(
        "/:liveClassId/enrollments/:studentId",
        asyncHandler(controller.cancelEnrollment)
    );
    router.get("/:liveClassId/roster", asyncHandler(controller.getRoster));

    return router;
};
