// RedisClient.ts

import { createClient, RedisClientType } from "redis";
import config from "../config/config";

class RedisClient {
    private static instance: RedisClientType | null = null;

    public static async getInstance(): Promise<RedisClientType> {
        if (RedisClient.instance) {
            return RedisClient.instance;
        }

        const client: RedisClientType = createClient({ url: `redis://${config.REDIS_HOST}` });

        client.on("error", (err) => console.error("Redis Client Error", err));

        try {
            await client.connect();
            console.log("Redis client connected");
        } catch (error) {
            console.error("Failed to connect to Redis:", error);
            throw error;
        }

        RedisClient.instance = client;
        return client;
    }

    public static async close(): Promise<void> {
        if (!RedisClient.instance) {
            return;
        }

        await RedisClient.instance.quit();
        RedisClient.instance = null;
    }
}

export const newRedisClient = async (): Promise<RedisClientType> => {
    return RedisClient.getInstance();
};

export const closeRedisClient = async (): Promise<void> => {
    await RedisClient.close();
};
