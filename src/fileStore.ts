
export type ItemsPayload = { items: any[] };
export async function pickSaveFile(): Promise<FileSystemFileHandle | null> {
  if (!('showSaveFilePicker' in window)) return null as any;
  try {
    // @ts-ignore
    const handle: FileSystemFileHandle = await window.showSaveFilePicker({
      suggestedName: 'ec-roadmap.json',
      types: [{ description: 'EC Roadmap JSON', accept: { 'application/json': ['.json'] } }]
    });
    return handle;
  } catch { return null; }
}
export async function pickOpenFile(): Promise<FileSystemFileHandle | null> {
  if (!('showOpenFilePicker' in window)) return null as any;
  try {
    // @ts-ignore
    const [handle]: FileSystemFileHandle[] = await window.showOpenFilePicker({
      multiple: false,
      types: [{ description: 'EC Roadmap JSON', accept: { 'application/json': ['.json'] } }]
    });
    return handle;
  } catch { return null; }
}
export async function writeToHandle(handle: FileSystemFileHandle, data: ItemsPayload){
  // @ts-ignore
  const writable = await handle.createWritable();
  await writable.write(new Blob([JSON.stringify(data, null, 2)], { type:'application/json' }));
  await writable.close();
}
export async function readFromHandle(handle: FileSystemFileHandle): Promise<ItemsPayload | null> {
  // @ts-ignore
  const file = await handle.getFile();
  const text = await file.text();
  try { return JSON.parse(text); } catch { return null; }
}
export function downloadJson(filename: string, data: any){
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
}
export function uploadJson(): Promise<any | null> {
  return new Promise((resolve) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json';
    inp.onchange = async () => {
      const file = (inp.files && inp.files[0]) ? inp.files[0] : null;
      if (!file) return resolve(null);
      const text = await file.text();
      try { resolve(JSON.parse(text)); } catch { resolve(null); }
    };
    inp.click();
  });
}
