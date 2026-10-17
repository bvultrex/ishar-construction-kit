import { DUNGEON_FRAMES, wallColumnEdges } from "./dungeon-scenes";

export async function fitWallBlob(blob:Blob,role:string,depth:number):Promise<Blob> {
  const image=await createImageBitmap(blob);
  try {
    const source=document.createElement("canvas");source.width=image.width;source.height=image.height;
    const ctx=source.getContext("2d")!;ctx.drawImage(image,0,0);
    const data=ctx.getImageData(0,0,source.width,source.height).data;
    const columns:Array<{x:number,top:number,bottom:number}>=[];
    for(let x=0;x<source.width;x++) {
      let top=source.height,bottom=-1;
      for(let y=0;y<source.height;y++) if(data[(y*source.width+x)*4+3]!>0){top=Math.min(top,y);bottom=y;}
      if(bottom>=top) columns.push({x,top,bottom});
    }
    if(!columns.length) return blob;
    const outer=DUNGEON_FRAMES[depth]!,inner=DUNGEON_FRAMES[depth+1]!;
    const front=role==="wall.front";
    const output=document.createElement("canvas");
    output.width=front ? inner.r-inner.l : inner.l-outer.l;
    output.height=front ? inner.b-inner.t : outer.b-outer.t;
    const target=output.getContext("2d")!;target.imageSmoothingEnabled=false;
    for(let x=0;x<output.width;x++) {
      const c=columns[Math.min(columns.length-1,Math.floor(x*columns.length/output.width))]!;
      const edges=front ? {top:0,bottom:output.height} : wallColumnEdges(depth,role==="wall.left",x+.5,output.width);
      const top=Math.floor(edges.top),bottom=Math.ceil(edges.bottom);
      target.drawImage(source,c.x,c.top,1,c.bottom-c.top+1,x,top,1,bottom-top);
    }
    return await new Promise<Blob>((resolve,reject)=>output.toBlob(b=>b ? resolve(b) : reject(new Error("Wandprojektion fehlgeschlagen")),"image/png"));
  } finally {image.close();}
}
