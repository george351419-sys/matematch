import {LunarUtil} from 'lunar-javascript';
const sourceTitles=['缘分与吸引','性格与相处','情绪与沟通','生活与金钱','长期婚姻适配','关系发展节奏','彼此助力'];
export const titles=['缘分与吸引','性格与沟通','生活与金钱','长期婚姻适配','关系发展节奏','彼此助力'];
export const weights=[15,30,15,15,10,15];
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

// Editorial symbolic categories, not empirical personality or fortune measurements.
const groups={规划:['紫微','天府','武曲','天相'],行动:['太阳','七杀','破军','廉贞'],交流:['天机','巨门','贪狼'],照顾:['太阴','天同','天梁']};
const palaceLabels={ming:'命宫',spouse:'夫妻宫',wealth:'财帛宫',career:'官禄宫',wellbeing:'福德宫',travel:'迁移宫'};
const tags=p=>new Set((p?.used||[]).flatMap(star=>Object.entries(groups).filter(([,stars])=>stars.includes(star)).map(([tag])=>tag)));
function affinity(p,q){if(!p?.used?.length||!q?.used?.length)return null;const x=tags(p),y=tags(q);return 68+Array.from(x).filter(t=>y.has(t)).length*6;}
const average=values=>{const known=values.filter(v=>v!==null);return known.length?Math.round(known.reduce((a,b)=>a+b,0)/known.length*10)/10:null;};
function ziweiDimension(a,b,index){
 const routes=[['ming','spouse'],['ming','ming'],['ming','wellbeing'],['wealth','wealth'],['spouse','spouse'],['travel','wellbeing'],['career','wealth']];
 const [x,y]=routes[index],value=average([affinity(a[x],b[y]),affinity(b[x],a[y])]);
 const describe=(person,label,key)=>`${label}${palaceLabels[key]}${person[key]?.borrowed?'（借对宫）':''}：${person[key]?.used?.join('、')||'资料不足'}`;
 return {score:value,basis:[describe(a,'甲方',x),describe(b,'乙方',y),...(x===y?[]:[describe(b,'乙方',x),describe(a,'甲方',y)])].join('；'),formula:'每个方向基准68＋共同象征类别数×6，两方向取平均；类别为规划、行动、交流、照顾。类别不同不代表不合，空宫借星不扣分；无星资料的方向剔除'};
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
 const direction=(from,to,pf,pt,label)=>{const supports=pf.visibleElements.some(e=>generates[e]===pt.dayElement);const z=affinity(from.career,to.wealth);return {direction:label,bazi:70+(supports?6:0),ziwei:z,basis:`显干${supports?'有':'未见'}生扶对方日主的路径；官禄宫到对方财帛宫仅作协作方式的讨论，不判断收入或喜用神`,score:Math.round(z===null?70+(supports?6:0):(70+(supports?6:0))*0.6+z*0.4)};};
 const assistance=[direction(a,b,pa,pb,'甲方对乙方'),direction(b,a,pb,pa,'乙方对甲方')];
 scoreValues.push(average(assistance.map(d=>d.bazi)));
 formulas.push('分别核对显干是否生扶对方日主：基准70＋可见生扶6，双向平均；未定喜用神，生扶不等于有益运势');
 verdicts.push('分别核对资源、行动与情绪支持，把助力变成可兑现的分工');
 const sourceDimensions=sourceTitles.map((title,i)=>{const z=ziweiDimension(a,b,i),bz=scoreValues[i];const combined=bz===null?z.score:z.score===null?bz:Math.round((bz*0.6+z.score*0.4)*10)/10;return {title,score:combined,bazi:bz,ziwei:z.score,ziweiBasis:z.basis,weight:[15,15,15,15,15,10,15][i],verdict:verdicts[i],formula:`八字：${formulas[i]}。紫微：${z.formula}。两项齐全时八字60%＋紫微40%；仅一项适用时使用该项，不按零分处理。${i===5?'紫微为本命迁移与福德的变化需求比较，不是紫微大运流年预测。':''}`};});
 const left=sourceDimensions[1],right=sourceDimensions[2];
 const merged={...left,title:titles[1],weight:30,score:average([left.score,right.score]),bazi:average([left.bazi,right.bazi]),ziwei:average([left.ziwei,right.ziwei]),ziweiBasis:left.ziweiBasis+'；'+right.ziweiBasis,verdict:controlled?'关心需要先被理解，做决定时给彼此留出空间':'把相处习惯与情绪需要说清楚，一起商量解决办法',formula:'性格相处与情绪沟通各占本项一半。'+left.formula+'；'+right.formula};
 const dimensions=[sourceDimensions[0],merged,...sourceDimensions.slice(3)];
 const applicableWeight=dimensions.reduce((s,d)=>s+(d.score===null?0:d.weight),0);
 const raw=dimensions.reduce((s,d)=>s+(d.score??0)*d.weight,0)/applicableWeight;
 const weighted=Math.round(raw*10)/10,total=Math.round(raw);
 const facts={a:pa,b:pb,aSeesB,bSeesA,hetero,roleCount,branch,stem,support,controlled,paths,nativeNotes,timingKnown,upcoming,assistance};
 return {version:'编辑参考标尺 v3',asOf,scope:'八字 × 紫微六维参考评分',dimensions,applicableWeight,weighted,total,facts,disclaimer:'分数是站内传统命理编辑标尺；八字沿用示例规则，紫微采用主星象征类别比较，六维重算后不与旧版分数直接比较，不是通行命理定量公式、婚姻成功率或真实人格测量。沟通、金钱和生活场景是弱取象假设，须用真实经历核对。'};
}
