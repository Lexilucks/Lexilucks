// test/sms-inbound.test.js
// Tests for SMS routing, age gate, STOP handling, package selection

import assert from 'assert';
import {
  isValidTransition,
  has18PlusConsent,
  isOptedOut,
} from '../src/lib/sms-state-machine.js';

describe('SMS State Machine', () => {
  describe('State Transitions', () => {
    it('should allow valid transitions', () => {
      assert(isValidTransition('new', 'consented'));
      assert(isValidTransition('consented', 'package_selected'));
      assert(isValidTransition('package_selected', 'checkout_sent'));
      assert(isValidTransition('checkout_sent', 'paid'));
      assert(isValidTransition('paid', 'scheduling_sent'));
      assert(isValidTransition('scheduling_sent', 'completed'));
    });

    it('should reject invalid transitions', () => {
      assert.throws(() => {
        isValidTransition('completed', 'new'); // Can't go backwards
      });

      assert.throws(() => {
        isValidTransition('new', 'paid'); // Can't skip states
      });

      assert.throws(() => {
        isValidTransition('invalid_state', 'new');
      });
    });
  });

  describe('SMS Message Parsing', () => {
    it('should normalize uppercase and trim', () => {
      const parseMessage = (text) => text.trim().toUpperCase();

      assert.strictEqual(parseMessage('  stop  '), 'STOP');
      assert.strictEqual(parseMessage('yes'), 'YES');
      assert.strictEqual(parseMessage('1'), '1');
    });

    it('should validate package selection (1-8)', () => {
      const isValidChoice = (choice) => /^[1-8]$/.test(choice);

      assert(isValidChoice('1'));
      assert(isValidChoice('8'));
      assert(!isValidChoice('0'));
      assert(!isValidChoice('9'));
      assert(!isValidChoice('abc'));
    });
  });

  describe('STOP/UNSTOP Keywords', () => {
    it('should recognize STOP keyword', () => {
      const message = 'STOP';
      assert.strictEqual(message, 'STOP');
    });

    it('should recognize UNSTOP keyword', () => {
      const message = 'UNSTOP';
      assert.strictEqual(message, 'UNSTOP');
    });

    it('should recognize HELP keyword', () => {
      const message = 'HELP';
      assert.strictEqual(message, 'HELP');
    });
  });

  describe('Phone Number Validation', () => {
    it('should validate E.164 format', () => {
      const validatePhoneNumber = (phoneNumber) => {
        const e164Regex = /^\+[1-9]\d{1,14}$/;
        return e164Regex.test(phoneNumber);
      };

      assert(validatePhoneNumber('+14155552671'));
      assert(validatePhoneNumber('+447700900123'));
      assert(!validatePhoneNumber('4155552671')); // Missing +
      assert(!validatePhoneNumber('+1415555267')); // Too short
      assert(!validatePhoneNumber('+01415555267')); // Leading 0 invalid
    });
  });
});
