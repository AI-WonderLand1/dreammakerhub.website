module.exports = {
  apps: [{
    name: 'wonderspace-web',
    cwd: '/home/b116197696/psychic-octo-fishstick/apps/web',
    script: 'npx',
    args: 'next start --webpack -p 5000',
    interpreter: 'none',
    env: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  }]
};
