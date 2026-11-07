/* Drive all 64 combinations through the actual UI and record the card shown. */
const path=require('path'),{spawn}=require('child_process'),http=require('http');
const {JSDOM,VirtualConsole}=require('jsdom');
const PORT=8811;
const srv=spawn(process.execPath,[path.join('/home/user/komyukomustahan','serve.js'),String(PORT)],{stdio:'ignore'});
const SP=require('/home/user/komyukomustahan/superpowers.js');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  await new Promise((resolve, reject) => {
    let tries = 60;
    const tick = () => {
      const req = http.get({ host: '127.0.0.1', port: PORT, path: '/' }, res => {
        res.resume(); resolve();
      });
      req.on('error', () => { if (tries-- <= 0) return reject(new Error('server never came up')); setTimeout(tick, 100); });
    };
    tick();
  });
  const results={};
  const combos=[];
  for(const a of 'ABCD') for(const b of 'ABCD') for(const c of 'ABCD') combos.push(a+b+c);
  for(const combo of combos){
    const dom=await JSDOM.fromURL(`http://127.0.0.1:${PORT}/index.html`,{
      runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
    await wait(320);
    const doc=dom.window.document;
    doc.querySelector('#btn-begin').click(); await wait(40);
    doc.querySelector('#btn-to-quiz').click(); await wait(90);
    for(const k of combo.split('')){ doc.querySelector('.option[data-key="'+k+'"]').click(); await wait(420); }
    doc.querySelector('#btn-skip-processing').click(); await wait(120);
    const shown=doc.querySelector('#reveal-name').textContent.trim();
    const expected=SP.powerFor({q1:combo[0],q2:combo[1],q3:combo[2]}).name;
    results[combo]={shown,expected,ok:shown===expected};
    dom.window.close();
  }
  const bad=Object.entries(results).filter(([k,v])=>!v.ok);
  console.log('combinations tested:',combos.length);
  console.log('mismatches:',bad.length);
  bad.forEach(([k,v])=>console.log('  ',k,'shown',v.shown,'expected',v.expected));
  const seen=new Set(Object.values(results).map(v=>v.shown));
  console.log('distinct powers reachable through the UI:',seen.size);
  console.log('AEGIS reached by:',Object.entries(results).filter(([,v])=>v.shown==='AEGIS').map(([k])=>k).join(' '));
  srv.kill(); process.exit(bad.length?1:0);
})().catch(e=>{console.error(e);srv.kill();process.exit(1);});
