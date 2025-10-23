
import * as React from 'react';
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'outline' | 'solid' | 'danger' };
export function Button({ className='', variant='solid', ...props }: Props){
  const base = 'px-4 py-2 text-sm rounded-xl transition shadow-sm active:scale-[.99]';
  const style =
    variant==='outline' ? 'border border-[var(--line)] bg-white hover:bg-[var(--muted)]' :
    variant==='danger' ? 'bg-rose-600 text-white hover:bg-rose-500' :
    'bg-[var(--green)] text-white hover:bg-[var(--green-600)]';
  return <button className={`${base} ${style} ${className}`} {...props}/>;
}
