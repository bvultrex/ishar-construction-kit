import type { LoadedAssetPack } from "./ishar/asset-pack";

type CachedPack = { pack: LoadedAssetPack; blobs: Record<string,Blob> };
function database(): Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open("ishar-local-assets",1);
    request.onupgradeneeded=()=>request.result.createObjectStore("packs");
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
async function transact<T>(mode:IDBTransactionMode, action:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T> {
  const db=await database();
  try { return await new Promise<T>((resolve,reject)=>{
    const tx=db.transaction("packs",mode); const request=action(tx.objectStore("packs"));
    tx.oncomplete=()=>resolve(request.result);
    tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error);
  }); } finally {db.close();}
}
export async function snapshotPack(pack:LoadedAssetPack):Promise<CachedPack> {
  const urls=new Set([...Object.values(pack.urls),...(pack.discoveredAssets??[]).map(a=>a.url)]);
  const blobs:Record<string,Blob>={};
  await Promise.all(Array.from(urls,async url=>{
    // Only store local decoded assets; never fetch arbitrary external manifest URLs.
    if(!url.startsWith("blob:") && !url.startsWith("data:")) throw new Error("Nicht-lokale Asset-URL");
    const response=await fetch(url); if(!response.ok) throw new Error("Asset nicht verfügbar");
    blobs[url]=await response.blob();
  }));
  return {pack:structuredClone(pack),blobs};
}
export const writeCachedPack=(value:CachedPack)=>transact("readwrite",s=>s.put(value,"active"));
export const deleteCachedPack=()=>transact("readwrite",s=>s.delete("active"));
export async function readCachedPack():Promise<LoadedAssetPack|null> {
  const cached=await transact<CachedPack|undefined>("readonly",s=>s.get("active"));
  if(!cached) return null;
  const urls:Record<string,string>={};
  for(const [old,blob] of Object.entries(cached.blobs)) urls[old]=URL.createObjectURL(blob);
  return {...cached.pack,urls:Object.fromEntries(Object.entries(cached.pack.urls).map(([id,url])=>[id,urls[url]!])),
    discoveredAssets:cached.pack.discoveredAssets?.map(a=>({...a,url:urls[a.url]!}))};
}
