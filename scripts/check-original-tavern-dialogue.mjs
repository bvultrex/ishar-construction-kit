import assert from 'node:assert/strict';
import {originalTavernRumour} from '../src/lib/ishar/original-tavern-dialogue.ts';
for(let tavern=0;tavern<=10;tavern++)assert.equal(originalTavernRumour(tavern).message,100+tavern);
assert.equal(originalTavernRumour(2).text,'Unser neues Haus ist sehr angenehm. Das Gefängnis nebenan ist kein echtes Problem, außer nachts ... manchmal um 3 Uhr morgens hört man laute Schreie, aber sonst ...');
assert.equal(originalTavernRumour(0).text,null);
for(const invalid of [-1,11,1.5,NaN])assert.throws(()=>originalTavernRumour(invalid));
console.log('Original tavern dialogue selectors 100..110 and the native German t=2 capture passed. Listening has no SAV writer.');
