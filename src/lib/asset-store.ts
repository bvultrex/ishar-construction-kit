import { useKit } from "./store";
import { create } from "zustand";
import type { LoadedAssetPack } from "./ishar/asset-pack";
import { revokeAssetPack } from "./ishar/asset-pack";
import { snapshotPack, writeCachedPack, readCachedPack, deleteCachedPack } from "./asset-cache";

interface AssetPackState {
  pack: LoadedAssetPack | null;
  cacheStatus: string;
  setPack: (pack: LoadedAssetPack) => void;
  updatePack: (pack: LoadedAssetPack) => void;
  clearPack: () => void;
  restorePack: () => Promise<void>;
}
let revision=0;
let restoring:Promise<void>|undefined;
let writes:Promise<unknown>=Promise.resolve();
function persist(pack:LoadedAssetPack,version:number) {
  useAssetPack.setState({cacheStatus:"Assets werden lokal gespeichert …"});
  // Start reading while the current Blob URLs are still alive.
  const snapshot=snapshotPack(pack);
  void snapshot.catch(()=>{});
  writes=writes.catch(()=>{}).then(async()=>{
    const data=await snapshot;
    if(version!==revision) return;
    await writeCachedPack(data);
    if(version===revision) useAssetPack.setState({cacheStatus:"Assets lokal gespeichert · automatisches Laden aktiv."});
  }).catch(()=>{if(version===revision) useAssetPack.setState({cacheStatus:"Browser-Cache nicht verfügbar. Assets bleiben für diese Sitzung geladen."});});
}
export const useAssetPack = create<AssetPackState>((set,get)=>({
  pack:null, cacheStatus:"",
  setPack:pack=>{revision++;revokeAssetPack(get().pack);set({pack});persist(pack,revision);},
  updatePack:pack=>{revision++;set({pack});persist(pack,revision);},
  clearPack:()=>{
    revision++;revokeAssetPack(get().pack);set({pack:null,cacheStatus:"Assets entladen."});
    writes=writes.catch(()=>{}).then(()=>deleteCachedPack()).catch(()=>set({cacheStatus:"Lokaler Cache konnte nicht gelöscht werden."}));
  },
  restorePack:()=>{
    if(restoring) return restoring;
    const version=revision;
    restoring=(async()=>{
      try {
        set({cacheStatus:"Lokale Assets werden geladen …"});
        let pack=await readCachedPack();
        if(pack && version===revision) set({pack});
        if((!pack || (pack.sceneLayoutVersion??0)<28) && version===revision && ["127.0.0.1","localhost","[::1]"].includes(location.hostname)) {
          const source=await fetch("/__local/ishar-source");
          if(source.ok && source.headers.get("content-type")?.includes("application/zip")) {
            set({cacheStatus:"Lokales Ishar-Archiv wird automatisch geladen …"});
            const {autoImportIsharZip}=await import("./ishar/ishar-auto-import");
            const result=await autoImportIsharZip(new File([await source.blob()],"Ishar-local.zip"));
            if(pack) {
              const urls={...pack.urls},paths={...pack.paths};
              const tilesets=pack.manifest.tilesets.map(old=>{
                const next=result.pack.manifest.tilesets.find(t=>t.id===old.id);
                const isGenerated=(e: typeof old.entries[number])=>/^ishar2-(?:dj(?:[12]|cat)|out[1-4])-(wall\.(left|right|front)-[0-3]|door\.front\.(open|closed)-[0-3]|door\.leaf\.(open|closed)\.(wood|grate)-[0-3]|wall\.reveal\.(left|right)-[0-3]|sprite-[A-Z0-9]+\.IO-\d+m?|opening\.(room\.)?(left|right)-[0-3]|surface\.(floor|ceiling))$/.test(e.id) && e.renderMode==="layer";
                for(const entry of old.entries.filter(isGenerated)){delete urls[entry.id];delete paths[entry.id];}
                const kept=old.entries.filter(e=>!isGenerated(e));
                const additions=(next?.entries??[]).filter(e=>!kept.some(o=>o.role===e.role && o.depth===e.depth && o.targetId===e.targetId));
                for(const entry of additions){urls[entry.id]=result.pack.urls[entry.id]!;paths[entry.id]=result.pack.paths[entry.id]!;}
                return {...old,entries:[...kept,...additions]};
              });
              // r8: tilesets new in this layout (ishar2-djcat) are appended whole.
              for(const t of result.pack.manifest.tilesets) if(!tilesets.some(o=>o.id===t.id)){
                for(const entry of t.entries){urls[entry.id]=result.pack.urls[entry.id]!;paths[entry.id]=result.pack.paths[entry.id]!;}
                tilesets.push(t);
              }
              const oldPreviews=new Map((pack.discoveredAssets??[]).map(asset=>[asset.id,asset]));
              const discoveredAssets=(result.pack.discoveredAssets??[]).map(asset=>{
                const old=oldPreviews.get(asset.id);
                oldPreviews.delete(asset.id);
                const outdoorComposite=asset.assetKind==="composite" && /\/(FORET1|PLAINE1)\.IO · ALIS #/i.test(asset.path);
                const refreshedObject=asset.source==="alis" && /(OBJET|GOLEM1|WIZARD1|AVEUGLE5)\.IO · ALIS #/i.test(asset.path);
                return old ? {...old,...asset,url:outdoorComposite || refreshedObject ? asset.url : old.url,runtimeAssigned:asset.assetKind==="composite" ? asset.runtimeAssigned : old.runtimeAssigned || asset.runtimeAssigned} : asset;
              }).concat([...oldPreviews.values()]);
              const keep=new Set([...Object.values(urls),...discoveredAssets.map(asset=>asset.url)]);
              for(const url of new Set([...Object.values(result.pack.urls),...(result.pack.discoveredAssets??[]).map(a=>a.url)])) if(!keep.has(url)) URL.revokeObjectURL(url);
              pack={...pack,urls,paths,discoveredAssets,manifest:{...pack.manifest,tilesets},sceneLayoutVersion:28};
            } else pack=result.pack;
            if(version===revision) {
              const kit=useKit.getState();
              kit.setInventory(result.inventory,"Lokales Ishar-Archiv");
              kit.setProject({...kit.project,game:{...kit.project.game,assetPackId:pack.manifest.id}});
              set({pack});persist(pack,version);return;
            }
          }
        }
        if(version!==revision){revokeAssetPack(pack);return;}
        set({pack,cacheStatus:pack ? "Assets automatisch aus lokalem Browser-Cache geladen." : ""});
        if(pack) persist(pack,version);
      } catch {if(version===revision) set({cacheStatus:"Kein Zugriff auf den lokalen Asset-Cache."});}
    })();
    return restoring;
  },
}));
