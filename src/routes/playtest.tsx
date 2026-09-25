import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useKit } from "@/lib/store";
import { validateGame } from "@/lib/ishar/project-validation";

export const Route = createFileRoute("/playtest")({ component: PlaytestPage });

function PlaytestPage() {
  const project = useKit((s) => s.project);
  const game = project.game;
  const hero = game.characters[0];
  const problems = validateGame(game);
  const [locationId, setLocationId] = useState(game.startLocationId);
  const [heroHp, setHeroHp] = useState(hero?.hp ?? 1);
  const [enemyHp, setEnemyHp] = useState<Record<string, number>>({});
  const [completedEncounters, setCompletedEncounters] = useState<string[]>([]);
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>(["Playtest gestartet."]);

  const location = useMemo(() => game.locations.find((x) => x.id === locationId), [game.locations, locationId]);
  const encounter = location?.encounterId ? game.encounters.find((x) => x.id === location.encounterId) : undefined;
  const encounterDone = encounter ? completedEncounters.includes(encounter.id) : true;
  const currentEnemyHp = encounter ? (enemyHp[encounter.id] ?? encounter.enemyHp) : 0;
  const defeated = heroHp <= 0;
  const won = !!location?.ending && !defeated && encounterDone;

  function reset() {
    setLocationId(game.startLocationId);
    setHeroHp(hero?.hp ?? 1);
    setEnemyHp({});
    setCompletedEncounters([]);
    setCompletedQuests([]);
    setInventory([]);
    setLog(["Playtest neu gestartet."]);
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

  function move(target: string) {
    if (!encounterDone || defeated) return;
    const next = game.locations.find((x)=>x.id===target);
    if (!next) return;
    setLocationId(target);
    setLog((x)=>[`Du gehst nach ${next.name}.`, ...x]);
  }

  function takeItem(id: string) {
    if (inventory.includes(id)) return;
    const item = game.items.find((x)=>x.id===id);
    setInventory((x)=>[...x,id]);
    setLog((x)=>[`${item?.name ?? id} aufgenommen.`, ...x]);
  }

  if (problems.length || !hero || !location) return <section><header className="page-head"><div><p className="eyebrow">Playtest</p><h1>Projekt nicht spielbar</h1><p>Behebe zuerst die Referenzfehler im Adventure Builder.</p></div><Link className="file-button" to="/author">Zum Builder</Link></header><div className="empty-state">{problems.map((p,i)=><p key={i}>{p.path}: {p.message}</p>)}</div></section>;

  return <section>
    <header className="page-head">
      <div><p className="eyebrow">Browser runtime / vertical slice</p><h1>{project.name}</h1><p>{hero.name} · HP {heroHp}/{hero.hp}</p></div>
      <div className="toolbar"><Link className="file-button" to="/author">Bearbeiten</Link><button onClick={reset}>Neu starten</button></div>
    </header>

    <div className="playtest-grid">
      <article className="parchment-card game-scene">
        <p className="eyebrow">Ort</p><h2>{location.name}</h2><p>{location.description}</p>

        {encounter && !encounterDone && !defeated && <div className="encounter-box">
          <strong>{encounter.name}</strong><span>HP {currentEnemyHp}/{encounter.enemyHp}</span>
          <button onClick={attack}>Angreifen ({hero.attack})</button>
        </div>}

        {defeated && <div className="ending-box"><h3>Die Gruppe wurde besiegt.</h3><button onClick={reset}>Erneut versuchen</button></div>}
        {won && <div className="ending-box"><h3>Abenteuer abgeschlossen</h3><p>Der Vertical-Slice ist vom Start bis zum Ende spielbar.</p></div>}

        {!defeated && encounterDone && <>
          {location.itemIds.map((id)=>{
            const item=game.items.find((x)=>x.id===id);
            return <button className="secondary scene-action" key={id} disabled={inventory.includes(id)} onClick={()=>takeItem(id)}>{inventory.includes(id)?"Aufgenommen":`${item?.name ?? id} aufnehmen`}</button>;
          })}
          <div className="exit-list">{location.exits.map((id)=>{
            const target=game.locations.find((x)=>x.id===id);
            return <button key={id} onClick={()=>move(id)}>Nach {target?.name ?? id}</button>;
          })}</div>
        </>}
      </article>

      <aside className="stone-card playtest-side">
        <h2>Questlog</h2>
        {game.quests.map((q)=><div className="quest-line" key={q.id}><strong>{q.title}</strong><span>{completedQuests.includes(q.id)?"abgeschlossen":"aktiv"}</span><p>{completedQuests.includes(q.id)?q.completedText:q.objective}</p></div>)}
        <h2>Inventar</h2>
        {inventory.length ? <ul>{inventory.map((id)=><li key={id}>{game.items.find((x)=>x.id===id)?.name ?? id}</li>)}</ul> : <p className="muted">leer</p>}
        <h2>Protokoll</h2>
        <div className="game-log">{log.slice(0,8).map((line,i)=><p key={i}>{line}</p>)}</div>
      </aside>
    </div>
  </section>;
}
