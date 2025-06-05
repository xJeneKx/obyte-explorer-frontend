import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOGS_DIR = join(__dirname, 'logs');

interface BaseLogEntry {
  timestamp: string;
  url: string;
  method: string;
  status: number;
  duration: number;
}

interface ErrorLogEntry extends BaseLogEntry {
  error: {
    name: string;
    message: string;
    stack?: string;
    response?: any;
    request?: {
      headers?: any;
      body?: any;
      params?: any;
    };
  };
}

type LogEntry = BaseLogEntry | ErrorLogEntry;

let writeQueue = Promise.resolve();

const ensureLogsDir = async () => {
  try {
    await fs.mkdir(LOGS_DIR, { recursive: true });
  } catch (err: any) {
    if (err.code !== 'EEXIST') {
      console.error('Failed to create logs directory:', err);
      throw err;
    }
  }
};

ensureLogsDir().catch(console.error);

export const logFetchRequest = async (url: string, options: any, response: any, error?: any) => {
  const logFile = join(LOGS_DIR, `requests.log`);
  const requestStartTime = options?._requestStartTime || Date.now();

  try {
    const duration = Date.now() - requestStartTime;
    let logEntry: LogEntry;

    if (error) {
      logEntry = {
        timestamp: new Date().toISOString(),
        url,
        method: options?.method || 'GET',
        status: error.response?.status || 500,
        duration,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          response: error.response?.data || error.response,
          request: {
            headers: options?.headers,
            body: options?.body,
            params: options?.params
          }
        }
      };
    } else {
      logEntry = {
        timestamp: new Date().toISOString(),
        url,
        method: options?.method || 'GET',
        status: response?.status || 200,
        duration
      };
    }

    writeQueue = writeQueue
      .then(async () => {
        try {
          await fs.appendFile(
            logFile,
            JSON.stringify(logEntry, null, 2) + '\n\n',
            { encoding: 'utf-8' }
          );
        } catch (writeErr) {
          console.error('Error writing fetch log:', writeErr);
          throw writeErr;
        }
      })
      .catch(err => {
        console.error('Error in log queue:', err);
        return Promise.resolve();
      });

    await writeQueue;
  } catch (err) {
    console.error('Error in logFetchRequest:', err);
    throw err;
  }
};

export const createFetchWithLogger = (originalFetch: typeof globalThis.$fetch): typeof globalThis.$fetch => {
  const wrappedFetchInstance = async (url: string, options: any = {}) => {
    const requestStartTime = Date.now();
    const optionsForLogging = { ...options, _requestStartTime: requestStartTime };

    try {
      const response = await originalFetch(url, options);
      await logFetchRequest(
        url,
        optionsForLogging,
        response,
        undefined
      );
      return response;
    } catch (error: any) {
      await logFetchRequest(
        url,
        optionsForLogging,
        error.response,
        error
      );
      throw error;
    }
  };

  const callableWithProperties = wrappedFetchInstance as typeof globalThis.$fetch;

  if (originalFetch.raw) {
    callableWithProperties.raw = originalFetch.raw;
  }
  if (originalFetch.create) {
    callableWithProperties.create = originalFetch.create;
  }

  return callableWithProperties;
};
