import { Redis } from "@upstash/redis";

const ORDER_PREFIX = "orders:";
const TOKENS_SET = "orders:tokens";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

function getOrderKey(token) {
  return `${ORDER_PREFIX}${token}`;
}

export function hasDatabaseConfig() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export async function listOrders() {
  const tokens = (await redis.smembers(TOKENS_SET)) || [];
  if (!Array.isArray(tokens) || tokens.length === 0) return [];

  const orders = await Promise.all(
    tokens.map(async (token) => redis.get(getOrderKey(String(token))))
  );

  return orders
    .filter(Boolean)
    .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
}

export async function upsertOrder(order) {
  await redis.set(getOrderKey(order.token), order);
  await redis.sadd(TOKENS_SET, order.token);
}

export async function setOrderStatus(token, status) {
  const existing = await redis.get(getOrderKey(token));
  if (!existing) return false;

  const updated = { ...existing, status };
  await redis.set(getOrderKey(token), updated);
  return true;
}

export async function deleteOrderByToken(token) {
  await redis.del(getOrderKey(token));
  await redis.srem(TOKENS_SET, token);
}

export async function clearOrders() {
  const tokens = (await redis.smembers(TOKENS_SET)) || [];
  if (Array.isArray(tokens) && tokens.length > 0) {
    await Promise.all(tokens.map((token) => redis.del(getOrderKey(String(token)))));
  }
  await redis.del(TOKENS_SET);
}

