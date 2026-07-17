import { Request, Response } from "express";
import Joi from "joi";
import { LiveClassServiceInterface } from "../../../service/live-class";
import { AuthenticatedRequest } from "../../../types/request";
import { Controller } from "../controller";

export class LiveClassController extends Controller {
    constructor(private liveClassService: LiveClassServiceInterface) {
        super();
        this.create = this.create.bind(this);
        this.enroll = this.enroll.bind(this);
        this.cancelEnrollment = this.cancelEnrollment.bind(this);
        this.getRoster = this.getRoster.bind(this);
    }

    async create(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const schema = Joi.object({
            title: Joi.string().trim().min(3).max(191).required(),
            startTime: Joi.date().iso().required(),
            durationMinutes: Joi.number().integer().min(1).required(),
            maxSeats: Joi.number().integer().min(1).required(),
            price: Joi.number().min(0).default(0),
        });

        const { value } = await this.validateRequest(schema, req.body);
        const liveClass = await this.liveClassService.create({
            ...value,
            schoolId: req.tenantId as number,
        });
        return this.sendResponse({ response: liveClass }, 201, res);
    }

    async enroll(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const schema = Joi.object({
            liveClassId: Joi.number().integer().positive().required(),
        });

        const { value } = await this.validateRequest(schema, req.params);

        const result = await this.liveClassService.enroll(
            req.tenantId as number,
            value.liveClassId,
            req.userId as number
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

    async cancelEnrollment(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<Response> {
        const schema = Joi.object({
            liveClassId: Joi.number().integer().positive().required(),
        });

        const { value } = await this.validateRequest(schema, req.params);

        const result = await this.liveClassService.cancel(
            req.tenantId as number,
            value.liveClassId,
            req.userId as number
        );
        return this.sendResponse({ response: result }, 200, res);
    }

    async getRoster(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const schema = Joi.object({
            liveClassId: Joi.number().integer().positive().required(),
        });

        const { value } = await this.validateRequest(schema, req.params);

        const roster = await this.liveClassService.getRoster(
            req.tenantId as number,
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
