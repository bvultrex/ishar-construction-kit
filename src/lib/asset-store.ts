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
        if(!pack && version===revision && location.hostname==="127.0.0.1") {
          const source=await fetch("/__local/ishar-source");
          if(source.ok && source.headers.get("content-type")?.includes("application/zip")) {
            set({cacheStatus:"Lokales Ishar-Archiv wird automatisch geladen …"});
            const {autoImportIsharZip}=await import("./ishar/ishar-auto-import");
            const result=await autoImportIsharZip(new File([await source.blob()],"Ishar-local.zip"));
            pack=result.pack;
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
      } catch {if(version===revision) set({cacheStatus:"Kein Zugriff auf den lokalen Asset-Cache."});}
    })();
    return restoring;
  },
}));
