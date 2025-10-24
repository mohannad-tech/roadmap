export function Card(p:any){return <div className={'card '+(p.className||'')} {...p}/>}
export function CardHeader(p:any){return <div className={'p-6 '+(p.className||'')} {...p}/>}
export function CardTitle(p:any){return <h3 className={'heading '+(p.className||'')} {...p}/>}
export function CardContent(p:any){return <div className={'p-6 pt-0 '+(p.className||'')} {...p}/>}
