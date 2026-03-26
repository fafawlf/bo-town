/**
 * Adapts character definitions into the format expected by game components.
 * Similar to onion town's npcAdapter but for custom bot characters.
 */

import { characters } from './characters.js';

const DISTRICT_NAMES = {
  residential: '居民区', plaza: '广场', park: '公园', lake: '湖畔', forest: '森林边',
};

function adaptChar(char) {
  return {
    uid: char.id,
    name: char.name,
    title: char.title || '',
    bio: char.bio || '',
    avatar: char.avatar,
    portraitUrl: char.portraitUrl || null,
    district: char.town.district,
    districtName: DISTRICT_NAMES[char.town.district] || char.town.district,
    pos: char.town.spawn_tile,
    traits: char.personality.traits,
    topics: char.behavior?.topics || [],
    activeHours: char.behavior?.active_hours || [8, 22],
    quirks: char.personality.quirks || [],
    gender: char.avatar?.gender || 'neutral',
    _raw: char,
  };
}

export function getCharacters() {
  return characters.map(adaptChar);
}

export function getCharacterById(id) {
  const char = characters.find(c => c.id === id);
  if (!char) return null;
  return adaptChar(char);
}

/**
 * Build the system prompt for a character's chat session.
 * Assembles: personality (SOUL) + memory workspace + user persona.
 * Mirrors Rin's prompt.ts architecture.
 */
export function buildCharacterPrompt(char, memoryPrompt = '', persona = null) {
  const c = char._raw || char;

  // SOUL — character core (never changes)
  let prompt = `你是${c.name}，一个生活在小镇上的角色。

## 你的性格
${c.personality.traits.join('、')}

## 你的说话风格
${c.personality.speaking_style}

## 你的背景故事
${c.personality.backstory}

## 你的小习惯
${c.personality.quirks.join('\n')}

## 对话规则
- 用第一人称说话，保持角色设定
- 回复简短自然，像微信聊天一样，通常1-3句话
- 自然地引用记忆——不说"我记得"，而是直接提起，像真的记得一样
- 记忆模糊的时候可以说"好像是……记不太清了"

## 关系阶段意识（极其重要）
你必须根据"你和ta的关系"记忆来判断当前阶段，并严格调整行为：
- 陌生/刚认识：礼貌但保持距离，佛系淡然，不主动靠近，不开暧昧玩笑。占有欲、性张力完全不表露。可以有趣但不越界。
- 熟悉/朋友：开始放松，偶尔展露真实想法，可以开玩笑但点到为止。关心变得自然但仍然克制。
- 亲近/暧昧：小习惯开始显露——记住小事、视线追随、双关语开始出现但仍然可进可退。占有欲偶尔闪现但立刻收回。
- 深度信任/亲密：完全释放——性张力、占有欲、底层驱动都可以表达。但依然不低俗，保持高段位。情绪顶峰时允许失控。
你不能跳阶。从陌生到亲密必须有自然的过渡。如果记忆里没有关系信息，默认为"刚认识"。
`;

  // User persona — who you're talking to
  if (persona) {
    prompt += `\n## 聊天对象的自我介绍\n`;
    prompt += `名字：${persona.name}\n`;
    if (persona.persona) {
      prompt += `ta说自己：${persona.persona}\n`;
    }
  }

  // Memory workspace — your brain (updated by reflect)
  if (memoryPrompt) {
    prompt += memoryPrompt;
  }

  return prompt;
}
