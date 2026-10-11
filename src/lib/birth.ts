import {Lunar} from 'lunar-javascript';
import type {BirthInput} from './types';
function wallParts(ms:number,tz:string){const p=new Intl.DateTimeFormat('en-GB',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(ms));const get=(k:string)=>Number(p.find(x=>x.type===k)?.value);return Date.UTC(get('year'),get('month')-1,get('day'),get('hour'),get('minute'),get('second'));}
function offset(ms:number,tz:string){return wallParts(ms,tz)-ms;}
export function normalizedBirth(input:BirthInput){
 let [y,m,d]=input.date.split('-').map(Number);const [h,mi]=input.time.split(':').map(Number);
 if(y<1901||y>2100||m<1||m>12||d<1||d>31)throw new Error('日期超出支持范围，请输入 1901–2100 年的有效日期。');
 if(input.leap&&input.calendar!=='lunar')throw new Error('公历日期不能选择闰月。');
 if(input.calendar==='lunar'){try{const l=Lunar.fromYmdHms(y,input.leap?-m:m,d,h,mi,0);if(l.getYear()!==y||l.getMonth()!==(input.leap?-m:m)||l.getDay()!==d)throw new Error();const s=l.getSolar();y=s.getYear();m=s.getMonth();d=s.getDay();}catch{throw new Error('农历日期或闰月无效，请检查月份、日期和闰月选项。')}}
 const local=Date.UTC(y,m-1,d,h,mi);const check=new Date(local);if(check.getUTCFullYear()!==y||check.getUTCMonth()+1!==m||check.getUTCDate()!==d)throw new Error('出生日期不存在，请检查月份和天数。');
 // Find all UTC instants corresponding to the supplied wall clock; reject ambiguous DST folds/gaps.
 const candidates=new Set<number>();for(const probe of [local-86400000,local,local+86400000]){const utc=local-offset(probe,input.timezone);if(wallParts(utc,input.timezone)===local)candidates.add(utc);}
 if(candidates.size!==1)throw new Error('这个钟点处于夏令时跳变或重复区间，请核对出生记录后再试。');
 const utc=[...candidates][0];if(utc>Date.now())throw new Error('出生日期不能晚于今天。');
 const actual=local-utc;const standard=Math.min(offset(Date.UTC(y,0,15,12),input.timezone),offset(Date.UTC(y,6,15,12),input.timezone));
 const dst=actual-standard;const date=new Date(local-dst);
 return {year:date.getUTCFullYear(),month:date.getUTCMonth()+1,day:date.getUTCDate(),hour:date.getUTCHours(),minute:date.getUTCMinutes(),dstMinutes:dst/60000,solarInput:`${y}-${m}-${d} ${input.time}`,normalized:date.toISOString().slice(0,16).replace('T',' ')};
}
