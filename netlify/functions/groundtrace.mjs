import crypto from "node:crypto";
const memories = new Map();
const MAX_AGE_DAYS = 180, MIN_SIMILARITY = 0.70;
const json = (statusCode, body) => ({ statusCode, headers: { "content-type":"application/json; charset=utf-8", "cache-control":"no-store" }, body: JSON.stringify(body) });
const tokens = (text="") => new Set(text.toLowerCase().match(/[a-z0-9]+/g) || []);
function similarity(a,b){ const A=tokens(a),B=tokens(b); if(!A.size||!B.size)return 0; let n=0; for(const t of A)if(B.has(t))n++; return n/Math.sqrt(A.size*B.size); }
function admit(m,s){ if(!m.provenance?.source)return ["REJECT","missing_provenance"]; if(!m.outcome_success)return ["REJECT","unsuccessful_prior_outcome"]; if(!m.verified)return ["HOLD","memory_unverified"]; const age=(Date.now()-Date.parse(m.occurred_at))/86400000; if(!Number.isFinite(age)||age>MAX_AGE_DAYS)return ["HOLD","memory_stale"]; if(s<MIN_SIMILARITY)return ["HOLD","similarity_below_threshold"]; return ["RELY","admissible_memory"]; }
export async function handler(event){
 if(event.httpMethod!=="POST")return json(405,{error:"method_not_allowed"}); let p; try{p=JSON.parse(event.body||"{}")}catch{return json(400,{error:"invalid_json"})}
 if(p.operation==="health")return json(200,{status:"ok",runtime:"webmcp-isolated-demo"});
 if(p.operation==="remember"){ if(["tenant_id","incident_text","action_text","occurred_at"].some(k=>!p[k]))return json(400,{error:"missing_required_field"}); const id=crypto.randomUUID(); memories.set(id,{id,tenant_id:p.tenant_id,incident_text:p.incident_text,action_text:p.action_text,outcome_success:Boolean(p.outcome_success),verified:Boolean(p.verified),occurred_at:p.occurred_at,provenance:p.provenance||null}); return json(200,{status:"REMEMBERED",memory_id:id}); }
 if(p.operation==="recall"){ if(!p.tenant_id||!p.incident_text)return json(400,{error:"missing_required_field"}); const candidates=[...memories.values()].filter(m=>m.tenant_id===p.tenant_id).map(m=>({m,s:similarity(p.incident_text,m.incident_text)})).sort((a,b)=>b.s-a.s).slice(0,5).map(({m,s})=>{const [admission,reason]=admit(m,s);return {memory_id:m.id,similarity:Number(s.toFixed(3)),admission,reason,action_text:admission==="RELY"?m.action_text:undefined,provenance:m.provenance}}); const relied=candidates.find(c=>c.admission==="RELY"); return json(200,{status:relied?"RELY":candidates.length?"HOLD":"NO_MEMORY",recommendation:relied?.action_text||null,trace_id:crypto.randomUUID(),candidates}); }
 return json(400,{error:"unsupported_operation"});
}
