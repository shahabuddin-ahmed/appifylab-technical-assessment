import http from "http";
import { buildApp } from "./app";
import config from "./config/config";
import { closeRedisClient } from "./infra/redis";
import newSequelize from "./infra/sequelize";

const logger = console;

const gracefulShutdown = (server: http.Server, forcedTimeoutMs: number) => {
    return function () {
        logger.info("Received shutdown signal. Shutting down gracefully...");
        server.close(async () => {
            logger.info("Closed out remaining HTTP connections.");

            try {
                await closeRedisClient();
                await newSequelize().close();
                logger.info("Database and Redis connections closed.");
                process.exit(0);
            } catch (err) {
                logger.error("Shutdown failed", err);
                process.exit(1);
            }
        });

        setTimeout(() => {
            logger.error("Could not close connections in time, forcefully shutting down");
            process.exit(1);
        }, forcedTimeoutMs);
    };
};

const startServer = async (): Promise<void> => {
    const app = await buildApp();
    const server = http.createServer(app);
    const forcedTimeoutMs = config.APP_FORCE_SHUTDOWN_SECOND * 1000;

    process.on("SIGTERM", gracefulShutdown(server, forcedTimeoutMs));
    process.on("SIGINT", gracefulShutdown(server, forcedTimeoutMs));

    server.listen(config.APPLICATION_SERVER_PORT, () => {
        logger.log("API is running on port: " + config.APPLICATION_SERVER_PORT);
    });
};

startServer().catch((err) => {
    logger.error("Failed to start server", err);
    process.exit(1);
});
