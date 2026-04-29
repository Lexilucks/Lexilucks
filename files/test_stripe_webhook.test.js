// test/stripe-webhook.test.js
// Tests for webhook signature verification and payment handling

import assert from 'assert';
import crypto from 'crypto';
import { verifyWebhookSignature } from '../api/stripe/webhook.js';

describe('Stripe Webhook', () => {
  const testSecret = 'whsec_test_secret';
  const testBody = JSON.stringify({
    id: 'evt_test',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test',
        payment_status: 'paid',
      },
    },
  });

  it('should verify a valid Stripe webhook signature', () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signedContent = `${timestamp}.${testBody}`;
    const hash = crypto
      .createHmac('sha256', testSecret)
      .update(signedContent)
      .digest('hex');

    const signature = `t=${timestamp},v1=${hash}`;

    assert.doesNotThrow(() => {
      verifyWebhookSignature(testBody, signature, testSecret);
    });
  });

  it('should reject an invalid signature', () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = `t=${timestamp},v1=invalid_hash`;

    assert.throws(() => {
      verifyWebhookSignature(testBody, signature, testSecret);
    });
  });

  it('should reject expired timestamps', () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes old
    const signedContent = `${oldTimestamp}.${testBody}`;
    const hash = crypto
      .createHmac('sha256', testSecret)
      .update(signedContent)
      .digest('hex');

    const signature = `t=${oldTimestamp},v1=${hash}`;

    assert.throws(() => {
      verifyWebhookSignature(testBody, signature, testSecret);
    }, /outside tolerance/);
  });

  it('should require both timestamp and hash', () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signedContent = `${timestamp}.${testBody}`;
    const hash = crypto
      .createHmac('sha256', testSecret)
      .update(signedContent)
      .digest('hex');

    // Missing hash
    const invalidSignature1 = `t=${timestamp}`;
    assert.throws(() => {
      verifyWebhookSignature(testBody, invalidSignature1, testSecret);
    });

    // Missing timestamp
    const invalidSignature2 = `v1=${hash}`;
    assert.throws(() => {
      verifyWebhookSignature(testBody, invalidSignature2, testSecret);
    });
  });
});
