/** START.STP's seven tag/value pairs. Ishar2 DOS decode verified at23D7:F43.
 * Both supplied files have this structure; Ishar1 runtime semantics are separate.
 * Preserve opaque R value, noncanonical values and any trailing bytes verbatim.
 */
export const STARTUP_SETTING_TAGS=['R','V','S','P','J','M','K'] as const;
export type StartupSettingTag=typeof STARTUP_SETTING_TAGS[number];
export function readStartupSettings(source:Uint8Array){
 if(source.length<14)throw Error(`START.STP requires at least14 bytes; got ${source.length}`);
 const values={} as Record<StartupSettingTag,number>;
 for(let i=0;i<STARTUP_SETTING_TAGS.length;i++){
  const tag=STARTUP_SETTING_TAGS[i];
  if(source[i*2]!==tag.charCodeAt(0))throw Error(`START.STP invalid tag at byte ${i*2}: expected ${tag}`);
  values[tag]=source[i*2+1];
 }
 return {values,byteLength:source.length,trailingBytes:source.length-14};
}
export function writeStartupSettings(source:Uint8Array,changes:Partial<Record<StartupSettingTag,number>>={}){
 readStartupSettings(source);
 for(const [tag,value] of Object.entries(changes)){
  if(!STARTUP_SETTING_TAGS.includes(tag as StartupSettingTag)||typeof value!=='number'||!Number.isInteger(value)||value<0||value>255)throw Error(`Invalid START.STP change ${tag}; expected a known tag and byte value`);
 }
 const output=source.slice();
 for(let i=0;i<STARTUP_SETTING_TAGS.length;i++){
  const value=changes[STARTUP_SETTING_TAGS[i]];if(value!==undefined)output[i*2+1]=value;
 }
 return output;
}
