export type BuildRequest={prompt:string;kind:'website'|'game'};
export type BuildResponse={id:string;title:string;summary:string;status:'ready'|'queued'};
export const API_BASE_URL=process.env.EXPO_PUBLIC_API_BASE_URL??'';
export async function createBuild(request:BuildRequest):Promise<BuildResponse>{
 if(!API_BASE_URL){await new Promise(r=>setTimeout(r,700));return{id:`demo-${Date.now()}`,title:request.kind==='game'?'New Wonder Game':'New Wonder Website',summary:`Demo build created from: ${request.prompt}`,status:'ready'};}
 const response=await fetch(`${API_BASE_URL}/build`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)});
 if(!response.ok)throw new Error(`Build request failed (${response.status})`);return response.json();
}
