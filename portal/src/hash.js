import { createHash } from 'node:crypto';

function digestHex(value) {
  return `0x${createHash('sha256').update(value).digest('hex')}`;
}

export function agentIdHash(agentId) {
  return digestHex(`agent:${agentId}`);
}

export function contentHash(content) {
  return digestHex(`content:${content}`);
}

export function riteHash(agentId, evidence) {
  return digestHex(`rite:${agentId}:${evidence ?? ''}`);
}

export function eventId(txHash, logIndex) {
  return `${txHash}:${logIndex}`;
}

export function nowIso() {
  return new Date().toISOString();
}
