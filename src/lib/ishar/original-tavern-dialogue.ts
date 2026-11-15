export interface OriginalTavernRumour {
  message:number;
  text:string|null;
}

const KNOWN_GERMAN_RUMOURS:Record<number,string>={
  2:'Unser neues Haus ist sehr angenehm. Das Gefängnis nebenan ist kein echtes Problem, außer nachts ... manchmal um 3 Uhr morgens hört man laute Schreie, aber sonst ...',
};

/** TAVERNE 0x00150 starts TEXTIND with message 100+t. Listening itself
 * performs no persistent write. Only t=2 has a native German text capture.
 */
export function originalTavernRumour(tavern:number):OriginalTavernRumour {
  if(!Number.isInteger(tavern)||tavern<0||tavern>10)throw Error('Ungültiger Tavernendialogparameter.');
  return {message:100+tavern,text:KNOWN_GERMAN_RUMOURS[tavern]??null};
}
