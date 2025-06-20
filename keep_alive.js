const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Global variables untuk tracking bot status
let botStatus = {
  isRunning: false,
  startTime: new Date(),
  lastActivity: new Date(),
  qrScanned: false,
  connectedNumber: null,
  messageCount: 0,
  errors: []
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS untuk debugging dari browser
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Static file untuk simple dashboard
app.use(express.static('public'));

// Route utama dengan dashboard HTML
app.get('/', (req, res) => {
  const htmlDashboard = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>WhatsApp Bot Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .status { padding: 15px; border-radius: 5px; margin: 10px 0; }
            .status.running { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .status.stopped { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .metric { display: inline-block; margin: 10px 20px 10px 0; }
            .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
            .refresh-btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px 0; }
            .refresh-btn:hover { background: #0056b3; }
            .log { background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px; max-height: 300px; overflow-y: auto; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 WhatsApp Request Bot Dashboard</h1>
            <div class="status ${botStatus.isRunning ? 'running' : 'stopped'}">
                Status: ${botStatus.isRunning ? '🟢 Running' : '🔴 Stopped'}
            </div>
            
            <div class="metrics">
                <div class="metric">
                    <div>Uptime</div>
                    <div class="metric-value">${Math.floor(process.uptime() / 60)}m</div>
                </div>
                <div class="metric">
                    <div>Messages</div>
                    <div class="metric-value">${botStatus.messageCount}</div>
                </div>
                <div class="metric">
                    <div>Memory</div>
                    <div class="metric-value">${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB</div>
                </div>
            </div>

            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
            
            <h3>Connection Info</h3>
            <div class="log">
                QR Scanned: ${botStatus.qrScanned ? '✅ Yes' : '❌ No'}<br>
                Connected Number: ${botStatus.connectedNumber || 'Not connected'}<br>
                Last Activity: ${botStatus.lastActivity.toLocaleString()}<br>
                Start Time: ${botStatus.startTime.toLocaleString()}
            </div>

            <h3>Quick Actions</h3>
            <a href="/health" target="_blank">Health Check</a> | 
            <a href="/status" target="_blank">Status API</a> | 
            <a href="/ping" target="_blank">Ping Test</a>
        </div>
    </body>
    </html>
  `;
  
  res.send(htmlDashboard);
});

// API untuk update status bot dari file utama
app.post('/api/bot-status', (req, res) => {
  const { isRunning, qrScanned, connectedNumber, messageCount, error } = req.body;
  
  if (isRunning !== undefined) botStatus.isRunning = isRunning;
  if (qrScanned !== undefined) botStatus.qrScanned = qrScanned;
  if (connectedNumber) botStatus.connectedNumber = connectedNumber;
  if (messageCount !== undefined) botStatus.messageCount = messageCount;
  if (error) {
    botStatus.errors.push({
      message: error,
      timestamp: new Date()
    });
    // Keep only last 10 errors
    if (botStatus.errors.length > 10) {
      botStatus.errors = botStatus.errors.slice(-10);
    }
  }
  
  botStatus.lastActivity = new Date();
  res.json({ success: true, status: botStatus });
});

// Health check endpoint (lebih detail)
app.get('/health', (req, res) => {
  const health = {
    status: botStatus.isRunning ? 'healthy' : 'unhealthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    bot: {
      running: botStatus.isRunning,
      qrScanned: botStatus.qrScanned,
      connected: !!botStatus.connectedNumber,
      messageCount: botStatus.messageCount,
      lastActivity: botStatus.lastActivity,
      errors: botStatus.errors.length
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    }
  };
  
  res.status(botStatus.isRunning ? 200 : 503).json(health);
});

// Status bot endpoint
app.get('/status', (req, res) => {
  res.json({
    bot: 'WhatsApp Request Bot',
    version: process.env.BOT_VERSION || '1.0.0',
    status: botStatus.isRunning ? 'running' : 'stopped',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    connected: botStatus.connectedNumber,
    messageCount: botStatus.messageCount,
    timestamp: new Date().toISOString()
  });
});

// Ping endpoint
app.get('/ping', (req, res) => {
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Endpoint untuk webhook (jika diperlukan)
app.post('/webhook', (req, res) => {
  console.log('📨 Webhook received:', req.body);
  res.json({ received: true, timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  botStatus.errors.push({
    message: err.message,
    timestamp: new Date()
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.originalUrl} not found`,
    availableEndpoints: ['/', '/health', '/status', '/ping', '/api/bot-status'],
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Keep-alive server running on port ${port}`);
  console.log(`📱 Dashboard: http://localhost:${port}`);
  console.log(`💚 Health check: http://localhost:${port}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  botStatus.isRunning = false;
  
  server.close(() => {
    console.log('🔴 Server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.log('🔴 Force closing server');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Enhanced keep-alive dengan retry logic
if (process.env.KEEP_ALIVE !== 'false') {
  const pingInterval = parseInt(process.env.PING_INTERVAL) || 300000; // 5 menit
  const maxRetries = 3;
  let retryCount = 0;
  
  const keepAlive = async () => {
    try {
      const response = await fetch(`http://localhost:${port}/ping`);
      const data = await response.json();
      
      console.log(`🏓 Keep-alive ping: ${data.message} - ${new Date().toLocaleTimeString()}`);
      retryCount = 0; // Reset retry count on success
      
    } catch (err) {
      retryCount++;
      console.error(`❌ Keep-alive ping failed (${retryCount}/${maxRetries}):`, err.message);
      
      if (retryCount >= maxRetries) {
        console.error('🔴 Max retries reached, keep-alive disabled');
        return;
      }
      
      // Retry after 10 seconds
      setTimeout(keepAlive, 10000);
    }
  };
  
  setInterval(keepAlive, pingInterval);
  console.log(`⏰ Keep-alive ping interval: ${pingInterval/1000} seconds`);
}

// Export untuk dapat digunakan di file lain
module.exports = { app, botStatus };
