# Original gameplay decompilation status

The authored NPC/trade prototype is distinct from the original runtime. Originalskripte in the builder reads local MARCHAND.IO.asm and EAFF.IO.asm listings. Merchant edits can now be stored in the project for playtest; this does not patch original IO binaries.

## Shop entry and stock
MAIN.IO 0x03169 dispatches absolute values 1-15 to TAVERNE (selector value minus 1). MAIN.IO 0x0326a dispatches values 17-39 to MARCHAND (selector value minus 17). GERDEP 0x00e54 sends MAIN message 17 with target B when stepping forward onto entrance A -21/-20/-19/-18/-5 on maps 1/2/3/7. MAIN consumes that message through oscan; entry is not limited to clicking a sign. Merchant entry is blocked at saved day phase 3 (word offset 90).

MARCHAND supplies six stock slots and 17 selectors; shared routines and empty stocks are preserved. Listings stay outside Git and are served only through local readonly endpoints. Builder-edited stock takes precedence over the local listing. OBJET negative-code dispatch supplies item sprites, including composed resources 188 and 196. Cache layout 27 prioritizes these composites and uses their original x/z placements.

The playtest opens a functional merchant panel on entrance. Selecting ware holds it until return or recipient portrait click. Movement and exit are locked while holding it. Buying needs a loaded DOS-v2 save. This panel is not a pixel-exact reproduction of the original shop screen. Tavern services, selling and full NPC execution remain pending.

## Original purchase and save rules
MARCHAND 0x00603 subtracts recipient money from MAIN word arrays 0x2d68/0x2d80 (save offsets 1006/1026). Selection at 0x00411 creates an OBJET entity and held object 0x2d16. Inventory checks precede payment. Stack codes -59 through -49 use quantity offset 7629, character stride 20; existing-stack lookup scans slots 0-10, new items use backpack slots 0-8. Capacity is 20 for -49, otherwise 10. Partial accepted bundles are charged in full, remainder cleared at 0x005e0. No stock decrement appears in this path. Save patches preserve unrelated bytes and never mutate the source file. Exported copies still need original-game compatibility checks.

## Ground items
AFFOBJ reads coordinates from MAIN 0x2aba/0x2b84 and map 0x2c4e (save offsets 336/536/736). Its cone allows distances 0-6 with absolute lateral <= distance. Render loop scans IDs 0-110 while IO saves 200 bytes per table at 0x00eda-0x00ee8. Outside map 1, facing must match MAIN 0x50c8 (save offset 8039). The remaining saved range needs investigation.

Positive object IDs 9/10 are integrated on map 1, with original projection and distance variants. Objects one step ahead are pickable. SOURIS pickup clears the three fields in a copied save; return restores them. Clicking a recipient writes the positive code to the first empty backpack slot without opening inventory. Absent/full recipients retain the item. Export and movement are blocked while holding. Loaded saves restore map, position, facing and scene; subsequent playtest movement does not update original party-position fields on export.

Browser validation used a private START.SAV copy with object 9 one step ahead. Pickup, return, portrait delivery, movement lock and inventory word 9 were verified. This does not prove quest spawning. Authored portraits are still a shell; original recipients are identified by slot index.

The starter crypt-rune now resolves to original object 9, preserving placement references. OBJET resources 115/116/117 provide its ground art; key resources are 69/70/71. The invented glowing pedestal fallback is removed; unknown original items get no random substitute. Authored placements project through connected forward cells up to distance two. Closed wooden doors stop visibility; closed grates allow it. Native saved ground items use a separate path. Stale OBJET PNGs are refreshed so decoder transparency is preserved at distance.

## Actors
MAIN 0x00a7d initializes actor limit 0x4a81 to 110. EAFF scans slots 50-109. Scene, HP, facing and cone filters in save-actors.ts are candidate filters only. EAFF 0x00629 gives slots 50-52 special script bindings. Type dispatch 0x00664 uses MAIN 0x3d2e, saved at offset 4911; offset 5021 was an incorrect transient interpretation and was reverted after loader audit. original-actor-dispatch.ts follows branch bindings to common setup. Tests cover 3 special slots and 58 type bindings. Sprite execution, EDPLT movement, EATT combat, dialogue and event gates must follow their actual routines.

## Validation
Tests cover merchant dispatch/night closure, literal OBJET mapping, per-recipient payment, full bags/stacks, partial bundles, immutable save patching, item door/grate visibility, native sprite transparency and loader offsets. Local START.SAV and original listings are private fixtures. TypeScript and production build pass. Earlier commerce browser verification selected object -61 without changing 40200 gold, then recipient delivery reduced it to 38400. JSON is an intermediate editing format, not verified binary IO export.

Current browser verification entered CONT3 merchant 1 via the forward step at row 17 / column 58. All six item sprites loaded. Buying object -61 through portrait 1 exported backpack word -61 and reduced gold from 40200 to 38400; source fixture remained untouched.

## Native actor first-frame integration
The playtest now binds saved actor slots to GOLEM1, WIZARD1 and AVEUGLE5 scripts on CONT1. A bounded read-only ALIS evaluator follows entry jumps, conditionals, calls, switches, local arithmetic and signed MAIN fields through the first yield. It never runs listing text as JavaScript or changes save bytes. The IO loader generates the MAIN memory mapping directly from its sequential reads; unsupported memory or opcodes reject the actor rather than guessing. Only unambiguous EAFF dispatches with verified literal offsets are enabled. Cached composed sprites preserve their original x/z child offsets (layout 28).

This is stationary first-frame rendering, not complete NPC/enemy gameplay. Color-only palette routines retain imported graphics colors; transient machine-specific day/night palette execution is pending. Random crowd placement, maps 2-7 occlusion/height checks, animation scheduling, dialogue/recruitment and EDPLT/EATT movement/combat remain unported. Saved actor positions remain fixed while the camera moves. Tests execute the actual local IO/EAFF/GOLEM1/WIZARD1/AVEUGLE5 listings and validate signed states, distance variants, rejected unknown branches and immutable saves.

Browser validation with an isolated save copy at CONT1 11/12 displayed three original actor scripts. Turning away removed the view candidates; returning restored the same actor slots and coordinates. Signed negative HP now correctly excludes dead actors. The fixture and screenshots remain outside Git.


## Resumable actor scripts — 2026-10-11

`actorAnimationSteps` now preserves the program counter, call stack, local bytes,
mirror flag and displayed resource across `cstop`/`csleep`. Position changes without
another `cput` update the retained sprite; a new `cput` replaces it. Each scheduler
step has an independent 512-instruction bound and returns an immutable snapshot.
The first-frame renderer continues to use the same evaluator via a compatibility
wrapper.

Actual AVEUGLE5 and WIZARD1 listings were checked across their idle loop: countdown,
one-unit horizontal sway, six-step pause, signed direction reversal, and unchanged
distance resource. The random source is explicitly injected for deterministic
verification; no default RNG or invented wall-clock interval is installed.

This is execution infrastructure, not automatic playtest animation yet. Original
scheduler timing, random semantics and message dispatch still need verification
before connecting live animation, attack triggers, dialogue or actor movement.
No actor/save state is modified by these checks.
