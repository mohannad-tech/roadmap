export function Button(p:any){return <button className={'px-4 py-2 rounded-xl '+(p.variant==='danger'?'bg-rose-600 text-white':'bg-[var(--green)] text-white')} {...p}/>}
