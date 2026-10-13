import assert from 'node:assert/strict';
import {
  addDateDays,
  formatLocalDate,
  getEffectiveRentalDates,
  isValidDateOnly,
} from '../lib/utils/date-only';

assert.equal(isValidDateOnly('2026-02-28'), true);
assert.equal(isValidDateOnly('2026-02-29'), false);
assert.equal(isValidDateOnly('2026-2-09'), false);
assert.equal(addDateDays('2026-03-08', 1), '2026-03-09');
assert.equal(addDateDays('2026-12-31', 1), '2027-01-01');
assert.equal(addDateDays('2028-02-28', 1), '2028-02-29');
assert.equal(formatLocalDate(new Date(2026, 0, 2, 23, 30)), '2026-01-02');
assert.deepEqual(
  getEffectiveRentalDates('2026-10-12', '2026-10-15', '2026-10-13'),
  { startDate: '2026-10-13', endDate: '2026-10-15' }
);
assert.deepEqual(
  getEffectiveRentalDates('', '', '2026-10-13'),
  { startDate: '2026-10-13', endDate: '2026-10-16' }
);
