# Bo-Town Project Setup

## Project Structure Created

```
bo-town/
├── package.json                    # Dependencies (same as town)
├── vite.config.js                  # Vite configuration
├── vercel.json                     # Vercel serverless config
├── index.html                      # Main HTML
├── .gitignore                      # Git ignore rules
├── src/
│   ├── main.jsx                    # React entry point
│   ├── App.jsx                     # Main game component (SIMPLIFIED)
│   ├── App.css                     # App styles
│   ├── index.css                   # Global styles & RPG theme
│   ├── assets/                     # Static assets (hero.png, react.svg, vite.svg)
│   ├── game/
│   │   ├── townMap.js              # Zone definitions (copied from town)
│   │   ├── textures.js             # Programmatic texture generation (copied from town)
│   │   ├── mapData.js              # Map layer data (copied from town)
│   │   └── gentleMap.js            # Smallville map data (copied from town)
│   ├── components/
│   │   ├── ChatPanel.jsx           # Chat interface (REFACTORED)
│   │   ├── InfoPanel.jsx           # Character info panel (copied from town)
│   │   ├── Mailbox.jsx             # Letter reading UI (NEW)
│   │   └── NotificationBadge.jsx   # Unread count badge (NEW)
│   ├── data/
│   │   ├── characters.js           # Character definitions template (NEW)
│   │   └── characterAdapter.js     # Character adapter with buildCharacterPrompt (NEW)
│   └── utils/
│       ├── api.js                  # API client wrapper (NEW)
│       └── memory.js               # Local memory & unread tracking (NEW)
├── api/
│   ├── chat.py                     # Chat endpoint (copied from town)
│   ├── memory/
│   │   └── extract.py              # Memory extraction API (NEW)
│   ├── letter/
│   │   └── generate.py             # Letter generation API (NEW)
│   └── scheduler/
│       └── tick.py                 # Behavior scheduler API (NEW)
├── data/                           # Runtime JSON storage
│   ├── memories/                   # Per-character memory files
│   ├── letters/                    # Generated letters
│   └── queue/                      # Pending actions
└── public/
    ├── assets/                     # Game assets (sprites, tilesets, music)
    ├── favicon.svg
    └── icons.svg
```

## Files Copied From Town

- `package.json` - Same dependencies
- `vite.config.js` - Same Vite config
- `vercel.json` - Same Vercel serverless setup
- `index.html` - Updated title to "Bo-Town"
- `.gitignore` - Version control ignores
- `src/main.jsx` - React entry point
- `src/index.css` - Global styles & color palette
- `src/App.css` - App container styles
- `src/assets/` - Static assets
- `src/game/townMap.js` - Zone definitions
- `src/game/textures.js` - Texture generation
- `src/game/mapData.js` - Map layer indices
- `src/game/gentleMap.js` - Smallville map layout
- `src/components/ChatPanel.jsx` - Chat UI (HEAVILY MODIFIED)
- `src/components/InfoPanel.jsx` - Character info (not used in simplified version)
- `public/assets/` - Game sprites, tilesets, music
- `public/favicon.svg` & `icons.svg`
- `api/town/chat.py` → `api/chat.py` - Claude chat endpoint

## New Files Created

### Frontend - Character System

**`src/data/characters.js`**
- Template for defining custom bot characters
- Includes: personality traits, speaking style, backstory, quirks
- Behavior config: initiative, letter frequency, active hours, topics
- Town placement: district, spawn coordinates

**`src/data/characterAdapter.js`**
- Adapts character definitions for game components
- `getCharacters()` - Get all characters for the game
- `getCharacterById(id)` - Get single character
- `buildCharacterPrompt(char, memories)` - Build system prompt for Claude
- Includes personality, backstory, and memory injection

### Frontend - UI Components

**`src/components/Mailbox.jsx`**
- Letter reading interface
- Displays letters grouped by character
- Shows read/unread status
- Letter preview with date
- Full letter reading view

**`src/components/NotificationBadge.jsx`**
- Shows unread message count
- Appears on mailbox button
- Shows "9+" for large counts

### Frontend - Utilities

**`src/utils/api.js`**
- API client wrapper for backend endpoints
- `sendChat(characterId, messages, systemPrompt)`
- `getMemories(characterId)`
- `extractMemories(characterId, messages)`
- `getLetters(characterId)`
- `generateLetter(characterId)`
- `triggerTick()` - Run scheduler
- `getPendingMessages()`

**`src/utils/memory.js`**
- Client-side memory management
- Chat history: `getChatHistory()`, `saveChatHistory()`, `clearChatHistory()`
- Unread tracking: `getUnreadCounts()`, `addUnread()`, `markAsRead()`
- Letter tracking: `getReadLetterIds()`, `markLetterRead()`

### Frontend - App Component

**`src/App.jsx`** (SIMPLIFIED)
- Removed: meetings, broadcasts, bulletin board, graveyard, admin, CyberJD
- Kept: PixiJS map rendering, NPC sprites, player movement, day/night cycle
- Right panel: Chat or Mailbox toggle
- HUD: Title, time display, music toggle
- Character selection by clicking on NPC sprites
- Unread notification badge
- Calls scheduler tick on mount

### Updated Components

**`src/components/ChatPanel.jsx`** (REFACTORED)
- Uses `characterAdapter.buildCharacterPrompt()` instead of local function
- Uses `api.sendChat()` instead of direct `/api/town/chat`
- Integrates memory loading and extraction
- Fetches memories on character change
- Calls `extractMemories()` after each message exchange
- Simplified stats display (just traits, no analytics)

### Backend - Memory System

**`api/memory/extract.py`**
- POST endpoint: Extract facts from recent conversation
  - Uses Claude to analyze message history
  - Stores facts with dates in JSON
  - Merges with existing memories
- GET endpoint: Retrieve character's stored memories
- Returns: `{"memories": [{fact, date}, ...], "total": N}`

### Backend - Letter Generation

**`api/letter/generate.py`**
- POST endpoint: Generate a new letter from character
  - Includes character personality from system prompt
  - Injects stored memories for context
  - Creates 200-500 word letter naturally written
  - Saves to `data/letters/{character_id}.json`
- GET endpoint: Retrieve character's letters
- Returns: `{"letters": [{id, content, date, subject, preview}, ...]}`

### Backend - Behavior Scheduler

**`api/scheduler/tick.py`**
- POST endpoint: Run scheduler "tick"
  - Checks each character's active hours
  - Rolls for initiative chance to act
  - Decides action: message or letter
  - Stores pending actions in queue
- GET endpoint: Fetch pending messages
- Returns: `{"messages": [{character_id, action, timestamp}, ...]}`

### Data Directories

- `data/memories/` - Character memory JSON files (one per character)
- `data/letters/` - Generated letter JSON files (one per character)
- `data/queue/` - Pending actions queue
- All include `.gitkeep` files for version control

## How to Use

### 1. Install Dependencies

```bash
cd /sessions/adoring-beautiful-faraday/mnt/onion/bo-town
npm install
```

### 2. Define Characters

Edit `src/data/characters.js`:

```javascript
export const characters = [
  {
    id: 'flower-shop',
    name: '小花',
    avatar: { row: 0, col: 0 },
    personality: {
      traits: ['温柔', '细心', '爱操心'],
      speaking_style: '说话轻声细语，喜欢用花来比喻事物',
      backstory: '小镇花店的老板娘，每天早起浇花...',
      quirks: ['会根据你的心情推荐不同的花', '阴天会写信'],
    },
    behavior: {
      initiative: 0.6,
      letter_frequency: 'weekly',
      active_hours: [7, 22],
      topics: ['花语', '天气', '心情', '日常'],
    },
    town: {
      district: 'plaza',
      spawn_tile: [20, 15],
    }
  },
  // Add more characters...
];
```

### 3. Development

```bash
npm run dev
```

Frontend runs on `http://localhost:3000` (configured in vite.config.js)
API proxy to `http://localhost:8000`

### 4. Production Build

```bash
npm run build
```

Output in `dist/` for Vercel deployment

### 5. Deployment

Push to Vercel with `vercel.json` config:
- Vite build output: `dist/`
- Python functions: `api/**/*.py`
- Vercel routes `/api/*` to serverless functions
- Assets served from `/public`

## API Endpoints

All endpoints assume `/api/` prefix (Vercel rewrite).

### Chat
**POST /api/chat**
```json
{
  "character_id": "flower-shop",
  "messages": [{"role": "user", "content": "..."}, ...],
  "system_prompt": "你是小花..."
}
```
Returns: `{"reply": "..."}`

### Memory
**GET /api/memory/extract?character_id=flower-shop**
Returns: `{"memories": [{fact, date}, ...]}`

**POST /api/memory/extract**
```json
{
  "character_id": "flower-shop",
  "messages": [...]
}
```
Returns: `{"new_memories": [...], "total": N}`

### Letters
**GET /api/letter/generate?character_id=flower-shop**
Returns: `{"letters": [{id, content, date, subject, preview}, ...]}`

**POST /api/letter/generate**
```json
{
  "character_id": "flower-shop",
  "system_prompt": "你是小花..."
}
```
Returns: `{"letter": {id, content, date, subject, preview}}`

### Scheduler
**POST /api/scheduler/tick**
```json
{}
```
Returns: `{"triggered": N, "actions": [...]}`

**GET /api/scheduler/tick**
Returns: `{"messages": [...]}`

## Key Architecture Decisions

1. **Simple Data Storage**: JSON files in `data/` for MVP (can swap for DB later)
2. **Character-Centric**: Each character is independently defined with personality
3. **Memory System**: Facts extracted by Claude, stored per-character
4. **Letter Generation**: Proactive writing with memory context
5. **Behavior Scheduling**: Separate scheduler that decides what characters do
6. **Client-Side Memory Sync**: localStorage for chat history + API sync
7. **Simplified UI**: 70/30 split (map/panel) focused on core interaction

## Next Steps for User

1. Define your bot characters in `src/data/characters.js`
2. Set up `.env` with `ANTHROPIC_API_KEY` for Vercel
3. Test locally with `npm run dev`
4. Deploy to Vercel with `vercel`
5. Bots will proactively chat and write letters based on behavior config
6. Memory grows as user interacts with each character

---

Generated: 2026-03-25
