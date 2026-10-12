import {LunarUtil} from 'lunar-javascript';
export const titles=['缘分与吸引','性格与相处','情绪与沟通','生活与金钱','长期婚姻适配','关系发展节奏'];
export const weights=[15,20,20,15,20,10];
const elements={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
const generates={木:'火',火:'土',土:'金',金:'水',水:'木'},controls={木:'土',土:'水',水:'火',火:'金',金:'木'};
const pairs={合:['子丑','寅亥','卯戌','辰酉','巳申','午未'],冲:['子午','丑未','寅申','卯酉','辰戌','巳亥'],害:['子未','丑午','寅巳','卯辰','申亥','酉戌']};
const hasPair=(x,y,list)=>list.some(p=>p===x+y||p===y+x);
export function personFacts(p){
 const day=p.pillars[2][0],dayElement=elements[day],spouseGod=p.sex==='male'?'正财':'正官';
 const hidden=p.pillars.map(p=>LunarUtil.ZHI_HIDE_GAN[p[1]]);
 const gods=p.pillars.map(p=>LunarUtil.SHI_SHEN[day+p[0]]);
 const spouseStems=Object.keys(elements).filter(g=>LunarUtil.SHI_SHEN[day+g]===spouseGod);
 const locations=[];for(let i=0;i<4;i++)for(const g of spouseStems){if(p.pillars[i][0]===g)locations.push(`${['年','月','日','时'][i]}干${g}${spouseGod}`);if(hidden[i].includes(g))locations.push(`${['年','月','日','时'][i]}支${p.pillars[i][1]}藏${g}${spouseGod}`);}
 const native=[];for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)for(const kind of ['冲','害'])if(hasPair(p.pillars[i][1],p.pillars[j][1],pairs[kind]))native.push(`${['年','月','日','时'][i]}支${p.pillars[i][1]}与${['年','月','日','时'][j]}支${p.pillars[j][1]}相${kind}`);
 const visibleElements=p.pillars.map(p=>elements[p[0]]);
 const food=generates[dayElement],wealth=controls[dayElement];
 // A visible symbolic path, not a successful 格局 or a strength judgement.
 const foodWealth=visibleElements.includes(food)&&visibleElements.includes(wealth);
 return {day,dayElement,hidden,gods,spouseGod,spouseStems,locations,native,visibleElements,foodWealth,foodWealthPath:`${food}生${wealth}`};
}
export function evaluatePair(a,b,asOf){
 const pa=personFacts(a),pb=personFacts(b),hetero=a.sex!==b.sex;
 const aSeesB=LunarUtil.SHI_SHEN[pa.day+pb.day],bSeesA=LunarUtil.SHI_SHEN[pb.day+pa.day];
 const roleCount=hetero?Number(aSeesB===pa.spouseGod)+Number(bSeesA===pb.spouseGod):0;
 const ba=a.pillars[2][1],bb=b.pillars[2][1];
 const branch=hasPair(ba,bb,pairs.合)?'六合':hasPair(ba,bb,pairs.冲)?'六冲':ba===bb?'同支':'未见直接六合或六冲';
 const stem=hasPair(pa.day,pb.day,['甲己','乙庚','丙辛','丁壬','戊癸'])?'天干五合':'未见日干五合';
 const controlled=controls[pa.dayElement]===pb.dayElement||controls[pb.dayElement]===pa.dayElement;
 const support=pa.visibleElements.some(e=>generates[e]===pb.dayElement)||pb.visibleElements.some(e=>generates[e]===pa.dayElement);
 const paths=Number(pa.foodWealth)+Number(pb.foodWealth);
 const nativeNotes=[`甲方原局：${pa.native.join('；')||'未见本工具核对的六冲六害'}`,`乙方原局：${pb.native.join('；')||'未见本工具核对的六冲六害'}`];
 const clocks=[a.timing,b.timing],timingKnown=clocks.every(t=>t&&t.asOf===asOf&&t.current&&t.next);
 const upcoming=timingKnown&&clocks.some(t=>{const days=(Date.parse(t.next.start)-Date.parse(asOf))/86400000;return days>=0&&days<=730;});
 const scoreValues=[hetero?65+roleCount*10+(stem==='天干五合'?3:0)+(branch==='六合'?2:0):null,70+(support?6:0)-(controlled?3:0),70+(paths===2?4:0)-(controlled?6:0),69+paths*3,hetero?68+Number(pa.locations.length>0)*6+Number(pb.locations.length>0)*6-(branch==='六冲'?4:0):null,timingKnown?70+(upcoming?4:0):null];
 const formulas=[hetero?`基准65＋配偶星角色对应${roleCount}×10${stem==='天干五合'?'＋日干五合3':''}${branch==='六合'?'＋日支六合2':''}`:'传统异性配偶角色规则不适用；不计入，不作低分处理',`基准70${support?'＋跨盘生扶线索6':''}${controlled?'－日干制约讨论3':''}`,`基准70${paths===2?'＋双方表达转行动线索4':''}${controlled?'－需核对沟通错位6':''}`,`基准69＋原局食伤到财的显干路径${paths}×3`,hetero?`基准68＋各自原局正配偶星可见${Number(pa.locations.length>0)+Number(pb.locations.length>0)}×6${branch==='六冲'?'－日支六冲议题4':''}；不重复计入互为配偶星`:'传统异性配偶星规则不适用；不计入，不作低分处理',timingKnown?`基准70${upcoming?'＋未来两年可核对换运安排4':''}；表示讨论主题，不表示某年宜婚`:'大运资料不足，不评分，也不补造换运时间'];
 const verdicts=[roleCount===2?'彼此有较明确的配偶角色对应':hetero?'配偶角色对应需结合原局分别看':'不套用传统异性配偶角色',support&&controlled?'有互相支持的空间，也要留意主导权':'把不同的节奏变成可协商的分工',controlled?'最需要核对：给方案与被理解是否错位':'核对表达方式与情绪需求是否一致',paths===2?'可围绕共同目标合作，分工必须说清楚':'先谈清预算与责任，不默认金钱观一致',hetero?'婚恋结构须由真实的共同生活验证':'以真实承诺和责任分工作为核对重点',timingKnown?(upcoming?'临近换运，适合核对双方未来安排':'以当前阶段为背景，谈清未来安排'):'资料不足，先讨论现实中的未来安排'];
 const dimensions=titles.map((title,i)=>({title,score:scoreValues[i],weight:weights[i],verdict:verdicts[i],formula:formulas[i]}));
 const applicableWeight=dimensions.reduce((s,d)=>s+(d.score===null?0:d.weight),0);
 const raw=dimensions.reduce((s,d)=>s+(d.score??0)*d.weight,0)/applicableWeight;
 const weighted=Math.round(raw*10)/10,total=Math.round(raw);
 const facts={a:pa,b:pb,aSeesB,bSeesA,hetero,roleCount,branch,stem,support,controlled,paths,nativeNotes,timingKnown,upcoming};
 return {version:'编辑参考标尺 v1',asOf,scope:'八字参考评分；紫微补充不计分',dimensions,applicableWeight,weighted,total,facts,disclaimer:'分数是按所给示例校准的站内传统命理解释标尺，不是通行命理定量公式、婚姻成功率或真实人格测量。沟通、金钱和生活场景是弱取象假设，须用真实经历核对。'};
}
