import { Router } from "express";
import { StudentController } from "../../controller/v1/student";
import { asyncHandler } from "../../middleware/async-hander";

export const newStudentRouter = async (
    controller: StudentController
): Promise<Router> => {
    const router = Router();
    router.post("/", asyncHandler(controller.create));
    router.get("/:studentId/enrollments", asyncHandler(controller.listEnrollments));
    return router;
};
