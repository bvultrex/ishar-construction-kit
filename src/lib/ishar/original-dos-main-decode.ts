/** MAIN caller77F6..782B: destination, packed flag and decoder branch.
 * Does not execute a decoder or allocate the alternate79A5 destination.
 */
export function prepareOriginalDosMainDecode(globals:Uint8Array){
 if(globals.length!==65536)throw Error('Expected original global segment');
 const memory=globals.slice(),word=(at:number)=>memory[at]|(memory[at+1]<<8),raw=word(0x2482),pack=(raw>>>8)&0xfe;
 memory[0xb57]=pack;
 return {memory,entry:pack>=128?0x79e9:0x79a5,stackDelta:pack>=128?-2:-6,registers:{ax:pack>=128?raw&255:(pack<<8)|(raw&255),cx:(word(0x2480)-22)&65535,dx:word(0xbc8),ds:word(0xbca)}};
}
