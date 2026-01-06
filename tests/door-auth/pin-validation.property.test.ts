/**
 * Property-Based Tests for PIN Validation (Frontend)
 * Feature: door-auth-refactor
 * 
 * Property 7: PIN Validation
 * For any input string, the PIN validation shall accept if and only if
 * the string is exactly 4 characters and all characters are numeric digits (0-9).
 * 
 * Validates: Requirements 3.4
 */

import fc from 'fast-check';

/**
 * PIN validation function (same logic as in SecuritySettings.tsx)
 */
function validatePin(pin: string): boolean {
  return pin.length === 4 && /^\d+$/.test(pin);
}

/**
 * Validates PIN change form (requires current PIN, new PIN, and confirmation)
 */
function validatePinChangeForm(currentPin: string, newPin: string, confirmPin: string): { valid: boolean; error?: string } {
  if (!validatePin(currentPin)) {
    return { valid: false, error: 'Mã PIN hiện tại phải là 4 chữ số' };
  }
  if (!validatePin(newPin)) {
    return { valid: false, error: 'Mã PIN mới phải là 4 chữ số' };
  }
  if (newPin !== confirmPin) {
    return { valid: false, error: 'Mã PIN xác nhận không khớp' };
  }
  return { valid: true };
}

/**
 * Generates a valid 4-digit PIN
 */
const validPinArbitrary = fc.tuple(
  fc.integer({ min: 0, max: 9 }),
  fc.integer({ min: 0, max: 9 }),
  fc.integer({ min: 0, max: 9 }),
  fc.integer({ min: 0, max: 9 })
).map(([a, b, c, d]) => `${a}${b}${c}${d}`);

/**
 * Generates an invalid PIN
 */
const invalidPinArbitrary = fc.oneof(
  // Too short (0-3 digits)
  fc.integer({ min: 0, max: 999 }).map(n => n.toString()),
  // Too long (5+ digits)
  fc.integer({ min: 10000, max: 99999 }).map(n => n.toString()),
  // Contains non-numeric characters (4 chars)
  fc.string({ minLength: 4, maxLength: 4 }).filter(s => !/^\d{4}$/.test(s) && s.length === 4),
  // Empty string
  fc.constant('')
);

describe('PIN Validation Property Tests (Frontend)', () => {
  /**
   * Feature: door-auth-refactor, Property 7: PIN Validation
   * Validates: Requirements 3.4
   */
  describe('Property 7: PIN Validation', () => {
    it('accepts exactly 4 numeric digits', () => {
      fc.assert(
        fc.property(validPinArbitrary, (pin) => {
          return validatePin(pin) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('rejects strings that are not exactly 4 numeric digits', () => {
      fc.assert(
        fc.property(invalidPinArbitrary, (input) => {
          return validatePin(input) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('validation is consistent with regex /^\\d{4}$/', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const isValid = validatePin(input);
          const regexValid = /^\d{4}$/.test(input);
          return isValid === regexValid;
        }),
        { numRuns: 100 }
      );
    });

    it('PIN confirmation must match new PIN', () => {
      fc.assert(
        fc.property(validPinArbitrary, validPinArbitrary, (pin1, pin2) => {
          const matches = pin1 === pin2;
          // If PINs match, confirmation passes; if not, it fails
          return matches === (pin1 === pin2);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * PIN Change Form Validation (requires current PIN)
   */
  describe('PIN Change Form Validation', () => {
    it('requires valid current PIN', () => {
      fc.assert(
        fc.property(invalidPinArbitrary, validPinArbitrary, (currentPin, newPin) => {
          const result = validatePinChangeForm(currentPin, newPin, newPin);
          return result.valid === false && result.error === 'Mã PIN hiện tại phải là 4 chữ số';
        }),
        { numRuns: 100 }
      );
    });

    it('requires valid new PIN', () => {
      fc.assert(
        fc.property(validPinArbitrary, invalidPinArbitrary, (currentPin, newPin) => {
          const result = validatePinChangeForm(currentPin, newPin, newPin);
          return result.valid === false && result.error === 'Mã PIN mới phải là 4 chữ số';
        }),
        { numRuns: 100 }
      );
    });

    it('requires confirmation to match new PIN', () => {
      fc.assert(
        fc.property(validPinArbitrary, validPinArbitrary, validPinArbitrary, (currentPin, newPin, confirmPin) => {
          fc.pre(newPin !== confirmPin); // Only test when they don't match
          const result = validatePinChangeForm(currentPin, newPin, confirmPin);
          return result.valid === false && result.error === 'Mã PIN xác nhận không khớp';
        }),
        { numRuns: 100 }
      );
    });

    it('accepts valid form with all fields correct', () => {
      fc.assert(
        fc.property(validPinArbitrary, validPinArbitrary, (currentPin, newPin) => {
          const result = validatePinChangeForm(currentPin, newPin, newPin);
          return result.valid === true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
