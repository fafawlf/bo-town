/**
 * Client-side memory helpers
 * For MVP, memories are stored in localStorage + synced to server JSON
 */

import { getCharacterById, buildCharacterPrompt } from '../data/characterAdapter.js';
import { getLetters } from './api.js';

const UNREAD_KEY = 'bo_unread';
const LETTERS_KEY = 'bo_letters_read'; // legacy global read ids

/**
 * Chat is scoped per (persona, character). No shared fallback — different users never see the same thread.
 * personaIdOverride: pass from UI when you have it, so keys match even if active persona lags by a tick.
 */
function chatStorageKey(characterId, personaIdOverride = undefined) {
  const pid = personaIdOverride !== undefined && personaIdOverride !== null
    ? personaIdOverride
    : getActivePersonaId();
  if (pid == null) return `bo_chat_${characterId}`;
  return `bo_chat_${pid}_${characterId}`;
}

function lettersReadKey() {
  const pid = getActivePersonaId();
  return pid != null ? `bo_letters_read_${pid}` : LETTERS_KEY;
}
const PERSONA_KEY = 'bo_persona'; // legacy single-persona key
const PERSONAS_KEY = 'bo_personas';
const ACTIVE_PERSONA_KEY = 'bo_active_persona';

// Chat history (per persona + character)
export function getChatHistory(characterId, personaIdOverride = undefined) {
  try {
    const raw = localStorage.getItem(chatStorageKey(characterId, personaIdOverride));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveChatHistory(characterId, messages, personaIdOverride = undefined) {
  localStorage.setItem(chatStorageKey(characterId, personaIdOverride), JSON.stringify(messages));
}

export function clearChatHistory(characterId, personaIdOverride = undefined) {
  localStorage.removeItem(chatStorageKey(characterId, personaIdOverride));
}

// Unread tracking (per persona — same as chat)
function unreadStorageKey() {
  const pid = getActivePersonaId();
  return pid != null ? `bo_unread_${pid}` : UNREAD_KEY;
}

export function getUnreadCounts() {
  try {
    const raw = localStorage.getItem(unreadStorageKey());
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function markAsRead(characterId) {
  const counts = getUnreadCounts();
  delete counts[characterId];
  localStorage.setItem(unreadStorageKey(), JSON.stringify(counts));
}

export function addUnread(characterId, count = 1) {
  const counts = getUnreadCounts();
  counts[characterId] = (counts[characterId] || 0) + count;
  localStorage.setItem(unreadStorageKey(), JSON.stringify(counts));
}

// Letter read tracking (per active persona)
export function getReadLetterIds() {
  const key = lettersReadKey();
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    if (key !== LETTERS_KEY) {
      const legacy = localStorage.getItem(LETTERS_KEY);
      if (legacy) {
        localStorage.setItem(key, legacy);
        return JSON.parse(legacy);
      }
    }
    return [];
  } catch { return []; }
}

export function markLetterRead(letterId) {
  const ids = getReadLetterIds();
  if (!ids.includes(letterId)) {
    ids.push(letterId);
    localStorage.setItem(lettersReadKey(), JSON.stringify(ids));
  }
}

// Daily letter cron (王大凡 → Bo): at most once per local calendar day per persona
function letterCronStorageKey(personaId, characterId) {
  return `bo_letter_cron_${personaId}_${characterId}`;
}

export function localDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

export function shouldRunDailyLetterCron(personaId, characterId) {
  if (!personaId || !characterId) return false;
  try {
    const last = localStorage.getItem(letterCronStorageKey(personaId, characterId));
    return last !== localDateString();
  } catch { return true; }
}

export function markDailyLetterCronRun(personaId, characterId) {
  localStorage.setItem(letterCronStorageKey(personaId, characterId), localDateString());
}

/** Normalize chat messages with estimated ts for older saves */
export function normalizeMessagesWithTs(messages) {
  const now = Date.now();
  return messages.map((m, i) => ({
    ...m,
    ts: typeof m.ts === 'number' ? m.ts : (now - (messages.length - 1 - i) * 60000),
  }));
}

/** Recent diary + memory workspace text for letter decision */
export function getRecentContextForLetter(characterId) {
  const parts = [];
  const user = getMemFile(characterId, 'user');
  const relation = getMemFile(characterId, 'relation');
  const core = getMemFile(characterId, 'core');
  const summary = getMemFile(characterId, 'summary');
  if (user) parts.push(`关于对方：\n${user}`);
  if (relation) parts.push(`你和ta的关系：\n${relation}`);
  if (core) parts.push(`重要的共同记忆：\n${core}`);
  if (summary) parts.push(`更早的摘要：\n${summary}`);
  const recentDiary = getRecentDiary(characterId, 3);
  if (recentDiary.length) {
    parts.push(`最近日记：\n${recentDiary.map(e => `[${e.date}]\n${e.content}`).join('\n\n')}`);
  }
  return parts.join('\n\n') || '（暂无结构化记忆）';
}

// Persona / multi-profile support

function migrateLegacyPersona() {
  try {
    const legacy = localStorage.getItem(PERSONA_KEY);
    if (!legacy) return;
    const data = JSON.parse(legacy);
    if (data && !data.id) data.id = Date.now();
    const existing = getAllPersonas();
    if (existing.length === 0 && data) {
      saveAllPersonas([data]);
      setActivePersona(data.id);
    }
    localStorage.removeItem(PERSONA_KEY);
  } catch { /* ignore corrupt legacy data */ }
}

export function getAllPersonas() {
  migrateLegacyPersona();
  try {
    const raw = localStorage.getItem(PERSONAS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveAllPersonas(list) {
  localStorage.setItem(PERSONAS_KEY, JSON.stringify(list));
}

export function addPersona(data) {
  const persona = { ...data, id: Date.now() };
  const list = getAllPersonas();
  list.push(persona);
  saveAllPersonas(list);
  setActivePersona(persona.id);
  return persona;
}

export function updatePersona(id, data) {
  const list = getAllPersonas();
  const idx = list.findIndex(p => p.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...data };
    saveAllPersonas(list);
  }
}

export function deletePersona(id) {
  let list = getAllPersonas();
  list = list.filter(p => p.id !== id);
  saveAllPersonas(list);
  const activeId = getActivePersonaId();
  if (activeId === id) {
    setActivePersona(list.length > 0 ? list[0].id : null);
  }
}

export function setActivePersona(id) {
  if (id == null) {
    localStorage.removeItem(ACTIVE_PERSONA_KEY);
  } else {
    localStorage.setItem(ACTIVE_PERSONA_KEY, String(id));
  }
}

export function getActivePersonaId() {
  try {
    const raw = localStorage.getItem(ACTIVE_PERSONA_KEY);
    return raw ? Number(raw) : null;
  } catch { return null; }
}

export function getPersona() {
  const id = getActivePersonaId();
  if (id == null) return null;
  const list = getAllPersonas();
  return list.find(p => p.id === id) || null;
}

export function savePersona(data) {
  if (data.id) {
    updatePersona(data.id, data);
  } else {
    addPersona(data);
  }
}

export function hasPersona() {
  return getPersona() !== null;
}

// Workspace-style memory system (inspired by Rin architecture)
// Each character has 5 "memory files" stored in localStorage:
//   user     — facts about the user (auto-updated by reflect)
//   relation — how the character feels about the relationship
//   core     — important shared memories / moments
//   diary    — daily diary entries [{date, content}]
//   summary  — compressed long-term memory from old diary entries

const MEM_KEY = (charId, file) => {
  const pid = getActivePersonaId();
  return pid ? `bo_ws_${charId}_${pid}_${file}` : `bo_ws_${charId}_${file}`;
};
const MEMORY_FILES = ['user', 'relation', 'core', 'diary', 'summary'];

export function getMemFile(characterId, file) {
  try {
    const raw = localStorage.getItem(MEM_KEY(characterId, file));
    return raw ? JSON.parse(raw) : (file === 'diary' ? [] : '');
  } catch { return file === 'diary' ? [] : ''; }
}

export function setMemFile(characterId, file, content) {
  localStorage.setItem(MEM_KEY(characterId, file), JSON.stringify(content));
}

// Diary helpers
export function addDiaryEntry(characterId, content) {
  const diary = getMemFile(characterId, 'diary');
  const today = new Date().toISOString().slice(0, 10);
  const existing = diary.find(e => e.date === today);
  if (existing) {
    existing.content += '\n' + content;
  } else {
    diary.push({ date: today, content });
  }
  if (diary.length > 30) diary.splice(0, diary.length - 30);
  setMemFile(characterId, 'diary', diary);
}

export function getRecentDiary(characterId, days = 3) {
  const diary = getMemFile(characterId, 'diary');
  return diary.slice(-days);
}

// Apply reflect results from API (batch update all memory files)
export function applyReflect(characterId, result) {
  if (result.user) setMemFile(characterId, 'user', result.user);
  if (result.relation) setMemFile(characterId, 'relation', result.relation);
  if (result.core) setMemFile(characterId, 'core', result.core);
  if (result.diary_entry) addDiaryEntry(characterId, result.diary_entry);
  if (result.summary) setMemFile(characterId, 'summary', result.summary);
  if (result.diary_unlocked !== undefined) setMemFile(characterId, 'diary_unlocked', result.diary_unlocked);
}

export function isDiaryUnlocked(characterId) {
  return getMemFile(characterId, 'diary_unlocked') === true;
}

// Build the full memory prompt for system prompt injection
// Mirrors Rin's prompt.ts: reads all workspace files and assembles
export function buildMemoryPrompt(characterId) {
  const user = getMemFile(characterId, 'user');
  const relation = getMemFile(characterId, 'relation');
  const core = getMemFile(characterId, 'core');
  const summary = getMemFile(characterId, 'summary');
  const recentDiary = getRecentDiary(characterId, 3);

  let prompt = '';

  if (user) {
    prompt += `\n## 关于对方\n${user}\n`;
  }

  if (relation) {
    prompt += `\n## 你和ta的关系\n${relation}\n`;
  }

  if (core) {
    prompt += `\n## 重要的共同记忆\n${core}\n`;
  }

  if (summary) {
    prompt += `\n## 更早的记忆\n${summary}\n`;
  }

  if (recentDiary.length > 0) {
    prompt += `\n## 最近的日记\n`;
    for (const entry of recentDiary) {
      prompt += `[${entry.date}]\n${entry.content}\n\n`;
    }
  }

  return prompt;
}

// Get all current memory for sending to reflect API
export function getAllMemory(characterId) {
  const result = {};
  for (const file of MEMORY_FILES) {
    result[file] = getMemFile(characterId, file);
  }
  return result;
}

// Sliding window
const MAX_RECENT_MESSAGES = 20;

export function truncateMessages(messages) {
  if (messages.length <= MAX_RECENT_MESSAGES) return messages;
  return messages.slice(-MAX_RECENT_MESSAGES);
}

/** Payload for POST /api/letter/daily — requires active persona */
export async function collectDailyLetterPayload(characterId) {
  const personaId = getActivePersonaId();
  if (personaId == null) return null;

  const letters = await getLetters(characterId, personaId);
  const readIds = getReadLetterIds();
  const hasUnread = letters.some(l => !readIds.includes(l.id));

  const chat = getChatHistory(characterId);
  const normalized = normalizeMessagesWithTs(chat);
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const recent24 = normalized.filter(m => (m.ts ?? 0) >= cutoff);
  const older = normalized.filter(m => (m.ts ?? 0) < cutoff);

  const label = (role) => (role === 'user' ? 'Bo' : '王大凡');
  const linesRecent = recent24.map(m => `${label(m.role)}：${m.content}`).join('\n');
  const linesOlder = older.slice(-40).map(m => `${label(m.role)}：${m.content}`).join('\n');

  const chatTranscript = [
    recent24.length ? `【最近24小时内的聊天】\n${linesRecent}` : '',
    older.length ? `【更早的聊天（节选）】\n${linesOlder}` : '',
  ].filter(Boolean).join('\n\n') || '（暂无聊天记录）';

  const recentContext = getRecentContextForLetter(characterId);
  const char = getCharacterById(characterId);
  const characterPrompt = char
    ? buildCharacterPrompt(char, buildMemoryPrompt(characterId), getPersona())
    : '';

  return {
    character_id: characterId,
    persona_id: personaId,
    has_unread: hasUnread,
    chat_transcript: chatTranscript,
    recent_context: recentContext,
    character_prompt: characterPrompt,
  };
}
