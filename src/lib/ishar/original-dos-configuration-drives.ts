export interface OriginalConfigurationDriveReplies{
 currentDrive:number;driveCount:number;currentDirectory:Uint8Array;handle:number;
 attempts:Array<{chdirError:boolean;createError:boolean}>;
}
/** Ishar2 module1C33..1D06. DOS replies explicit; no host filesystem access.
 * Guest create/close/delete of the temporary probe are events only.
 */
export function probeOriginalDosConfigurationDrives(source:Uint8Array,segment:number,replies:OriginalConfigurationDriveReplies){
 if(source.length!==0x100000||!Number.isInteger(segment)||segment<0||segment>65535||segment*16+0xbe9>source.length||!Number.isInteger(replies.currentDrive)||replies.currentDrive<0||replies.currentDrive>25||!Number.isInteger(replies.driveCount)||replies.driveCount<0||replies.driveCount>26||!Number.isInteger(replies.handle)||replies.handle<0||replies.handle>65535||replies.currentDirectory.length<1||replies.currentDirectory.length>64||replies.currentDirectory.at(-1)!==0||!replies.attempts.every(v=>typeof v.chdirError==='boolean'&&typeof v.createError==='boolean'))throw Error('Invalid configuration drive replies');
 const memory=source.slice(),base=segment*16,set=(at:number,value:number)=>{memory[base+at]=value;},events:Array<Record<string,number|string>>=[];
 const select=(drive:number)=>events.push({service:'select-drive',drive});
 events.push({service:'current-drive'});set(0xb9c,replies.currentDrive);set(0xb97,replies.currentDrive>=2?0:replies.currentDrive);
 events.push({service:'current-directory',drive:0,segment,offset:0xba9});memory.set(replies.currentDirectory,base+0xba9);set(0xba8,memory[base+0xb94]);
 select(replies.currentDrive);set(0xb9b,replies.driveCount);set(0xb9a,1);
 let accepted=false,attempts=0;
 for(let drive=2;;drive++){
  set(0xb9a,drive);if(drive>=replies.driveCount)break;
  const reply=replies.attempts[attempts++];if(!reply)throw Error('Configuration drive probe requires another attempt reply');
  select(drive);events.push({service:'change-directory',segment,offset:0xba8});if(reply.chdirError)continue;
  events.push({service:'create',segment,offset:0xb9f,attributes:0});if(reply.createError)continue;
  events.push({service:'close',handle:replies.handle},{service:'delete',segment,offset:0xb9f});set(0xb98,replies.currentDrive);set(0xb99,drive);accepted=true;break;
 }
 if(!accepted){set(0xb98,replies.currentDrive);set(0xb99,2);select(2);events.push({service:'change-directory',segment,offset:0xb9d});set(0xb96,1);}
 select(replies.currentDrive);
 return {memory,events,accepted,attempts};
}
