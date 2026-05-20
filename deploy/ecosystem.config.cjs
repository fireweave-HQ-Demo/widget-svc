const path = require('path');

/** Run via bash + bun exec — avoids PM2 ProcessContainerForkBun require() issues. */
module.exports = {
  apps: [
    {
      name: 'widget-svc',
      cwd: path.join(__dirname, '..'),
      script: path.join(__dirname, 'start.sh'),
      interpreter: 'bash',
      env: {
        NODE_ENV: 'production',
        PORT: '3101',
        HOST: '0.0.0.0',
      },
    },
  ],
};
