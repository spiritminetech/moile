import NotificationAudit from '../models/NotificationAudit.js';
import appConfig from '../../../config/app.config.js';

/**
 * Comprehensive Error Handling Service
 * Implements circuit breaker pattern, exponential backoff, and detailed error logging
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */
class ErrorHandlingService {
  constructor() {
    this.config = appConfig.notification?.errorHandling || {
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 60000, // 1 minute
        halfOpenMaxCalls: 3
      },
      retry: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitterFactor: 0.1
      },
      alerting: {
        adminAlertThreshold: 10,
        criticalErrorThreshold: 5,
        alertCooldown: 300000 // 5 minutes
      }
    };

    // Circuit breakers for different services
    this.circuitBreakers = new Map();
    
    // Error tracking
    this.errorCounts = new Map();
    this.lastAlertTimes = new Map();
    
    // Admin notification queue
    this.adminAlertQueue = [];
    
    this.initializeCircuitBreakers();
  }

  /**
   * Initialize circuit breakers for different services
   */
  initializeCircuitBreakers() {
    const services = ['FCM', 'SMS', 'DATABASE', 'EXTERNAL_API'];
    
    services.forEach(service => {
      this.circuitBreakers.set(service, {
        state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
        failures: 0,
        lastFailureTime: null,
        lastSuccessTime: null,
        halfOpenCalls: 0,
        nextAttemptTime: null
      });
    });
  }

  /**
   * Circuit Breaker Pattern Implementation
   * Prevents cascading failures by temporarily blocking calls to failing services
   * Requirement 12.1: Circuit breaker pattern for external services
   */
  
  /**
   * Check if circuit breaker allows the call
   * @param {string} serviceName - Name of the service
   * @returns {boolean} Whether the call is allowed
   */
  isCallAllowed(serviceName) {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) {
      console.warn(`Circuit breaker not found for service: ${serviceName}`);
      return true;
    }

    const now = Date.now();

    switch (breaker.state) {
      case 'CLOSED':
        return true;

      case 'OPEN':
        if (now >= breaker.nextAttemptTime) {
          breaker.state = 'HALF_OPEN';
          breaker.halfOpenCalls = 0;
          console.log(`Circuit breaker for ${serviceName} moved to HALF_OPEN state`);
          return true;
        }
        return false;

      case 'HALF_OPEN':
        return breaker.halfOpenCalls < this.config.circuitBreaker.halfOpenMaxCalls;

      default:
        return true;
    }
  }

  /**
   * Record successful call to service
   * @param {string} serviceName - Name of the service
   */
  recordSuccess(serviceName) {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) return;

    const now = Date.now();
    breaker.lastSuccessTime = now;

    if (breaker.state === 'HALF_OPEN') {
      breaker.halfOpenCalls++;
      
      if (breaker.halfOpenCalls >= this.config.circuitBreaker.halfOpenMaxCalls) {
        breaker.state = 'CLOSED';
        breaker.failures = 0;
        breaker.halfOpenCalls = 0;
        console.log(`Circuit breaker for ${serviceName} moved to CLOSED state after successful recovery`);
      }
    } else if (breaker.state === 'CLOSED') {
      // Reset failure count on successful call
      breaker.failures = Math.max(0, breaker.failures - 1);
    }

    this.logCircuitBreakerEvent(serviceName, 'SUCCESS', {
      state: breaker.state,
      failures: breaker.failures,
      halfOpenCalls: breaker.halfOpenCalls
    });
  }

  /**
   * Record failed call to service
   * @param {string} serviceName - Name of the service
   * @param {Error} error - The error that occurred
   */
  recordFailure(serviceName, error) {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) return;

    const now = Date.now();
    breaker.failures++;
    breaker.lastFailureTime = now;

    if (breaker.state === 'HALF_OPEN') {
      // Failure in half-open state immediately opens the circuit
      breaker.state = 'OPEN';
      breaker.nextAttemptTime = now + this.config.circuitBreaker.recoveryTimeout;
      console.warn(`Circuit breaker for ${serviceName} moved to OPEN state after failure in HALF_OPEN`);
    } else if (breaker.state === 'CLOSED' && breaker.failures >= this.config.circuitBreaker.failureThreshold) {
      // Too many failures, open the circuit
      breaker.state = 'OPEN';
      breaker.nextAttemptTime = now + this.config.circuitBreaker.recoveryTimeout;
      console.warn(`Circuit breaker for ${serviceName} OPENED after ${breaker.failures} failures`);
      
      // Trigger admin alert for circuit breaker opening
      this.triggerAdminAlert('CIRCUIT_BREAKER_OPENED', {
        serviceName,
        failures: breaker.failures,
        error: error.message,
        recoveryTime: new Date(breaker.nextAttemptTime).toISOString()
      });
    }

    this.logCircuitBreakerEvent(serviceName, 'FAILURE', {
      state: breaker.state,
      failures: breaker.failures,
      error: error.message,
      errorCode: error.code
    });
  }

  /**
   * Get circuit breaker status for a service
   * @param {string} serviceName - Name of the service
   * @returns {Object} Circuit breaker status
   */
  getCircuitBreakerStatus(serviceName) {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) {
      return { exists: false };
    }

    return {
      exists: true,
      serviceName,
      state: breaker.state,
      failures: breaker.failures,
      lastFailureTime: breaker.lastFailureTime,
      lastSuccessTime: breaker.lastSuccessTime,
      nextAttemptTime: breaker.nextAttemptTime,
      halfOpenCalls: breaker.halfOpenCalls,
      isCallAllowed: this.isCallAllowed(serviceName)
    };
  }

  /**
   * Get status of all circuit breakers
   * @returns {Object} All circuit breaker statuses
   */
  getAllCircuitBreakerStatuses() {
    const statuses = {};
    
    for (const [serviceName] of this.circuitBreakers) {
      statuses[serviceName] = this.getCircuitBreakerStatus(serviceName);
    }

    return {
      timestamp: new Date().toISOString(),
      circuitBreakers: statuses,
      summary: {
        total: this.circuitBreakers.size,
        closed: Object.values(statuses).filter(s => s.state === 'CLOSED').length,
        open: Object.values(statuses).filter(s => s.state === 'OPEN').length,
        halfOpen: Object.values(statuses).filter(s => s.state === 'HALF_OPEN').length
      }
    };
  }

  /**
   * Exponential Backoff Implementation
   * Implements intelligent retry logic with exponential backoff and jitter
   * Requirements 12.2, 12.3: Exponential backoff for retry logic
   */

  /**
   * Calculate retry delay using exponential backoff with jitter
   * @param {number} attemptNumber - Current attempt number (1-based)
   * @param {Object} options - Retry options
   * @returns {number} Delay in milliseconds
   */
  calculateRetryDelay(attemptNumber, options = {}) {
    const config = { ...this.config.retry, ...options };
    
    // Exponential backoff: baseDelay * (backoffMultiplier ^ (attemptNumber - 1))
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attemptNumber - 1);
    
    // Cap at maximum delay
    const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
    
    // Add jitter to prevent thundering herd problem
    const jitter = cappedDelay * config.jitterFactor * Math.random();
    const finalDelay = cappedDelay + jitter;
    
    return Math.floor(finalDelay);
  }

  /**
   * Determine if operation should be retried
   * @param {Error} error - The error that occurred
   * @param {number} attemptNumber - Current attempt number
   * @param {Object} options - Retry options
   * @returns {boolean} Whether to retry
   */
  shouldRetry(error, attemptNumber, options = {}) {
    const config = { ...this.config.retry, ...options };
    
    // Don't retry if max attempts reached
    if (attemptNumber >= config.maxAttempts) {
      return false;
    }

    // Don't retry certain error types
    const nonRetryableErrors = [
      'VALIDATION_ERROR',
      'AUTHENTICATION_ERROR',
      'AUTHORIZATION_ERROR',
      'MALFORMED_TOKEN',
      'INVALID_TOKEN',
      'SENDER_ID_MISMATCH'
    ];

    if (nonRetryableErrors.includes(error.code)) {
      return false;
    }

    // Retry for network and temporary errors
    const retryableErrors = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'SERVER_UNAVAILABLE',
      'INTERNAL_ERROR',
      'QUOTA_EXCEEDED',
      'RATE_LIMITED'
    ];

    return retryableErrors.includes(error.code) || error.temporary === true;
  }

  /**
   * Execute operation with retry logic and circuit breaker
   * @param {Function} operation - The operation to execute
   * @param {string} serviceName - Name of the service
   * @param {Object} options - Execution options
   * @returns {Promise<any>} Operation result
   */
  async executeWithRetry(operation, serviceName, options = {}) {
    const config = { ...this.config.retry, ...options };
    let lastError;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      // Check circuit breaker
      if (!this.isCallAllowed(serviceName)) {
        const error = new Error(`Service ${serviceName} is currently unavailable (circuit breaker open)`);
        error.code = 'CIRCUIT_BREAKER_OPEN';
        throw error;
      }

      try {
        const result = await operation(attempt);
        
        // Record success
        this.recordSuccess(serviceName);
        
        // Log successful retry if not first attempt
        if (attempt > 1) {
          this.logRetryEvent(serviceName, 'SUCCESS', {
            attemptNumber: attempt,
            totalAttempts: attempt,
            previousErrors: lastError?.message
          });
        }

        return result;

      } catch (error) {
        lastError = error;
        
        // Record failure
        this.recordFailure(serviceName, error);
        
        // Log retry attempt
        this.logRetryEvent(serviceName, 'ATTEMPT', {
          attemptNumber: attempt,
          maxAttempts: config.maxAttempts,
          error: error.message,
          errorCode: error.code
        });

        // Check if we should retry
        if (!this.shouldRetry(error, attempt, config)) {
          this.logRetryEvent(serviceName, 'EXHAUSTED', {
            attemptNumber: attempt,
            maxAttempts: config.maxAttempts,
            finalError: error.message,
            reason: attempt >= config.maxAttempts ? 'MAX_ATTEMPTS_REACHED' : 'NON_RETRYABLE_ERROR'
          });
          throw error;
        }

        // Calculate delay for next attempt
        if (attempt < config.maxAttempts) {
          const delay = this.calculateRetryDelay(attempt, config);
          
          this.logRetryEvent(serviceName, 'DELAY', {
            attemptNumber: attempt,
            nextAttempt: attempt + 1,
            delayMs: delay,
            error: error.message
          });

          await this.sleep(delay);
        }
      }
    }

    // This should never be reached, but just in case
    throw lastError;
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Detailed Error Logging and Admin Alerts
   * Requirements 12.4: Detailed error logging and admin alerts
   */

  /**
   * Log comprehensive error information
   * @param {Error} error - The error to log
   * @param {Object} context - Additional context information
   * @param {string} severity - Error severity level
   */
  async logError(error, context = {}, severity = 'ERROR') {
    try {
      const errorData = {
        timestamp: new Date(),
        severity,
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        stack: error.stack,
        context: {
          serviceName: context.serviceName,
          operation: context.operation,
          userId: context.userId,
          notificationId: context.notificationId,
          attemptNumber: context.attemptNumber,
          ...context
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          memory: process.memoryUsage(),
          uptime: process.uptime()
        }
      };

      // Create audit record for error
      await NotificationAudit.createAuditRecord({
        notificationId: context.notificationId || null,
        workerId: context.userId || null,
        event: 'ERROR',
        metadata: {
          errorType: 'SYSTEM_ERROR',
          severity,
          errorCode: error.code || 'UNKNOWN_ERROR',
          errorMessage: error.message,
          serviceName: context.serviceName,
          operation: context.operation,
          stack: error.stack?.substring(0, 1000), // Truncate stack trace
          systemInfo: errorData.system
        }
      });

      // Console logging with structured format
      const logLevel = severity === 'CRITICAL' ? 'error' : 'warn';
      console[logLevel]('🚨 Error logged:', {
        severity,
        code: error.code,
        message: error.message,
        service: context.serviceName,
        operation: context.operation,
        timestamp: errorData.timestamp.toISOString()
      });

      // Track error counts for alerting
      this.trackErrorForAlerting(error, context, severity);

      // Trigger admin alerts for critical errors
      if (severity === 'CRITICAL') {
        await this.triggerAdminAlert('CRITICAL_ERROR', {
          error: error.message,
          code: error.code,
          service: context.serviceName,
          operation: context.operation,
          timestamp: errorData.timestamp.toISOString()
        });
      }

    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
      console.error('Original error:', error);
    }
  }

  /**
   * Track errors for alerting thresholds
   * @param {Error} error - The error
   * @param {Object} context - Error context
   * @param {string} severity - Error severity
   */
  trackErrorForAlerting(error, context, severity) {
    const key = `${context.serviceName || 'UNKNOWN'}_${error.code || 'UNKNOWN_ERROR'}`;
    const now = Date.now();
    const timeWindow = 300000; // 5 minutes

    if (!this.errorCounts.has(key)) {
      this.errorCounts.set(key, []);
    }

    const errorList = this.errorCounts.get(key);
    
    // Add current error
    errorList.push({ timestamp: now, severity });
    
    // Remove errors outside time window
    const cutoff = now - timeWindow;
    const recentErrors = errorList.filter(e => e.timestamp > cutoff);
    this.errorCounts.set(key, recentErrors);

    // Check if we should trigger an alert
    const criticalErrors = recentErrors.filter(e => e.severity === 'CRITICAL').length;
    const totalErrors = recentErrors.length;

    if (criticalErrors >= this.config.alerting.criticalErrorThreshold ||
        totalErrors >= this.config.alerting.adminAlertThreshold) {
      
      // Check cooldown
      const lastAlert = this.lastAlertTimes.get(key) || 0;
      if (now - lastAlert > this.config.alerting.alertCooldown) {
        this.triggerAdminAlert('ERROR_THRESHOLD_EXCEEDED', {
          errorType: key,
          criticalErrors,
          totalErrors,
          timeWindow: '5 minutes',
          service: context.serviceName
        });
        
        this.lastAlertTimes.set(key, now);
      }
    }
  }

  /**
   * Trigger admin alert
   * @param {string} alertType - Type of alert
   * @param {Object} alertData - Alert data
   */
  async triggerAdminAlert(alertType, alertData) {
    try {
      const alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: alertType,
        severity: this.getAlertSeverity(alertType),
        timestamp: new Date(),
        data: alertData,
        acknowledged: false
      };

      // Add to admin alert queue
      this.adminAlertQueue.push(alert);

      // Create audit record for admin alert
      await NotificationAudit.createAuditRecord({
        notificationId: null,
        workerId: null,
        event: 'ADMIN_ALERT',
        metadata: {
          alertType,
          alertId: alert.id,
          severity: alert.severity,
          alertData
        }
      });

      console.warn(`🚨 Admin alert triggered: ${alertType}`, alertData);

      // TODO: Implement actual admin notification (email, Slack, etc.)
      // This would integrate with your admin notification system
      
    } catch (error) {
      console.error('Failed to trigger admin alert:', error);
    }
  }

  /**
   * Get alert severity based on alert type
   * @param {string} alertType - Alert type
   * @returns {string} Severity level
   */
  getAlertSeverity(alertType) {
    const severityMap = {
      'CRITICAL_ERROR': 'CRITICAL',
      'CIRCUIT_BREAKER_OPENED': 'HIGH',
      'ERROR_THRESHOLD_EXCEEDED': 'HIGH',
      'SERVICE_DEGRADED': 'MEDIUM',
      'PERFORMANCE_ISSUE': 'MEDIUM'
    };

    return severityMap[alertType] || 'LOW';
  }

  /**
   * Get recent admin alerts
   * @param {number} limit - Maximum number of alerts to return
   * @returns {Array} Recent admin alerts
   */
  getRecentAdminAlerts(limit = 50) {
    return this.adminAlertQueue
      .slice(-limit)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Acknowledge admin alert
   * @param {string} alertId - Alert ID to acknowledge
   * @returns {boolean} Whether alert was found and acknowledged
   */
  acknowledgeAdminAlert(alertId) {
    const alert = this.adminAlertQueue.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Log circuit breaker events
   * @param {string} serviceName - Service name
   * @param {string} eventType - Event type
   * @param {Object} metadata - Event metadata
   */
  async logCircuitBreakerEvent(serviceName, eventType, metadata) {
    try {
      await NotificationAudit.createAuditRecord({
        notificationId: null,
        workerId: null,
        event: 'CIRCUIT_BREAKER',
        metadata: {
          serviceName,
          eventType,
          circuitBreakerState: metadata.state,
          ...metadata
        }
      });
    } catch (error) {
      console.error('Failed to log circuit breaker event:', error);
    }
  }

  /**
   * Log retry events
   * @param {string} serviceName - Service name
   * @param {string} eventType - Event type
   * @param {Object} metadata - Event metadata
   */
  async logRetryEvent(serviceName, eventType, metadata) {
    try {
      await NotificationAudit.createAuditRecord({
        notificationId: null,
        workerId: null,
        event: 'RETRY',
        metadata: {
          serviceName,
          eventType,
          ...metadata
        }
      });
    } catch (error) {
      console.error('Failed to log retry event:', error);
    }
  }

  /**
   * Get error handling statistics
   * @param {number} hours - Hours to look back
   * @returns {Promise<Object>} Error statistics
   */
  async getErrorStatistics(hours = 24) {
    try {
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      const errorStats = await NotificationAudit.aggregate([
        {
          $match: {
            event: { $in: ['ERROR', 'CIRCUIT_BREAKER', 'RETRY'] },
            timestamp: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: {
              event: '$event',
              serviceName: '$metadata.serviceName',
              errorCode: '$metadata.errorCode'
            },
            count: { $sum: 1 },
            latestOccurrence: { $max: '$timestamp' }
          }
        },
        {
          $group: {
            _id: '$_id.event',
            services: {
              $push: {
                serviceName: '$_id.serviceName',
                errorCode: '$_id.errorCode',
                count: '$count',
                latestOccurrence: '$latestOccurrence'
              }
            },
            totalCount: { $sum: '$count' }
          }
        }
      ]);

      return {
        period: `${hours} hours`,
        statistics: errorStats,
        circuitBreakers: this.getAllCircuitBreakerStatuses(),
        adminAlerts: {
          total: this.adminAlertQueue.length,
          unacknowledged: this.adminAlertQueue.filter(a => !a.acknowledged).length,
          recent: this.getRecentAdminAlerts(10)
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to get error statistics:', error);
      throw error;
    }
  }

  /**
   * Reset circuit breaker for a service (admin function)
   * @param {string} serviceName - Service name
   * @returns {boolean} Whether reset was successful
   */
  resetCircuitBreaker(serviceName) {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) {
      return false;
    }

    breaker.state = 'CLOSED';
    breaker.failures = 0;
    breaker.lastFailureTime = null;
    breaker.halfOpenCalls = 0;
    breaker.nextAttemptTime = null;

    console.log(`Circuit breaker for ${serviceName} manually reset to CLOSED state`);
    
    this.logCircuitBreakerEvent(serviceName, 'MANUAL_RESET', {
      state: 'CLOSED',
      resetBy: 'ADMIN'
    });

    return true;
  }

  /**
   * Get service health summary
   * @returns {Object} Health summary
   */
  getHealthSummary() {
    const circuitBreakers = this.getAllCircuitBreakerStatuses();
    const recentAlerts = this.getRecentAdminAlerts(10);
    
    const healthyServices = Object.values(circuitBreakers.circuitBreakers)
      .filter(cb => cb.state === 'CLOSED').length;
    
    const totalServices = Object.keys(circuitBreakers.circuitBreakers).length;
    
    return {
      timestamp: new Date().toISOString(),
      overall: {
        status: circuitBreakers.summary.open > 0 ? 'DEGRADED' : 'HEALTHY',
        healthyServices,
        totalServices,
        degradedServices: circuitBreakers.summary.open + circuitBreakers.summary.halfOpen
      },
      circuitBreakers: circuitBreakers.summary,
      alerts: {
        total: this.adminAlertQueue.length,
        unacknowledged: this.adminAlertQueue.filter(a => !a.acknowledged).length,
        critical: recentAlerts.filter(a => a.severity === 'CRITICAL').length
      }
    };
  }
}

export default new ErrorHandlingService();