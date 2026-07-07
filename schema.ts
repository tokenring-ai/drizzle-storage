import type z from "zod";
import { bunStorageConfigSchema } from "./BunStorage.ts";

export const BunStorageConfigSchema = bunStorageConfigSchema;

export type BunStorageConfig = z.infer<typeof BunStorageConfigSchema>;
