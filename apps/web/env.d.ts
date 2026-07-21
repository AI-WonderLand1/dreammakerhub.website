import { logger } from '@/lib/logger';
// apps/web/env.d.ts
// NOTE: Do NOT prefix sensitive API keys with NEXT_PUBLIC_ - that exposes them to the client bundle.

declare namespace NodeJS {
  interface ProcessEnv {
    // Public variables (safe for client)
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    NEXT_PUBLIC_URL?: string;
    NEXT_PUBLIC_ENABLE_GRAPES_BUILDER?: string;
    NEXT_PUBLIC_ENABLE_MEM0_MEMORY?: string;
    NEXT_PUBLIC_SMOKE_MODE?: string;
    NEXT_PUBLIC_PLAYCANVAS_MODE?: string;
    NEXT_PUBLIC_CODER_URL?: string;
    NEXT_PUBLIC_WORKSPACE_DOMAIN?: string;
    NEXT_PUBLIC_ENABLE_CONVAI_NPC?: string;
    NEXT_PUBLIC_CONVAI_CHARACTER_ID?: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
    
    NODE_ENV?: string;

    // Server-only secrets (NEVER prefix with NEXT_PUBLIC_)
    // Supabase
    SUPABASE_SERVICE_ROLE_KEY?: string;
    
    // AI Providers - Server-side only
    OPENROUTER_API_KEY?: string;
    OPENAI_API_KEY?: string;
    GEMINI_API_KEY?: string;
    CEREBRAS_API_KEY?: string;
    N8N_API_KEY?: string;
    N8N_WEBHOOK_URL?: string;
    ANTHROPIC_API_KEY?: string;
    GROQ_API_KEY?: string;
    
    // Convai - server-side proxy only (client should not have direct API access)
    CONVAI_API_KEY?: string;
    
    // Other services
    HUGGINGFACE_TOKEN?: string;
    GITHUB_WEBHOOK_SECRET?: string;
    BLOB_READ_WRITE_TOKEN?: string;
    
    // Encryption
    SECRETS_ENCRYPTION_KEY?: string;
    BYOC_CREDENTIALS_ENCRYPTION_KEY?: string;
    TOKEN_HASH_SECRET?: string;
    
    // Database
    MEM0_POSTGRES_URL?: string;
    
    // Workspace provisioning
    WORKSPACE_DOMAIN?: string;
    WORKSPACE_DOCKER_IMAGE?: string;
    WORKSPACE_DOCKER_NETWORK?: string;
    DOCKER_SOCKET?: string;
    DOCKER_HOST?: string;
    DOCKER_PORT?: string;

    // Coder workspace management service
    CODER_API_URL?: string;
    CODER_SESSION_TOKEN?: string;
    CODER_WORKSPACE_URL?: string;
    CODER_WORKSPACE_PORT?: string;
    
    // OPTIONAL (disabled infra)
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
    // Stripe
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
  }
}
