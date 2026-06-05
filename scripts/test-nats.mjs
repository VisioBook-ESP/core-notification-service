/**
 * Manual test script for NATS event listeners.
 * Usage: node scripts/test-nats.mjs [subject]
 *
 * Examples:
 *   node scripts/test-nats.mjs                         → shows menu
 *   node scripts/test-nats.mjs payment.confirmed        → fires that event
 *   node scripts/test-nats.mjs notifications.send.email → fires that event
 */

import { connect, StringCodec } from 'nats';

const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';
const sc = StringCodec();

const PAYLOADS = {
  'notifications.send.email': {
    to: 'camilogzlez@gmail.com',
    subject: 'Test email via NATS',
    body: '<h1>Hello from NATS</h1><p>This email was triggered by a NATS event.</p>',
  },

  'notifications.send.template_email': {
    to: 'test@example.com',
    templateId: 'welcome',
    data: { userName: 'Alice' },
  },

  'notifications.send.push': {
    userId: '00000000-0000-0000-0000-000000000001',
    title: 'Test push via NATS',
    body: 'This push was triggered by a NATS event.',
    data: { action: 'test' },
  },

  'notifications.create.in_app': {
    userId: '00000000-0000-0000-0000-000000000001',
    type: 'system_announcement',
    title: 'Test in-app notification',
    body: 'This in-app notification was created via NATS.',
  },

  'generation.completed': {
    userId: '00000000-0000-0000-0000-000000000001',
    userEmail: 'test@example.com',
    generationId: 'gen-abc-123',
    title: 'My Test Video',
  },

  'generation.failed': {
    userId: '00000000-0000-0000-0000-000000000001',
    generationId: 'gen-abc-456',
    reason: 'Insufficient resources',
  },

  'content.shared': {
    userId: '00000000-0000-0000-0000-000000000001',
    sharedByName: 'Bob',
    contentId: 'content-xyz-789',
  },

  'payment.confirmed': {
    userId: '00000000-0000-0000-0000-000000000001',
    userEmail: 'camilogzlez@gmail.com',
    amount: 29.99,
    currency: 'EUR',
    paymentId: 'pay-stripe-test-123',
  },

  'user.registered': {
    userId: '00000000-0000-0000-0000-000000000002',
    email: 'newuser@example.com',
    name: 'Charlie',
    verificationToken: 'tok-abc-def-123',
  },

  'user.password_reset_requested': {
    userId: '00000000-0000-0000-0000-000000000001',
    email: 'test@example.com',
    resetToken: 'reset-tok-xyz-456',
  },
};

async function publish(subject, payload) {
  const nc = await connect({ servers: NATS_URL });
  nc.publish(subject, sc.encode(JSON.stringify(payload)));
  await nc.drain();
  console.log(`✅ Published to "${subject}"`);
  console.log('   Payload:', JSON.stringify(payload, null, 2));
}

async function main() {
  const subject = process.argv[2];

  if (!subject) {
    console.log('Available subjects:\n');
    Object.keys(PAYLOADS).forEach(s => console.log(`  ${s}`));
    console.log('\nUsage: node scripts/test-nats.mjs <subject>');
    console.log(`       NATS_URL=${NATS_URL}`);
    return;
  }

  if (!PAYLOADS[subject]) {
    console.error(`Unknown subject: "${subject}"`);
    console.error('Run without arguments to see available subjects.');
    process.exit(1);
  }

  try {
    await publish(subject, PAYLOADS[subject]);
  } catch (err) {
    console.error(`❌ Could not connect to NATS at ${NATS_URL}`);
    console.error(`   ${err.message}`);
    process.exit(1);
  }
}

main();
