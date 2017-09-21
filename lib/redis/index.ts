import { emit } from "cluster";

import * as Bluebird from "bluebird";
import { EventEmitter } from "events";

const redis = require("redis");

Bluebird.promisifyAll(redis.RedisClient);
Bluebird.promisifyAll(redis.Multi);

/**
 * Handle interactions with Redis.
 * 
 * @export
 * @class RedisController
 */
export class RedisController extends EventEmitter {

    private client: any = null;

    constructor(private options: RedisConnectionOptions) {
        super();
    }

    public async connect(): Promise<any> {
        return new Promise<any>((resolve: any, reject: any) => {
            let connectionTimeout = setTimeout(() => {
                return reject("Connection to Redis timed out.");
            }, 2000);
            this.client = redis.createClient(this.options);

            this.client.on("error", (error: string) => emit("error", error));
            this.client.on("ready", () => {
                clearTimeout(connectionTimeout);
                resolve();
            });

            this.client.on("reconnection", () => emit("reconnection"));
        });
    }

    public async disconnect(): Promise<any> {
        return new Promise<any>((resolve: any, reject: any) => {
            let disconnectionTimeout = setTimeout(() => {
                return reject("Unable to disconnect from Redis?");
            }, 2000);

            this.client.on("end", () => {
                clearTimeout(disconnectionTimeout);
                resolve();
            });
            this.client.quit();
        });
    }

    public async set(key: string, value: string, expire?: number): Promise<string> {
        if (expire) {
            return this.client.setexAsync(key, expire, value);
        }
        return this.client.setAsync(key, value);
    }

    public async get(key: string): Promise<any> {
        return this.client.getAsync(key);
    }

    public async delete(key: string): Promise<any> {
        return this.client.delAsync(key);
    }

    public async increment(key: string): Promise<any> {
        return this.client.incrAsync(key);
    }
}
