// Network Logger Utility for Development

interface NetworkLog {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  requestHeaders: any;
  requestData: any;
  responseStatus?: number;
  responseData?: any;
  responseHeaders?: any;
  error?: any;
  duration?: number;
}

class NetworkLogger {
  private logs: NetworkLog[] = [];
  private enabled = __DEV__; // Only enable in development

  log(logData: Partial<NetworkLog>): void {
    if (!this.enabled) return;

    const log: NetworkLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      method: 'GET',
      url: '',
      requestHeaders: {},
      requestData: null,
      ...logData,
    };

    this.logs.push(log);

    // Keep only last 50 logs to prevent memory issues
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50);
    }

    // Pretty print to console
    this.prettyPrint(log);
  }

  private prettyPrint(log: NetworkLog): void {
    const emoji = log.error ? '❌' : log.responseStatus && log.responseStatus >= 400 ? '⚠️' : '✅';
    
    console.group(`${emoji} ${log.method} ${log.url}`);
    console.log('🕐 Time:', log.timestamp.toLocaleTimeString());
    
    if (log.requestData) {
      console.log('📤 Request Data:', log.requestData);
    }
    
    if (log.requestHeaders && Object.keys(log.requestHeaders).length > 0) {
      console.log('📋 Request Headers:', log.requestHeaders);
    }
    
    if (log.responseStatus) {
      console.log('📊 Status:', log.responseStatus);
    }
    
    if (log.responseData) {
      console.log('📥 Response Data:', log.responseData);
    }
    
    if (log.error) {
      console.error('💥 Error:', log.error);
    }
    
    if (log.duration) {
      console.log('⏱️ Duration:', `${log.duration}ms`);
    }
    
    console.groupEnd();
  }

  getAllLogs(): NetworkLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    console.log('🧹 Network logs cleared');
  }

  enable(): void {
    this.enabled = true;
    console.log('🔍 Network logging enabled');
  }

  disable(): void {
    this.enabled = false;
    console.log('🔇 Network logging disabled');
  }
}

export const networkLogger = new NetworkLogger();
export default networkLogger;