import { describe, it, expect } from 'vitest';
import { logger } from '../../src/utils/logger';

describe('logger', () => {
  it('should be defined', () => {
    expect(logger).toBeDefined();
  });

  it('should have standard logging methods', () => {
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  it('should have a level property', () => {
    expect(logger.level).toBeDefined();
    expect(typeof logger.level).toBe('string');
  });
});
