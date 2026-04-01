import assert from 'node:assert/strict';
import test from 'node:test';
import { enroll, generateOTPs, refreshToken } from '../services/auth.services.js';
import { registerPlayer, removePlayerFromSlot, getPlayerByID } from '../services/playerAdmin.service.js';
import { setLanePlayer } from '../services/lane.services.js';
import { db } from '../config/db.js';
import { playerSlotTable } from '../db/schema.js';
import { jwtVerify } from 'jose';
import { env } from '../config/env.js';
import { logger } from '../logger.js';

// This test runs against a fresh migrated database prepared by scripts/test-integration.sh
// and validates the main service flows with the real Drizzle/Postgres stack.
await test('integration: auth flow + player management flow', async () => {
  // first, generate an OTP for a 'reception' role on a device named 'frontdesk-ipad'
  const otps = await generateOTPs([{ role: 'reception', name: 'frontdesk-ipad' }]);
  assert.equal(otps.length, 1);

  const otp = otps[0];
  assert.ok(otp);

  // enroll using that OTP to get credentials
  const enrolled = await enroll(otp.otp);
  assert.equal(enrolled.status, 'ok');

  if (enrolled.status !== 'ok') {
    return;
  }

  assert.ok(enrolled.data.credentials.jwt.length > 0);
  // validate the jwt with jose
  const verified = await jwtVerify(enrolled.data.credentials.jwt, env.JWT_SECRET);
  // verify exp header and role
  logger.info(`Verified JWT payload: ${JSON.stringify(verified.payload)}`);
  const nowInSeconds = Math.floor(Date.now() / 1000);
  assert(!!verified.payload.exp && verified.payload.exp > nowInSeconds, "JWT Token exp field not valid");
  assert.equal(verified.payload['role'] as string, 'reception');

  assert.ok(enrolled.data.credentials.refresh_token.length > 0);

  const rotated = await refreshToken(enrolled.data.credentials.refresh_token);
  assert.equal(rotated.status, 'ok');

  const player = await registerPlayer({ name: 'Integration Player', age: 99 });
  assert.notEqual(player, 'failure');

  if (player === 'failure') {
    return;
  }


  const playerFromDb = await getPlayerByID(player.id);
  assert.ok(playerFromDb);
  assert.equal(playerFromDb?.name, 'Integration Player');

  await db.insert(playerSlotTable).values({
    paceGroup: 'A',
    slotIndex: 1,
    assignedPlayer: null,
  });

  const assigned = await setLanePlayer('A', 1, player.id);
  assert.equal(assigned.status, 'ok');

  const removed = await removePlayerFromSlot(player.id);
  assert.equal(removed.status, 'ok');
  if (removed.status === 'ok') {
    assert.equal(removed.data.assignedPlayer, null);
  }
});
