import { Request, Response } from "express";
import Joi from "joi";
import { LiveClassServiceInterface } from "../../../service/live-class";
import { Controller } from "../controller";

export class LiveClassController extends Controller {
    constructor(private liveClassService: LiveClassServiceInterface) {
        super();
        this.create = this.create.bind(this);
        this.enroll = this.enroll.bind(this);
        this.cancelEnrollment = this.cancelEnrollment.bind(this);
        this.getRoster = this.getRoster.bind(this);
    }

    async create(req: Request, res: Response): Promise<Response> {
        const schema = Joi.object({
            schoolId: Joi.number().integer().positive().required(),
            title: Joi.string().trim().min(3).max(191).required(),
            startTime: Joi.date().iso().required(),
            durationMinutes: Joi.number().integer().min(1).required(),
            maxSeats: Joi.number().integer().min(1).required(),
            price: Joi.number().min(0).default(0),
        });

        const { value } = await this.validateRequest(schema, req.body);
        const liveClass = await this.liveClassService.create(value);
        return this.sendResponse({ response: liveClass }, 201, res);
    }

    async enroll(req: Request, res: Response): Promise<Response> {
        const schema = Joi.object({
            schoolId: Joi.number().integer().positive().required(),
            liveClassId: Joi.number().integer().positive().required(),
            studentId: Joi.number().integer().positive().required(),
        });

        const { value } = await this.validateRequest(schema, {
            schoolId: req.body.schoolId,
            liveClassId: req.params.liveClassId,
            studentId: req.body.studentId,
        });

        const result = await this.liveClassService.enroll(
            value.schoolId,
            value.liveClassId,
            value.studentId
        );

        return this.sendResponse(
            {
                response: result,
                message: result.wasExisting
                    ? "Enrollment already exists"
                    : "Enrollment processed",
            },
            result.wasExisting ? 200 : 201,
            res
        );
    }

    async cancelEnrollment(req: Request, res: Response): Promise<Response> {
        const schema = Joi.object({
            schoolId: Joi.number().integer().positive().required(),
            liveClassId: Joi.number().integer().positive().required(),
            studentId: Joi.number().integer().positive().required(),
        });

        const { value } = await this.validateRequest(schema, {
            schoolId: req.query.schoolId,
            liveClassId: req.params.liveClassId,
            studentId: req.params.studentId,
        });

        const result = await this.liveClassService.cancel(
            value.schoolId,
            value.liveClassId,
            value.studentId
        );
        return this.sendResponse({ response: result }, 200, res);
    }

    async getRoster(req: Request, res: Response): Promise<Response> {
        const schema = Joi.object({
            schoolId: Joi.number().integer().positive().required(),
            liveClassId: Joi.number().integer().positive().required(),
        });

        const { value } = await this.validateRequest(schema, {
            schoolId: req.query.schoolId,
            liveClassId: req.params.liveClassId,
        });

        const roster = await this.liveClassService.getRoster(
            value.schoolId,
            value.liveClassId
        );
        return this.sendResponse({ response: roster }, 200, res);
    }
}

export const newLiveClassV1Controller = async (
    liveClassService: LiveClassServiceInterface
): Promise<LiveClassController> => {
    return new LiveClassController(liveClassService);
};
