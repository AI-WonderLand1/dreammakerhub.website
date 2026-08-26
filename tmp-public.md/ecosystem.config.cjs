module.exports = {
  apps: [{
    name: 'dreammaker-web',
    cwd: '/home/user/dreammakerhub.website/apps/web',
    script: 'npx',
    args: 'next start -p ${PORT:-5000} -H 0.0.0.0',
    interpreter: 'none',
    env: {
      NODE_ENV: 'production',
    },
    max_memory_restart: '1G',
    instances: 1,
    autorestart: true,
    watch: false,
  }]
};
