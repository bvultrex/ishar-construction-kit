import {probeOriginalDosConfigurationDrives,type OriginalConfigurationDriveReplies} from './original-dos-configuration-drives.ts';
import {detectOriginalDosConfigurationDevices,type OriginalConfigurationDetectionReplies} from './original-dos-configuration-detection.ts';
import {loadOriginalDosStartupConfiguration,type OriginalStartupConfigurationFileReply} from './original-dos-startup-configuration.ts';
import {runOriginalDosConfigurationPrompt,type OriginalConfigurationPromptReplies} from './original-dos-configuration-prompt.ts';
import {applyOriginalDosStartupConfiguration} from './original-dos-configuration-apply.ts';
export interface OriginalConfigurationEntryReplies{
 drives?:OriginalConfigurationDriveReplies;devices:OriginalConfigurationDetectionReplies;file:OriginalStartupConfigurationFileReply;prompt:OriginalConfigurationPromptReplies;
}
/** Outer Ishar1 1AFA / Ishar2 1BCE. Supported discovery branch only.
 * Stops before the actual settings menu or final RETF. External services explicit.
 */
export function runOriginalDosConfigurationEntry(source:Uint8Array,segment:number,ss:number,profile:'ishar1'|'ishar2',replies:OriginalConfigurationEntryReplies){
 if(source.length!==0x100000||!['ishar1','ishar2'].includes(profile)||![segment,ss].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||segment*16+0xbe9>source.length||ss*16+0x289a>source.length)throw Error('Invalid outer configuration state');
 let memory=source.slice();const base=segment*16,stages:Array<{stage:string;events:Array<Record<string,number|string>>}>=[];
 if(profile==='ishar2'){
  if(!replies.drives)throw Error('Ishar2 configuration requires drive replies');
  const result=probeOriginalDosConfigurationDrives(memory,segment,replies.drives);memory=result.memory;stages.push({stage:'drives',events:result.events});
 }
 memory[base+0xb91]=0;memory[base+0xb90]=0;
 const devices=detectOriginalDosConfigurationDevices(memory,segment,replies.devices);memory=devices.memory;stages.push({stage:'devices',events:devices.events});
 const file=loadOriginalDosStartupConfiguration(memory,segment,profile,replies.file);memory=file.memory;stages.push({stage:'file',events:file.events});
 const menu=()=>({memory,stages,reason:'menu',boundary:profile==='ishar1'?0x1498:0x156c});
 if(memory[base+0xb90]===1)return menu();
 memory[base+0xb91]=1;memory[base+0xb88]=0;
 const prompt=runOriginalDosConfigurationPrompt(memory,segment,replies.prompt);memory=prompt.memory;stages.push({stage:'prompt',events:prompt.events});
 if(memory[base+0xb90]!==0)return menu();
 memory=applyOriginalDosStartupConfiguration(memory,segment,ss).memory;
 stages.push({stage:'final',events:[{kind:'mode',value:2}]});
 return {memory,stages,reason:'return',boundary:profile==='ishar1'?0x1b5b:0x1c32};
}
