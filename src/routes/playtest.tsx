import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useKit } from "@/lib/store";
import { canTravel, DIRECTION_LABELS, turnBack, turnLeft, turnRight } from "@/lib/ishar/dungeon";
import { validateGame } from "@/lib/ishar/project-validation";
import type { AuthoredEncounter, AuthoredGame, AuthoredLocation, Direction } from "@/lib/ishar/types";

export const Route = createFileRoute("/playtest")({ component: PlaytestPage });

const FRAMES = [
  { l: 0, t: 0, r: 640, b: 400 },
  { l: 72, t: 46, r: 568, b: 354 },
  { l: 148, t: 92, r: 492, b: 308 },
  { l: 210, t: 128, r: 430, b: 272 },
  { l: 254, t: 154, r: 386, b: 246 },
];

function points(values: number[][]) {
  return values.map((value) => value.join(",")).join(" ");
}

function DungeonViewport({ game, location, facing, encounter, encounterDone, hasItem }: {
  game: AuthoredGame;
  location: AuthoredLocation;
  facing: Direction;
  encounter?: AuthoredEncounter;
  encounterDone: boolean;
  hasItem: boolean;
}) {
  const segments: React.ReactNode[] = [];
  let cell: AuthoredLocation | undefined = location;

  for (let depth = 0; depth < 4 && cell; depth++) {
    const outer = FRAMES[depth]!;
    const inner = FRAMES[depth + 1]!;
    const leftOpen = !!canTravel(game.locations, cell, turnLeft(facing));
    const rightOpen = !!canTravel(game.locations, cell, turnRight(facing));
    const forward = canTravel(game.locations, cell, facing);

    segments.push(
      <g key={`segment-${depth}`} className={`dungeon-depth depth-${depth}`}>
        <polygon className="dungeon-ceiling" points={points([[outer.l,outer.t],[outer.r,outer.t],[inner.r,inner.t],[inner.l,inner.t]])}/>
        <polygon className="dungeon-floor" points={points([[outer.l,outer.b],[inner.l,inner.b],[inner.r,inner.b],[outer.r,outer.b]])}/>
        <polygon className="dungeon-wall side-left" points={points([[outer.l,outer.t],[inner.l,inner.t],[inner.l,inner.b],[outer.l,outer.b]])}/>
        <polygon className="dungeon-wall side-right" points={points([[inner.r,inner.t],[outer.r,outer.t],[outer.r,outer.b],[inner.r,inner.b]])}/>
        {leftOpen && <polygon className="dungeon-opening side-opening" points={points([[outer.l+5,outer.t+34],[inner.l-2,inner.t+20],[inner.l-2,inner.b-20],[outer.l+5,outer.b-34]])}/>}
        {rightOpen && <polygon className="dungeon-opening side-opening" points={points([[inner.r+2,inner.t+20],[outer.r-5,outer.t+34],[outer.r-5,outer.b-34],[inner.r+2,inner.b-20]])}/>}
        {!forward && <>
          <rect className="dungeon-back-wall" x={inner.l} y={inner.t} width={inner.r-inner.l} height={inner.b-inner.t}/>
          <line className="dungeon-mortar" x1={inner.l} y1={(inner.t+inner.b)/2} x2={inner.r} y2={(inner.t+inner.b)/2}/>
          <line className="dungeon-mortar" x1={(inner.l+inner.r)/2} y1={inner.t} x2={(inner.l+inner.r)/2} y2={inner.b}/>
        </>}
      </g>
    );

    if (!forward) break;
    cell = forward;
  }

  return <div className="dungeon-viewport">
    <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid meet" aria-label={`Blick nach ${DIRECTION_LABELS[facing]}`}>
      <rect width="640" height="400" className="dungeon-dark"/>
      {segments}
      <path className="dungeon-vignette" d="M0 0H640V400H0Z M32 25V375H608V25Z" fillRule="evenodd"/>
      {encounter && !encounterDone && <g className="enemy-silhouette" transform="translate(320 232)">
        <ellipse cx="0" cy="58" rx="58" ry="13" className="enemy-shadow"/>
        <path d="M-36 48 L-24 -52 L0 -84 L24 -52 L36 48 Z" className="enemy-body"/>
        <circle cx="0" cy="-88" r="24" className="enemy-head"/>
        <path d="M-23 -90 L-8 -105 L0 -95 L9 -108 L23 -90" className="enemy-crown"/>
        <circle cx="-8" cy="-91" r="3" className="enemy-eye"/><circle cx="8" cy="-91" r="3" className="enemy-eye"/>
        <path d="M-42 -22 L-70 23 L-52 30 L-26 2 M42 -22 L70 23 L52 30 L26 2" className="enemy-arms"/>
      </g>}
      {hasItem && <g className="dungeon-item" transform="translate(500 310)">
        <ellipse cx="0" cy="36" rx="34" ry="8" className="item-shadow"/>
        <path d="M-22 34 L-14 -8 L14 -8 L22 34 Z" className="item-pedestal"/>
        <circle cx="0" cy="-24" r="13" className="item-glow"/>
        <path d="M-5 -30 L7 -25 L0 -15 L-8 -20 Z" className="item-core"/>
      </g>}
    </svg>
    <div className="viewport-topbar"><span>{location.name}</span><strong>{DIRECTION_LABELS[facing]}</strong></div>
    {encounter && !encounterDone && <div className="enemy-hud"><strong>{encounter.name}</strong><span>im Weg</span></div>}
  </div>;
}

function PlaytestPage() {
  const project = useKit((s) => s.project);
  const game = project.game;
  const hero = game.characters[0];
  const problems = validateGame(game);
  const [locationId, setLocationId] = useState(game.startLocationId);
  const [facing, setFacing] = useState<Direction>(game.startFacing);
  const [heroHp, setHeroHp] = useState(hero?.hp ?? 1);
  const [enemyHp, setEnemyHp] = useState<Record<string, number>>({});
  const [completedEncounters, setCompletedEncounters] = useState<string[]>([]);
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>(["Du betrittst den Dungeon."]);

  const location = useMemo(() => game.locations.find((x) => x.id === locationId), [game.locations, locationId]);
  const encounter = location?.encounterId ? game.encounters.find((x) => x.id === location.encounterId) : undefined;
  const encounterDone = encounter ? completedEncounters.includes(encounter.id) : true;
  const currentEnemyHp = encounter ? (enemyHp[encounter.id] ?? encounter.enemyHp) : 0;
  const defeated = heroHp <= 0;
  const won = !!location?.ending && !defeated && encounterDone;
  const visibleItemIds = location?.itemIds.filter((id) => !inventory.includes(id)) ?? [];

  function reset() {
    setLocationId(game.startLocationId);
    setFacing(game.startFacing);
    setHeroHp(hero?.hp ?? 1);
    setEnemyHp({});
    setCompletedEncounters([]);
    setCompletedQuests([]);
    setInventory([]);
    setLog(["Dungeon neu betreten."]);
  }

  function attack() {
    if (!hero || !encounter || encounterDone || defeated) return;
    const nextEnemy = Math.max(0, currentEnemyHp - hero.attack);
    if (nextEnemy === 0) {
      setEnemyHp((x)=>({...x,[encounter.id]:0}));
      setCompletedEncounters((x)=>[...x,encounter.id]);
      if (encounter.questId && !completedQuests.includes(encounter.questId)) setCompletedQuests((x)=>[...x,encounter.questId!]);
      setLog((x)=>[encounter.victoryText, ...x]);
      return;
    }
    const nextHero = Math.max(0, heroHp - encounter.enemyAttack);
    setEnemyHp((x)=>({...x,[encounter.id]:nextEnemy}));
    setHeroHp(nextHero);
    setLog((x)=>[`${hero.name} trifft für ${hero.attack}. ${encounter.name} trifft für ${encounter.enemyAttack}.`, ...x]);
  }

  function step(direction: Direction) {
    if (!location || !encounterDone || defeated || won) return;
    const target = canTravel(game.locations, location, direction);
    if (!target) {
      setLog((x)=>["Dort ist eine Wand.", ...x]);
      return;
    }
    setLocationId(target.id);
    setLog((x)=>[`Du betrittst: ${target.name}.`, ...x]);
  }

  function takeItem(id: string) {
    if (inventory.includes(id)) return;
    const item = game.items.find((x)=>x.id===id);
    setInventory((x)=>[...x,id]);
    setLog((x)=>[`${item?.name ?? id} aufgenommen.`, ...x]);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input,textarea,select")) return;
      const key = event.key.toLowerCase();
      if (["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d"].includes(key)) event.preventDefault();
      if (key === "arrowleft" || key === "a") setFacing((value)=>turnLeft(value));
      else if (key === "arrowright" || key === "d") setFacing((value)=>turnRight(value));
      else if (key === "arrowup" || key === "w") step(facing);
      else if (key === "arrowdown" || key === "s") step(turnBack(facing));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [facing, locationId, encounterDone, defeated, won]);

  if (problems.length || !hero || !location) return <section><header className="page-head"><div><p className="eyebrow">Dungeon Playtest</p><h1>Projekt nicht spielbar</h1><p>Behebe zuerst die Raster- oder Referenzfehler im Adventure Builder.</p></div><Link className="file-button" to="/author">Zum Builder</Link></header><div className="empty-state">{problems.map((p,i)=><p key={i}>{p.path}: {p.message}</p>)}</div></section>;

  return <section className="crawler-page">
    <header className="page-head crawler-head">
      <div><p className="eyebrow">First-person dungeon runtime</p><h1>{project.name}</h1><p>WASD / Pfeiltasten: drehen und schrittweise bewegen.</p></div>
      <div className="toolbar"><Link className="file-button" to="/author">Dungeon bearbeiten</Link><button onClick={reset}>Neu starten</button></div>
    </header>

    <div className="crawler-layout">
      <main className="crawler-main">
        <DungeonViewport game={game} location={location} facing={facing} encounter={encounter} encounterDone={encounterDone} hasItem={visibleItemIds.length > 0}/>
        <div className="crawler-controls">
          <button onClick={()=>setFacing(turnLeft(facing))} aria-label="Links drehen">↶<small>drehen</small></button>
          <button onClick={()=>step(facing)} disabled={!encounterDone || defeated || won} aria-label="Vorwärts">↑<small>vor</small></button>
          <button onClick={()=>setFacing(turnRight(facing))} aria-label="Rechts drehen">↷<small>drehen</small></button>
          <span className="compass">{DIRECTION_LABELS[facing]}</span>
          <button onClick={()=>step(turnBack(facing))} disabled={!encounterDone || defeated || won} aria-label="Rückwärts">↓<small>zurück</small></button>
          {encounter && !encounterDone && !defeated && <button className="attack-button" onClick={attack}>⚔ Angriff <small>{currentEnemyHp}/{encounter.enemyHp} HP</small></button>}
        </div>

        <div className="party-hud">
          <article className={defeated ? "party-member defeated" : "party-member"}>
            <div className="portrait-placeholder">{hero.name.slice(0,1).toUpperCase()}</div>
            <div><strong>{hero.name}</strong><span>HP {heroHp}/{hero.hp}</span><div className="hp-track"><i style={{width:`${Math.max(0, Math.round(heroHp/hero.hp*100))}%`}}/></div></div>
          </article>
          <div className="party-empty">Party-Slot 2</div><div className="party-empty">Party-Slot 3</div><div className="party-empty">Party-Slot 4</div><div className="party-empty">Party-Slot 5</div>
        </div>

        {visibleItemIds.length > 0 && !defeated && <div className="crawler-actions">{visibleItemIds.map((id)=>{
          const item=game.items.find((x)=>x.id===id);
          return <button key={id} onClick={()=>takeItem(id)}>{item?.name ?? id} aufnehmen</button>;
        })}</div>}

        {defeated && <div className="crawler-message danger"><strong>Die Gruppe wurde besiegt.</strong><button onClick={reset}>Erneut versuchen</button></div>}
        {won && <div className="crawler-message victory"><strong>Sonnenheiligtum erreicht.</strong><span>Der Dungeon-Slice ist abgeschlossen.</span></div>}
      </main>

      <aside className="crawler-sidebar">
        <section><p className="eyebrow">Raum</p><h2>{location.name}</h2><p>{location.description}</p></section>
        <section><h3>Quest</h3>{game.quests.map((q)=><div className="quest-line" key={q.id}><strong>{q.title}</strong><span>{completedQuests.includes(q.id)?"erfüllt":"aktiv"}</span><p>{completedQuests.includes(q.id)?q.completedText:q.objective}</p></div>)}</section>
        <section><h3>Inventar</h3>{inventory.length ? <ul>{inventory.map((id)=><li key={id}>{game.items.find((x)=>x.id===id)?.name ?? id}</li>)}</ul> : <p className="muted">leer</p>}</section>
        <section><h3>Protokoll</h3><div className="game-log">{log.slice(0,6).map((line,i)=><p key={i}>{line}</p>)}</div></section>
      </aside>
    </div>
  </section>;
}
