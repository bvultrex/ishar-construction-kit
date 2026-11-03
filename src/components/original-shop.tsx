import type {OriginalMerchant} from '@/lib/ishar/original-merchants';
import type {OriginalPurchase} from '@/lib/ishar/original-commerce';
import type {LoadedAssetPack} from '@/lib/ishar/asset-pack';

export function OriginalShop({selector,merchant,pack,resources,canBuy,held,onSelect,onReturn,onExit}:{
  selector:number;merchant?:OriginalMerchant;pack:LoadedAssetPack|null;resources:Record<number,number>;
  canBuy:boolean;held:OriginalPurchase|null;onSelect:(purchase:OriginalPurchase,position:{x:number;y:number})=>void;onReturn:()=>void;onExit:()=>void;
}) {
  const asset=(module:string,index:number)=>pack?.discoveredAssets?.find(a=>a.path.toUpperCase().endsWith(`${module}.IO · ALIS #${index}`));
  // MARCHAND 0x0003b..0x000a1: background child of original composite 3/22/21.
  const backdrop=selector>=1&&selector<=6?1:selector>=9&&selector<=16?17:selector===17?18:undefined;
  return <section className="original-shop" aria-label="Originalhändler">
    <header><h2>Händler</h2><button onClick={onExit} disabled={!!held}>Verlassen</button></header>
    {backdrop!==undefined&&asset('MARCHAND',backdrop)&&<img className="original-shop-backdrop" src={asset('MARCHAND',backdrop)!.url} alt=""/>}
    {!merchant?<p>Für diesen Eingang ist noch kein Originalsortiment geladen.</p>:<div className="original-shop-stock">{merchant.slots.map((slot,index)=>{
      const [objectCode,thousands,remainder,quantity]=slot.fields;
      if(objectCode!>=0||objectCode!< -89)return null;
      const sprite=resources[objectCode!],image=sprite===undefined?undefined:asset('OBJET',sprite);
      const valid=thousands!>=0&&remainder!>=0&&remainder!<1000&&quantity!>=1&&quantity!<=255;
      return <button key={index} disabled={!canBuy||!!held||!valid} onClick={event=>onSelect({objectCode:objectCode!,price:[thousands!,remainder!],quantity:quantity!},{x:event.clientX,y:event.clientY})}>
        {image&&<img src={image.url} alt=""/>}<span>Objekt {objectCode} · {quantity} Stück</span><strong>{thousands!*1000+remainder!} Gold</strong>
      </button>;
    })}</div>}
    {!canBuy&&<p>Zum Kaufen einen Originalspielstand laden.</p>}
    {held&&<p>Ware in der Hand: Charakterporträt anklicken oder <button onClick={onReturn}>Ware zurücklegen</button>.</p>}
    {merchant&&!merchant.slots.some(slot=>slot.fields[0]!<0)&&<p>Dieser Händler bietet keine Waren an.</p>}
  </section>;
}
