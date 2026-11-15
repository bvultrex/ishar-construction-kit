import {deriveIshar1SaveLayout,readIshar1SavedMain,patchIshar1SavedMain,type Ishar1SaveLayout} from './ishar1-save-layout.ts';
import {deriveIshar2SaveLayout,readIshar2SavedMain,patchIshar2SavedMain,type Ishar2SaveLayout,type Ishar2MainWrite} from './ishar2-save-layout.ts';
export type OriginalSaveLayout=Ishar1SaveLayout|Ishar2SaveLayout;
export function deriveOriginalSaveLayout(module:Uint8Array,game:'ishar1'|'ishar2'){
 return game==='ishar1'?deriveIshar1SaveLayout(module):deriveIshar2SaveLayout(module);
}
export function readOriginalSavedMain(bytes:Uint8Array,layout:OriginalSaveLayout){
 return layout.game==='ishar1'?readIshar1SavedMain(bytes,layout):readIshar2SavedMain(bytes,layout);
}
export function patchOriginalSavedMain(bytes:Uint8Array,layout:OriginalSaveLayout,writes:readonly Ishar2MainWrite[]){
 return layout.game==='ishar1'?patchIshar1SavedMain(bytes,layout,writes):patchIshar2SavedMain(bytes,layout,writes);
}
export function originalSaveFields(layout:OriginalSaveLayout){
 return layout.game==='ishar1'?layout.fields:layout.fields.filter(field=>field.space==='main');
}
export function originalSaveProfileHash(layout:OriginalSaveLayout){return layout.game==='ishar1'?layout.mainSha256:layout.ioSha256;}
