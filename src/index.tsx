
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { pickSaveFile, pickOpenFile, writeToHandle, readFromHandle, downloadJson, uploadJson } from "./fileStore";

type Item = { id: string; title: string; status: "backlog"|"dev"|"product"|"done"; start: string; end: string; progress: number; };
const STATUSES = [
  { id:"backlog", label:"Backlog", color:"#e2e8f0" },
  { id:"dev", label:"In Dev", color:"#84cc16" },
  { id:"product", label:"Product", color:"#0ea5e9" },
  { id:"done", label:"Complete", color:"#10b981" },
] as const;

const DAY_PX = 18;
const WINDOW_DAYS = 150;
function addDays(base: Date | string, n: number){ const d=new Date(base); d.setDate(d.getDate()+n); return d; }
function fmt(d: Date | string){ return new Date(d).toISOString().slice(0,10); }
function clamp(n: number, lo: number, hi: number){ return Math.max(lo, Math.min(hi, n)); }

const LS_ITEMS = "ec_file_items";

export default function App(){
  const defaults: Item[] = [
    { id: crypto.randomUUID(), title:"Onboarding Revamp", status:"dev", start: addDays(new Date(),-7).toISOString(), end:addDays(new Date(),21).toISOString(), progress:45 },
    { id: crypto.randomUUID(), title:"Pharmacy Integrations", status:"product", start: addDays(new Date(),10).toISOString(), end:addDays(new Date(),50).toISOString(), progress:20 },
    { id: crypto.randomUUID(), title:"Compounding Workflow", status:"done", start: addDays(new Date(),-30).toISOString(), end:addDays(new Date(),-2).toISOString(), progress:100 },
  ];

  const [items, setItems] = useState<Item[]>(() => { try{const s=localStorage.getItem(LS_ITEMS); if(s) return JSON.parse(s);}catch{} return defaults; });
  const [saving, setSaving] = useState(false);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [fileStatus, setFileStatus] = useState<string>("Not connected");
  const [autoSave, setAutoSave] = useState(true);

  useEffect(()=>{ try{ localStorage.setItem(LS_ITEMS, JSON.stringify(items)); }catch{} }, [items]);

  useEffect(()=>{
    if (!autoSave || !fileHandle) return;
    const h = setTimeout(async ()=>{
      try { setSaving(true); await writeToHandle(fileHandle, { items }); setFileStatus("Saved to file"); }
      catch(e){ console.error(e); setFileStatus("File save failed"); }
      finally { setSaving(false); }
    }, 700);
    return ()=>clearTimeout(h);
  }, [items, autoSave, fileHandle]);

  async function connectNewFile(){
    const handle = await pickSaveFile();
    if (handle){
      setFileHandle(handle);
      setFileStatus("Connected to file");
      try { await writeToHandle(handle, { items }); setFileStatus("Saved to file"); } catch {}
    }
  }
  async function openExistingFile(){
    const handle = await pickOpenFile();
    if (handle){
      setFileHandle(handle);
      const data = await readFromHandle(handle);
      if (data?.items && Array.isArray(data.items)) setItems(data.items);
      setFileStatus("Connected to file");
    }
  }
  async function saveNow(){
    if (fileHandle){
      try { setSaving(true); await writeToHandle(fileHandle, { items }); setFileStatus("Saved to file"); }
      catch(e){ console.error(e); setFileStatus("File save failed"); }
      finally { setSaving(false); }
    } else {
      downloadJson("ec-roadmap.json", { items });
      setFileStatus("Downloaded JSON");
    }
  }
  async function importJson(){
    const data = await uploadJson();
    if (data?.items && Array.isArray(data.items)) setItems(data.items);
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-[var(--line)] bg-white sticky top-0 z-10">
        <div className="section py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg border border-[var(--line)] bg-[var(--green)] text-white grid place-items-center font-semibold">EC</div>
            <div className="title-xl">EC Roadmap</div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={connectNewFile}>Connect Save File</Button>
            <Button variant="outline" onClick={openExistingFile}>Open File</Button>
            <Button onClick={saveNow}>Save Now</Button>
            <label className="text-sm inline-flex items-center gap-2 select-none"><input type="checkbox" checked={autoSave} onChange={e=>setAutoSave(e.target.checked)} /> Auto‑save</label>
            <span className="text-sm text-gray-500">{saving? "Saving…" : fileStatus}</span>
          </div>
        </div>
      </div>

      {/* Section: Items */}
      <div className="section mt-8 space-y-6">
        <h2 className="heading">Roadmap Items</h2>
        {items.map(it=>(
          <Card key={it.id} className="p-0">
            <CardContent className="pt-6">
              {/* Title full width */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Title</label>
                <Input value={it.title} onChange={e=>setItems(p=>p.map(x=>x.id===it.id?{...x,title:e.target.value}:x))} />
              </div>

              {/* Controls row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-white"
                    value={it.status}
                    onChange={e=>setItems(p=>p.map(x=>x.id===it.id?{...x,status:e.target.value as Item['status']}:x))}
                  >
                    <option value="backlog">Backlog</option>
                    <option value="dev">In Dev</option>
                    <option value="product">Product</option>
                    <option value="done">Complete</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Start</label>
                  <Input type="date" value={fmt(it.start)} onChange={e=>setItems(p=>p.map(x=>x.id===it.id?{...x,start:new Date(e.target.value).toISOString()}:x))}/>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Target</label>
                  <Input type="date" value={fmt(it.end)} onChange={e=>setItems(p=>p.map(x=>x.id===it.id?{...x,end:new Date(e.target.value).toISOString()}:x))}/>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Progress</label>
                  <input type="range" min={0} max={100} value={it.progress} onChange={e=>setItems(p=>p.map(x=>x.id===it.id?{...x,progress:Number(e.target.value)}:x))} className="w-full"/>
                  <div className="text-xs text-right text-gray-600 mt-1">{it.progress}%</div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Button variant="danger" onClick={()=>setItems(p=>p.filter(x=>x.id!==it.id))}>Remove</Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-3">
          <Button onClick={()=>setItems(p=>[{ id: crypto.randomUUID(), title:"New Block", status:"backlog", start: new Date().toISOString(), end: new Date(Date.now()+14*864e5).toISOString(), progress:0 }, ...p])}>Add Block</Button>
          <Button variant="outline" onClick={()=>downloadJson('ec-roadmap.json',{ items })}>Download JSON</Button>
          <Button variant="outline" onClick={importJson}>Upload JSON</Button>
        </div>
      </div>

      {/* Section: Timeline */}
      <Timeline items={items} onChange={(id,p)=>setItems(prev=>prev.map(x=>x.id===id?{...x,...p}:x))} />
    </div>
  );
}

function Timeline({ items, onChange }:{ items:Item[]; onChange:(id:string,p:Partial<Item>)=>void; }){
  const startAnchor = useMemo(()=>{ const d=new Date(); d.setDate(d.getDate()-14); return d; }, []);
  const endAnchor = useMemo(()=>{ const d=new Date(startAnchor); d.setDate(d.getDate()+WINDOW_DAYS); return d; }, [startAnchor]);
  const totalDays = Math.max(1, Math.ceil((+endAnchor - +startAnchor)/(1000*60*60*24)));
  function dateToPx(d: string){ const days = Math.round((+new Date(d) - +startAnchor)/(1000*60*60*24)); return clamp(days,0,totalDays)*DAY_PX; }

  return (
    <div className="section mt-10 mb-16">
      <h2 className="heading mb-4">Timeline</h2>
      <div className="card overflow-hidden">
        <div className="p-6">
          <div className="flex text-[11px] text-gray-500 mb-2 overflow-x-auto">
            {Array.from({length:Math.ceil(totalDays/7)+1}).map((_,i)=>{
              const d=new Date(startAnchor); d.setDate(d.getDate()+i*7);
              return <div key={i} style={{width:7*DAY_PX}} className="shrink-0 text-center">{d.toLocaleDateString(undefined,{month:'short',day:'numeric'})}</div>
            })}
          </div>
          <div className="relative border border-[var(--line)] rounded-2xl bg-[var(--muted)] overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:'linear-gradient(to right, #e9ecef 1px, transparent 1px)', backgroundSize:`${DAY_PX}px 100%` }} />
            <div className="divide-y divide-[var(--line)]">
              {items.map(it=>{
                const left = dateToPx(it.start);
                const right = dateToPx(it.end);
                const width = Math.max(DAY_PX, right-left);
                return <Row key={it.id} item={it} left={left} width={width} onChange={onChange} />;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ item, left, width, onChange }:{ item:Item; left:number; width:number; onChange:(id:string,p:Partial<Item>)=>void; }){
  const contRef = useRef<HTMLDivElement|null>(null);
  const barRef = useRef<HTMLDivElement|null>(null);
  const state = useRef<{mode:null|'move'|'left'|'right'; startX:number; origLeft:number; origWidth:number}>({mode:null,startX:0,origLeft:0,origWidth:0});
  const color = STATUSES.find(s=>s.id===item.status)?.color || "#94a3b8";

  function onDown(e:React.MouseEvent, mode:'move'|'left'|'right'){
    const bar=barRef.current; if(!bar) return;
    state.current={mode,startX:e.clientX,origLeft:bar.offsetLeft,origWidth:bar.offsetWidth};
    window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp);
  }
  function onMove(e:MouseEvent){
    const cont=contRef.current, bar=barRef.current; if(!cont||!bar) return;
    const dx=e.clientX-state.current.startX;
    if(state.current.mode==='move'){
      const newLeft=Math.max(0, Math.min(cont.clientWidth-state.current.origWidth, state.current.origLeft+dx));
      bar.style.left=`${newLeft}px`;
    }else if(state.current.mode==='left'){
      const newLeft=Math.max(0, state.current.origLeft+dx);
      const newWidth=Math.max(18, state.current.origWidth + (state.current.origLeft - newLeft));
      bar.style.left=`${newLeft}px`; bar.style.width=`${newWidth}px`;
    }else if(state.current.mode==='right'){
      const newWidth=Math.max(18, state.current.origWidth+dx);
      bar.style.width=`${newWidth}px`;
    }
  }
  function onUp(){
    const cont=contRef.current, bar=barRef.current; if(cont&&bar){
      const leftPx=bar.offsetLeft, widthPx=bar.offsetWidth;
      onChange(item.id,{ start: pxToISO(leftPx), end: pxToISO(leftPx+widthPx) });
    }
    window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',onUp);
  }
  function pxToISO(px:number){
    const days=Math.round(px/DAY_PX); const anchor=new Date(); anchor.setDate(anchor.getDate()-14); anchor.setHours(0,0,0,0);
    const d=new Date(anchor); d.setDate(d.getDate()+days); return d.toISOString();
  }

  return (
    <div ref={contRef} className="relative h-16 bg-white/60">
      <div className="absolute inset-y-0 left-3 flex items-center text-sm text-gray-700">{item.title}</div>
      <div ref={barRef} className="absolute top-3 h-10 rounded-xl shadow-sm" style={{ left, width, background: color }} onMouseDown={(e)=>onDown(e,'move')}>
        <div className="absolute inset-y-0 left-0 rounded-xl" style={{ width: `${clamp(item.progress,0,100)}%`, background:"rgba(255,255,255,0.35)" }} />
        <div className="absolute inset-y-0 left-0 w-2 cursor-ew-resize bg-black/10 rounded-l-xl" onMouseDown={(e)=>{e.stopPropagation(); onDown(e,'left')}}/>
        <div className="absolute inset-y-0 right-0 w-2 cursor-ew-resize bg-black/10 rounded-r-xl" onMouseDown={(e)=>{e.stopPropagation(); onDown(e,'right')}}/>
        <div className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-white">
          {fmt(item.start)} → {fmt(item.end)} • {item.progress}%
        </div>
      </div>
    </div>
  );
}
