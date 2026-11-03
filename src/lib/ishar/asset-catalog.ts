export type AssetCatalogGroup = "all" | "houses" | "overworld" | "dungeon" | "ui" | "font" | "other";

export const ASSET_CATALOG_GROUPS: {id:AssetCatalogGroup;label:string}[] = [
  {id:"all",label:"Alle"},
  {id:"houses",label:"Häuser"},
  {id:"overworld",label:"Oberwelt"},
  {id:"dungeon",label:"Dungeon"},
  {id:"ui",label:"Original-UI"},
  {id:"font",label:"Schriftzeichen"},
  {id:"other",label:"Weitere"},
];

export function assetCatalogGroup(path:string):AssetCatalogGroup {
  const module=path.replace(/\\/g,"/").match(/([A-Z0-9]+\.IO)/i)?.[1]?.toUpperCase();
  const index=Number(path.match(/ALIS #(\d+)/i)?.[1]);
  if(module==="VHOUSE1.IO" || module==="VHOUSE2.IO") return "houses";
  if(module==="MAIN.IO" && Number.isInteger(index) && index>=1 && index<=112) return "font";
  if(module==="FRISE.IO" || module==="MAIN.IO") return "ui";
  if(module && /^(DJ1|DJ2|DJCAT|DJCOL|DJDEC|DJFONT|DJTRAP|FDJ1|FDJ2|FDJCAT)\.IO$/.test(module)) return "dungeon";
  if(module && /^(V|ARBO|FARBO|FORET|MONTAGNE|PLAINE|PCAVE|BOAT|PUIT)/.test(module)) return "overworld";
  return "other";
}

export function assetCatalogUse(path:string):string|undefined {
  const module=path.replace(/\\/g,"/").match(/([A-Z0-9]+\.IO)/i)?.[1]?.toUpperCase();
  const index=Number(path.match(/ALIS #(\d+)/i)?.[1]);
  if(module==="VHOUSE1.IO" || module==="VHOUSE2.IO") return "Haus-/Fassadengrafik · ursprüngliche Platzierung offen";
  if(module==="MAIN.IO" && index>=1 && index<=112) return "Originales Zeichensprite · Zeichenkodierung noch offen";
  if(module==="FRISE.IO") return "Originales Ishar-2-UI-Element · Layoutzuordnung prüfen";
  if(module==="DJFONT.IO") return "Leuchtergrafik · trotz Dateiname kein Textfont";
  return undefined;
}
