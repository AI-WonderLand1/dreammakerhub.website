import { z } from "zod";

export const wonderBuildBlockSchema = z.object({
  type: z.enum(["Heading", "Text", "Button", "Image", "Section"]),
  props: z.record(z.string(), z.unknown()),
});

export const wonderBuildActivationDataSchema = z.object({
  content: z.array(wonderBuildBlockSchema),
});

export type WonderBuildActivationData = z.infer<typeof wonderBuildActivationDataSchema>;

export function parseActivationData(value: unknown): WonderBuildActivationData {
  return wonderBuildActivationDataSchema.parse(value);
}

export function safeParseActivationData(value: unknown) {
  return wonderBuildActivationDataSchema.safeParse(value);
}
