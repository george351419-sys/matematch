import {inputSchema,interpret} from '../backend/service.mjs';
const counters=new Map();
function allowed(key,max){const now=Date.now();let c=counters.get(key);if(!c||now-c.at>=60000)c={at:now,n:0};c.n++;counters.set(key,c);if(counters.size>5000)for(const [k,v] of counters)if(now-v.at>=60000)counters.delete(k);return c.n<=max;}
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('Vary','Origin');
 const send=(status,data)=>{res.statusCode=status;res.end(JSON.stringify(data));};
 const origins=(process.env.ALLOWED_ORIGINS||'https://george351419-sys.github.io').split(',').map(s=>s.trim());
 const origin=req.headers.origin;
 if(!origin||!origins.includes(origin))return send(403,{error:'请求来源未授权。'});
 res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');
 if(req.method==='OPTIONS'){res.statusCode=204;return res.end();}
 if(req.method!=='POST')return send(405,{error:'仅接受 POST 请求。'});
 if(!req.headers['content-type']?.includes('application/json'))return send(415,{error:'请使用 JSON 格式。'});
 if(!process.env.DEEPSEEK_API_KEY)return send(503,{error:'AI 解读尚未配置，基础报告可正常使用。'});
 const ip=String(req.headers['x-vercel-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];
 if(!allowed('ip:'+ip,3)||!allowed('site',30))return send(429,{error:'请求较多，请一分钟后重试。'});
 let input;
 try{
  let body=req.body;
  if(body===undefined){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>12000)return send(413,{error:'请求过长。'});chunks.push(chunk);}body=Buffer.concat(chunks).toString();}
  const raw=typeof body==='string'?body:JSON.stringify(body);
  if(Buffer.byteLength(raw)>12000)return send(413,{error:'请求过长。'});
  input=inputSchema.parse(JSON.parse(raw));
 }catch{return send(400,{error:'双人排盘摘要格式无效。'});}
 try{return send(200,{report:await interpret(input,process.env.DEEPSEEK_API_KEY,process.env.DEEPSEEK_MODEL||'deepseek-flash'),provider:'DeepSeek'});}
 catch(e){return send(502,{error:e instanceof Error&&e.message.startsWith('服务繁忙')?e.message:'AI 解读暂时不可用或返回格式异常，已保留基础报告。'});}
}
