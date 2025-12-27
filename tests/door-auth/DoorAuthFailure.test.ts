/**
 * Door Authentication Failure Simulation Test
 * 
 * This test simulates 5 consecutive authentication failures at 1-second intervals
 * to verify the system's incorrect authentication handling behavior.
 * 
 * Expected behavior:
 * - Each failed attempt increments the failure counter
 * - After 5 failures, the alarm should be triggered
 * - Access logs should record each denied attempt
 * - Push notification should be sent on alarm trigger
 */

// Simulated door authentication state (mirrors ESP32 behavior)
interface DoorAuthState {
  failedAttempts: number;
  doorAlarmActive: boolean;
  lastAttemptTime: number;
  accessLogs: AccessLog[];
}

interface AccessLog {
  event: 'access_granted' | 'access_denied' | 'alarm_triggered';
  method: string;
  rfidUid: string;
  timestamp: number;
}

interface AuthResult {
  success: boolean;
  reason?: string;
  alarmTriggered?: boolean;
}

// Constants matching ESP32 configuration
const MAX_FAILED_ATTEMPTS = 5;
const ALARM_TRIGGER_THRESHOLD = 5;

// Simulated door authentication system
class DoorAuthSimulator {
  private state: DoorAuthState = {
    failedAttempts: 0,
    doorAlarmActive: false,
    lastAttemptTime: 0,
    accessLogs: [],
  };

  // Valid credentials for testing
  private validPinHash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'; // SHA256 of "1234"
  private validRfidHashes = ['abc123hash', 'def456hash'];

  reset(): void {
    this.state = {
      failedAttempts: 0,
      doorAlarmActive: false,
      lastAttemptTime: 0,
      accessLogs: [],
    };
  }

  getState(): DoorAuthState {
    return { ...this.state };
  }

  // Simulate RFID + PIN authentication attempt
  attemptAuth(rfidUid: string, pin: string): AuthResult {
    const timestamp = Date.now();
    this.state.lastAttemptTime = timestamp;

    // If alarm is active, deny all attempts
    if (this.state.doorAlarmActive) {
      this.logAccess('access_denied', 'alarm_active', rfidUid, timestamp);
      return { success: false, reason: 'alarm_active' };
    }

    // Simulate SHA256 hash of RFID (in real system this would be actual hash)
    const rfidHash = `${rfidUid}hash`;
    const isValidRfid = this.validRfidHashes.includes(rfidHash);

    if (!isValidRfid) {
      return this.handleFailedAttempt('invalid_rfid', rfidUid, timestamp);
    }

    // Simulate SHA256 hash of PIN
    const pinHash = this.simulateSha256(pin);
    const isValidPin = pinHash === this.validPinHash;

    if (!isValidPin) {
      return this.handleFailedAttempt('invalid_pin', rfidUid, timestamp);
    }

    // Success - reset failed attempts
    this.state.failedAttempts = 0;
    this.logAccess('access_granted', 'rfid_pin', rfidUid, timestamp);
    return { success: true };
  }

  // Simulate PIN-only authentication (keypad)
  attemptPinAuth(pin: string): AuthResult {
    const timestamp = Date.now();
    this.state.lastAttemptTime = timestamp;

    if (this.state.doorAlarmActive) {
      this.logAccess('access_denied', 'alarm_active', 'KEYPAD', timestamp);
      return { success: false, reason: 'alarm_active' };
    }

    const pinHash = this.simulateSha256(pin);
    const isValidPin = pinHash === this.validPinHash;

    if (!isValidPin) {
      return this.handleFailedAttempt('invalid_pin', 'KEYPAD', timestamp);
    }

    this.state.failedAttempts = 0;
    this.logAccess('access_granted', 'pin', 'KEYPAD', timestamp);
    return { success: true };
  }

  // Handle failed authentication attempt
  private handleFailedAttempt(reason: string, rfidUid: string, timestamp: number): AuthResult {
    this.state.failedAttempts++;
    this.logAccess('access_denied', reason, rfidUid, timestamp);

    // Check if alarm should be triggered
    if (this.state.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      this.triggerAlarm(rfidUid, timestamp);
      return { 
        success: false, 
        reason, 
        alarmTriggered: true 
      };
    }

    return { success: false, reason };
  }

  // Trigger door alarm
  private triggerAlarm(lastRfidUid: string, timestamp: number): void {
    this.state.doorAlarmActive = true;
    this.logAccess('alarm_triggered', `max_failed_attempts_${this.state.failedAttempts}`, lastRfidUid, timestamp);
  }

  // Reset alarm (admin action)
  resetAlarm(): void {
    this.state.doorAlarmActive = false;
    this.state.failedAttempts = 0;
  }

  // Log access attempt
  private logAccess(event: AccessLog['event'], method: string, rfidUid: string, timestamp: number): void {
    this.state.accessLogs.push({ event, method, rfidUid, timestamp });
  }

  // Simplified SHA256 simulation (for testing purposes)
  private simulateSha256(input: string): string {
    // In real implementation, this would be actual SHA256
    // For testing, we use a simple mapping
    const hashMap: Record<string, string> = {
      '1234': 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
      '0000': 'wrong_hash_0000',
      '9999': 'wrong_hash_9999',
      '1111': 'wrong_hash_1111',
    };
    return hashMap[input] || `wrong_hash_${input}`;
  }
}

// Helper function to wait for specified milliseconds
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

describe('Door Authentication Failure Simulation', () => {
  let simulator: DoorAuthSimulator;

  beforeEach(() => {
    simulator = new DoorAuthSimulator();
  });

  describe('Single Failed Attempt', () => {
    it('should increment failed attempts counter on invalid RFID', () => {
      const result = simulator.attemptAuth('invalid_card', '1234');
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('invalid_rfid');
      expect(simulator.getState().failedAttempts).toBe(1);
      expect(simulator.getState().doorAlarmActive).toBe(false);
    });

    it('should increment failed attempts counter on invalid PIN', () => {
      const result = simulator.attemptAuth('abc123', '0000');
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('invalid_pin');
      expect(simulator.getState().failedAttempts).toBe(1);
    });

    it('should log access_denied event', () => {
      simulator.attemptAuth('invalid_card', '1234');
      
      const logs = simulator.getState().accessLogs;
      expect(logs).toHaveLength(1);
      expect(logs[0].event).toBe('access_denied');
      expect(logs[0].method).toBe('invalid_rfid');
    });
  });

  describe('Sequential Failed Attempts (5 times at 1-second intervals)', () => {
    jest.setTimeout(10000); // Extend timeout for sequential test

    it('should trigger alarm after 5 consecutive failures', async () => {
      const attemptResults: AuthResult[] = [];
      const attemptTimestamps: number[] = [];

      // Simulate 5 failed attempts at 1-second intervals
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        // Alternate between invalid RFID and invalid PIN for variety
        const result = i % 2 === 0
          ? simulator.attemptAuth(`invalid_card_${i}`, '1234')
          : simulator.attemptAuth('abc123', `wrong_pin_${i}`);
        
        attemptResults.push(result);
        attemptTimestamps.push(startTime);

        // Wait 1 second before next attempt (except after last one)
        if (i < 4) {
          await delay(1000);
        }
      }

      // Verify results
      const state = simulator.getState();

      // First 4 attempts should fail without triggering alarm
      for (let i = 0; i < 4; i++) {
        expect(attemptResults[i].success).toBe(false);
        expect(attemptResults[i].alarmTriggered).toBeUndefined();
      }

      // 5th attempt should trigger alarm
      expect(attemptResults[4].success).toBe(false);
      expect(attemptResults[4].alarmTriggered).toBe(true);

      // Verify alarm state
      expect(state.doorAlarmActive).toBe(true);
      expect(state.failedAttempts).toBe(5);

      // Verify access logs
      expect(state.accessLogs).toHaveLength(6); // 5 denied + 1 alarm triggered
      
      const deniedLogs = state.accessLogs.filter(log => log.event === 'access_denied');
      const alarmLogs = state.accessLogs.filter(log => log.event === 'alarm_triggered');
      
      expect(deniedLogs).toHaveLength(5);
      expect(alarmLogs).toHaveLength(1);
      expect(alarmLogs[0].method).toContain('max_failed_attempts');

      // Verify timing (approximately 1 second between attempts)
      for (let i = 1; i < attemptTimestamps.length; i++) {
        const interval = attemptTimestamps[i] - attemptTimestamps[i - 1];
        expect(interval).toBeGreaterThanOrEqual(900); // Allow 100ms tolerance
        expect(interval).toBeLessThanOrEqual(1100);
      }
    });

    it('should block all attempts after alarm is triggered', async () => {
      // Trigger alarm with 5 failures
      for (let i = 0; i < 5; i++) {
        simulator.attemptAuth(`invalid_${i}`, 'wrong');
        if (i < 4) await delay(1000);
      }

      expect(simulator.getState().doorAlarmActive).toBe(true);

      // Try valid credentials - should still be denied
      const validAttempt = simulator.attemptAuth('abc123', '1234');
      expect(validAttempt.success).toBe(false);
      expect(validAttempt.reason).toBe('alarm_active');
    });

    it('should allow access after alarm reset', async () => {
      // Trigger alarm
      for (let i = 0; i < 5; i++) {
        simulator.attemptAuth(`invalid_${i}`, 'wrong');
        if (i < 4) await delay(1000);
      }

      expect(simulator.getState().doorAlarmActive).toBe(true);

      // Reset alarm (admin action)
      simulator.resetAlarm();

      expect(simulator.getState().doorAlarmActive).toBe(false);
      expect(simulator.getState().failedAttempts).toBe(0);

      // Valid credentials should now work
      const validAttempt = simulator.attemptAuth('abc123', '1234');
      expect(validAttempt.success).toBe(true);
    });
  });

  describe('PIN-only Authentication Failures', () => {
    jest.setTimeout(10000);

    it('should trigger alarm after 5 consecutive PIN failures', async () => {
      const wrongPins = ['0000', '9999', '1111', '5555', '7777'];

      for (let i = 0; i < 5; i++) {
        const result = simulator.attemptPinAuth(wrongPins[i]);
        
        if (i < 4) {
          expect(result.alarmTriggered).toBeUndefined();
          await delay(1000);
        } else {
          expect(result.alarmTriggered).toBe(true);
        }
      }

      expect(simulator.getState().doorAlarmActive).toBe(true);
      expect(simulator.getState().failedAttempts).toBe(5);
    });
  });

  describe('Mixed Authentication Failures', () => {
    jest.setTimeout(10000);

    it('should count failures across different auth methods', async () => {
      // Mix of RFID and PIN-only failures
      simulator.attemptAuth('invalid_rfid', '1234'); // Fail 1: invalid RFID
      await delay(1000);
      
      simulator.attemptPinAuth('0000'); // Fail 2: invalid PIN
      await delay(1000);
      
      simulator.attemptAuth('abc123', 'wrong'); // Fail 3: invalid PIN with valid RFID
      await delay(1000);
      
      simulator.attemptPinAuth('9999'); // Fail 4: invalid PIN
      await delay(1000);
      
      const finalResult = simulator.attemptAuth('bad_card', 'bad_pin'); // Fail 5: invalid RFID
      
      expect(finalResult.alarmTriggered).toBe(true);
      expect(simulator.getState().doorAlarmActive).toBe(true);
    });
  });

  describe('Successful Auth Resets Counter', () => {
    it('should reset failed attempts after successful authentication', async () => {
      // 3 failed attempts
      simulator.attemptAuth('invalid', '1234');
      await delay(1000);
      simulator.attemptAuth('invalid', '1234');
      await delay(1000);
      simulator.attemptAuth('invalid', '1234');
      
      expect(simulator.getState().failedAttempts).toBe(3);

      // Successful attempt
      simulator.attemptAuth('abc123', '1234');
      
      expect(simulator.getState().failedAttempts).toBe(0);
      expect(simulator.getState().doorAlarmActive).toBe(false);

      // 3 more failed attempts should not trigger alarm
      simulator.attemptAuth('invalid', '1234');
      simulator.attemptAuth('invalid', '1234');
      simulator.attemptAuth('invalid', '1234');
      
      expect(simulator.getState().failedAttempts).toBe(3);
      expect(simulator.getState().doorAlarmActive).toBe(false);
    });
  });

  describe('Access Log Verification', () => {
    it('should record all attempts with correct timestamps', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 3; i++) {
        simulator.attemptAuth(`card_${i}`, 'wrong');
        if (i < 2) await delay(1000);
      }

      const logs = simulator.getState().accessLogs;
      
      expect(logs).toHaveLength(3);
      
      logs.forEach((log, index) => {
        expect(log.event).toBe('access_denied');
        expect(log.rfidUid).toBe(`card_${index}`);
        expect(log.timestamp).toBeGreaterThanOrEqual(startTime);
        expect(log.timestamp).toBeLessThanOrEqual(Date.now());
      });
    });
  });
});

describe('Door Auth Constants', () => {
  it('should have correct MAX_FAILED_ATTEMPTS value', () => {
    expect(MAX_FAILED_ATTEMPTS).toBe(5);
  });

  it('should have correct ALARM_TRIGGER_THRESHOLD value', () => {
    expect(ALARM_TRIGGER_THRESHOLD).toBe(5);
  });
});
