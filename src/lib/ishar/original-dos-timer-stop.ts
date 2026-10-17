/** Native CS:8E2C..8E8D. Pending-work branch is reported, never silently skipped. */
export function stopOriginalDosTimer(input:{active:number;pending:number;savedDivisor:number;vectorOffset:number;vectorSegment:number;port61:number;interruptsEnabled:boolean}){
 if(![input.active,input.port61].every(n=>Number.isInteger(n)&&n>=0&&n<=255)||![input.pending,input.savedDivisor,input.vectorOffset,input.vectorSegment].every(n=>Number.isInteger(n)&&n>=0&&n<=65535)||typeof input.interruptsEnabled!=='boolean')throw Error('Invalid native timer stop state');
 if(input.active===0)return {kind:'inactive' as const,ports:[],interruptsEnabled:input.interruptsEnabled};
 return {kind:input.pending===0?'stopped' as const:'pending' as const,interruptsEnabled:false,
  ports:[{port:0x43,value:0x36},{port:0x40,value:input.savedDivisor&255},{port:0x40,value:input.savedDivisor>>>8},{port:0x61,value:input.port61&0xfc}],
  vector:{offset:input.vectorOffset,segment:input.vectorSegment},writes:{active:0,sampleState:0,pendingFlag:0,priority:128}};
}
