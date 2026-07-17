import { Router } from "express";
import { ERROR_CODES } from "../../../constant/error";
import { LiveClassController } from "../../controller/v1/live-class";
import { SchoolController } from "../../controller/v1/school";
import { StudentController } from "../../controller/v1/student";
import { NotFoundException } from "../../exception/not-found-exception";
import { newHealthRouter } from "./health";
import { newLiveClassRouter } from "./live-class";
import { newSchoolRouter } from "./school";
import { newStudentRouter } from "./student";

export const newV1Router = async ({
    schoolController,
    studentController,
    liveClassController,
}: {
    schoolController: SchoolController;
    studentController: StudentController;
    liveClassController: LiveClassController;
}): Promise<Router> => {
    const v1 = Router();

    v1.use("/health", await newHealthRouter());
    v1.use("/schools", await newSchoolRouter(schoolController));
    v1.use("/students", await newStudentRouter(studentController));
    v1.use("/live-classes", await newLiveClassRouter(liveClassController));

    v1.use("*", (req) => {
        throw new NotFoundException(ERROR_CODES.E_PAGE_NOT_FOUND, "", [
            `Cannot ${req.method} ${req.baseUrl}`,
        ]);
    });

    return v1;
};
