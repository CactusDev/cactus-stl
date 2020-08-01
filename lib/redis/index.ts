
import * as Bluebird from "bluebird";
import { EventEmitter } from "events";

const redis = require("redis");

Bluebird.promisifyAll(redis.RedisClient);
Bluebird.promisifyAll(redis.Multi);

interface Subscriptions {
    [event: string]: Function;
}

/**
 * Configure how Redis will be connected to
 * 
 * @export
 * @interface RedisConnectionOptions
 */
export interface RedisConnectionOptions {
    db: number;
    host: string;
    port: number;
    password: string;
}

/**
 * Handle interactions with Redis.
 * 
 * @export
 * @class RedisController
 */
export class RedisController extends EventEmitter {

    private client: any = null;
    
    private pub: any = null;
    private sub: any = null;
    
    private subscriptions: Subscriptions = {};

    constructor(private options: RedisConnectionOptions) {
        super();
    }

    public async connect(): Promise<any> {
        return new Promise<any>((resolve: any, reject: any) => {
            let connectionTimeout = setTimeout(() => {
                return reject("Connection to Redis timed out.");
            }, 6000);

            if (this.options.password === "") {
                this.options.password = undefined;
            }

            this.client = redis.createClient(this.options);

            this.client.on("error", (error: string) => this.emit("error", error));
            this.client.on("ready", () => {
                this.pub = redis.createClient(this.options);
                this.sub = redis.createClient(this.options);

                this.pub.on("ready", () => this.sub.on("ready", () => {
                    this.listenForEvents();
                    clearTimeout(connectionTimeout);
                    resolve();
                }));
                this.pub.send_command("config", ["set", "notify-keyspace-events", "Ex"], async (e: any, r: any) => await this.onExpirationEvent(e, r))
            });

            this.client.on("reconnection", () => this.emit("reconnection"));
        });
    }

    public async disconnect(): Promise<any> {
        return new Promise<any>((resolve: any, reject: any) => {
            let disconnectionTimeout = setTimeout(() => {
                return reject("Unable to disconnect from Redis?");
            }, 2000);

            this.client.on("end", () => {
                clearTimeout(disconnectionTimeout);
                
                this.sub.unsubscribe();
                this.sub.quit();
                this.pub.quit();
                
                resolve();
            });
            this.client.quit();
        });
    }
    
    private async listenForEvents() {
        this.sub.on("message", (channel: string, message: string) => {
            if (!this.subscriptions[channel]) {
                return;
            }
            
            this.subscriptions[channel](message);
        });
    }

    public async set(key: string, value: string, expire?: number): Promise<string> {
        if (expire) {
            return this.client.setex(key, expire, value);
        }
        return this.client.set(key, value);
    }

    public async get(key: string): Promise<any> {
        return new Promise<any>((resolve: any, reject: any) => {
            this.client.get(key, (err: any, reply: any) => {
                if (err) {
                    return reject(err);
                }
                return resolve(reply);
            });            
        });
    }

    public async delete(key: string): Promise<any> {
        return this.client.del(key);
    }

    public async increment(key: string): Promise<any> {
        return this.client.incr(key);
    }
    
    public async subscribe(channel: string, callback: Function) {
        this.sub.subscribe(channel);
        this.subscriptions[channel] = callback;
    }
    
    public async unsubscribe(channel: string) {
        this.sub.unsubscribe(channel);
        delete this.subscriptions[channel];
    }
    
    public async publish(channel: string, data: string) {
        this.pub.publish(channel, data)
    }

    public async scan(pattern: string, chunkSize?: number, cursor?: string): Promise<string[]> {
        chunkSize = chunkSize ? chunkSize : 500
        cursor = cursor ? cursor : "0"

        return new Promise<string[]>((resolve, reject) => {
            let allKeys: string[] = [];

            this.client.scan(cursor, "MATCH", pattern, "COUNT", chunkSize, async (err: any, reply: any) => {
                if (err) {
                    return reject(err)
                }
                cursor = reply[0];

                const keys = reply[1]
                keys.forEach((key: string) => allKeys.push(key))

                if (cursor !== "0") {
                    const result = await this.scan(pattern, chunkSize, cursor)
                    result.forEach(key => allKeys.push(key))
                }
    
                return resolve(allKeys)
            })
        })
    }

    private async onExpirationEvent(e: any, r: any) {
        const expiredKey = "__keyevent@" + this.options.db + "__:expired"
        this.sub.subscribe(expiredKey, () => {
            this.sub.on("message", (chan: any, msg: any) => {
                this.emit("expiration", { chan, msg })
            })
        })
    }
}
