import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {describeAlisPalettes,editAlisPalette} from '../src/lib/ishar/alis-assets.ts';
import {exportAlisMod} from './alis-mod.mjs';
const [game,installation,output]=process.argv.slice(2);
if(!['ishar1','ishar2'].includes(game)||!installation||!output)throw Error('Usage: prepare-logo-mod-probe.mjs <ishar1|ishar2> <original installation> <new mod directory>');
const source=readAlisModule(new Uint8Array(await readFile(join(installation,'LOGO.IO'))));
const palette=describeAlisPalettes(source.image).find(p=>p.entryIndex===6);
if(!palette)throw Error('Expected LOGO palette6 is absent; no guessed replacement');
// One channel, high contrast: deterministic and easy to compare in a native frame.
const rgb=[...palette.colors[0]];rgb[0]=rgb[0]===palette.maxChannel?0:palette.maxChannel;
const edited=editAlisPalette(source.image,6,palette.firstColor,rgb);
const report=await exportAlisMod(installation,game,'LOGO.IO',edited,output);
console.log(JSON.stringify({...report,probe:{palette:6,color:palette.firstColor,channel:'red',rule:'toggle between original maximum and zero',expectedEffect:'changed palette colour while LOGO palette6 is active; native visible effect not yet verified'}},null,2));
