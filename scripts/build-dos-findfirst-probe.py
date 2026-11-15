"""Build an owned DOS COM oracle fixture. No original game bytes are embedded.
The output folder must be new; run these COMs only on that disposable fixture.
"""
import argparse,hashlib,json,struct
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('output',type=Path);p.add_argument('--enumeration',action='store_true');a=p.parse_args();a.output.mkdir(parents=True,exist_ok=False)
patterns=['EXIST.AO','exist.ao','MISSING.AO','*.AO','EXIST.*','*.*','NOFILE.*','']
(a.output/'EXIST.AO').write_bytes(b'Owned Ishar reconstruction DOS fixture\r\n')
def build(pattern,output):
 code=bytearray();labels={};fixups=[]
 def emit(*values):code.extend(values)
 def ref(prefix,label,delta=0):emit(*prefix);fixups.append((len(code),label,delta));emit(0,0)
 def label(name):labels[name]=len(code)+0x100
 def copy_dta(target):
  emit(0x1e,0x06) # save DS/ES
  ref([0xa1],'record',2);emit(0x8e,0xd8) # DS=DTA segment
  ref([0x2e,0x8b,0x36],'record') # SI=CS:[DTA offset]
  emit(0x8c,0xc8,0x8e,0xc0);ref([0xbf],'record',target)
  emit(0xb9,43,0,0xfc,0xf3,0xa4,0x07,0x1f)
 emit(0xb4,0x2f,0xcd,0x21);ref([0x89,0x1e],'record');emit(0x8c,0xc0);ref([0xa3],'record',2)
 copy_dta(59)
 emit(0x31,0xc9);ref([0xba],'pattern');emit(0xb4,0x4e,0xcd,0x21)
 ref([0xa3],'record',4);emit(0x9c,0x58);ref([0xa3],'record',6)
 ref([0x89,0x0e],'record',8);ref([0x89,0x16],'record',10)
 emit(0x8c,0xd8);ref([0xa3],'record',12);emit(0x8c,0xc0);ref([0xa3],'record',14)
 copy_dta(16)
 emit(0x31,0xc9);ref([0xba],'output');emit(0xb4,0x3c,0xcd,0x21,0x73,0x05,0xb8,1,0x4c,0xcd,0x21)
 emit(0x89,0xc3,0xb9,102,0);ref([0xba],'record');emit(0xb4,0x40,0xcd,0x21,0xb4,0x3e,0xcd,0x21,0xb8,0,0x4c,0xcd,0x21)
 label('pattern');code.extend(pattern.encode('ascii')+b'\0');label('output');code.extend(output.encode('ascii')+b'\0');label('record');code.extend(bytes(102))
 for at,name,delta in fixups:code[at:at+2]=struct.pack('<H',labels[name]+delta)
 return bytes(code)
manifest=[]
for index,pattern in enumerate(patterns):
 name=f'P{index:02}.COM';data=build(pattern,f'R{index:02}.BIN');(a.output/name).write_bytes(data)
 manifest.append({'program':name,'pattern':pattern,'output':f'R{index:02}.BIN','sha256':hashlib.sha256(data).hexdigest()})
def build_enumeration(pattern,output,custom,rewind=False):
 code=bytearray();labels={};fixups=[]
 def emit(*values):code.extend(values)
 def ref(prefix,label,delta=0):emit(*prefix);fixups.append((len(code),label,delta));emit(0,0)
 def label(name):labels[name]=len(code)+0x100
 def copy_dta(record,target,destination='records'):
  emit(0x1e,0x06);ref([0xa1],'records',record+2);emit(0x8e,0xd8);ref([0x2e,0x8b,0x36],'records',record)
  emit(0x8c,0xc8,0x8e,0xc0);ref([0xbf],destination,record+target if destination=='records' else 0);emit(0xb9,43,0,0xfc,0xf3,0xa4,0x07,0x1f)
 if custom:ref([0xba],'custom');emit(0xb4,0x1a,0xcd,0x21)
 for index in range(4):
  record=index*102
  emit(0xb4,0x2f,0xcd,0x21);ref([0x89,0x1e],'records',record);emit(0x8c,0xc0);ref([0xa3],'records',record+2)
  if rewind and index==2:
   emit(0x1e,0x06);ref([0xa1],'records',record+2);emit(0x8e,0xc0);ref([0x8b,0x3e],'records',record);ref([0xbe],'backup');emit(0xb9,43,0,0xfc,0xf3,0xa4,0x07,0x1f)
  copy_dta(record,59);emit(0x31,0xc9);ref([0xba],'pattern');emit(0xb4,0x4e if index==0 else 0x4f,0xcd,0x21)
  ref([0xa3],'records',record+4);emit(0x9c,0x58);ref([0xa3],'records',record+6);ref([0x89,0x0e],'records',record+8);ref([0x89,0x16],'records',record+10)
  emit(0x8c,0xd8);ref([0xa3],'records',record+12);emit(0x8c,0xc0);ref([0xa3],'records',record+14);copy_dta(record,16)
  if rewind and index==0:copy_dta(record,0,'backup')
 emit(0x31,0xc9);ref([0xba],'output');emit(0xb4,0x3c,0xcd,0x21,0x73,5,0xb8,1,0x4c,0xcd,0x21)
 emit(0x89,0xc3,0xb9,0x98,1);ref([0xba],'records');emit(0xb4,0x40,0xcd,0x21,0xb4,0x3e,0xcd,0x21,0xb8,0,0x4c,0xcd,0x21)
 label('pattern');code.extend(pattern.encode('ascii')+b'\0');label('output');code.extend(output.encode('ascii')+b'\0');label('custom');code.extend(bytes([0xcc])*43);label('backup');code.extend(bytes(43));label('records');code.extend(bytes(408))
 for at,name,delta in fixups:code[at:at+2]=struct.pack('<H',labels[name]+delta)
 return bytes(code),labels['custom']
enumeration=[]
if a.enumeration:
 for index,name in enumerate(['A.TST','B.TST','C.TST']):(a.output/name).write_bytes(bytes([65+index])*(index+1))
 for pattern,rewind in [('*.TST',False),('A.TST',False),('Z.TST',False),('*.TST',True)]:
  for custom in [False,True]:
   index=len(enumeration);name=f'E{index:02}.COM';output=f'S{index:02}.BIN';data,pointer=build_enumeration(pattern,output,custom,rewind);(a.output/name).write_bytes(data)
   enumeration.append({'program':name,'pattern':pattern,'customDta':custom,'rewindDta':rewind,'expectedDtaOffset':pointer if custom else 0x80,'output':output,'sha256':hashlib.sha256(data).hexdigest()})
(a.output/'PROBES.BAT').write_bytes(('\r\n'.join('@'+row['program'] for row in manifest+enumeration)+'\r\n').encode('ascii'))
(a.output/'manifest.json').write_text(json.dumps({'schema':'owned-dos-findfirst-probe-v1','recordBytes':102,'fixtureBytes':(a.output/'EXIST.AO').stat().st_size,'cases':manifest,'enumerationCases':enumeration},indent=2))
print(json.dumps({'output':str(a.output.resolve()),'programs':len(manifest)+len(enumeration),'enumerationSequences':len(enumeration),'originalFilesRead':False}))
