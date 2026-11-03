import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {STARTUP_SETTING_TAGS as tags,readStartupSettings as read,writeStartupSettings as write} from '../src/lib/ishar/startup-settings.ts';
const fixture=new Uint8Array(37);for(let i=0;i<fixture.length;i++)fixture[i]=(i*19)&255;
for(let i=0;i<tags.length;i++)fixture[i*2]=tags[i].charCodeAt(0);
assert.deepEqual(write(fixture),fixture);
for(const tag of tags)for(let value=0;value<256;value++){
 const before=fixture.slice(),out=write(fixture,{[tag]:value}),offset=tags.indexOf(tag)*2+1;
 assert.equal(read(out).values[tag],value);
 assert.deepEqual(fixture,before);
 for(let i=0;i<out.length;i++)if(i!==offset)assert.equal(out[i],fixture[i]);
}
assert.throws(()=>read(new Uint8Array(13)));assert.throws(()=>read(new Uint8Array(14)));
for(const changes of [{V:-1},{V:256},{V:1.5},{X:1},{V:undefined}])assert.throws(()=>write(fixture,changes));
const reports=[];for(const path of process.argv.slice(2)){
 const source=new Uint8Array(readFileSync(path)),roundtrip=write(source);assert.deepEqual(roundtrip,source);
 const changed=write(source,{V:67});assert.equal(read(changed).values.V,67);
 assert.deepEqual(new Uint8Array(readFileSync(path)),source);
 reports.push({path,bytes:source.length,sha256:createHash('sha256').update(source).digest('hex'),roundtripExact:true,sourceUnchanged:true});
}
console.log(JSON.stringify({syntheticEdits:1792,reports},null,2));
