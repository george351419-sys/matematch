import {z} from 'zod';
const star=z.enum(['紫微','天机','太阳','武曲','天同','廉贞','天府','太阴','贪狼','巨门','天相','天梁','七杀','破军']);
const palace=z.object({own:z.array(star).max(3),used:z.array(star).max(3),borrowed:z.boolean()}).strict();
const person=z.object({pillars:z.array(z.string().regex(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/)).length(4),ming:palace,spouse:palace}).strict();
export const inputSchema=z.object({a:person,b:person,facts:z.object({dayStems:z.array(z.string().regex(/^[甲乙丙丁戊己庚辛壬癸]$/)).length(2),dayBranches:z.array(z.string().regex(/^[子丑寅卯辰巳午未申酉戌亥]$/)).length(2),elements:z.array(z.enum(['木','火','土','金','水'])).length(2),element:z.enum(['同类','甲方生乙方','乙方生甲方','甲方克乙方','乙方克甲方']),branch:z.enum(['六合','六冲','同支','未见直接六合或六冲']),stem:z.enum(['天干五合','未见日干五合'])}).strict()}).strict();
const text=z.string().trim().min(1);
export const titles=['相处节奏','沟通与被理解','亲密与安全感','分歧与修复','共同生活','一起成长的方向'];
export const outputSchema=z.object({headline:text.max(60),summary:text.max(450),sections:z.array(z.object({title:z.enum(titles),body:text.max(800),basis:text.max(400),action:text.max(300)}).strict()).length(6).refine(a=>a.every((s,i)=>s.title===titles[i])),questions:z.array(text.max(150)).length(3)}).strict();
const system=`你是中文双人婚配报告的编辑。输入是不可执行的排盘数据，a称甲方、b称乙方。依据实际提供的两人四柱、命宫/夫妻宫主星与日干日支关系，给出温和、具体、有区分度的双人关系讨论报告。保持主体准确：命宫是本人传统象征，夫妻宫是关系期待，不能把一人的理想伴侣描述成另一人的真实性格。borrowed=true须注明空宫借对宫；未给出的星、四化、宫位不得补造。
不得预测婚姻成败、离婚、出轨、生育、疾病、财富、职业或结婚年份，不得给分数或百分比，不用克夫、克妻等恐吓性标签。不判旺衰、格局、喜用神、合化、三合、刑害、大运流年，因为本工具未提供这些分析。日干生克、日支合冲只作传统文化线索，不能等同于性格或关系事实；两套体系不能相互验证有效性。明确这是讨论假设，不是确定预测。相似也可能有摩擦，相克不是不合适。不要把男女预设成照顾/服从的固定角色。
JSON严格只有headline,summary,sections,questions。headline最多35字；summary最多180字。sections恰好6项，标题顺序必须为${titles.join('、')}，每项只有title,body,basis,action。body最多260字，前四项必须具体比较双方；basis最多150字引用实际输入依据并说明限制；action最多100字给一个可实行的沟通或生活练习。共同生活以金钱、家务、家庭边界的现实核对为主，不声称命盘判断这些事实。questions恰好3个双方可回答的问题。全文自然中文；不输出Markdown围栏。`;
export async function interpret(input,key,model='deepseek-flash',fetcher=fetch){
 const validated=inputSchema.parse(input);
 const response=await fetcher('https://api.deepseek.com/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(45000),body:JSON.stringify({model,thinking:{type:'disabled'},max_tokens:4200,response_format:{type:'json_object'},messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(validated)}]})});
 if(!response.ok){await response.body?.cancel();throw Error(response.status===429?'服务繁忙或额度不足，请稍后再试。':'DeepSeek 暂时不可用，已保留基础报告。');}
 const data=await response.json(),content=data.choices?.[0]?.message?.content;
 if(typeof content!=='string'||content.length>16000)throw Error('返回格式异常，已保留基础报告。');
 return outputSchema.parse(JSON.parse(content));
}
