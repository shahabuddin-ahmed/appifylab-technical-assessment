import { Request, Response } from "express";
import Joi from "joi";
import { SchoolServiceInterface } from "../../../service/school";
import { Controller } from "../controller";

export class SchoolController extends Controller {
    constructor(private schoolService: SchoolServiceInterface) {
        super();
        this.create = this.create.bind(this);
    }

    async create(req: Request, res: Response): Promise<Response> {
        const schema = Joi.object({
            name: Joi.string().trim().min(2).max(150).required(),
        });

        const { value } = await this.validateRequest(schema, req.body);
        const school = await this.schoolService.create(value);
        return this.sendResponse({ response: school }, 201, res);
    }
}

export const newSchoolV1Controller = async (
    schoolService: SchoolServiceInterface
): Promise<SchoolController> => {
    return new SchoolController(schoolService);
};
