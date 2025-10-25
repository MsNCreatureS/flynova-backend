module.exports = {
  apps: [{
    name: 'flynova-api',
    script: './server/index.js',
    instances: 'max', // Utilise tous les CPU disponibles
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    // Logs
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Auto-restart
    watch: false, // Set to true in development if you want auto-reload
    max_memory_restart: '1G',
    // Restart strategy
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    // Cluster settings
    instance_var: 'INSTANCE_ID'
  }]
};
