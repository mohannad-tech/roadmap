
import * as React from 'react';
export function Card(p: React.HTMLAttributes<HTMLDivElement>){ return <div {...p} className={`card ${p.className||''}`} /> }
export function CardHeader(p: React.HTMLAttributes<HTMLDivElement>){ return <div {...p} className={`p-6 ${p.className||''}`} /> }
export function CardTitle(p: React.HTMLAttributes<HTMLHeadingElement>){ return <h3 {...p} className={`heading ${p.className||''}`} /> }
export function CardContent(p: React.HTMLAttributes<HTMLDivElement>){ return <div {...p} className={`p-6 pt-0 ${p.className||''}`} /> }
