module.exports = {
  apps: [
    {
      name: "api",
      script: "./dist/server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "prod",
      },
    },
  ],
};
