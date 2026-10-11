import {mkdtemp,cp,readdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=process.cwd();
const run=(args,cwd=root)=>execFileSync('git',['-c','credential.helper=','-c','credential.helper=!gh auth git-credential',...args],{cwd,encoding:'utf8',stdio:['ignore','pipe','inherit']}).trim();
const remote=run(['remote','get-url','origin']);
const name=run(['config','user.name']);const email=run(['config','user.email']);
const dir=await mkdtemp(join(tmpdir(),'matematch-pages-'));
try{
 run(['init','-b','gh-pages'],dir);run(['remote','add','origin',remote],dir);
 if(run(['ls-remote','--heads','origin','gh-pages'],dir)){
  run(['fetch','origin','gh-pages'],dir);run(['reset','--hard','FETCH_HEAD'],dir);
 }
 for(const entry of await readdir(dir)){if(entry!=='.git')await rm(join(dir,entry),{recursive:true,force:true});}
 await cp(resolve(root,'dist'),dir,{recursive:true});await writeFile(join(dir,'.nojekyll'),'');
 run(['config','user.name',name],dir);run(['config','user.email',email],dir);run(['add','.'],dir);
 if(run(['status','--porcelain'],dir))run(['commit','-m','Deploy GitHub Pages site'],dir);
 run(['push','origin','HEAD:gh-pages'],dir);
 console.log('Published static build to gh-pages.');
}finally{await rm(dir,{recursive:true,force:true});}
