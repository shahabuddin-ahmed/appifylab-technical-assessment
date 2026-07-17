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
}

export const newRedisClient = async (): Promise<RedisClientType> => {
    return RedisClient.getInstance();
};
