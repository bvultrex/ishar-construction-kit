/** Original1451..1564, expression118's memory/pool queries.
 * Selectors0/1 report truncated decimal kilobytes after16-bit paragraph wrap;
 * selectors2/3 count remaining slots,4 traverses the actual free-object chain.
 * A..D/a..d continue into DOS disk-space service1579, not synthesized here.
 */
export function queryOriginalDosMemoryValue(globals:Uint8Array,selector:number,physical?:Uint8Array){
 if(globals.length!==65536||!Number.isInteger(selector)||selector<0||selector>65535||physical!==undefined&&physical.length!==0x100000)throw Error('Invalid original memory query');
 const w=(at:number)=>globals[at]|globals[at+1]<<8,u=(x:number)=>x&65535;
 if(selector===0)return Math.floor(u(w(0xb96)+(w(0xb94)>>>4)-w(0xbca)-(w(0xbc8)>>>4))*16/1000);
 if(selector===1)return Math.floor(u(w(0xbe2)+(w(0xbe0)>>>4)-w(0xbd6)-(w(0xbd8)>>>4))*16/1000);
 if(selector===2)return u(w(0xbcc)-w(0xbce));if(selector===3)return u(w(0xbda)-w(0xbdc));
 if(selector===4){
  let bx=w(0xbec),count=0;if(bx===0)return 0;if(!physical)throw Error('Object free-chain query requires physical memory');
  const segment=w(0xbea),base=w(0xbe8),seen=new Set<number>();
  while(bx!==0){if(seen.has(bx)||seen.size>=65536)throw Error('Object free-chain exceeds host cycle bound');seen.add(bx);count=u(count+1);const offset=u(bx+base+4),at=segment*16+offset;if(offset===65535||at+2>physical.length)throw Error('Object free-chain outside bounded physical window');bx=physical[at]|physical[at+1]<<8;}
  return count;
 }
 if([65,66,67,68,97,98,99,100].includes(selector))throw Error('Original memory query requires explicit DOS disk-space service');
 return 65535;
}
