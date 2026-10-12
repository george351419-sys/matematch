import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chartFor,scoreMatch,apiPayload,buildMatch} from '../src/lib/match.ts';
import {evaluatePair} from '../backend/scoring.mjs';
import {reportMarkdown} from '../src/lib/export.ts';
const ref='2026-10-12';
const a=chartFor({name:'小禾',date:'1994-02-25',time:'02:30',sex:'female',calendar:'solar',leap:false,place:'北京',timezone:'Asia/Shanghai'},ref);
const b=chartFor({...a.input,name:'阿远',date:'1990-02-13',time:'15:37',sex:'male'},ref);
test('reference sample has six requested scores with corrected weighted arithmetic',()=>{
 const score=scoreMatch(a,b);assert.deepEqual(score.dimensions.map(d=>d.score),[85,73,68,75,80,74]);assert.deepEqual(score.dimensions.map(d=>d.weight),[15,20,20,15,20,10]);assert.equal(score.weighted,75.6);assert.equal(score.total,76);assert.equal(score.applicableWeight,100);
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
test('nonapplicable spouse roles and missing timing excluded and reweighted, not zero',()=>{
 const c=chartFor({...b.input,sex:'female'},ref),score=scoreMatch(a,c);assert.equal(score.dimensions[0].score,null);assert.equal(score.dimensions[4].score,null);assert.equal(score.applicableWeight,65);
 const payload=apiPayload(a,b);payload.a.timing={...payload.a.timing,current:null,next:null};const missing=evaluatePair(payload.a,payload.b,ref);assert.equal(missing.dimensions[5].score,null);assert.equal(missing.applicableWeight,90);assert.equal(missing.weighted,75.8);
});
test('export includes score, perspectives, advice and separated Ziwei supplement',()=>{
 const text=reportMarkdown(a,b,buildMatch(a,b),'basic');for(const expected of ['76／100','75.6','甲方看乙方','三条相处建议','紫微独立补充','编辑参考标尺 v1','不是通行命理定量公式'])assert.ok(text.includes(expected));assert.ok(!/\|\n\n\|/.test(text));
});
