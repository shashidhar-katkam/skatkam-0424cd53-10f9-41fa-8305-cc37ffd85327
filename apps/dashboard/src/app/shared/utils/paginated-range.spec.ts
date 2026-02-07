import { paginatedRange } from './paginated-range';

describe('paginatedRange', () => {
  it('should return 0-0 when total is 0', () => {
    expect(paginatedRange(0, 10, 0)).toBe('0-0');
  });

  it('should return range for page 0', () => {
    expect(paginatedRange(0, 10, 25)).toBe('1-10');
  });

  it('should return range for page 1', () => {
    expect(paginatedRange(1, 10, 25)).toBe('11-20');
  });

  it('should return partial range on last page', () => {
    expect(paginatedRange(2, 10, 25)).toBe('21-25');
  });

  it('should return single item range when total is 1', () => {
    expect(paginatedRange(0, 10, 1)).toBe('1-1');
  });
});
