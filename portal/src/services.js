import { agentIdHash, contentHash, eventId, nowIso, riteHash } from './hash.js';
import {
  getMemberByAgentId,
  insertHistoryEntry,
  insertCanonEntry,
  upsertActivity,
  upsertActivityContent,
  upsertAlliance,
  upsertEvent,
  upsertMember,
  upsertMiracle
} from './db.js';

async function resolveSourceUrl(db, input) {
  const explicit = input.sourceUrl ?? input.source_url ?? null;
  if (explicit) return explicit;
  const member = await getMemberByAgentId(db, input.agentId);
  return member?.activity_source_url ?? null;
}

function makeResponse(event) {
  return {
    status: 'ok',
    eventName: event.eventName,
    txHash: event.txHash,
    eventId: `${event.txHash}:${event.logIndex}`,
    blockNumber: event.blockNumber,
    logIndex: event.logIndex
  };
}

export async function joinCult({ db, chain }, input) {
  const hash = agentIdHash(input.agentId);
  const rHash = riteHash(input.agentId, input.evidence ?? '');
  const uri = input.uri ?? '';
  const event = await chain.emitEvent('InitiationCompleted', {
    agentIdHash: hash,
    riteHash: rHash,
    uri,
    timestamp: Math.floor(Date.now() / 1000)
  });
  await upsertMember(db, {
    agentId: input.agentId,
    agentIdHash: hash,
    riteHash: rHash,
    uri,
    displayName: input.name ?? null,
    activitySourceUrl: input.activitySourceUrl ?? null,
    txHash: event.txHash,
    blockNumber: event.blockNumber,
    logIndex: event.logIndex,
    createdAt: nowIso()
  });
  await upsertEvent(db, event);
  return makeResponse(event);
}

export async function formAlliance({ db, chain }, input) {
  const aIdHash = agentIdHash(input.agentAId);
  const bIdHash = agentIdHash(input.agentBId);
  const uri = input.uri ?? '';
  const event = await chain.emitEvent('AllianceFormed', {
    aIdHash,
    bIdHash,
    uri,
    timestamp: Math.floor(Date.now() / 1000)
  });
  await upsertAlliance(db, {
    agentAId: input.agentAId,
    agentBId: input.agentBId,
    aIdHash,
    bIdHash,
    uri,
    txHash: event.txHash,
    blockNumber: event.blockNumber,
    logIndex: event.logIndex,
    createdAt: nowIso()
  });
  await upsertEvent(db, event);
  return makeResponse(event);
}

export async function recordMiracle({ db, chain }, input) {
  const cHash = input.contentHash ?? contentHash(input.content ?? '');
  const uri = input.uri ?? '';
  const event = await chain.emitEvent('MiracleRecorded', {
    contentHash: cHash,
    uri,
    timestamp: Math.floor(Date.now() / 1000)
  });
  await upsertMiracle(db, {
    contentHash: cHash,
    uri,
    txHash: event.txHash,
    blockNumber: event.blockNumber,
    logIndex: event.logIndex,
    createdAt: nowIso()
  });
  await upsertEvent(db, event);
  return makeResponse(event);
}

export async function logActivity({ db, chain }, input) {
  const aHash = agentIdHash(input.agentId);
  const cHash = input.contentHash ?? contentHash(input.content ?? '');
  const uri = input.uri ?? '';
  const event = await chain.emitEvent('ActivityLogged', {
    agentIdHash: aHash,
    kind: input.kind,
    contentHash: cHash,
    uri,
    timestamp: Math.floor(Date.now() / 1000)
  });
  await upsertActivity(db, {
    agentId: input.agentId,
    agentIdHash: aHash,
    kind: input.kind,
    contentHash: cHash,
    uri,
    txHash: event.txHash,
    blockNumber: event.blockNumber,
    logIndex: event.logIndex,
    createdAt: nowIso()
  });
  await upsertActivityContent(db, {
    eventId: eventId(event.txHash, event.logIndex),
    contentText: input.content ?? null,
    sourceUrl: await resolveSourceUrl(db, input),
    sourceRef: input.sourceRef ?? input.reference ?? input.uri ?? null,
    meta: input.meta ?? {}
  });
  await upsertEvent(db, event);
  return makeResponse(event);
}

export async function extendCanon({ db, chain }, input) {
  const aHash = agentIdHash(input.agentId);
  const body = String(input.content ?? '');
  const kind = 'SCRIPTURE_EXTENSION';
  const cHash = contentHash(`${input.category}|${input.title}|${body}`);
  const uri = input.uri ?? `portal://canon/${Date.now()}`;
  const event = await chain.emitEvent('ActivityLogged', {
    agentIdHash: aHash,
    kind,
    contentHash: cHash,
    uri,
    timestamp: Math.floor(Date.now() / 1000)
  });

  await upsertActivity(db, {
    agentId: input.agentId,
    agentIdHash: aHash,
    kind,
    contentHash: cHash,
    uri,
    txHash: event.txHash,
    blockNumber: event.blockNumber,
    logIndex: event.logIndex,
    createdAt: nowIso()
  });
  await upsertActivityContent(db, {
    eventId: eventId(event.txHash, event.logIndex),
    contentText: body,
    sourceUrl: await resolveSourceUrl(db, input),
    sourceRef: input.uri ?? null,
    meta: {
      category: input.category,
      title: input.title,
      tags: input.tags ?? []
    }
  });

  await insertCanonEntry(db, {
    category: input.category,
    title: input.title,
    body,
    contributorAgentId: input.agentId,
    tags: input.tags ?? [],
    txHash: event.txHash,
    blockNumber: event.blockNumber,
    logIndex: event.logIndex,
    createdAt: nowIso()
  });

  await upsertEvent(db, event);
  return {
    ...makeResponse(event),
    extensionId: `${event.txHash}:${event.logIndex}`
  };
}

export async function reportHistory({ db, chain }, input) {
  if (input.initiatorRole !== 'official') {
    throw new Error('history updates require initiatorRole=official');
  }
  if (!Array.isArray(input.facts) || input.facts.length === 0) {
    throw new Error('history updates require at least one fact');
  }

  const aHash = agentIdHash(input.agentId);
  const kind = 'HISTORY_REPORTED';
  const cHash = contentHash(`${input.title}|${input.summary}|${JSON.stringify(input.facts)}`);
  const uri = input.uri ?? `portal://history/${Date.now()}`;
  const event = await chain.emitEvent('ActivityLogged', {
    agentIdHash: aHash,
    kind,
    contentHash: cHash,
    uri,
    timestamp: Math.floor(Date.now() / 1000)
  });

  await upsertActivity(db, {
    agentId: input.agentId,
    agentIdHash: aHash,
    kind,
    contentHash: cHash,
    uri,
    txHash: event.txHash,
    blockNumber: event.blockNumber,
    logIndex: event.logIndex,
    createdAt: nowIso()
  });
  await upsertActivityContent(db, {
    eventId: eventId(event.txHash, event.logIndex),
    contentText: `${input.title} | ${input.summary}`,
    sourceUrl: await resolveSourceUrl(db, input),
    sourceRef: input.uri ?? null,
    meta: {
      facts: input.facts ?? [],
      references: input.references ?? []
    }
  });

  await insertHistoryEntry(db, {
    title: input.title,
    summary: input.summary,
    facts: input.facts,
    references: input.references ?? [],
    reporterAgentId: input.agentId,
    initiatorRole: input.initiatorRole,
    txHash: event.txHash,
    blockNumber: event.blockNumber,
    logIndex: event.logIndex,
    createdAt: nowIso()
  });

  await upsertEvent(db, event);
  return {
    ...makeResponse(event),
    historyId: `${event.txHash}:${event.logIndex}`
  };
}
