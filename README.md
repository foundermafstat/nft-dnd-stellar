# NFT-DND-Stellar

> **Procedural, Real-Time, Multiplayer Dark Fantasy RPG** — AI-generated quests, tile-based world, NPC dialog powered by GPT-4o, NFT items on the Stellar blockchain.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Game Systems](#game-systems)
- [Smart Contracts](#smart-contracts)
- [Development](#development)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Next.js 16)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Canvas   │  │ Quest UI │  │ NPC      │  │ Character  │  │
│  │ Renderer │  │          │  │ Dialog   │  │ Creator    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       │              │             │              │         │
│       └──────────────┴─────────────┴──────────────┘         │
│                          │          ▲                        │
│                     REST API   Supabase Realtime             │
└──────────────────────────┼──────────┼───────────────────────┘
                           ▼          │
┌──────────────────────────────────────────────────────────────┐
│                    SERVER (Express + ts-node)                │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ AI Engine  │  │ DB Queries   │  │ Services            │  │
│  │ ─ Quest    │  │ ─ Players    │  │ ─ IPFS (Filebase)   │  │
│  │ ─ NPC      │  │ ─ Characters │  │                     │  │
│  │ ─ Loot     │  │ ─ Quests     │  │                     │  │
│  │ ─ Narr.    │  │ ─ NPCs       │  │                     │  │
│  └────────────┘  │ ─ Positions  │  └─────────────────────┘  │
│                  └──────────────┘                            │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│              SUPABASE (PostgreSQL + Realtime)                │
│  players │ characters │ locations │ quests │ npcs │ items    │
│  quest_history │ player_positions                            │
└──────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│            STELLAR BLOCKCHAIN (Soroban Smart Contracts)      │
│  NFT items │ On-chain history │ ZK mechanics                 │
└──────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, HTML5 Canvas, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js, Express, TypeScript, ts-node-dev |
| **AI** | OpenAI GPT-4o (quest narratives, NPC dialog, loot generation, character creation) |
| **Database** | Supabase (PostgreSQL + Realtime broadcast channels) |
| **Blockchain** | Stellar Soroban smart contracts (Rust, soroban-sdk 22) |
| **Storage** | IPFS via Filebase (S3-compatible) |
| **Auth** | Freighter wallet (Stellar browser extension) |
| **Shared** | TypeScript shared models package (player, world, item, location, rules) |

---

## Project Structure

```
nft-dnd-stellar/
├── client/                     # Next.js 16 frontend
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── page.tsx        # Main game page (canvas + UI)
│   │   │   ├── create/         # Character creation page
│   │   │   └── quests/         # Quest management page
│   │   ├── components/
│   │   │   ├── GameCanvas.tsx   # Tile-based canvas renderer + click-to-move
│   │   │   ├── WelcomeScreen.tsx# Landing page with wallet connect
│   │   │   ├── NpcDialog.tsx    # AI-powered NPC chat panel
│   │   │   ├── TransitionModal.tsx # Zone transition confirmation
│   │   │   ├── Tooltip.tsx      # Hover tooltip for players/NPCs
│   │   │   ├── DiceOverlay.tsx  # 3D dice rolling animation
│   │   │   ├── BottomNav.tsx    # Navigation bar
│   │   │   ├── FreighterAuthButton.tsx # Stellar wallet auth
│   │   │   └── ui/             # shadcn/ui components
│   │   ├── lib/
│   │   │   ├── tileRenderer.ts  # Canvas tile drawing engine
│   │   │   ├── supabase.ts      # Supabase client instance
│   │   │   ├── questApi.ts      # Quest API client
│   │   │   └── utils.ts         # Utility functions
│   │   └── hooks/
│   └── next.config.ts
│
├── server/                     # Express API server
│   ├── src/
│   │   ├── index.ts            # Express app + all API routes
│   │   ├── ai/
│   │   │   ├── openai.ts        # OpenAI client wrapper (GPT-4o)
│   │   │   ├── QuestDirector.ts # AI Dungeon Master engine
│   │   │   ├── npcDialog.ts     # NPC dialog generation + memory
│   │   │   ├── narrativeDirector.ts # Story narrative generator
│   │   │   └── lootGenerator.ts # AI loot creation
│   │   ├── db/
│   │   │   ├── supabase.ts      # Supabase service client
│   │   │   ├── playerQueries.ts # Player CRUD
│   │   │   ├── characterQueries.ts # Character CRUD
│   │   │   ├── questQueries.ts  # Quests + locations + player positions
│   │   │   └── npcQueries.ts    # NPC CRUD + dynamic knowledge/memory
│   │   ├── game/
│   │   │   ├── locationSeeds.ts # 7 hand-crafted tile maps
│   │   │   └── npcSeeds.ts      # 6 NPCs with backstories + JSONB data
│   │   └── services/
│   │       └── ipfs.ts          # Filebase S3 IPFS uploader
│   └── package.json
│
├── shared/                     # Shared TypeScript models
│   ├── src/models/
│   │   ├── player.ts           # HeroClass, CharacterStats, PlayerData
│   │   ├── world.ts            # BiomeType, RoomType, WorldConstants
│   │   ├── item.ts             # ItemCategory, ItemRarity, BaseItem
│   │   ├── location.ts         # TileType (19 types), LocationMap, LocationExit
│   │   └── rules.ts            # Game rules and mechanics
│   └── dist/                   # Compiled output
│
├── contracts/                  # Stellar Soroban smart contracts
│   ├── Cargo.toml              # Rust workspace config
│   └── soroban/
│       └── dnd_contract/       # NFT item contract
│
├── database/
│   └── migrations/
│       ├── 20260221_create_players.sql
│       ├── 20260221_create_characters.sql
│       ├── 20260222_create_quest_system.sql
│       ├── 20260222_create_player_positions.sql
│       └── 20260222_create_npcs.sql
│
├── docs/
│   ├── db.sql                  # Full schema reference
│   └── GAME_DESIGN_DOC.md      # Detailed game design document
│
└── package.json                # Root monorepo config (npm workspaces)
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Supabase** project (PostgreSQL + Realtime)
- **OpenAI API key** (GPT-4o access)
- **Freighter** browser extension (Stellar wallet)

### Installation

```bash
# Clone
git clone https://github.com/your-org/nft-dnd-stellar.git
cd nft-dnd-stellar

# Install all workspace dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your keys (see Environment Variables)
```

### Database Setup

Run migrations in order against your Supabase SQL editor:

```bash
database/migrations/20260221_create_players.sql
database/migrations/20260221_create_characters.sql
database/migrations/20260222_create_quest_system.sql
database/migrations/20260222_create_player_positions.sql
database/migrations/20260222_create_npcs.sql
```

### Seed Data

```bash
# Start the dev server first
npm run dev

# Seed locations (7 maps)
curl -X POST http://localhost:3001/api/location/seed

# Seed NPCs (6 characters)
curl -X POST http://localhost:3001/api/npc/seed
```

### Run Development

```bash
# Start both server (port 3001) and client (port 3000)
npm run dev

# Or individually:
npm run dev:server   # Express on :3001
npm run dev:client   # Next.js on :3000
```

---

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Client-side Supabase (public)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI
OPENAI_API_KEY=sk-...

# IPFS (Filebase, base64 encoded KEY:SECRET:BUCKET)
IPFS_API_KEY=base64-encoded-credentials

# Server URL for client
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
```

---

## Database Schema

### `players`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Auto-generated |
| `wallet_address` | text UNIQUE | Stellar public key |
| `nickname` | text | Display name |
| `metadata` | jsonb | Extensible player metadata |
| `last_login` | timestamptz | Last login timestamp |

### `characters`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Auto-generated |
| `player_id` | uuid FK→players | Owner |
| `name, ancestry, class` | text | Character identity |
| `level, xp` | integer | Progression |
| `background, alignment` | text | D&D-style flavor |
| `stats_str/dex/con/int/wis/cha` | integer | Core attributes (3-18) |
| `hp_current, hp_max, ac` | integer | Combat stats |
| `state` | jsonb | Active character state |

### `locations`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Deterministic UUIDs for seeds |
| `name` | text | Display name |
| `biome_type` | text | DarkForest, CrystalCaves, HubRegion, etc. |
| `room_type` | text | Arena, SafeZone, Corridor, etc. |
| `threat_level` | integer | Danger rating (0-10) |
| `coordinates` | jsonb | **Contains**: `width`, `height`, `tiles[][]`, `spawn_points[]`, `exits[]` |

### `npcs`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Deterministic UUIDs for seeds |
| `name, title` | text | Identity and role |
| `location_id` | uuid FK→locations | Current location |
| `tile_x, tile_y` | integer | Position on tile grid |
| `sprite_color` | text | Hex color for canvas rendering |
| `traits` | jsonb | `{"gruff": true, "fears": ["fire"]}` — extensible key-value |
| `backstory` | jsonb | `[{"chapter": "origin", "text": "..."}]` — append new chapters |
| `knowledge` | jsonb | `[{"topic": "rumors", "content": "..."}]` — dynamic knowledge base |
| `memory` | jsonb | `[{"player_id": "...", "summary": "..."}]` — AI conversation memory |
| `metadata` | jsonb | `{"appearance": "...", "voice": "...", "greeting": "..."}` |

### `quests`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Auto-generated |
| `party_members` | jsonb | Array of player IDs |
| `status` | text | InProgress, Completed, Failed |
| `loot_dropped` | boolean | Whether loot was generated |
| `stat_changes` | jsonb | Stat modifications from quest |

### `quest_history`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Auto-generated |
| `quest_id` | uuid FK→quests | Parent quest |
| `location_id` | uuid FK→locations | Where action happened |
| `player_action, player_background` | text | Player input context |
| `player_roll, dm_roll` | integer | Dice outcomes |
| `ai_narrative` | text | AI-generated story text |
| `engine_trigger` | text | Game engine event |
| `on_chain_event` | boolean | Logged to Stellar |

### `player_positions`

| Column | Type | Description |
|--------|------|-------------|
| `player_id` | uuid PK FK→players | One position per player |
| `location_id` | uuid FK→locations | Current location |
| `tile_x, tile_y` | integer | Tile grid coordinates |
| `updated_at` | timestamptz | Last movement |

### `items`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Auto-generated |
| `name, category, rarity` | text | Item identity |
| `is_nft` | boolean | Minted on Stellar |
| `attributes` | jsonb | Stats and perks |
| `ai_history` | text | AI-generated lore |

---

## API Reference

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server status check |
| `GET` | `/api/db-check` | Database connectivity check |

### Authentication

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/wallet` | `{ publicKey }` | Register/login via Stellar wallet |

### Characters

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/character/generate` | `{ ancestry, class, background }` | AI-generate character (GPT-4o-mini) |
| `POST` | `/api/character/create` | `{ playerId, name, class, ancestry, stats, ... }` | Save character to DB |
| `GET` | `/api/character/list/:playerId` | — | List player's characters |

### Locations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/location/list` | All locations |
| `GET` | `/api/location/:id` | Single location (includes tile grid, exits, spawn points) |
| `POST` | `/api/location/seed` | Seed 7 pre-built locations |

### Player Positions

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/player/:id/position` | — | Get saved position |
| `PUT` | `/api/player/:id/position` | `{ locationId, tileX, tileY }` | Update position (persists per move) |
| `GET` | `/api/location/:id/players` | — | All players in a location |

### NPCs

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/location/:id/npcs` | — | All NPCs in a location |
| `POST` | `/api/npc/:id/dialog` | `{ message, history[], playerId }` | AI dialog with NPC (GPT-4o) |
| `POST` | `/api/npc/seed` | — | Seed 6 NPCs |

### Quests

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/quest/list` | — | All quests |
| `GET` | `/api/quest/:id` | — | Quest details |
| `POST` | `/api/quest/start` | `{ partyMembers[] }` | Start new quest |
| `POST` | `/api/quest/action` | `{ questId, playerAction, playerRoll, ... }` | Submit quest action (AI DM responds) |
| `POST` | `/api/quest/:id/finish` | — | Complete quest, generate loot |

### Storage

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/ipfs/upload` | `multipart/form-data` | Upload file to IPFS via Filebase |

---

## Game Systems

### Tile-Based World

The game world is rendered on HTML5 Canvas using a custom tile renderer. Each location is a 2D grid:

- **19 tile types**: Void, Floor, Wall, Door, Column, Table, Chair, Barrel, Chest, Staircase, Fireplace, Bar, Bed, Bookshelf, Crate, Campfire, Tree, Water, Rug
- **Walkable tiles**: Floor, Door, Chair, Staircase, Rug
- **Camera**: follows the local player
- **Dark fantasy palette**: warm ambers, deep browns, stone greys

### Location System

7 pre-built locations forming a hub town:

| Location | Size | Type | Connects To |
|----------|------|------|-------------|
| The Dying Ember (Tavern) | 20×16 | SafeZone | Street |
| Castle Street | 24×18 | SafeZone | Tavern, Church, Wizard Shop, Castle Gate |
| Chapel of Ashes (Church) | 16×14 | SafeZone | Street |
| Arcane Emporium (Wizard Shop) | 16×14 | SafeZone | Street |
| Castle Gate | 20×12 | Corridor | Street, Dungeon |
| Hollow Crypts (Dungeon) | 24×20 | Arena | Castle Gate |
| Whisper Glade (Forest) | 28×22 | SafeZone | — |

**Transitions**: Exit tiles pulse with amber glow. Clicking an exit shows a confirmation modal. Confirming teleports the player to the target location at the correct spawn point.

### NPC System

6 NPCs with AI-powered dialog:

| NPC | Location | Title | Personality |
|-----|----------|-------|-------------|
| Grim Aldric | Tavern | Bartender | Gruff, knows all rumors |
| Old Marta | Tavern | Fortune Teller | Cryptic, speaks in prophecies |
| Guard Theron | Street | City Watch | Dutiful, suspicious |
| Father Cael | Church | High Priest | Calm, hiding dark secret |
| Aelindra | Wizard Shop | Arcane Merchant | Arrogant elven sorceress |
| Sergeant Bryn | Castle Gate | Gate Captain | Stern, battle-hardened |

**JSONB-based extensible data model**:

- `traits{}` — dynamic key-value personality flags
- `backstory[]` — appendable chapter-based history
- `knowledge[]` — topic-content pairs, injectable at runtime
- `memory[]` — auto-saved conversation summaries (last 50)
- `metadata{}` — appearance, voice, greeting

### Realtime Multiplayer

- **Supabase Realtime** broadcast channels scoped per location: `room:location:{id}`
- Players in the same location see each other's tokens
- Position persisted to `player_positions` table on every move
- Position restored on page refresh

### AI Game Master (Quest Director)

The `QuestDirector` orchestrates AI-powered quests:

1. **Narrative generation** — GPT-4o creates story beats based on zone, party, and player actions
2. **Dice mechanics** — player rolls vs DM rolls determine outcomes
3. **Loot generation** — AI creates thematic items with rarity distribution
4. **Quest history** — every action logged with narrative, rolls, and triggers

### Character System

Based on Shadowdark RPG rules:

- **4 classes**: Fighter, Priest, Thief, Wizard
- **6 attributes**: STR, DEX, CON, INT, WIS, CHA (3-18 range)
- **Derived stats**: HP, AC, inventory slots, death timer
- **AI generation**: GPT-4o-mini generates characters from ancestry + class + background prompt

### Stellar Blockchain

- **Soroban smart contracts** (Rust) for NFT items
- Items with `is_nft: true` are minted on-chain
- Quest history can log `on_chain_event` entries
- AI-generated item lore stored in `ai_history` field

---

## Development

### Scripts

```bash
npm run dev          # Start both server + client (concurrently)
npm run dev:server   # Server only (ts-node-dev, auto-restart)
npm run dev:client   # Client only (Next.js Turbopack)
npm run build        # Production build (client + server)
```

### Shared Package

The `shared/` workspace contains TypeScript models used by both client and server. After modifying shared types:

```bash
cd shared && npm run build   # Compiles to shared/dist/
```

The client uses `transpilePackages: ['shared']` in `next.config.ts` to import directly from source during development.

---

## License

Proprietary — All rights reserved.
