import { Elysia } from "elysia";
import { nanoid } from "nanoid";
import { redis } from "@/lib/redis";
import { authMiddleware } from "./auth";
import z from "zod";
import { realtime, Message } from "@/lib/realtime";

const ROOM_TTL_SECONDS = 60 * 10;

const rooms = new Elysia({ prefix: "/room" })
  .post(
    "/create",
    async ({ body }) => {
      const { maxSize, ttl } = body;
      const roomId = nanoid();

      const finalMaxSize = maxSize ? Number(maxSize) : 50;
      const finalTtl = ttl ? Number(ttl) : 600;

      await redis.hset(`meta:${roomId}`, {
        connected: [],
        createdAt: Date.now(),
        maxSize: finalMaxSize,
        ttl: finalTtl,
      });

      await redis.expire(`meta:${roomId}`, finalTtl);

      return { roomId };
    },
    {
      body: z.object({
        maxSize: z.number().min(2).max(100).optional(),
        ttl: z.number().min(60).max(86400).optional(),
      }),
    }
  )
  .use(authMiddleware)
  .get(
    "/ttl",
    async ({ auth }) => {
      const ttl = await redis.ttl(`meta:${auth.roomId}`);
      return { ttl: ttl > 0 ? ttl : 0 };
    },
    { query: z.object({ roomId: z.string() }) },
  ).delete("/", async ( {auth} ) => {

    await Promise.all([
      redis.del(auth.roomId),
      redis.del(`meta:${auth.roomId}`),
      redis.del(`messages:${auth.roomId}`),
    ])

    await realtime.channel(auth.roomId).emit("chat.destroy", { isDestroyed: true})
    
  }, {query: z.object({roomId: z.string()})} )

  .post(
    "/join",
    async ({ query }) => {
      const roomId = query.roomId as string;

      if (!roomId) {
        throw new Error("Missing roomId");
      }

      const roomExists = await redis.exists(`meta:${roomId}`);
      if (!roomExists) {
        throw new Error("Room does not exist");
      }

      const token = nanoid();
      const connected =
        (await redis.hget<string[]>(`meta:${roomId}`, "connected")) || [];

      await redis.hset(`meta:${roomId}`, { connected: [...connected, token] });

      return { token };
    },
    {
      query: z.object({ roomId: z.string() }),
    },
  );

const messages = new Elysia({ prefix: "/messages" })
  .use(authMiddleware)
  .post(
    "/",
    async ({ body, auth }) => {
      const { sender, text } = body;
      const roomId = auth.roomId;

      const roomExists = await redis.exists(`meta:${roomId}`);

      if (!roomExists) {
        throw new Error("Room doesn not exist");
      }

      const message: Message = {
        id: nanoid(),
        sender,
        text,
        timestamp: Date.now(),
        roomId,
      };

      // add message to history

      await redis.rpush(`messages:${roomId}`, {
        ...message,
        token: auth.token,
      });
      await realtime.channel(roomId).emit("chat.message", message);

      // housekeeping
      const remaining = await redis.ttl(`meta:${roomId}`);

      await redis.expire(`messages:${roomId}`, remaining);
      await redis.expire(`history:${roomId}`, remaining);
      await redis.expire(roomId, remaining);
    },
    {
      query: z.object({ roomId: z.string() }),
      body: z.object({
        sender: z.string().max(100),
        text: z.string().max(1000),
      }),
    },
  )
  .get(
    "/",
    async ({ auth }) => {
      const messages = await redis.lrange<Message>(
        `messages:${auth.roomId}`,
        0,
        -1,
      );

      return {
        messages: messages.map((m) => ({
          ...m,
          token: m.token === auth.token ? auth.token : undefined,
        })),
      };
    },
    { query: z.object({ roomId: z.string() }) },
  );

const app = new Elysia({ prefix: "/api" }).use(rooms).use(messages);

export const GET = app.fetch;
export const POST = app.fetch;
export const DELETE = app.fetch;

export type App = typeof app;
