import { createFileRoute } from "@tanstack/react-router";
import { KNOWLEDGE } from "@/lib/ishar/knowledge";

export const Route = createFileRoute("/knowledge")({ component: Knowledge });

function Knowledge() {
  return <section><header className="page-head"><div><p className="eyebrow">Knowledge / Audit ledger</p><h1>Was wissen wir wirklich?</h1><p>Jede Behauptung behält ihren Evidenzstatus und einen nächsten Test.</p></div></header>
    <div className="knowledge-list">{KNOWLEDGE.map(k=><article key={k.id}><div><span className={`badge ${k.evidence.kind}`}>{k.evidence.kind}</span><small>{k.system}</small></div><h2>{k.title}</h2><p>{k.evidence.summary}</p><footer><strong>Quelle:</strong> {k.evidence.source}<br/><strong>Nächster Test:</strong> {k.evidence.nextTest || "—"}</footer></article>)}</div>
  </section>;
}
