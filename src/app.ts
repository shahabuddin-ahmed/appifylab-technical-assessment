import bodyParser from "body-parser";
import express, { Express } from "express";
import morgan from "morgan";
import { initializeDBConnection } from "./infra/db";
import { newRedisClient } from "./infra/redis";
import { registerModels } from "./model";
import { newEnrollmentRepo } from "./repo/enrollment";
import { newLiveClassRepo } from "./repo/live-class";
import { newSchoolRepo } from "./repo/school";
import { newStudentRepo } from "./repo/student";
import { newLiveClassService } from "./service/live-class";
import { newSchoolService } from "./service/school";
import { newStudentService } from "./service/student";
import { newLiveClassV1Controller } from "./web/controller/v1/live-class";
import { newSchoolV1Controller } from "./web/controller/v1/school";
import { newStudentV1Controller } from "./web/controller/v1/student";
import { globalErrorHandler } from "./web/middleware/global-error-handler";
import { newV1Router } from "./web/router/v1";

export const buildApp = async (): Promise<Express> => {
    registerModels();
    await initializeDBConnection();
    const redisClient = await newRedisClient();

    const schoolRepo = await newSchoolRepo();
    const studentRepo = await newStudentRepo();
    const liveClassRepo = await newLiveClassRepo();
    const enrollmentRepo = await newEnrollmentRepo();

    const schoolService = await newSchoolService(schoolRepo);
    const studentService = await newStudentService(studentRepo, schoolRepo);
    const liveClassService = await newLiveClassService(
        liveClassRepo,
        enrollmentRepo,
        schoolRepo,
        studentRepo,
        redisClient
    );

    const schoolController = await newSchoolV1Controller(schoolService);
    const studentController = await newStudentV1Controller(studentService);
    const liveClassController = await newLiveClassV1Controller(liveClassService);

    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(morgan("short"));
    app.use(
        "/api/v1",
        await newV1Router({
            schoolController,
            studentController,
            liveClassController,
        })
    );
    app.use(globalErrorHandler);

    return app;
};
