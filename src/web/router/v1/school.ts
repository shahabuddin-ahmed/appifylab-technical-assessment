import { Router } from "express";
import { SchoolController } from "../../controller/v1/school";
import { asyncHandler } from "../../middleware/async-hander";

export const newSchoolRouter = async (
    controller: SchoolController,
): Promise<Router> => {
    const router = Router();
    router.post("/", asyncHandler(controller.create));
    return router;
};
