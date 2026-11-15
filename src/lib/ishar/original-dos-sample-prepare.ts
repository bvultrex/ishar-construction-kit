/** Native captured DOS block CS:6302..633E. No C-reference speed clamp.
 * Resource selection/type filtering and later channel/device routing are outside. */
export function prepareOriginalDosSample(header:Uint8Array,segment:number,offset:number,commandSpeed:number){
 if(header.length<16)throw Error('Native sample header truncated');
 if(![segment,offset].every(n=>Number.isInteger(n)&&n>=0&&n<=65535)||!Number.isInteger(commandSpeed)||commandSpeed<0||commandSpeed>255)throw Error('Invalid native sample parameters');
 const speed=commandSpeed===0?header[1]!:commandSpeed;
 const length=((header[2]!|(header[3]!<<8))-16)&65535;
 return {speed,length,sampleOffset:(offset+16)&65535,sampleSegment:segment,frequency:(speed*1000)&65535};
}

/** Later native device branch CS:886D..8885, distinct from parameter setup.
 * Reached only after its device/priority guards; not universal sample behavior. */
export function normalizeOriginalDosDeviceSpeed(speed:number){
 if(!Number.isInteger(speed)||speed<0||speed>255)throw Error('Invalid native device speed');
 const signed=speed>=128?speed-256:speed;
 return signed<1||signed>20?10:speed;
}
