/** Native frame3D3C..3E54, idle-render path, ordinary keyboard byte.
 * Rendering/cursor work and special key73h are explicit unsupported paths.
 * Timer wait is returned, never busy-spun or treated as completed.
 */
export function runOriginalDosIdleFrame(globals:Uint8Array,keyboardByte:number){
 if(globals.length!==65536||!Number.isInteger(keyboardByte)||keyboardByte<0||keyboardByte>255)throw Error('Invalid native idle-frame inputs');
 const memory=globals.slice(),word=(at:number)=>memory[at]|(memory[at+1]<<8),write=(at:number,v:number)=>{memory[at]=v&255;memory[at+1]=v>>>8;};
 if(memory[0xc4a]!==0&&memory[0x2898]!==0)throw Error('Native graphics notification requires separate execution');
 if(memory[0xc99]>memory[0xc9a])return {memory,phase:'wait' as const};
 if(keyboardByte===0x73)throw Error('Special native keyboard path requires separate execution');
 if(word(0xc16)!==0||(memory[0xc37]===0&&memory[0xcb0]!==0))throw Error('Native render/object work is outside idle-frame contract');
 memory[0xc9a]=0;
 for(const [source,target] of [[0xb88,0x1dbf],[0xb8a,0x1dc1],[0x1dcd,0x1dc3],[0x1dcf,0x1dc5],[0x1dd1,0x1dc7],[0x1dd3,0x1dc9],[0x1dd5,0x1dcb]])write(target,word(source));
 memory[0xc49]=0;
 return {memory,phase:'return' as const};
}
