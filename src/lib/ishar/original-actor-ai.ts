/** EATT.IO 0x00061..0x00167. Entry gates only, NOT a complete attack decision.
 * Addresses refer to MAIN memory, populated with IO.IO's verified save loader.
 * Transient movement state must be supplied by the runtime, never guessed. */
export type ActorAiGate={branch:'blocked'|'special'|'near'|'outside';reason:string};
export function originalActorAiGate(main:ReadonlyMap<number,number>,id:number,moving:boolean):ActorAiGate {
 if(!Number.isInteger(id)||id<50||id>=110)throw Error('Invalid original actor slot');
 const byte=(at:number)=>{const n=main.get(at);if(n===undefined)throw Error(`Missing MAIN ${at.toString(16)}`);return n>=128?n-256:n;};
 const word=(at:number)=>{const hi=byte(at)&255,lo=byte(at+1)&255,n=(hi<<8)|lo;return n>=32768?n-65536:n;};
 const blocked=(reason:string):ActorAiGate=>({branch:'blocked',reason});
 if(moving)return blocked('Gruppe bewegt sich');
 if(byte(0x449a+id)!==byte(0x4ef2))return blocked('Anderes Gebiet');
 // Original tests nonzero here, not hp > 0. Preserve that distinction.
 if(word(0x36ac+id*2)===0)return blocked('Keine Lebenspunkte');
 if(word(0x3946+id*2)!==0)return blocked('Status 0x3946 aktiv');
 if(word(0x3a24+id*2)!==0)return blocked('Status 0x3a24 aktiv');
 if(word(0x3b02+id*2)!==0)return {branch:'special',reason:'Sonderroutine 0x00cdb'};
 if(byte(0x43ba+id)<0&&[5,6,9,16,18].includes(byte(0x3cbe+id)))return {branch:'special',reason:'Sonderroutine 0x00e6d'};
 const radius=byte(0x2d18)===1?2:1;
 const dr=word(0x3412+id*2)-byte(0x2ab4),dc=word(0x34f0+id*2)-byte(0x2ab5);
 if(Math.abs(dr)>=radius||Math.abs(dc)>=radius||!(dr===0||dc===0))return {branch:'outside',reason:'Außerhalb des nahen Achsenzweigs'};
 return {branch:'near',reason:'Naher Achsenzweig; weitere Prüfungen offen'};
}
