import { Router } from "express";

export const newHealthRouter = async (): Promise<Router> => {
    const router = Router();

    router.get("/", (_req, res) => {
        return res.status(200).send({
            code: "SUCCESS",
            message: "Live class enrollment API is healthy",
            response: null,
            errors: [],
        });
    });

    return router;
};
