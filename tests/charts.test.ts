import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chartFor,apiPayload,buildMatch,pairFacts} from '../src/lib/match.ts';
import type {BirthInput} from '../src/lib/types.ts';
const base:BirthInput={name:'测试',date:'1994-02-25',time:'02:30',sex:'female',calendar:'solar',leap:false,place:'北京',timezone:'Asia/Shanghai'};
const chart=(overrides:Partial<BirthInput>={})=>chartFor({...base,...overrides});
test('matches soulmate female and male fixtures',()=>{
 const a=chart(),b=chart({date:'1990-02-13',time:'15:37',sex:'male'});
 assert.deepEqual(a.pillars,['甲戌','丙寅','壬午','辛丑']);assert.deepEqual(a.spouse.own,['天相']);
 assert.deepEqual(b.pillars,['庚午','戊寅','己酉','壬申']);assert.deepEqual(b.spouse.own,['太阳']);assert.equal(a.chart.palaces.length,12);
});
test('solar and lunar equivalence, valid leap month',()=>{
 const a=chart({date:'1990-02-13',time:'15:37',sex:'male'}),b=chart({date:'1990-01-18',time:'15:37',sex:'male',calendar:'lunar'});
 assert.deepEqual(a.pillars,b.pillars);assert.deepEqual(a.spouse,b.spouse);
 assert.equal(chart({date:'2025-06-10',calendar:'lunar',leap:true}).normalized.solarInput,'2025-8-3 02:30');
});
test('DST standard time normalization matches soulmate',()=>{assert.equal(chart({date:'1990-07-01',time:'15:00'}).normalized.normalized,'1990-07-01 14:00');});
test('rejects invalid dates, missing times, future dates and invalid leap months',()=>{
 for(const v of [{date:'1994-02-30'},{date:'1994-13-01'},{time:''},{date:'2099-01-01'},{date:'2025-05-10',calendar:'lunar',leap:true},{leap:true},{timezone:'Invalid/Zone'}])assert.throws(()=>chart(v as Partial<BirthInput>));
});
test('rejects ambiguous and nonexistent DST clock times',()=>{
 assert.throws(()=>chart({date:'2021-11-07',time:'01:30',timezone:'America/New_York'}),/夏令时/);
 assert.throws(()=>chart({date:'2021-03-14',time:'02:30',timezone:'America/New_York'}),/夏令时/);
});
test('23:00 keeps day pillar and uses late Zi index 12',()=>{
 const late=chart({date:'1994-02-25',time:'23:30'}),earlier=chart({date:'1994-02-25',time:'22:30'});
 assert.equal(late.pillars[2],earlier.pillars[2]);assert.equal(late.chart.birthInfo.hour,12);
});
test('same-gender pairs supported; payload removes raw identity and places',()=>{
 const a=chart(),b=chart({name:'另外一人',place:'秘密地点',date:'1990-02-13'});const payload=JSON.stringify(apiPayload(a,b));
 for(const str of ['测试','另外一人','秘密地点','1994-02-25','1990-02-13','02:30'])assert.ok(!payload.includes(str));
 assert.equal(buildMatch(a,b).sections.length,6);assert.equal(buildMatch(a,b).questions.length,3);
});
test('changing the other person changes the pair facts and report',()=>{
 const a=chart(),b=chart({date:'1990-02-13'}),c=chart({date:'1988-06-12'});
 assert.notDeepEqual(pairFacts(a,b),pairFacts(a,c));assert.notDeepEqual(buildMatch(a,b).sections,buildMatch(a,c).sections);
});
