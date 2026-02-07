import { AppLoggerService } from './logger.service';

describe('AppLoggerService', () => {
  let service: AppLoggerService;
  let consoleSpy: { log: jest.SpyInstance; warn: jest.SpyInstance; error: jest.SpyInstance };

  beforeEach(() => {
    service = new AppLoggerService();
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call setContext', () => {
    expect(() => service.setContext('Test')).not.toThrow();
  });

  it('should call debug', () => {
    service.setContext('Test');
    service.debug('debug message', { key: 'value' });
    expect(consoleSpy.log).toHaveBeenCalled();
  });

  it('should call info', () => {
    service.setContext('Test');
    service.info('info message');
    expect(consoleSpy.log).toHaveBeenCalled();
  });

  it('should call warn', () => {
    service.setContext('Test');
    service.warn('warn message');
    expect(consoleSpy.warn).toHaveBeenCalled();
  });

  it('should call error with Error', () => {
    service.setContext('Test');
    service.error('error message', new Error('test error'));
    expect(consoleSpy.error).toHaveBeenCalled();
  });

  it('should call error with string', () => {
    service.setContext('Test');
    service.error('error message', 'string err');
    expect(consoleSpy.error).toHaveBeenCalled();
  });
});
