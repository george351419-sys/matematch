import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chartFor,scoreMatch,apiPayload,buildMatch} from '../src/lib/match.ts';
import {evaluatePair} from '../backend/scoring.mjs';
import {reportMarkdown} from '../src/lib/export.ts';
const ref='2026-10-12';
const a=chartFor({name:'小禾',date:'1994-02-25',time:'02:30',sex:'female',calendar:'solar',leap:false,place:'北京',timezone:'Asia/Shanghai'},ref);
const b=chartFor({...a.input,name:'阿远',date:'1990-02-13',time:'15:37',sex:'male'},ref);
test('six dual-system scores preserve Bazi reference and recompute weighted total',()=>{
 const score=scoreMatch(a,b);assert.deepEqual(score.dimensions.slice(0,6).map(d=>d.bazi),[85,70.5,75,80,74,76]);assert.equal(score.dimensions.length,6);assert.equal(score.dimensions.reduce((n,d)=>n+d.weight,0),100);for(const d of score.dimensions){assert.notEqual(d.ziwei,null);assert.equal(d.score,Math.round((d.bazi!*0.6+d.ziwei!*0.4)*10)/10);}assert.equal(score.total,Math.round(score.dimensions.reduce((n,d)=>n+d.score!*d.weight,0)/100));
});
test('exact reciprocal spouse gods, locations, native clash and harm',()=>{
 const f=scoreMatch(a,b).facts;assert.equal(f.aSeesB,'正官');assert.equal(f.bSeesA,'正财');assert.equal(f.roleCount,2);
 assert.ok(f.a.locations.includes('日支午藏己正官'));assert.ok(f.b.locations.includes('时干壬正财'));assert.ok(f.b.locations.includes('时支申藏壬正财'));
 assert.ok(f.a.native.includes('日支午与时支丑相害'));assert.ok(f.b.native.includes('月支寅与时支申相冲'));assert.equal(f.stem,'未见日干五合');assert.equal(f.branch,'未见直接六合或六冲');
});
test('timing uses exact starting date, not DaYun year range',()=>{
 assert.equal(b.timing.current?.pillar,'辛巳');assert.equal(b.timing.next?.pillar,'壬午');assert.equal(b.timing.next?.start,'2026-12-13');assert.equal(a.timing.current?.pillar,'癸亥');assert.equal(a.timing.next?.start,'2031-01-14');
 assert.equal(chartFor(b.input,'2026-12-12').timing.current?.pillar,'辛巳');assert.equal(chartFor(b.input,'2026-12-13').timing.current?.pillar,'壬午');
});
test('swapping people preserves scores and reverses spouse relation subjects',()=>{
 assert.deepEqual(scoreMatch(a,b).dimensions.map(d=>d.score),scoreMatch(b,a).dimensions.map(d=>d.score));assert.equal(scoreMatch(b,a).facts.aSeesB,'正财');
});
test('scores are computed for each pair, not hardcoded to sample',()=>{
 const c=chartFor({...b.input,date:'1988-06-12'},ref);assert.notDeepEqual(scoreMatch(a,b).dimensions.map(d=>d.score),scoreMatch(a,c).dimensions.map(d=>d.score));
});
test('missing components use available system and missing entire dimension is excluded',()=>{
 const c=chartFor({...b.input,sex:'female'},ref),score=scoreMatch(a,c);for(const i of [0,3]){assert.equal(score.dimensions[i].bazi,null);assert.equal(score.dimensions[i].score,score.dimensions[i].ziwei);}
 const payload=apiPayload(a,b);payload.a.timing={...payload.a.timing,current:null,next:null};for(const person of [payload.a,payload.b])for(const key of ['travel','wellbeing'])person[key]={own:[],used:[],borrowed:true};const missing=evaluatePair(payload.a,payload.b,ref);assert.equal(missing.dimensions[4].score,null);assert.equal(missing.applicableWeight,90);
});
test('Ziwei stars affect all six dimensions and assistance swaps directions',()=>{
 const payload=apiPayload(a,b);for(const person of [payload.a,payload.b])for(const key of ['ming','spouse','wealth','career','wellbeing','travel'])person[key]={own:['天府'],used:['天府'],borrowed:false};const same=evaluatePair(payload.a,payload.b,ref);for(const key of ['ming','spouse','wealth','career','wellbeing','travel'])payload.b[key]={own:['天机'],used:['天机'],borrowed:false};const different=evaluatePair(payload.a,payload.b,ref);same.dimensions.forEach((d,i)=>assert.notEqual(d.score,different.dimensions[i].score));assert.equal(scoreMatch(a,b).facts.assistance[0].score,scoreMatch(b,a).facts.assistance[1].score);
});
test('export includes integrated Ziwei, six dimensions and advice',()=>{
 const text=reportMarkdown(a,b,buildMatch(a,b),'basic');for(const expected of ['甲方看乙方','三条相处建议','紫微线索回顾','编辑参考标尺 v3','彼此助力','不是通行命理定量公式'])assert.ok(text.includes(expected));assert.ok(!/\|\n\n\|/.test(text));
});
