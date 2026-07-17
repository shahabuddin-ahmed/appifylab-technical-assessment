import { Request, Response } from "express";
import Joi from "joi";
import { StudentServiceInterface } from "../../../service/student";
import { AuthenticatedRequest } from "../../../types/request";
import { Controller } from "../controller";

export class StudentController extends Controller {
    constructor(private studentService: StudentServiceInterface) {
        super();
        this.create = this.create.bind(this);
        this.listEnrollments = this.listEnrollments.bind(this);
    }

    async create(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const schema = Joi.object({
            name: Joi.string().trim().min(2).max(150).required(),
            email: Joi.string().email().required(),
        });

        const { value } = await this.validateRequest(schema, req.body);
        const student = await this.studentService.create({
            ...value,
            schoolId: req.tenantId as number,
        });
        return this.sendResponse({ response: student }, 201, res);
    }

    async listEnrollments(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<Response> {
        const enrollments = await this.studentService.listEnrollments(
            req.tenantId as number,
            req.userId as number
        );

        return this.sendResponse({ response: enrollments }, 200, res);
    }
}

export const newStudentV1Controller = async (
    studentService: StudentServiceInterface
): Promise<StudentController> => {
    return new StudentController(studentService);
};
