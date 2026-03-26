/**
 * API client for bo-town backend
 */

const API_BASE = '';

/** Only role + content — extra fields (e.g. ts) break Anthropic messages API */
function sanitizeChatMessages(messages) {
  return (messages || []).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: typeof m.content === 'string' ? m.content : String(m.content ?? ''),
  }));
}

export async function sendChat(characterId, messages, systemPrompt) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      character_id: characterId,
      messages: sanitizeChatMessages(messages),
      system_prompt: systemPrompt,
    }),
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Chat API: invalid JSON (${res.status})`);
  }
  if (!res.ok) {
    throw new Error(data?.error || `Chat API error: ${res.status}`);
  }
  if (data.error) {
    throw new Error(data.error);
  }
  if (data.reply == null || String(data.reply).trim() === '') {
    throw new Error('模型未返回内容');
  }
  return data;
}

export async function reflect(messages, charContext, currentMemory) {
  const res = await fetch(`${API_BASE}/api/memory/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      char_context: charContext,
      current_memory: currentMemory,
    }),
  });
  if (!res.ok) throw new Error(`Reflect API error: ${res.status}`);
  return res.json();
}

export async function getLetters(characterId, personaId = 'default') {
  const q = new URLSearchParams({
    character_id: characterId,
    persona_id: String(personaId),
  });
  const res = await fetch(`${API_BASE}/api/letter/generate?${q}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.letters || [];
}

export async function generateLetter(characterId, personaId = 'default') {
  const res = await fetch(`${API_BASE}/api/letter/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ character_id: characterId, persona_id: personaId }),
  });
  if (!res.ok) throw new Error(`Letter API error: ${res.status}`);
  return res.json();
}

/** Daily cron: 王大凡根据聊天与记忆决定是否写信（服务端） */
export async function runDailyLetter(payload) {
  const res = await fetch(`${API_BASE}/api/letter/daily`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Daily letter API: ${res.status}`);
  return res.json();
}

export async function triggerTick() {
  const res = await fetch(`${API_BASE}/api/scheduler/tick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Scheduler API error: ${res.status}`);
  return res.json();
}

export async function getPendingMessages() {
  const res = await fetch(`${API_BASE}/api/scheduler/tick?action=pending`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.messages || [];
}
