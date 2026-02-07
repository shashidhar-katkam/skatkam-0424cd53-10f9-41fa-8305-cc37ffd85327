import { createLogger, setLogLevel } from './logger.util';

describe('logger.util', () => {
  let consoleSpy: { log: jest.SpyInstance; warn: jest.SpyInstance; error: jest.SpyInstance };

  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    };
    setLogLevel('debug');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createLogger', () => {
    it('should create logger with optional context', () => {
      const logger = createLogger('TestContext');
      expect(logger).toBeDefined();
      expect(typeof logger.setContext).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should call debug and info', () => {
      const logger = createLogger('Test');
      logger.debug('debug msg');
      logger.info('info msg');
      expect(consoleSpy.log).toHaveBeenCalledTimes(2);
    });

    it('should call warn and error', () => {
      const logger = createLogger('Test');
      logger.warn('warn msg');
      logger.error('error msg');
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should handle error with Error object', () => {
      const logger = createLogger('Test');
      logger.error('err', new Error('test'));
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should allow setContext', () => {
      const logger = createLogger();
      expect(() => logger.setContext('NewCtx')).not.toThrow();
    });
  });

  describe('setLogLevel', () => {
    it('should set log level', () => {
      expect(() => setLogLevel('info')).not.toThrow();
    });
  });
});
