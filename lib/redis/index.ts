
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
            }, 2000);
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
        this.pub.publish(channel, data);
    }
}
