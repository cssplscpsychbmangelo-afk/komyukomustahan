const path=require('path');
const {spawn}=require('child_process');
const http=require('http');
const {JSDOM,VirtualConsole}=require('jsdom');
const axeSource=require('axe-core').source;

const PORT=8795;
const srv=spawn(process.execPath,[path.join('/home/user/komyukomustahan','serve.js'),String(PORT)],{stdio:'ignore'});

function wait(t=40){return new Promise((res,rej)=>{const go=n=>{const r=http.get({host:'127.0.0.1',port:PORT,path:'/'},x=>{x.resume();res();});r.on('error',()=>n<=0?rej(new Error('no server')):setTimeout(()=>go(n-1),120));};go(t);});}

(async()=>{
  await wait();
  const pages=['index.html','gallery.html','guide.html'];
  let total=0;
  for(const page of pages){
    const vc=new VirtualConsole();
    const dom=await JSDOM.fromURL(`http://127.0.0.1:${PORT}/${page}`,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:vc});
    await new Promise(r=>setTimeout(r,500));
    const win=dom.window;
    // axe needs a real-ish env; inject
    win.eval(axeSource);
    let v = (await win.eval(`axe.run(document, {resultTypes:['violations']})`)).violations;
    console.log(`\n=== ${page}: ${v.length} violation types`);
    v.forEach(x=>{
      total+=x.nodes.length;
      console.log(`  [${x.impact}] ${x.id} — ${x.help} (${x.nodes.length})`);
      x.nodes.slice(0,3).forEach(n=>console.log('      ',n.target.join(' ').slice(0,90),'|',(n.failureSummary||'').split('\n')[1]?.trim().slice(0,100)||''));
    });
  }
  /* now drive the activity and audit the screens that only exist mid-flow */
  {
    const vc=new VirtualConsole();
    const dom=await JSDOM.fromURL(`http://127.0.0.1:${PORT}/index.html`,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:vc});
    await new Promise(r=>setTimeout(r,500));
    const win=dom.window, doc=win.document;
    win.eval(axeSource);
    const step=async(label)=>{
      const v=(await win.eval(`axe.run(document, {resultTypes:['violations']})`)).violations;
      console.log(`\n=== ${label}: ${v.length} violation types`);
      v.forEach(x=>{ total+=x.nodes.length;
        console.log(`  [${x.impact}] ${x.id} — ${x.help} (${x.nodes.length})`);
        x.nodes.slice(0,3).forEach(n=>console.log('      ',n.target.join(' ').slice(0,80),'|',(n.failureSummary||'').split('\n')[1]?.trim().slice(0,90)||''));
      });
    };
    doc.querySelector('#btn-begin').click();
    await new Promise(r=>setTimeout(r,80));
    doc.querySelector('#btn-to-quiz').click();
    await new Promise(r=>setTimeout(r,120));
    await step('quiz (question 1)');
    for(const k of ['B','C','D']){
      doc.querySelector('.option[data-key="'+k+'"]').click();
      await new Promise(r=>setTimeout(r,450));
    }
    doc.querySelector('#btn-skip-processing').click();
    await new Promise(r=>setTimeout(r,150));
    await step('reveal');
    doc.querySelector('#btn-to-reflect').click();
    await new Promise(r=>setTimeout(r,150));
    await step('reflect');
    doc.querySelector('#btn-to-twist').click();
    await new Promise(r=>setTimeout(r,150));
    await step('twist');
  }

  console.log(`\nTOTAL nodes with violations: ${total}`);
  srv.kill();
  process.exit(0);
})().catch(e=>{console.error(e.message);srv.kill();process.exit(1);});
