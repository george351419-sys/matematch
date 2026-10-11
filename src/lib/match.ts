import {z} from 'zod';
import {Solar} from 'lunar-javascript';
import {astro} from 'iztro';
import {normalizedBirth} from './birth';
import {generateChart} from './ziwei/algorithm';
import {themes} from './interpretations';
import type {BirthInput,Narrative,Section} from './types';

export const timezones=[['Asia/Shanghai','中国大陆 · 北京时间'],['Asia/Hong_Kong','中国香港'],['Asia/Taipei','中国台湾'],['Asia/Singapore','新加坡'],['Asia/Tokyo','日本 · 东京'],['America/New_York','美国 · 纽约'],['America/Los_Angeles','美国 · 洛杉矶'],['Europe/London','英国 · 伦敦'],['Europe/Paris','法国 · 巴黎'],['Australia/Sydney','澳大利亚 · 悉尼']] as const;
const schema=z.object({name:z.string().trim().min(1,'请填写称呼').max(30,'称呼最多 30 个字'),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/,'请填写完整的出生日期'),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/,'请填写准确的出生时间'),sex:z.enum(['male','female']),calendar:z.enum(['solar','lunar']),leap:z.boolean(),place:z.string().trim().max(80),timezone:z.string().refine(s=>timezones.some(t=>t[0]===s),'请选择支持的出生时区')});
const wx:Record<string,string>={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
const generates:Record<string,string>={木:'火',火:'土',土:'金',金:'水',水:'木'};
const controls:Record<string,string>={木:'土',土:'水',水:'火',火:'金',金:'木'};
const branches='子丑寅卯辰巳午未申酉戌亥';
export function chartFor(value:BirthInput){
 const parsed=schema.safeParse(value);if(!parsed.success)throw Error(parsed.error.issues[0].message);
 const input=parsed.data as BirthInput;const normalized=normalizedBirth(input);
 const n=normalized,lunar=Solar.fromYmdHms(n.year,n.month,n.day,n.hour,n.minute,0).getLunar(),eight=lunar.getEightChar();eight.setSect(2);
 const pillars=[eight.getYear(),eight.getMonth(),eight.getDay(),eight.getTime()];
 astro.config({dayDivide:'current'});
 const chart=generateChart({year:n.year,month:n.month,day:n.day,hour:n.hour===23?12:Math.floor((n.hour+1)/2),gender:input.sex});
 const palace=(name:string)=>{const p=chart.palaces.find(p=>p.name===name);if(!p)throw Error('紫微排盘未完成，请检查日期。');return p;};
 const mainStars=(name:string)=>{const p=palace(name),own=p.stars.filter(s=>s.type==='major').map(s=>s.name);return {own,used:own.length?own:p.borrowedStars||[],borrowed:!own.length};};
 const ming=mainStars('命宫'),spouse=mainStars('夫妻');
 return {input,normalized,pillars,hidden:[eight.getYearHideGan(),eight.getMonthHideGan(),eight.getDayHideGan(),eight.getTimeHideGan()],dayElement:wx[pillars[2][0]],chart,ming,spouse};
}
export type PersonChart=ReturnType<typeof chartFor>;
function themeText(c:PersonChart,kind:'ming'|'spouse',field:'temperament'|'care'|'friction'|'observe'){
 const used=c[kind].used.map(s=>themes[s]).filter(Boolean);
 return used.length?used.slice(0,2).map(t=>t[field]).join(' '):'这一部分没有足够的主星线索，保留开放，不补造性格结论。';
}
function starBasis(c:PersonChart,kind:'ming'|'spouse'){
 return `${kind==='ming'?'命宫':'夫妻宫'}${c[kind].borrowed?'无主星，借对宫':''}：${c[kind].used.join('、')||'无可用主星'}`;
}
export function pairFacts(a:PersonChart,b:PersonChart){
 const da=a.pillars[2][0],db=b.pillars[2][0],ba=a.pillars[2][1],bb=b.pillars[2][1];
 const pair=ba+bb,contains=(pairs:string[])=>pairs.some(p=>p===pair||p===bb+ba);
 const branch=contains(['子丑','寅亥','卯戌','辰酉','巳申','午未'])?'六合':contains(['子午','丑未','寅申','卯酉','辰戌','巳亥'])?'六冲':ba===bb?'同支':'未见直接六合或六冲';
 const stem=['甲己','乙庚','丙辛','丁壬','戊癸'].some(p=>p===da+db||p===db+da)?'天干五合':'未见日干五合';
 const ea=a.dayElement,eb=b.dayElement;
 const element=ea===eb?'同类':generates[ea]===eb?'甲方生乙方':generates[eb]===ea?'乙方生甲方':controls[ea]===eb?'甲方克乙方':'乙方克甲方';
 return {dayStems:[da,db],dayBranches:[ba,bb],elements:[ea,eb],element,branch,stem};
}
export function buildMatch(a:PersonChart,b:PersonChart):Narrative{
 const f=pairFacts(a,b),na=a.input.name,nb=b.input.name;
 const elementText=f.element==='同类'?'两人的日干五行相同，传统上可作为「容易使用相似表达方式」的讨论线索。相似也可能让双方都等着对方先行动。':f.element.includes('生')?'日干五行呈相生关系，可以借此讨论支持与被支持的分工。但谁照顾谁，应由实际能力与意愿决定，不能按五行固定角色。':'日干五行呈相克关系，可作为「边界与节奏需要协商」的讨论线索。相克不等于伤害，更不代表婚姻一定不顺。';
 const branchText=f.branch==='六冲'?'两人的日支为六冲。传统符号强调差异和变化，但不能据此判断会争吵或分开。更有用的是提前谈好生活节奏、搬家和各自家庭的边界。':f.branch==='六合'?'两人的日支为六合。传统符号偏向连接与协调，但合并不保证幸福；迁就是否自愿、需要能否被说出来，仍需日常观察。':f.branch==='同支'?'两人的日支相同，可以把它作为讨论共同习惯的起点。熟悉感是否带来舒适，需要由真实相处确认。':'两人的日支未见直接六合或六冲。这不表示关系平淡或信息缺失，也不额外推断刑害等未实现的规则。';
 const sections:Section[]=[
  {title:'相处节奏',body:elementText,basis:`甲方日干${f.dayStems[0]}（${f.elements[0]}），乙方日干${f.dayStems[1]}（${f.elements[1]}）；${f.element}。只比较日干，不判旺衰或喜用神。`,action:'各自说出一天中最需要独处的时段，以及希望一起度过的固定时间。'},
  {title:'沟通与被理解',body:`以下是传统命宫象征的讨论假设，而非人格测评。${na}：${themeText(a,'ming','temperament')} ${nb}：${themeText(b,'ming','temperament')}`,basis:`甲方${starBasis(a,'ming')}；乙方${starBasis(b,'ming')}。`,action:'下次倾诉前先问一句：「你希望我先听你说，还是一起想办法？」'},
  {title:'亲密与安全感',body:`夫妻宫描述的是传统关系期待，不能当成对方的真实性格。${na}可能关注的主题：${themeText(a,'spouse','care')} ${nb}可能关注的主题：${themeText(b,'spouse','care')}`,basis:`甲方${starBasis(a,'spouse')}；乙方${starBasis(b,'spouse')}。不把伴侣期待等同于实际伴侣。`,action:'分别列出三件让自己感到被爱的具体小事，再选一件本周一起实践。'},
  {title:'分歧与修复',body:branchText,basis:`双方日支${f.dayBranches.join('、')}：${f.branch}；日干${f.stem}。不判定合化，不把单一关系作为婚配结论。`,action:'约定暂停争论的信号、恢复对话的时间，以及一次只处理一个问题的规则。'},
  {title:'共同生活',body:'生辰不能判断两人的收入、家务能力或家庭观念。婚配报告中这一部分保留为现实核对：预算是否透明、家务如何分配、与双方父母的距离，以及对子女和居住地的期待。',basis:'现实议题清单，不是命盘预测。',action:'安排一次 30 分钟的生活会议，讨论支出、家务和家庭边界，各自写下一个不能妥协的需要。'},
  {title:'一起成长的方向',body:`把下面的问题当作观察提示，不预设它一定存在。${na}：${themeText(a,'ming','observe')} ${nb}：${themeText(b,'ming','observe')}`,basis:'由各自命宫主星的传统象征转述，须由双方经历确认；两套命理体系不能相互证明预测准确。',action:'一周后回看：哪些描述与你们相符，哪些完全不符？保留有帮助的讨论，舍弃不适用的标签。'}
 ];
 return {headline:'看见彼此的不同，也找到靠近的方式',summary:`这份报告将${na}与${nb}的八字和紫微盘并置，从相处节奏、关系期待和日常选择中，提供六个可以一起讨论的角度。它不会替你们给婚姻打分；关系的答案，仍在共同的经历和选择里。`,sections,questions:['发生分歧时，你最希望我先做什么？','我们各自对金钱、家务和双方家庭有哪些期待？','未来一年，你最希望我们共同完成哪件事？']};
}
// The public API receives charts and computed relations only, never names, raw dates or places.
export function apiPayload(a:PersonChart,b:PersonChart){
 const pick=(c:PersonChart)=>({pillars:c.pillars,ming:c.ming,spouse:c.spouse});
 return {a:pick(a),b:pick(b),facts:pairFacts(a,b)};
}
export const branchName=(index:number)=>branches[index];
