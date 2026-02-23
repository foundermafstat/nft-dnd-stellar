# NFT-DND-Stellar

> **Procedural, Real-Time, Multiplayer Dark Fantasy RPG** — AI-generated quests, tile-based world, NPC dialog powered by GPT-4o, NFT items on the Stellar blockchain. Built on Shadowdark RPG rules.

---

DND ARENA ZK
CB4DFJLB34UCIEAOBIKLLEJ6DMIUBBNUKYBKBZIDJILUFR2AQCNVWN4Z

DND Token: CB2RIG4PPLQNW4EBL6WRWU4VSHO4GCH722XT4BLXMJ7NJM34ZI2OC2RU
Fate Verifier: CCIGFXIXSFUCYWRJVCXFOBAC2KRS4C4AQZRFGSM6A7H3KRXV552CGMCW
Relic Registry: CAOXCTX57AJJA6D2QN5UXDF3OHDZBDBS2J6SKSHI7TOFTMKGKD5Y5H2X
Adventure Vault: CCIIZ2MFPGV3SIRM3K2ZJFVPG6LMDCROTYUDTKI2GB6OHWZLRSSTGQ6J

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Technical Systems](#technical-systems)
  - [AI Pipeline](#1-ai-pipeline)
  - [Tile-Based World Engine](#2-tile-based-world-engine)
  - [Character System](#3-character-system--shadowdark-rules)
  - [Item & Inventory System](#4-item--inventory-system)
  - [Ability & Skill System](#5-ability--skill-system)
  - [NPC System](#6-npc-system--ai-dialog)
  - [Quest Director](#7-quest-director--ai-dungeon-master)
  - [Realtime Multiplayer](#8-realtime-multiplayer)
  - [Blockchain, ZK Proofs & IPFS](#9-stellar-blockchain-zk-proofs--ipfs)
  - [Game Server Engine](#10-game-server-engine)
- [API Reference](#api-reference)
- [Database Tables](#database-tables)
- [Development](#development)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Next.js 16)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Canvas   │  │ Quest UI │  │ NPC      │  │ Character  │  │
│  │ Renderer │  │ Chronicle│  │ Dialog   │  │ Creator    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       │              │             │              │         │
│  ┌────┴─────┐  ┌─────┴──────┐     │              │         │
│  │ A* Path  │  │ Dice       │     │              │         │
│  │ Finder   │  │ Physics 3D │     │              │         │
│  └──────────┘  └────────────┘     │              │         │
│       └──────────────┴─────────────┴──────────────┘         │
│                          │          ▲                        │
│                     REST API   Supabase Realtime             │
└──────────────────────────┼──────────┼───────────────────────┘
                           ▼          │
┌──────────────────────────────────────────────────────────────┐
│                    SERVER (Express + ts-node)                │
│  ┌──────────────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ AI Engine        │  │ DB Layer │  │ Services          │  │
│  │ ─ QuestDirector  │  │ ─ 7 query│  │ ─ IPFS (Filebase) │  │
│  │ ─ NpcDialog      │  │   modules│  │                   │  │
│  │ ─ NarrativeDir.  │  │          │  │                   │  │
│  │ ─ LootGenerator  │  │          │  │                   │  │
│  │ ─ OpenAI wrapper │  │          │  │                   │  │
│  └──────────────────┘  └──────────┘  └───────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Game Data Seeds (locationSeeds, npcSeeds,            │   │
│  │   itemSeeds: 912 lines, abilitySeeds: 1116 lines)   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│              SUPABASE (PostgreSQL + Realtime)                │
│  players │ characters │ locations │ quests │ quest_history   │
│  npcs │ items │ character_inventory │ abilities             │
│  character_abilities │ player_positions                     │
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
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, HTML5 Canvas, Tailwind CSS, shadcn/ui, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, ts-node-dev |
| **AI** | OpenAI GPT-4o (quest narratives, NPC dialog, loot generation, character creation) |
| **Database** | Supabase (PostgreSQL + Realtime broadcast channels) |
| **Blockchain** | Stellar Soroban smart contracts (Rust, soroban-sdk 22), Protocol 25 (X-Ray) |
| **ZK Stack** | Noir, RISC Zero zkVM, BN254 Elliptic Curves, Poseidon/Poseidon2 Hashes |
| **Storage** | IPFS via Filebase (S3-compatible, auto-pinning) |
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
│   │   │   ├── create/         # Character creation
│   │   │   └── quests/         # Quest chronicle + detail pages
│   │   ├── components/
│   │   │   ├── GameCanvas.tsx   # Tile renderer + click-to-move + realtime
│   │   │   ├── WelcomeScreen.tsx# Landing page with wallet connect
│   │   │   ├── NpcDialog.tsx    # AI-powered NPC chat panel
│   │   │   ├── TransitionModal  # Zone transition confirmation
│   │   │   ├── DiceOverlay.tsx  # 3D dice rolling physics animation
│   │   │   ├── BottomNav.tsx    # Navigation bar + wallet menu
│   │   │   ├── Tooltip.tsx      # Hover tooltip for players/NPCs
│   │   │   └── FreighterAuthButton.tsx
│   │   ├── lib/
│   │   │   ├── tileRenderer.ts  # Canvas tile drawing engine (353 lines)
│   │   │   ├── pathfinding.ts   # A* pathfinder (130 lines)
│   │   │   ├── questApi.ts      # Quest API client
│   │   │   ├── config.ts        # Centralized SERVER_URL config
│   │   │   └── supabase.ts      # Supabase client
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # Global auth state (playerId persistence)
│   │   └── hooks/
│   │       └── use-mobile.ts    # Responsive helper
│   └── next.config.ts
│
├── server/                     # Express API server
│   ├── src/
│   │   ├── index.ts            # Express app + 40+ API routes (547 lines)
│   │   ├── ai/
│   │   │   ├── openai.ts        # Generic OpenAI wrapper (typed JSON output)
│   │   │   ├── QuestDirector.ts # AI Dungeon Master engine
│   │   │   ├── npcDialog.ts     # NPC dialog + memory persistence
│   │   │   ├── narrativeDirector.ts # Story/NPC/quest generation
│   │   │   └── lootGenerator.ts # AI loot creation with rarity tiers
│   │   ├── db/
│   │   │   ├── supabase.ts      # Supabase service client (service_role)
│   │   │   ├── playerQueries.ts # Player upsert by wallet
│   │   │   ├── characterQueries.ts # Character CRUD
│   │   │   ├── questQueries.ts  # Quests + locations + positions (213 lines)
│   │   │   ├── npcQueries.ts    # NPC CRUD + knowledge + memory (140 lines)
│   │   │   ├── itemQueries.ts   # Template/instance items + inventory (205 lines)
│   │   │   └── abilityQueries.ts # Ability templates + character abilities (170 lines)
│   │   ├── game/
│   │   │   ├── engine.ts        # Server game loop (physics + AI ticks)
│   │   │   ├── locationSeeds.ts # 7 hand-crafted tile maps (352 lines)
│   │   │   ├── npcSeeds.ts      # 6 NPCs with full JSONB backstories (219 lines)
│   │   │   ├── itemSeeds.ts     # ~60 Shadowdark items (912 lines)
│   │   │   └── abilitySeeds.ts  # ~80 abilities, spells, talents (1116 lines)
│   │   └── services/
│   │       └── ipfs.ts          # Filebase S3 IPFS uploader
│   └── package.json
│
├── shared/                     # Shared TypeScript models
│   └── src/models/
│       ├── player.ts           # HeroClass, CharacterStats, PlayerData (92 lines)
│       ├── world.ts            # BiomeType, RoomType, GAME_CONSTANTS
│       ├── item.ts             # 7 enums + 6 stat interfaces + GameItem (104 lines)
│       ├── location.ts         # TileType (19 types), LocationMap, exits
│       └── rules.ts            # Modifiers, DCs, ancestries, class configs (114 lines)
│
├── contracts/                  # Stellar Soroban smart contracts
│   └── soroban/dnd_contract/   # NFT item contract (Rust)
│
├── database/migrations/        # 7 SQL migration files
├── docs/
│   ├── db.sql                  # Full schema reference
│   └── GAME_DESIGN_DOC.md      # Original GDD (314 lines, Russian)
│
├── scripts/
│   └── cloudflared-start.ps1   # Cloudflare tunnel helper
└── package.json                # Root monorepo (npm workspaces)
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18, **npm** ≥ 9
- **Supabase** project (PostgreSQL + Realtime)
- **OpenAI API key** (GPT-4o access)
- **Freighter** browser extension (Stellar wallet)

### Installation

```bash
git clone https://github.com/your-org/nft-dnd-stellar.git
cd nft-dnd-stellar
npm install
cp .env.example .env   # Edit with your keys
```

### Database Setup

Run all 7 migrations in order against your Supabase SQL editor:

```
20260221_create_players.sql
20260221_create_characters.sql
20260222_create_quest_system.sql      (locations, items, quests, quest_history)
20260222_create_player_positions.sql
20260222_create_npcs.sql
20260222_create_items_system.sql      (items overhaul + character_inventory)
20260222_create_abilities.sql         (abilities + character_abilities)
```

### Seed Data

```bash
npm run dev                                    # Start both client + server

curl -X POST http://localhost:3001/api/location/seed    # 7 tile maps
curl -X POST http://localhost:3001/api/npc/seed          # 6 NPCs
curl -X POST http://localhost:3001/api/item/seed         # ~60 Shadowdark items
curl -X POST http://localhost:3001/api/ability/seed      # ~80 abilities/spells
```

### Run Development

```bash
npm run dev          # Both server (:3001) + client (:3000)
npm run dev:server   # Express only
npm run dev:client   # Next.js only
```

---

## Technical Systems

### 1. AI Pipeline

The server contains 5 AI modules, all built on a single typed OpenAI wrapper (`server/src/ai/openai.ts`):

```typescript
// Generic typed wrapper — forces JSON response_format from GPT-4o
async function generateContent<T>(systemPrompt: string, userPrompt: string): Promise<T | null>
```

**Modules:**

| Module | File | Purpose |
|--------|------|---------|
| **OpenAI Wrapper** | `ai/openai.ts` | Base GPT-4o client. Forces `response_format: json_object`. All AI modules call this. |
| **Quest Director** | `ai/QuestDirector.ts` | AI Dungeon Master. Processes player actions, applies Shadowdark dice rules (Nat 20/Nat 1 logic), checks dead-end protection (10 min timeout → spawn patrol), runs morale checks (>50% enemy loss → flee), generates narrative JSON. |
| **NPC Dialog** | `ai/npcDialog.ts` | Builds per-NPC system prompts from JSONB fields (traits, backstory chapters, knowledge topics, conversation memory). Maintains persistent memory — saves interaction summaries to NPC's `memory[]` array (last 50 entries). Forces NPCs to stay in-character and respond in player's language. |
| **Narrative Director** | `ai/narrativeDirector.ts` | Higher-level generation: creates NPCs for room types and biomes, generates quest graphs with objectives and branches. Used for procedural world expansion. |
| **Loot Generator** | `ai/lootGenerator.ts` | Generates thematic weapons with AI lore. Maps rarity to multipliers (Common 1.0x → Legendary 3.0x). Creates `Weapon` objects conforming to shared type system with `aiHistory` field for on-chain metadata. |

**Quest Director Decision Flow:**

```
Player Action → Dead-end check (>10 min?) → Morale check (>50% loss?)
    → Build rules injection (Nat20/Nat1/Success/Fail + background bonus)
    → GPT-4o generates {narrative, engine_trigger, on_chain_event}
    → Log to quest_history table
```

**Engine triggers returned by AI:** `obstacle_cleared`, `combat_start`, `trap_triggered`, `spawn_patrol`, `enemies_flee`, `none`.

---

### 2. Tile-Based World Engine

The world is rendered on HTML5 Canvas using a custom tile renderer (`client/src/lib/tileRenderer.ts`, 353 lines).

**Rendering Pipeline:**

1. **Dark fantasy color palette** — 19 tile types, each mapped to hand-picked hex colors (e.g., Floor `#2a2218`, Wall `#1a1510`, Water `#1a2840`).
2. **Glow effects** — Fireplace, Campfire, and Chest tiles emit radial gradients (configurable color + radius).
3. **Schematic decorations** — Each tile type has 2D geometric decorations drawn via Canvas API: tables render as rectangles with wood grain, fireplaces show flame triangles, bookshelves show shelf lines, etc.
4. **Camera system** — Follows the local player with configurable viewport offset.
5. **Exit tile pulsing** — Exit tiles pulse with amber/orange glow animation to guide players.

**A* Pathfinding** (`client/src/lib/pathfinding.ts`, 130 lines):

- Manhattan distance heuristic
- 4-directional movement (no diagonals for cleaner grid feel)
- Respects `WALKABLE_TILES` set from shared models
- Accepts `blockedTiles` parameter (NPC positions treated as impassable)
- Exit tiles treated as walkable regardless of tile type
- Safety limit: `width × height × 2` max iterations

**19 Tile Types (shared/models/location.ts):**

```
Void | Floor | Wall | Door | Column | Table | Chair | Barrel
Chest | Staircase | Fireplace | Bar | Bed | Bookshelf | Crate
Campfire | Tree | Water | Rug
```

Walkable: Floor, Door, Chair, Staircase, Rug.

**7 Pre-built Locations:**

| Location | Size | Biome | Exits |
|----------|------|-------|-------|
| The Dying Ember (Tavern) | 20×16 | HubRegion | → Street |
| Castle Street | 24×18 | HubRegion | → Tavern, Church, Wizard Shop, Castle Gate |
| Chapel of Ashes | 16×14 | HubRegion | → Street |
| Arcane Emporium | 16×14 | HubRegion | → Street |
| Castle Gate | 20×12 | HubRegion | → Street, Dungeon |
| Hollow Crypts (Dungeon) | 24×20 | CrystalCaves | → Castle Gate |
| Whisper Glade (Forest) | 28×22 | DarkForest | Standalone |

Each location stores: deterministic UUID, tile grid (`tiles[y][x]`), labeled spawn points, exit definitions (target location ID + spawn label).

---

### 3. Character System — Shadowdark Rules

Rules engine is defined entirely in `shared/src/models/rules.ts` + `player.ts`.

**Core Mechanics:**

- **6 Stats:** STR, DEX, CON, INT, WIS, CHA (range 3-18)
- **Modifier table:** `≤3: -4 | 4-5: -3 | 6-7: -2 | 8-9: -1 | 10-11: 0 | 12-13: +1 | 14-15: +2 | 16-17: +3 | 18+: +4`
- **Difficulty Classes:** Easy 9, Normal 12, Hard 15, Extreme 18
- **Distances:** Close (5ft), Near (30ft), Far (line of sight)

**4 Classes with configuration:**

| Class | Hit Die | Weapons | Armor | Primary |
|-------|---------|---------|-------|---------|
| Fighter | d8 | Any | Any + Shields | STR |
| Priest | d6 | Limited | Any + Shields | WIS |
| Thief | d4 | Limited | Leather | DEX |
| Wizard | d4 | Dagger, Staff | None | INT |

**6 Ancestries with unique features:**

- **Dwarf** (Stout) — +2 HP, HP roll advantage
- **Elf** (Farsight) — +1 ranged/spellcasting
- **Goblin** (Keen Senses) — Cannot be surprised
- **Halfling** (Stealthy) — 1/day invisibility (3 rounds)
- **Half-Orc** (Mighty) — +1 melee attack/damage
- **Human** (Ambitious) — Extra talent roll at creation

**Character Creation Flow (client/src/app/create/page.tsx):**

1. AI Generation (optional): text prompt → GPT-4o-mini generates complete character JSON
2. Manual: 72-point allocation with ancestry+class min/max constraints
3. Derived stats auto-calculated: HP = hitDie + CON mod (Dwarf +2), AC = 10 + DEX mod
4. Saved via `POST /api/character/create`

---

### 4. Item & Inventory System

Implements a **Template → Instance** pattern for items.

**Architecture:**

```
Template items (is_template: true)
     ↓ createItemInstance()
Player instances (is_template: false, parent_template_id → template)
     ↓ addItemToInventory()
character_inventory entries (character_id, item_id, slot_position, is_equipped)
```

**Seed Data: ~60 items across 7 categories (912 lines):**

- **Gear** (16 items): Torch, Lantern, Rope, Crowbar, Thieves' Tools, Holy Symbol, Spellbook, etc.
- **Weapons — Melee** (12 items): Dagger (1d4 Finesse), Shortsword (1d6 Finesse), Longsword (1d8 Versatile), Greatsword (1d12 TwoHanded), etc.
- **Weapons — Ranged** (6 items): Shortbow (1d4 Far), Longbow (1d8 Far), Crossbow (1d6 Loading), etc.
- **Armor** (6 items): Leather (AC 11+DEX), Chainmail (AC 13+DEX), Plate (AC 15 flat), Shield (+2 AC), Mithril variants (Rare, no penalties)
- **Scrolls** (10 items): Cure Wounds, Protection from Evil, Magic Missile, Sleep, Burning Hands, Shield, etc.
- **Wands** (2 items): Multi-charge Magic Missile / Healing (break on Nat 1)

**Typed stat blocks (shared/models/item.ts):**

```typescript
WeaponStats   { damage, range, properties[], versatile_damage? }
ArmorStats    { ac_base, ac_dex, penalties[] }
GearStats     { duration_seconds?, light_range?, uses?, description? }
MagicStats    { spell?, charges?, break_on_nat1? }
```

**Blockchain integration:** Each item has `is_nft`, `blockchain_status` (OFF_CHAIN → MINTABLE → MINTED), `stellar_token_id` fields.

**Class-based starter kits:** `CLASS_STARTER_ITEMS` maps each class to specific template IDs. `POST /api/character/:id/inventory/give-starter-kit` gives all starter items.

---

### 5. Ability & Skill System

Comprehensive ability catalog based on Shadowdark RPG rules. All abilities use flexible JSONB `mechanics` and `usage` fields for engine-interpretable data.

**Seed Data: ~80 abilities (1116 lines) across 5 types:**

| Type | Count | Examples |
|------|-------|---------|
| **Ancestry Features** | 6 | Stout (+2 HP), Farsight (+1 ranged), Keen Senses, Stealthy (invisibility), Mighty (+1 melee), Ambitious (extra talent) |
| **Class Features** | 8 | Weapon Mastery, Hauler, Grit, Turn Undead, Divine/Arcane Spellcasting, Backstab, Thievery, Learning Spells |
| **Talents** | 16 | Per-class level-up options: attack bonuses, stat boosts, weapon mastery, extra attack, evasion, spell recall, etc. |
| **Priest Spells** (T1-T3) | ~12 | Cure Wounds, Protection from Evil, Light, Holy Weapon, Shield of Faith, Smite, Restore Health |
| **Wizard Spells** (T1-T3) | ~12 | Magic Missile, Sleep, Burning Hands, Shield, Detect Magic, Fireball, Invisibility |

**Mechanics Schema (JSONB):**

```json
{
  "bonus": 1,
  "target": ["melee_attack", "ranged_attack"],
  "stacks": true,
  "condition": "from_hiding_or_target_unaware"
}
```

**Usage Schema (JSONB):**

```json
{ "per": "passive" }
{ "per": "day", "charges": 1 }
{ "per": "focus", "focus_dc": 11 }
{ "per": "encounter", "charges": 1 }
```

**Character ability tracking:** `character_abilities` junction table with `is_active`, `charges_remaining`, `source` (level_up/ancestry/class/quest_reward).

---

### 6. NPC System & AI Dialog

**6 Pre-built NPCs with deep JSONB data models:**

| NPC | Location | Title | Personality |
|-----|----------|-------|-------------|
| Grim Aldric | Tavern | Bartender | Gruff, secretly kind, one-armed ex-mercenary |
| Old Marta | Tavern | Fortune Teller | Cryptic, whispering, ex-court seer |
| Guard Theron | Street | City Watch | Dutiful, suspicious, tired |
| Father Cael | Church | High Priest | Calm, hiding dark bargain |
| Aelindra | Wizard Shop | Arcane Merchant | Arrogant, exiled elven sorceress |
| Sergeant Bryn | Castle Gate | Gate Captain | Stern, battle-hardened, lost half her squad |

**JSONB Data Architecture:**

```
traits{}        — Dynamic personality flags: { gruff: true, fears: ["fire"] }
backstory[]     — Appendable chapters: [{ chapter: "origin", text: "..." }]
knowledge[]     — Topic-content pairs: [{ topic: "rumors", content: "..." }]
memory[]        — Auto-saved interactions: [{ player_id, summary, timestamp }]
metadata{}      — appearance, voice, greeting
```

**AI Dialog Pipeline (npcDialog.ts):**

1. Build system prompt from all JSONB fields (traits, backstory chapters, knowledge topics, last 10 memories)
2. Inject conversation history (last 6 messages)
3. Force in-character rules: stay in character, never break 4th wall, respond in player's language, keep short
4. Generate response via GPT-4o → `{ message, mood }`
5. **Persist interaction** to NPC's `memory[]` array via `addNpcMemory()` (capped at 50 entries)

**Dynamic NPC updates:**

- `addNpcKnowledge(npcId, topic, content)` — inject new knowledge at runtime
- `updateNpcTrait(npcId, key, value)` — modify personality flags
- `addNpcMemory(npcId, playerId, summary)` — auto-called after each dialog

---

### 7. Quest Director — AI Dungeon Master

The `QuestDirector` class (`server/src/ai/QuestDirector.ts`) orchestrates AI-powered quest sessions.

**Processing Pipeline:**

```
1. Dead-end Protection (GDD §1.2)
   └─ If no quest_history progress for 10 min → emit "spawn_patrol" event

2. Morale Check (Shadowdark rules)
   └─ If enemy count ≤ 50% of initial → DM roll (d20 < 15 = enemies flee)

3. Rules Injection (based on player roll)
   ├─ Nat 20 → "absolute triumph and heroic success"
   ├─ Nat 1  → "critical failure, gear breaking or Wizard Mishap"
   ├─ ≥ 15   → "player succeeded"
   └─ < 15   → "player failed"
   + Background bonus for flavor

4. GPT-4o Generation
   └─ System: grim, laconic AI DM — "describe smells, sounds, dying torch"
   └─ Output: { narrative, engine_trigger, on_chain_event }

5. Chronicle Logging
   └─ Insert into quest_history with both player roll and DM roll
```

**Quest lifecycle:**

- `POST /api/quest/start` — creates quest with party members
- `POST /api/quest/action` — submit action, AI responds
- `POST /api/quest/finish` — end quest (Success/PartyWiped), flag loot, record stat changes

**Chronicle UI (client):**

- `/quests` — List all quests with status icons (Trophy/Skull/Swords)
- `/quests/[id]` — Timeline view with roll badges (Nat20 glow, Nat1 skull), engine trigger chips, on-chain event markers, AI narrative blockquotes

---

### 8. Realtime Multiplayer

**Supabase Realtime** broadcast channels scoped per location:

```
Channel: room:location:{locationId}
Events: position_update, player_join, player_leave
```

**Position System:**

- `player_positions` table: one row per player (upsert on `player_id`)
- Every click-to-move persists position via `PUT /api/player/:id/position`
- On page refresh: position restored from DB, player placed at saved tile
- Other players in same location see each other's tokens rendered on canvas

**Player rendering:**

- Local player: amber glow ring + name label
- Remote players: colored token (based on wallet hash) + position interpolation

---

### 9. Stellar Blockchain, ZK Proofs & IPFS

**Zero-Knowledge (ZK) & Protocol 25 (X-Ray):**

Our system is engineered with **"honesty by design"** leveraging Stellar's latest **Protocol 25 (X-Ray)** upgrades. This introduces critical cryptographic building blocks natively at the protocol level—specifically, operations on **BN254 elliptic curves** and **Poseidon/Poseidon2 hash functions**. These are the fundamental primitives upon which modern ZK systems rely.

By utilizing these native operations, our Soroban smart contracts can efficiently verify Zero-Knowledge proofs directly on the blockchain. We use advanced ZK toolsets like **Noir** and zkVM approaches like **RISC Zero** to compute game logic off-chain (e.g., fog of war, hidden loot rolls, secret character stats). The resulting cryptographic proofs are submitted to stellar, verifying that the AI Dungeon Master and players acted faithfully according to the rules, without exposing the hidden data itself.

**IPFS Upload (services/ipfs.ts):**

- Uses Filebase S3-compatible API (auto-pinning)
- Base64-encoded credentials: `KEY:SECRET:BUCKET`
- Upload via AWS SDK `PutObjectCommand` → file pinned to IPFS

**Soroban Smart Contract (`contracts/soroban/dnd_contract/`):**

- Rust-based NFT item contract on Stellar Soroban
- Items with `is_nft: true` are mintable on-chain
- Quest history logs `on_chain_event` entries for monumental decisions
- AI-generated item lore stored in `ai_history` field for on-chain metadata

**Wallet Auth Flow:**

1. Player clicks "Connect Wallet" → Freighter extension signs challenge
2. `POST /api/auth/wallet { publicKey }` → upsert player by wallet address
3. Player ID persisted in `AuthContext` (localStorage)

---

### 10. Game Server Engine

**Dual-loop architecture** (`server/src/game/engine.ts`):

| Loop | Interval | Purpose |
|------|----------|---------|
| **Physics Tick** | 50ms (20 TPS) | Movement, hit detection, collision checks |
| **AI Director Tick** | 5000ms (every 5s) | NPC spawning, pacing, progression block detection |

**Constants (shared/models/world.ts):**

```typescript
PHYSICS_TICK_RATE_MS: 50        // 20 TPS
AI_DIRECTOR_TICK_MS: 5000       // Every 5 seconds
WORLD_UPDATER_TICK_MS: 60000    // Every minute
MAX_PLAYERS_PER_HUB: 100       // Soft cap
DEAD_END_FALLBACK_MINUTES: 10  // Spawn patrol on stall
```

---

## API Reference

### Health & Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server status |
| `GET` | `/api/db-check` | Database connectivity |
| `POST` | `/api/auth/wallet` | Register/login via Stellar wallet `{ publicKey }` |
| `POST` | `/api/upload` | Upload file to IPFS (multipart) |

### Characters

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/character/generate` | AI-generate character from prompt (GPT-4o-mini) |
| `POST` | `/api/character/create` | Save character `{ playerId, name, class, ancestry, stats, hp, ac }` |
| `GET` | `/api/character/player/:playerId` | List player's characters |

### Locations & Positions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/location/list` | All locations |
| `GET` | `/api/location/:id` | Single location (tiles, exits, spawn points) |
| `POST` | `/api/location/seed` | Seed 7 locations |
| `GET` | `/api/player/:id/position` | Player's saved position |
| `PUT` | `/api/player/:id/position` | Update position `{ locationId, tileX, tileY }` |
| `GET` | `/api/location/:id/players` | All players in a location |

### NPCs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/location/:id/npcs` | All NPCs in a location |
| `POST` | `/api/npc/:id/dialog` | AI dialog `{ message, history[], playerId }` |
| `POST` | `/api/npc/seed` | Seed 6 NPCs |

### Items & Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/item/list` | All template items (optional `?category=Weapon`) |
| `GET` | `/api/item/:id` | Single item by ID |
| `POST` | `/api/item/seed` | Seed ~60 Shadowdark items |
| `GET` | `/api/character/:id/inventory` | Character inventory (joins item data) |
| `POST` | `/api/character/:id/inventory/add` | Add item `{ templateId, quantity?, slotPosition? }` |
| `POST` | `/api/character/:id/inventory/give-starter-kit` | Give class starter kit `{ heroClass }` |
| `PUT` | `/api/inventory/:entryId/equip` | Equip item `{ slotPosition? }` |
| `PUT` | `/api/inventory/:entryId/unequip` | Unequip to backpack |
| `DELETE` | `/api/inventory/:entryId` | Remove from inventory |

### Abilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ability/list` | All abilities (optional `?type=`, `?class=`, `?ancestry=`) |
| `GET` | `/api/ability/:id` | Single ability |
| `POST` | `/api/ability/seed` | Seed ~80 abilities |
| `GET` | `/api/character/:id/abilities` | Character's learned abilities |
| `POST` | `/api/character/:id/abilities/learn` | Learn ability `{ abilityId, source? }` |
| `DELETE` | `/api/character/:id/abilities/:abilityId` | Forget ability |

### Quests

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/quest/list` | All quests |
| `GET` | `/api/quest/:id` | Quest details |
| `GET` | `/api/quest/:id/history` | Quest chronicle entries |
| `POST` | `/api/quest/start` | Start quest `{ partyMembers[] }` |
| `POST` | `/api/quest/action` | Submit action `{ questId, playerAction, playerRoll, currentZoneThreatLevel, ... }` |
| `POST` | `/api/quest/finish` | End quest `{ questId, status, lootDropped?, statChanges? }` |

---

## Database Tables

11 tables across 7 migration files:

| Table | Key Purpose |
|-------|-------------|
| `players` | Wallet-based auth. `wallet_address` (unique), nickname, metadata JSONB |
| `characters` | Per-player heroes. 6 stat columns, level, xp, alignment, background, state JSONB |
| `locations` | Tile maps. coordinates JSONB stores `{ width, height, tiles[][], spawn_points[], exits[] }` |
| `items` | Template/instance pattern. `is_template`, `parent_template_id`, stats/bonuses/perks JSONB, blockchain fields |
| `character_inventory` | Junction: character ↔ item. `slot_position`, `is_equipped`, quantity |
| `abilities` | Template abilities. `mechanics` JSONB, `usage` JSONB, class/ancestry restrictions |
| `character_abilities` | Junction: character ↔ ability. `is_active`, `charges_remaining`, source |
| `npcs` | JSONB-heavy: traits, backstory[], knowledge[], memory[], metadata |
| `quests` | Party quest sessions. `party_members` JSONB, status, loot_dropped, stat_changes JSONB |
| `quest_history` | Chronicle entries. player_action, player_roll, dm_roll, ai_narrative, engine_trigger, on_chain_event |
| `player_positions` | One position per player. location_id + tile_x/tile_y |

All tables use UUID PKs, RLS enabled, indexed on hot paths.

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

### Cloudflare Tunnels (External Access)

```powershell
.\scripts\cloudflared-start.ps1
# Starts tunnels for both :3000 (client) and :3001 (server)
# Copy server tunnel URL → .env NEXT_PUBLIC_SERVER_URL
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=sk-...
STELLAR_NETWORK=TESTNET
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
PORT=3001
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
IPFS_API_KEY=base64(KEY:SECRET:BUCKET)
```

---

## License

Proprietary — All rights reserved.
