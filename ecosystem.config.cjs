module.exports = {
  apps: [{
    name: 'wonderspace-web',
    cwd: '/home/b116197696/psychic-octo-fishstick/apps/web',
    script: 'npx',
    args: 'next start --webpack -p 5000',
    interpreter: 'none',
    env: {
      NODE_ENV: 'production',
<<<<<<< HEAD
      NEXT_PUBLIC_SUPABASE_URL: 'https://hhdduixckgllodixrejp.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3dXZmdmR5bG54aWVnbm93YnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NjIwMjEsImV4cCI6MjA4NDAzODAyMX0.QhF4PFCXGJcxaeQY4fODjzngLlNL7h8fZTlUY6b8tlE',
=======
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
    },
  }]
};
