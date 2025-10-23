
import * as React from 'react';
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>){
  const cls='w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-white outline-none focus:ring-2 ring-[var(--green-500)]';
  return <input {...props} className={`${cls} ${props.className||''}`} />;
}
