# AI Map Generation Rules

When creating or expanding location maps for the NFT-DND Stellar project, the AI (acting as the level designer/generator) **must** adhere to the following strict guidelines to ensure immersive, organic, and functionally connected environments:

## 1. Non-Rectangular, Organic Shapes

Do NOT create perfectly square or rectangular rooms for outdoor areas, caverns, or ruins unless the location specifically demands it (e.g., inside a formal building).

- **Edge Padding:** Pad the outermost edges with impassable blocks (e.g., `Tree (TR)`, `Wall (W)`, `Void (_)`, `Water (WA)`).
- **Irregular Boundaries:** Create jagged, asymmetric, or meandering borders that naturally frame the playable space.

## 2. Preserve Transition Sizes and Alignment

When connecting Location A to Location B, the transition points **must perfectly align** in width and relative position.

- **Width Matching:** If an exit in Location A is 4 tiles wide, the corresponding entrance spawn point in Location B MUST also span exactly 4 tiles wide.
- **Directional Logic:** An exit on the East side of Location A implies the entrance must be on the West side of Location B.
- **Visual Continuity:** Ensure the tiles leading up to the exit (e.g., `Cobblestone` or `Dirt`) match the visual path continuing on the other side.

## 3. Explicit Exits Array

Never leave the `exits: []` array empty for a connected zone (as was previously the case with Whisper Glade).

- Always define proper `{ tile_x, tile_y, target_location_id, target_location_name, spawn_label }` objects.
- Ensure the `spawn_label` exactly matches the `label` defined in the target location's `spawn_points`.

## 4. Visual Theming Built into the Grid

Instead of a simple "floor/wall" dichotomy, mix tiles organically:

- Add `Campfire (CF)`, `Rug (RG)`, `Crate (CR)`, or `Barrel (BR)` as scatter terrain.
- Use `Cobblestone (CB)` and `Bridge (BRG)` extensively for outdoor paths and river crossings.
