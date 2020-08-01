# cactus-stl
Standard library for CactusDev TypeScript projects

## Usage

#### Using RedisController

```typescript
import { RedisController } from "cactus-stl";

async function setup() {
    // Create the redis handler
    const handler = new RedisController({
        db: 0,
        host: "localhost",
        port: 6379,
        password: "awesome_password"
    });

    // Connect to redis
    await handler.connect();
    console.log("Connected to Redis!");

    // Set and get
    await handler.set("foo", "bar");
    console.log("Value of foo: " + await handler.get("foo"));

    // Can also set expiration
    await handler.set("potato", "salad", 100);

    // Pub / Sub is built right into the handler!
    // You can also use .unsubscribe, which only takes the channel.
    await handler.subscribe("cool_channel", (message: string) => {
        console.log("Got a really cool message!", message);
    });

    await handler.publish("cool_channel", "Hello world!");

    // Delete
    await handler.delete("foo");

    // Increment a variable
    await handler.increment("potato");

    // Make sure to disconnect!
    await handler.disconnect();
}

setup();
```
