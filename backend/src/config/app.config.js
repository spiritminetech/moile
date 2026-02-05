/**
 * Backend Application Configuration
 * Professional ERP System Backend Configuration
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class AppConfig {
  constructor() {
    this.validateEnvironmentVariables();
  }

  // Database Configuration
  get database() {
    return {
      uri: process.env.MONGODB_URI,
      name: process.env.DB_NAME || 'erp',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    };
  }

  // Server Configuration
  get server() {
    return {
      port: parseInt(process.env.PORT) || 5002,
      environment: process.env.NODE_ENV || 'development',
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production'
    };
  }

  // CORS Configuration
  get cors() {
    const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',');
    const driverUrls = (process.env.DRIVER_APP_URL || 'http://localhost:3000').split(',');
    
    // In development, be more permissive with CORS for mobile apps
    if (this.server.isDevelopment) {
      return {
        origin: true, // Allow all origins in development
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
        exposedHeaders: ['Content-Length', 'Content-Type']
      };
    }
    
    return {
      origin: [...frontendUrls, ...driverUrls],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    };
  }

  // JWT Configuration
  get jwt() {
    return {
      secret: process.env.JWT_SECRET || 'fallback-secret-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    };
  }

  // Email Configuration
  get email() {
    return {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };
  }

  // File Upload Configuration
  get upload() {
    return {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
      uploadPath: process.env.UPLOAD_PATH || './uploads',
      allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf'
      ],
      paths: {
        tasks: '/uploads/tasks',
        drivers: '/uploads/drivers',
        leave: '/uploads/leave',
        pickup: '/uploads/pickup',
        dropoff: '/uploads/dropoff'
      }
    };
  }

  // API Configuration
  get api() {
    return {
      version: process.env.API_VERSION || 'v1',
      prefix: process.env.API_PREFIX || '/api',
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
      }
    };
  }

  // Firebase Configuration
  get firebase() {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      clientId: process.env.FIREBASE_CLIENT_ID,
      authUri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      tokenUri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
      clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      databaseURL: process.env.FIREBASE_DATABASE_URL
    };
  }

  // Notification Configuration
  get notification() {
    return {
      dailyLimit: parseInt(process.env.NOTIFICATION_DAILY_LIMIT) || 10,
      escalationTimeoutHours: parseInt(process.env.NOTIFICATION_ESCALATION_TIMEOUT_HOURS) || 2,
      offlineQueueExpiryHours: parseInt(process.env.NOTIFICATION_OFFLINE_QUEUE_EXPIRY_HOURS) || 48,
      retryAttempts: {
        high: parseInt(process.env.NOTIFICATION_HIGH_PRIORITY_RETRIES) || 3,
        normal: parseInt(process.env.NOTIFICATION_NORMAL_PRIORITY_RETRIES) || 1,
        low: parseInt(process.env.NOTIFICATION_LOW_PRIORITY_RETRIES) || 1
      },
      deliveryTimeouts: {
        critical: parseInt(process.env.NOTIFICATION_CRITICAL_TIMEOUT_SECONDS) || 30,
        high: parseInt(process.env.NOTIFICATION_HIGH_TIMEOUT_SECONDS) || 120,
        normal: parseInt(process.env.NOTIFICATION_NORMAL_TIMEOUT_SECONDS) || 300,
        low: parseInt(process.env.NOTIFICATION_LOW_TIMEOUT_SECONDS) || 600
      },
      sms: {
        enabled: process.env.SMS_FALLBACK_ENABLED === 'true',
        provider: process.env.SMS_PROVIDER || 'twilio',
        accountSid: process.env.SMS_ACCOUNT_SID,
        authToken: process.env.SMS_AUTH_TOKEN,
        fromNumber: process.env.SMS_FROM_NUMBER
      },
      // Error Handling Configuration
      errorHandling: {
        circuitBreaker: {
          failureThreshold: parseInt(process.env.ERROR_CIRCUIT_BREAKER_FAILURE_THRESHOLD) || 5,
          recoveryTimeout: parseInt(process.env.ERROR_CIRCUIT_BREAKER_RECOVERY_TIMEOUT) || 60000, // 1 minute
          halfOpenMaxCalls: parseInt(process.env.ERROR_CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS) || 3
        },
        retry: {
          maxAttempts: parseInt(process.env.ERROR_RETRY_MAX_ATTEMPTS) || 3,
          baseDelay: parseInt(process.env.ERROR_RETRY_BASE_DELAY) || 1000,
          maxDelay: parseInt(process.env.ERROR_RETRY_MAX_DELAY) || 30000,
          backoffMultiplier: parseFloat(process.env.ERROR_RETRY_BACKOFF_MULTIPLIER) || 2,
          jitterFactor: parseFloat(process.env.ERROR_RETRY_JITTER_FACTOR) || 0.1
        },
        alerting: {
          adminAlertThreshold: parseInt(process.env.ERROR_ADMIN_ALERT_THRESHOLD) || 10,
          criticalErrorThreshold: parseInt(process.env.ERROR_CRITICAL_ERROR_THRESHOLD) || 5,
          alertCooldown: parseInt(process.env.ERROR_ALERT_COOLDOWN) || 300000 // 5 minutes
        }
      }
    };
  }

  // Logging Configuration
  get logging() {
    return {
      level: this.server.isDevelopment ? 'debug' : 'info',
      enableConsole: true,
      enableFile: this.server.isProduction
    };
  }

  // Validation
  validateEnvironmentVariables() {
    const required = [
      'MONGODB_URI',
      'JWT_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
      if (this.server.isProduction) {
        process.exit(1);
      }
    }

    // Warnings for optional but recommended variables
    const recommended = [
      'SMTP_USER',
      'SMTP_PASS',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL'
    ];

    const missingRecommended = recommended.filter(key => !process.env[key]);
    if (missingRecommended.length > 0) {
      console.warn(`⚠️ Missing recommended environment variables: ${missingRecommended.join(', ')}`);
    }
  }

  // Utility Methods
  getFullUrl(path = '') {
    const protocol = this.server.isDevelopment ? 'http' : 'https';
    const host = process.env.HOST || 'localhost';
    return `${protocol}://${host}:${this.server.port}${path}`;
  }

  getUploadUrl(type, filename = '') {
    const basePath = this.upload.paths[type] || '/uploads';
    return this.getFullUrl(`${basePath}${filename ? `/${filename}` : ''}`);
  }

  // Debug logging
  log(...args) {
    if (this.server.isDevelopment) {
      console.log(`[ERP-Backend]`, ...args);
    }
  }

  error(...args) {
    console.error(`[ERP-Backend]`, ...args);
  }
}

// Export singleton instance
const appConfig = new AppConfig();

export default appConfig;