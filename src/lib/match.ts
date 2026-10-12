import {z} from 'zod';
import {Solar} from 'lunar-javascript';
import {astro} from 'iztro';
import {normalizedBirth} from './birth';
import {generateChart} from './ziwei/algorithm';
import {themes} from './interpretations';
import {evaluatePair} from '../../backend/scoring.mjs';
import type {Timing} from './scoring-types';
import type {BirthInput,Narrative,Section} from './types';

export const timezones=[['Asia/Shanghai','中国大陆 · 北京时间'],['Asia/Hong_Kong','中国香港'],['Asia/Taipei','中国台湾'],['Asia/Singapore','新加坡'],['Asia/Tokyo','日本 · 东京'],['America/New_York','美国 · 纽约'],['America/Los_Angeles','美国 · 洛杉矶'],['Europe/London','英国 · 伦敦'],['Europe/Paris','法国 · 巴黎'],['Australia/Sydney','澳大利亚 · 悉尼']] as const;
const schema=z.object({name:z.string().trim().min(1,'请填写称呼').max(30,'称呼最多 30 个字'),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/,'请填写完整的出生日期'),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/,'请填写准确的出生时间'),sex:z.enum(['male','female']),calendar:z.enum(['solar','lunar']),leap:z.boolean(),place:z.string().trim().max(80),timezone:z.string().refine(s=>timezones.some(t=>t[0]===s),'请选择支持的出生时区')});
const wx:Record<string,string>={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
const generates:Record<string,string>={木:'火',火:'土',土:'金',金:'水',水:'木'};
const controls:Record<string,string>={木:'土',土:'水',水:'火',火:'金',金:'木'};
const branches='子丑寅卯辰巳午未申酉戌亥';
export function referenceDate(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function chartFor(value:BirthInput,asOf=referenceDate()){
 const parsed=schema.safeParse(value);if(!parsed.success)throw Error(parsed.error.issues[0].message);
 const input=parsed.data as BirthInput;const normalized=normalizedBirth(input);
 const n=normalized,lunar=Solar.fromYmdHms(n.year,n.month,n.day,n.hour,n.minute,0).getLunar(),eight=lunar.getEightChar();eight.setSect(2);
 const pillars=[eight.getYear(),eight.getMonth(),eight.getDay(),eight.getTime()];
 astro.config({dayDivide:'current'});
 const chart=generateChart({year:n.year,month:n.month,day:n.day,hour:n.hour===23?12:Math.floor((n.hour+1)/2),gender:input.sex});
 const palace=(name:string)=>{const p=chart.palaces.find(p=>p.name===name);if(!p)throw Error('紫微排盘未完成，请检查日期。');return p;};
 const mainStars=(name:string)=>{const p=palace(name),own=p.stars.filter(s=>s.type==='major').map(s=>s.name);return {own,used:own.length?own:p.borrowedStars||[],borrowed:!own.length};};
 const yun=eight.getYun(input.sex==='male'?1:0,1),start=yun.getStartSolar();
 const cycles=yun.getDaYun(14).filter(d=>d.getIndex()>0).map(d=>({pillar:d.getGanZhi(),start:start.nextYear((d.getIndex()-1)*10).toYmd(),end:start.nextYear(d.getIndex()*10).toYmd()}));
 const timing:Timing={asOf,current:cycles.find(c=>c.start<=asOf&&c.end>asOf)||null,next:cycles.find(c=>c.start>asOf)||null,method:'lunar-javascript 起运 sect=1，按起运日期每十年递推；边界当日按进入新运显示，日期为近似参考'};
 const ming=mainStars('命宫'),spouse=mainStars('夫妻');
 return {input,normalized,pillars,timing,hidden:[eight.getYearHideGan(),eight.getMonthHideGan(),eight.getDayHideGan(),eight.getTimeHideGan()],dayElement:wx[pillars[2][0]],chart,ming,spouse};
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
export function scoreMatch(a:PersonChart,b:PersonChart){return evaluatePair(apiPerson(a),apiPerson(b),a.timing.asOf);}
function apiPerson(c:PersonChart){return {pillars:c.pillars,sex:c.input.sex,ming:c.ming,spouse:c.spouse,timing:c.timing};}
export function buildMatch(a:PersonChart,b:PersonChart):Narrative{
 const score=scoreMatch(a,b),f=score.facts,pa=f.a,pb=f.b;
 const roles=f.hetero?`甲方为${pa.day}${pa.dayElement}日主，乙方日干${pb.day}对应甲方的${f.aSeesB}；乙方为${pb.day}${pb.dayElement}日主，甲方日干${pa.day}对应乙方的${f.bSeesA}。`:'这组组合不套用传统异性配偶星角色，因此相关两项不计分，也不作为缺点。';
 const attraction=f.roleCount===2?'双方日主恰好对应彼此传统意义上的正配偶星，可以作为把对方纳入伴侣角色的象征线索，适合认真了解。':'配偶角色的对应并不是判断关系好坏的门槛，仍要观察彼此是否愿意认真考虑未来。';
 const timingText=(c:PersonChart,label:string)=>c.timing.current&&c.timing.next?`${label}当前为${c.timing.current.pillar}大运，约${c.timing.next.start}转入${c.timing.next.pillar}大运。`:`${label}暂无可用的当前与下一步大运，不补造时间。`;
 const sections:Section[]=[
  {title:'缘分与吸引',verdict:score.dimensions[0].verdict,body:`${roles}\n\n${attraction}\n\n${f.stem}，双方日支${a.pillars[2][1]}与${b.pillars[2][1]}${f.branch}。不能将单一配偶星对应称为“天地相合”或唯一正缘，也不能直接认定必然一见钟情。`,basis:`明确盘面关系：${roles}日干${f.stem}，日支${f.branch}。`,action:'核对：你们是否愿意把对方纳入未来计划，而不只是维持短期好感？'},
  {title:'性格与相处',verdict:score.dimensions[1].verdict,body:`${f.support?'两盘显干之间存在生扶对方日主的五行线索。':'本项没有把所有藏干纳入生扶判断，也不判定身强身弱。'}${f.controlled?'同时，双方日干存在五行制约关系；支持与干预可能需要仔细区分。':'日干未见直接相克，但不能因此认定没有主导权分歧。'}\n\n最值得核对的是：一方的安排，另一方感受到的是“有人帮我承担”，还是“有人替我决定”？提供资源、信息和行动时，是否也保留了对方的选择权？这些是待验证的场景，不是对性格的判定。`,basis:`盘面：甲方${pa.day}${pa.dayElement}，乙方${pb.day}${pb.dayElement}；跨盘显干生扶${f.support?'可见':'未纳入更多推断'}。场景：帮助与主导权属于弱取象推演。`,action:'帮助之前先问：你希望我提供支持，还是希望保留自己决定的空间？'},
  {title:'情绪与沟通',verdict:score.dimensions[2].verdict,body:`${f.paths?`原局可见${f.paths}条显干的食伤生财五行路径，可作为讨论“通过表达和办事投入关系”的线索；不据此判定格局成立。`:'本项未见所核对的显干食伤生财路径，不代表表达能力差。'}\n\n一个值得核对的循环是：一方提出不满 → 另一方解释或给方案 → 前者觉得感受被忽略 → 后者觉得努力不被认可。双方都可能在维护关系，却没有回应对方当下的需要。分数保守来自这套解释标尺，不是命盘证明你们沟通差。`,basis:`盘面显干路径：甲方${pa.foodWealth?pa.foodWealthPath:'未见本项路径'}；乙方${pb.foodWealth?pb.foodWealthPath:'未见本项路径'}。缺少实际互动资料，沟通场景为较弱假设。`,action:'回想最近一次争执：结束时，你们理解了对方，还是只是停止了说话？先确认感受，再讨论事实，最后决定行动。'},
  {title:'生活与金钱',verdict:score.dimensions[3].verdict,body:`${f.paths===2?`甲方原局有${pa.foodWealthPath}、乙方有${pb.foodWealthPath}的显干路径，可以借此讨论把想法变成行动。`:'共同经营生活仍需要实际分工，不能用命盘替代预算和责任的讨论。'}这不意味着在一起必定旺财，也不证明消费观一致。\n\n需要警惕的是默认分工：一个人决定方向，另一个配合，久了却觉得承担与决定权不对等。日常开支、储蓄、大额支出、家务和照顾家人的责任，都应说具体。`,basis:`盘面五行路径可直接核对；金钱观、收入、家务能力不可从这些线索测量。`,action:'约定哪些钱和时间可以自主支配，哪些需要共同商量；不要把“应该懂”当作“已经约定”。'},
  {title:'长期婚姻适配',verdict:score.dimensions[4].verdict,body:`${f.hetero?`甲方原局：${pa.locations.join('；')||'未见本规则所取的正配偶星'}。乙方原局：${pb.locations.join('；')||'未见本规则所取的正配偶星'}。`:'这里以共同生活的责任兑现为核对重点，不套用传统异性婚配角色。'}双方日支${f.branch}；没有冲也不能单独证明婚姻幸福。\n\n${f.nativeNotes.join('。')}。这些首先属于各自原局，不能说成对方带来的问题，也不能据此推断出轨或离婚。面对工作变化、异地、搬家或照顾父母时，能否共同重新分配责任，才是需要验证的长期能力。`,basis:'本项只看各自原局正配偶星位置与双方日支直接六冲，不重复计算第一项的互为配偶星；原局冲害另列为事实，不直接转换为婚姻结果。',action:'讨论一次生活发生变化时的分工：谁能多承担什么，什么时候重新协商，而不是要求对方始终照旧配合。'},
  {title:'关系发展节奏',verdict:score.dimensions[5].verdict,body:`以${score.asOf}为参考日。${timingText(a,'甲方')}${timingText(b,'乙方')}\n\n起运按本站 sect=1 计算，与截图或其他流派可能有数日差异。大运只作为传统讨论背景，不能保证结婚，也不表示一定出现新对象。本站未做完整流年合婚，不能选出“最佳结婚年份”。更有用的是核对未来一两年的同居、结婚、换城市、换工作、住房和家庭责任安排。`,basis:`${a.timing.method}。不用年度区间替代具体交运日期；不沿用示例中的年份。`,action:'各自写下未来两年的三个重要安排，找出需要共同决定的一项，不因某个年份仓促推进关系。'}
 ];
 const advantage=f.roleCount===2?'双方日主对应彼此的传统正配偶星，伴侣角色呼应较明确。':'盘面提供了可以认真讨论的关系线索，是否愿意投入仍由双方的真实行动确认。';
 const challenge=f.controlled?'表达关心、分配责任和共同决策时，把“替你安排”变成“与你商量”。':'把彼此的期待说具体，让日常责任与决定权保持可协商。';
 return {headline:f.roleCount===2?'伴侣角色有对应，适合认真了解':'以真实相处，核对命盘中的关系线索',summary:`${advantage}主要需要磨合的是${challenge}明确的干支关系与生活场景推演分开列出，避免把假设当成事实。`,advantage,challenge,sections,perspectives:[{direction:'甲方看乙方',smooth:'可能愿意投入、提供帮助，把关系纳入未来计划；请用实际经历核对。',friction:'可能觉得已经付出很多，却没有回应到对方真正的需要；不是对内心的判定。'},{direction:'乙方看甲方',smooth:'可能感到有人共同承担、愿意认真协商，有一起生活的空间。',friction:'如果建议替代了倾听，可能觉得感受与选择被安排覆盖；这条同样可能发生在反方向。'}],advice:[{title:'给建议前，多问一句',body:'“你希望我先听你说，还是一起想办法？”让好意更容易被对方接收到，双方都适用。'},{title:'把需要说成可以执行的请求',body:'例如：“我想让你陪我聊十分钟，先不要提建议。”比“你根本不懂我”更容易让对方知道如何回应。'},{title:'每月安排一次共同生活讨论',body:'集中谈钱、时间、家务与未来安排，各说一件感谢的事、一件需要调整的事，再共同决定一个小行动。'}],conclusion:`${advantage}这份参考分表达的是传统结构的解释，不是关系质量的判决。最值得保留的是愿意为彼此投入，最值得练习的是协商，而不是把自己的付出方式当成对方唯一需要的方式。`,ziwei:`紫微独立补充，不计入八字分数。甲方${starBasis(a,'ming')}；乙方${starBasis(b,'ming')}。甲方的传统关系期待：${themeText(a,'spouse','care')}乙方的传统关系期待：${themeText(b,'spouse','care')}夫妻宫不是对另一人的真实性格判定，两套体系也不能互相证明预测准确。`,questions:['最近一次争执后，我们是理解了彼此，还是只是停止说话？','哪些帮助让我感到被支持，哪些安排让我失去选择权？','未来两年，哪些关于钱、居住地和家庭责任的决定需要一起商量？']};
}
export function apiPayload(a:PersonChart,b:PersonChart){return {version:2,asOf:a.timing.asOf,a:apiPerson(a),b:apiPerson(b)};}
export const branchName=(index:number)=>branches[index];
