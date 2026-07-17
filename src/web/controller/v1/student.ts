import { Request, Response } from "express";
import Joi from "joi";
import { StudentServiceInterface } from "../../../service/student";
import { Controller } from "../controller";

export class StudentController extends Controller {
    constructor(private studentService: StudentServiceInterface) {
        super();
        this.create = this.create.bind(this);
        this.listEnrollments = this.listEnrollments.bind(this);
    }

    async create(req: Request, res: Response): Promise<Response> {
        const schema = Joi.object({
            schoolId: Joi.number().integer().positive().required(),
            name: Joi.string().trim().min(2).max(150).required(),
            email: Joi.string().email().required(),
        });

        const { value } = await this.validateRequest(schema, req.body);
        const student = await this.studentService.create(value);
        return this.sendResponse({ response: student }, 201, res);
    }

    async listEnrollments(req: Request, res: Response): Promise<Response> {
        const schema = Joi.object({
            schoolId: Joi.number().integer().positive().required(),
            studentId: Joi.number().integer().positive().required(),
        });

        const { value } = await this.validateRequest(schema, {
            schoolId: req.query.schoolId,
            studentId: req.params.studentId,
        });

        const enrollments = await this.studentService.listEnrollments(
            value.schoolId,
            value.studentId
        );

        return this.sendResponse({ response: enrollments }, 200, res);
    }
}

export const newStudentV1Controller = async (
    studentService: StudentServiceInterface
): Promise<StudentController> => {
    return new StudentController(studentService);
};
