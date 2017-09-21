
/**
 * Configure how Redis will be connected to
 * 
 * @export
 * @interface RedisConnectionOptions
 */
interface RedisConnectionOptions {
    db: number;
    host: string;
    port: number;
    password: string;
}
