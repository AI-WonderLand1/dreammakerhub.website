import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /*
   * Server-side variables (Hidden from the browser)
   */
  server: {
    NEXTAUTH_SECRET: z.string().min(32),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    // Add your Supabase Service Role Key here later if needed
  },

  /*
   * Client-side variables (Visible in the browser)
   * Must be prefixed with NEXT_PUBLIC_
   */
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_URL: z.string().url().optional(),
    NEXT_PUBLIC_WORKSPACE_DOMAIN: z.string().min(1),
  },

  /*
   * This tells Next.js how to map the variables.
   * You must manually destructure process.env here for Next.js to inline them.
   */
  runtimeEnv: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_WORKSPACE_DOMAIN: process.env.NEXT_PUBLIC_WORKSPACE_DOMAIN,
    // Add these so you can use them in your Webhooks/Agents:
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  
  // If a variable is missing, this will throw a clear error in your VPS logs
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});