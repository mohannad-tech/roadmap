
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// === JSONBin config (your Bin + Key). These match your earlier messages.
// If your Access Key is different, paste it here.
const BIN_ID = "68fa5658ae596e708f26c5a3";
const ACCESS_KEY = "68fa5672ae596e708f26c5f3"; // NOTE: Must be the actual secret key, not an ID/hash.

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

// Robust JSONBin client with dual headers and safe errors
async function jsonbinLoad(){
  try {
    const r = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { "X-Master-Key": ACCESS_KEY, "X-Access-Key": ACCESS_KEY }
    });
    if (r.status === 401) throw new Error("401 Unauthorized (key does not match bin).");
    if (!r.ok) throw new Error(`Load failed: ${r.status}`);
    const j = await r.json();
    return (j as any)?.record?.items as Item[] | undefined;
  } catch (e) {
    console.error("[jsonbinLoad]", e);
    return undefined;
  }
}
async function jsonbinSave(items: Item[]){
  try {
    const r = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: "PUT",
      headers: { "Content-Type":"application/json", "X-Master-Key": ACCESS_KEY, "X-Access-Key": ACCESS_KEY },
      body: JSON.stringify({ items })
    });
    if (!r.ok) console.error("[jsonbinSave] failed:", r.status);
  } catch (e) {
    console.error("[jsonbinSave]", e);
  }
}

// LocalStorage fallback helpers
const LS_KEY = "ec_roadmap_items";
function lsLoad(): Item[] | undefined {
  try { const s = localStorage.getItem(LS_KEY); if (!s) return; return JSON.parse(s); } catch { return; }
}
function lsSave(items: Item[]){
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
}

export default function App(){
  const defaults: Item[] = [
    { id: crypto.randomUUID(), title:"Onboarding Revamp", status:"dev", start: addDays(new Date(),-7).toISOString(), end:addDays(new Date(),21).toISOString(), progress:45 },
    { id: crypto.randomUUID(), title:"Pharmacy Integrations", status:"product", start: addDays(new Date(),10).toISOString(), end:addDays(new Date(),50).toISOString(), progress:20 },
    { id: crypto.randomUUID(), title:"Compounding Workflow", status:"done", start: addDays(new Date(),-30).toISOString(), end:addDays(new Date(),-2).toISOString(), progress:100 },
  ];

  const [items, setItems] = useState<Item[]>(defaults);
  const [saving, setSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load: try JSONBin first; if it fails, use localStorage (so you don't lose edits)
  useEffect(()=>{
    (async()=>{
      setLoading(true); setLoadError(null);
      const fromServer = await jsonbinLoad();
      if (Array.isArray(fromServer)) {
        setItems(fromServer);
        setHasLoaded(true);
      } else {
        const fromLS = lsLoad();
        if (Array.isArray(fromLS)) setItems(fromLS);
        setHasLoaded(Boolean(fromServer)); // false if server failed
        if (!fromServer) setLoadError("Failed to load from server. Edits will be kept locally until connection works.");
      }
      setLoading(false);
    })();
  }, []);

  // Persist: only auto-save to JSONBin AFTER successful load; always save to localStorage
  useEffect(()=>{
    if (loading) return;
    // localStorage immediately (so refresh won't lose work while server is down)
    lsSave(items);
    if (!hasLoaded) return; // don't hit server until a successful load happened
    const h = setTimeout(async ()=>{
      try{ setSaving(true); await jsonbinSave(items); } finally { setSaving(false); }
    }, 700);
    return ()=>clearTimeout(h);
  }, [items, loading, hasLoaded]);

  function addItem(){
    setItems(prev => [{ id: crypto.randomUUID(), title: "New Block", status: "backlog", start: fmt(new Date())+"T00:00:00.000Z", end: addDays(new Date(), 14).toISOString(), progress: 0 }, ...prev]);
  }
  function removeItem(id: string){ setItems(prev => prev.filter(x=>x.id!==id)); }
  function patch(id: string, q: Partial<Item>){ setItems(prev => prev.map(x=>x.id===id? {...x, ...q}: x)); }

  const startAnchor = useMemo(()=>addDays(new Date(), -14), []);
  const endAnchor = useMemo(()=>addDays(startAnchor, WINDOW_DAYS), [startAnchor]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-[var(--line)] bg-white sticky top-0 z-10">
        <div className="section py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="logo" className="h-10 w-10 rounded-lg border border-[var(--line)]"/>
            <div className="title-xl">EC Roadmap</div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={addItem}>Add Block</Button>
            <Button variant="outline" onClick={()=>window.location.reload()}>Reload</Button>
            <Button onClick={async()=>{ setSaving(true); await jsonbinSave(items); setSaving(false); }}>Save Now</Button>
            <span className="text-sm text-gray-500">{saving? "Saving…" : "Saved"}</span>
          </div>
        </div>
      </div>

      {/* Banners */}
      {loading && <div className="bg-amber-50 text-amber-700 border-b border-amber-200"><div className="section py-3 text-sm">Loading from server…</div></div>}
      {loadError && !loading && <div className="bg-rose-50 text-rose-700 border-b border-rose-200"><div className="section py-3 text-sm">{loadError}</div></div>}

      {/* Section: Items */}
      <div className="section mt-8 space-y-6">
        <h2 className="heading">Roadmap Items</h2>
        {items.map(it=>(
          <Card key={it.id} className="p-0">
            <CardContent className="pt-6">
              {/* Title full width */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Title</label>
                <Input value={it.title} onChange={e=>patch(it.id,{title:e.target.value})} />
              </div>

              {/* Controls row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-white"
                    value={it.status}
                    onChange={e=>patch(it.id,{status:e.target.value as Item['status']})}
                  >
                    {STATUSES.map(s=>(<option key={s.id} value={s.id}>{s.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Start</label>
                  <Input type="date" value={fmt(it.start)} onChange={e=>patch(it.id,{start:new Date(e.target.value).toISOString()})}/>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Target</label>
                  <Input type="date" value={fmt(it.end)} onChange={e=>patch(it.id,{end:new Date(e.target.value).toISOString()})}/>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Progress</label>
                  <input type="range" min={0} max={100} value={it.progress} onChange={e=>patch(it.id,{progress:Number(e.target.value)})} className="w-full"/>
                  <div className="text-xs text-right text-gray-600 mt-1">{it.progress}%</div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Button variant="danger" onClick={()=>removeItem(it.id)}>Remove</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section: Timeline */}
      <div className="section mt-10 mb-16">
        <h2 className="heading mb-4">Timeline</h2>
        <Timeline items={items} onChange={(id,p)=>patch(id,p)} startAnchor={startAnchor} endAnchor={endAnchor} />
      </div>
    </div>
  );
}

function Timeline({ items, onChange, startAnchor, endAnchor }:{ items:Item[]; onChange:(id:string,p:Partial<Item>)=>void; startAnchor:Date; endAnchor:Date; }){
  const totalDays = Math.max(1, Math.ceil((+endAnchor - +startAnchor)/(1000*60*60*24)));
  function dateToPx(d: string){ const days = Math.round((+new Date(d) - +startAnchor)/(1000*60*60*24)); return clamp(days,0,totalDays)*DAY_PX; }
  return (
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
              return <TimelineRow key={it.id} item={it} left={left} width={width} onChange={onChange} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineRow({ item, left, width, onChange }:{ item:Item; left:number; width:number; onChange:(id:string,p:Partial<Item>)=>void; }){
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
