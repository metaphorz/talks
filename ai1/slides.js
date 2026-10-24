// AI Part 1 — title animation, music and per-slide interactions.
(function(){
  var NS='http://www.w3.org/2000/svg';
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var presenter=/[?&]presenter\b/.test(location.search);
  function $(sel,root){return (root||document).querySelector(sel);}
  function $$(sel,root){return [].slice.call((root||document).querySelectorAll(sel));}
  function el(tag,attrs,parent){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
  function slideOf(sel){return $('#stage '+sel);}
  // call on(true/false) whenever the slide is shown or hidden
  function watch(slide,on){
    if(!slide) return; var was=null;
    function check(){var now=slide.classList.contains('on'); if(now!==was){was=now;on(now);}}
    new MutationObserver(check).observe(slide,{attributes:true,attributeFilter:['class']}); check();
  }
  // a single-choice button group
  function group(root,attr,cb){
    var bs=$$('button['+attr+']',root);
    bs.forEach(function(b){b.addEventListener('click',function(){
      bs.forEach(function(x){x.classList.toggle('on',x===b);}); cb(b.getAttribute(attr),b);
    });});
  }
  // keep clicks on SVG controls from advancing the slide
  ['#neuron','.s-router .hub','.s-graph .board'].forEach(function(s){var e=$(s);if(e)e.setAttribute('data-noadvance','');});
  // the tutorial video stops when its slide is left
  (function(){var v=slideOf('.s-tut video'); if(v) watch(v.closest('.slide'),function(on){if(!on) v.pause();});})();

  // ================= 1 · title: a neural network that fires into the five elements =================
  (function(){
    var cv=$('#nn'); if(!cv) return;
    var slide=cv.closest('.slide'), ctx=cv.getContext('2d'); ctx.scale(2,2);
    var seed=7; function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
    var sizes=[5,8,10,10,8,5], outs=['Prompt','Level','Writing','Knowledge Graph','Roleplay'];
    var layers=[], edges=[], pulses=[], dust=[];
    sizes.forEach(function(n,l){
      var x=415+l*76, gap=Math.min(62,500/(n-1)), L=[];
      for(var i=0;i<n;i++) L.push({x:x,y:360+(i-(n-1)/2)*gap,a:0,cool:0,ph:rnd()*6.28,l:l,out:[],label:l===sizes.length-1?outs[i]:null});
      layers.push(L);
    });
    for(var l=0;l<layers.length-1;l++) layers[l].forEach(function(a){ layers[l+1].forEach(function(b){
      var e={a:a,b:b,w:rnd()*2-1,ph:rnd()*6.28,hot:0}; edges.push(e); a.out.push(e);
    });});
    for(var d=0;d<70;d++) dust.push({x:rnd()*960,y:rnd()*720,r:.5+rnd()*1.3,v:4+rnd()*10,ph:rnd()*6.28});
    function w(e,t){return e.w+.35*Math.sin(t*.35+e.ph);}
    function fire(n,t){
      n.a=1; n.cool=.35;
      n.out.forEach(function(e){ var we=w(e,t); if(we>0&&rnd()<we*.42&&pulses.length<260) pulses.push({e:e,u:0,sp:1.4+rnd()*.8}); });
    }
    var last=null, spawn=0;
    function step(t,dt){
      spawn-=dt; if(spawn<=0){ spawn=.16+rnd()*.18; fire(layers[0][Math.floor(rnd()*layers[0].length)],t); }
      layers.forEach(function(L){L.forEach(function(n){ n.a=Math.max(0,n.a-dt*1.1); n.cool-=dt; });});
      for(var i=pulses.length-1;i>=0;i--){ var p=pulses[i]; p.u+=dt*p.sp; p.e.hot=Math.min(1,p.e.hot+dt*4);
        if(p.u>=1){ pulses.splice(i,1); var b=p.e.b; b.a=Math.min(1.2,b.a+.5*Math.max(.2,w(p.e,t)));
          if(b.a>.62&&b.cool<=0) fire(b,t); } }
      edges.forEach(function(e){e.hot=Math.max(0,e.hot-dt*1.5);});
    }
    function py(n,t){return n.y+Math.sin(t*.5+n.ph)*4;}
    function draw(t){
      ctx.clearRect(0,0,960,720);
      dust.forEach(function(p){ var y=(p.y-t*p.v)%720; if(y<0)y+=720;
        ctx.fillStyle='rgba(127,196,192,'+(.10+.08*Math.sin(t+p.ph)).toFixed(3)+')'; ctx.beginPath(); ctx.arc(p.x+Math.sin(t*.3+p.ph)*8,y,p.r,0,6.283); ctx.fill(); });
      ctx.lineWidth=1;
      edges.forEach(function(e){ var we=w(e,t), al=.035+.09*Math.abs(we)+.35*e.hot;
        ctx.strokeStyle=(we>=0?'rgba(95,169,166,':'rgba(201,133,47,')+al.toFixed(3)+')';
        ctx.beginPath(); ctx.moveTo(e.a.x,py(e.a,t)); ctx.lineTo(e.b.x,py(e.b,t)); ctx.stroke(); });
      pulses.forEach(function(p){ var a=p.e.a,b=p.e.b, ay=py(a,t), by=py(b,t);
        var x=a.x+(b.x-a.x)*p.u, y=ay+(by-ay)*p.u, u0=Math.max(0,p.u-.18), x0=a.x+(b.x-a.x)*u0, y0=ay+(by-ay)*u0;
        var g=ctx.createLinearGradient(x0,y0,x,y); g.addColorStop(0,'rgba(240,180,90,0)'); g.addColorStop(1,'rgba(240,180,90,.9)');
        ctx.strokeStyle=g; ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x,y); ctx.stroke();
        ctx.fillStyle='#F4C27A'; ctx.beginPath(); ctx.arc(x,y,2.2,0,6.283); ctx.fill(); });
      layers.forEach(function(L){ L.forEach(function(n){ var y=py(n,t), a=Math.min(1,n.a);
        if(a>.02){ var g=ctx.createRadialGradient(n.x,y,0,n.x,y,22); g.addColorStop(0,'rgba(240,170,80,'+(.55*a).toFixed(3)+')'); g.addColorStop(1,'rgba(240,170,80,0)');
          ctx.fillStyle=g; ctx.beginPath(); ctx.arc(n.x,y,22,0,6.283); ctx.fill(); }
        ctx.fillStyle=a>.3?'#C9852F':'#1F2E36'; ctx.strokeStyle=a>.3?'#F4C27A':'#5FA9A6'; ctx.lineWidth=1.6;
        ctx.beginPath(); ctx.arc(n.x,y,n.label?7:5.5,0,6.283); ctx.fill(); ctx.stroke();
        if(n.label){ ctx.font='600 14px "Noto Sans", Arial'; ctx.textBaseline='middle';
          ctx.fillStyle='rgba(247,243,234,'+(.45+.55*a).toFixed(3)+')'; ctx.fillText(n.label,n.x+16,y); }
      });});
    }
    // warm up so the first frame is already alive
    for(var k=0;k<160;k++) step(k/30,1/30);
    var t=160/30;
    if(reduce){ draw(t); return; }
    var raf=0;
    function frame(ts){ var dt=last===null?0:Math.min(.05,(ts-last)/1000); last=ts; t+=dt; step(t,dt); draw(t); raf=requestAnimationFrame(frame); }
    watch(slide,function(on){ if(on&&!raf){last=null;raf=requestAnimationFrame(frame);} if(!on&&raf){cancelAnimationFrame(raf);raf=0;} });
    draw(t);
  })();

  // ================= music: plays on the title slide, fades out on slide 2 =================
  (function(){
    var slide=slideOf('.s-title'), btn=$('#music-btn'); if(!slide||!btn) return;
    var state=$('.state',btn);
    if(presenter){ state.textContent='plays in the audience window'; return; }
    var audio=new Audio('audio/celestial-drift.mp3'); audio.loop=true; audio.preload='auto'; audio.volume=0;
    var MAX=.75, want=true, timer=0;
    function show(){ var p=!audio.paused&&want; btn.classList.toggle('playing',p);
      state.textContent=p?'playing · press M to pause':(want?'click to play':'paused'); }
    function fade(to,ms,done){
      clearInterval(timer); var from=audio.volume, t0=Date.now();
      timer=setInterval(function(){ var u=Math.min(1,(Date.now()-t0)/ms), e=u*u*(3-2*u);
        audio.volume=Math.max(0,Math.min(1,from+(to-from)*e));
        if(u>=1){clearInterval(timer); if(done)done();} },40);
    }
    function start(){ if(!want) return;
      var p=audio.play(); if(p&&p.then) p.then(function(){fade(MAX,2500);show();}).catch(show); else {fade(MAX,2500);show();} }
    function stop(ms){ fade(0,ms,function(){audio.pause();show();}); }
    function onTitle(){return slide.classList.contains('on');}
    function toggle(){ if(!audio.paused&&want){want=false;stop(700);} else {want=true;if(onTitle())start();} show(); }
    btn.addEventListener('click',toggle);
    document.addEventListener('keydown',function(e){
      if(e.metaKey||e.ctrlKey||e.altKey) return;
      if(e.key==='m'||e.key==='M'){toggle();return;}
      if(onTitle()&&audio.paused&&want) start();          // first key press unlocks audio
    });
    document.addEventListener('pointerdown',function(e){
      if(e.target.closest('#music-btn')) return;
      if(onTitle()&&audio.paused&&want) start();
    });
    watch(slide,function(on){ if(on) start(); else if(!audio.paused) stop(5000); });
  })();

  // ================= 5 · story dice: tumble, then land on bird, house, person =================
  (function(){
    var slide=slideOf('.s-dice'); if(!slide) return;
    var cubes=$$('.cube',slide), btn=$('#dice-roll'), timer=0;
    btn.setAttribute('data-noadvance','');
    function rest(i){return 'rotateX(-16deg) rotateY('+(14-i*14)+'deg)';}
    function roll(){
      clearTimeout(timer); slide.classList.remove('landed');
      cubes.forEach(function(c,i){c.style.transform=rest(i);});
      if(reduce||!cubes[0].animate){ slide.classList.add('landed'); return; }
      var last=0;
      cubes.forEach(function(c,i){
        var x=360*(2+Math.floor(Math.random()*2))+Math.random()*90, y=360*(2+Math.floor(Math.random()*2))+Math.random()*90, z=Math.random()*120-60, d=1300+i*220;
        c.animate([{transform:'translateY(-150px) rotateX('+x+'deg) rotateY('+y+'deg) rotateZ('+z+'deg)'},
                   {transform:'translateY(0) rotateX('+(x*.25)+'deg) rotateY('+(y*.25)+'deg)',offset:.55},
                   {transform:'translateY(-22px) rotateX(-30deg) rotateY('+(30-i*14)+'deg)',offset:.75},
                   {transform:'translateY(0) '+rest(i)}],{duration:d,easing:'cubic-bezier(.3,.6,.4,1)'});
        last=Math.max(last,d);
      });
      timer=setTimeout(function(){slide.classList.add('landed');},last-100);
    }
    btn.addEventListener('click',function(e){e.stopPropagation();roll();});
    watch(slide,function(on){ if(on) roll(); });
  })();

  // ================= 2 · openness =================
  (function(){
    var slide=slideOf('.s-open'); if(!slide) return;
    var R=[
      ['Writer',['Brainstorm titles, openings and angles','Be a first reader: what is unclear?','Suggest a form: letter, haiku, scene'],['Your voice and your experience','What to keep and what to cut']],
      ['Musician',['Sketch a melody or backing track from words','Try a style you have never played','Suggest chords for your lyric'],['Taste: which take is right','The feeling you are after']],
      ['Artist',['Make studies and variations','Explore palettes and compositions','Turn a rough sketch into options'],['Your eye: what is worth making','The meaning behind the image']],
      ['Designer',['Many layouts, fast','A clickable prototype from a description','A critique against your goal'],['The real problem and the real user','The final choice']],
      ['Director',['Storyboards and shot lists','Short generated clips to test an idea','A table-read of your script in many voices'],['The story and its pacing','Casting your tools and collaborators']]
    ];
    var roles=$$('.role',slide), spokes=$$('.spoke',slide), fade=$('.panel .fade',slide), cur=-1, auto=0, stopped=false;
    function li(a){return a.map(function(s){return '<li>'+s+'</li>';}).join('');}
    function pick(i){
      if(i===cur) return; cur=i;
      roles.forEach(function(r,k){r.classList.toggle('on',k===i);}); spokes.forEach(function(s,k){s.classList.toggle('on',k===i);});
      fade.style.opacity=0;
      setTimeout(function(){ $('#role-name').textContent=R[i][0]; $('#role-ai').innerHTML=li(R[i][1]); $('#role-you').innerHTML=li(R[i][2]); fade.style.opacity=1; },180);
    }
    roles.forEach(function(r,k){r.addEventListener('click',function(){stopped=true;clearInterval(auto);pick(k);});});
    pick(0);
    watch(slide,function(on){ clearInterval(auto); if(on&&!stopped&&!reduce) auto=setInterval(function(){pick((cur+1)%5);},3800); });
  })();

  // ================= 3 · attention =================
  (function(){
    var slide=slideOf('.s-attn'); if(!slide) return;
    var lab=$('#breath'), clock=$('#sit-clock'), go=$('#sit-go'), bt=0, ct=0;
    watch(slide,function(on){
      clearInterval(bt);
      if(on){ var t0=Date.now(); lab.textContent='breathe in';
        bt=setInterval(function(){ lab.textContent=((Date.now()-t0)%10000)<5000?'breathe in':'breathe out'; },250); }
    });
    go.addEventListener('click',function(){
      clearInterval(ct); var end=Date.now()+60000; go.textContent='Restart';
      function tick(){ var s=Math.max(0,Math.ceil((end-Date.now())/1000));
        clock.textContent=Math.floor(s/60)+':'+('0'+s%60).slice(-2);
        if(s===0){clearInterval(ct);clock.textContent='What did you notice?';clock.style.fontSize='24px';} else clock.style.fontSize=''; }
      tick(); ct=setInterval(tick,250);
    });
  })();

  // ================= 4 · history: click an era to revisit it =================
  (function(){
    var slide=slideOf('.s-hist'); if(!slide) return;
    var cards=$('.cards',slide), cs=$$('.ecard',slide), eras=$$('.era',slide);
    function clear(){cards.classList.remove('picked');cs.forEach(function(c){c.classList.remove('pick');});eras.forEach(function(e){e.classList.remove('pick');});}
    eras.forEach(function(e){ e.addEventListener('click',function(){
      if(!e.classList.contains('shown')) return;
      clear(); var k=+e.getAttribute('data-k'); cards.classList.add('picked'); cs[k].classList.add('pick'); e.classList.add('pick');
    });});
    document.addEventListener('keydown',function(e){ if(/Arrow|Page| |Enter|Backspace/.test(e.key)) clear(); });
    watch(slide,function(on){if(!on)clear();});
  })();

  // ================= 5 · rules vs weights =================
  (function(){
    var slide=slideOf('.s-two'); if(!slide) return;
    var F={feathers:1,flies:0,swims:0,legs:1,sings:0};
    $$('#facts .btn').forEach(function(b){ b.addEventListener('click',function(){
      var f=b.getAttribute('data-f'); F[f]=F[f]?0:1; b.classList.toggle('on',!!F[f]); rules(); }); });
    function rules(){
      var bird=!!F.feathers, fired={1:bird,2:bird&&F.legs,3:bird&&F.swims&&!F.flies,4:bird&&F.flies&&F.sings};
      $$('#rules li').forEach(function(li){li.classList.toggle('fire',!!fired[li.getAttribute('data-r')]);});
      var c=[], why=[];
      if(fired[2]){c.push('a wading bird');why.push('R1 → R2');}
      if(fired[3]){c.push('a penguin');why.push('R1 → R3');}
      if(fired[4]){c.push('a songbird');why.push('R1 → R4');}
      var h;
      if(!bird) h='No conclusion.<small>No rule matches these facts — the system knows only what it was told.</small>';
      else if(!c.length) h='It is a bird.<small>Because R1. But no rule says what kind.</small>';
      else if(c.length>1) h='It is '+c.join(' and ')+'?!<small>Because '+why.join(' and ')+'. Nothing in the rules forbids it: rules are brittle.</small>';
      else h='It is '+c[0]+'.<small>Because '+why[0]+'. The system can explain its reasoning.</small>';
      $('#concl').innerHTML=h;
    }
    rules();
    // the neuron
    var svg=$('#neuron'), X=[1,1,0], W=[1.5,1,-.5], B=-1.5, names=['feathers','long legs','flies'], ys=[45,125,205];
    var gE=el('g',{},svg), gN=el('g',{},svg), lines=[], wl=[], ins=[];
    ys.forEach(function(y,i){
      lines.push(el('line',{x1:62,y1:y,x2:196,y2:125,'stroke-linecap':'round'},gE));
      wl.push(el('text',{x:112,y:y+(125-y)*.38-8,'font-size':12,'font-weight':700,'font-family':'Noto Sans Mono, monospace','text-anchor':'middle'},gE));
      var g=el('g',{style:'cursor:pointer'},gN);
      ins.push(el('circle',{cx:40,cy:y,r:20,'stroke-width':2},g));
      var t=el('text',{x:40,y:y+5,'font-size':14,'font-weight':700,'font-family':'Noto Sans','text-anchor':'middle',fill:'#fff'},g); t.setAttribute('class','v');
      el('text',{x:40,y:y+36,'font-size':11.5,'font-family':'Noto Sans','text-anchor':'middle',fill:'#5B636B'},g).textContent=names[i];
      g.addEventListener('click',function(){X[i]=X[i]?0:1;neuron();});
    });
    el('line',{x1:268,y1:125,x2:312,y2:125,stroke:'#20252B','stroke-width':2.5},gE);
    el('circle',{cx:232,cy:125,r:36,fill:'#20252B'},gN);
    el('text',{x:232,y:132,'font-size':22,'font-weight':700,fill:'#fff','text-anchor':'middle','font-family':'Noto Sans'},gN).textContent='Σ';
    el('text',{x:232,y:180,'font-size':11.5,fill:'#5B636B','text-anchor':'middle','font-family':'Noto Sans'},gN).textContent='bias −1.5';
    var oc=el('circle',{cx:336,cy:125,r:24,stroke:'#C9852F','stroke-width':2},gN);
    var ot=el('text',{x:336,y:130,'font-size':13,'font-weight':700,'text-anchor':'middle','font-family':'Noto Sans'},gN);
    el('text',{x:336,y:168,'font-size':11.5,fill:'#5B636B','text-anchor':'middle','font-family':'Noto Sans'},gN).textContent='wading bird';
    var wrow=$('#weights');
    W.forEach(function(_,i){
      var d=document.createElement('div'); d.className='w';
      d.innerHTML='weight '+(i+1)+'<div class="ctl"><button class="btn">−</button><span></span><button class="btn">+</button></div>';
      var bs=d.querySelectorAll('button');
      bs[0].addEventListener('click',function(){W[i]=Math.max(-2,+(W[i]-.5).toFixed(1));neuron();});
      bs[1].addEventListener('click',function(){W[i]=Math.min(2,+(W[i]+.5).toFixed(1));neuron();});
      wrow.appendChild(d);
    });
    function fmt(v){return (v<0?'−':'')+Math.abs(v).toFixed(1);}
    function neuron(){
      var z=B; W.forEach(function(w,i){z+=w*X[i];});
      var o=1/(1+Math.exp(-2*z));
      lines.forEach(function(l,i){ l.setAttribute('stroke',W[i]>=0?'#1D6E73':'#C9852F'); l.setAttribute('stroke-width',(1+2.4*Math.abs(W[i])).toFixed(1));
        l.setAttribute('opacity',X[i]?1:.3); wl[i].textContent=fmt(W[i]); wl[i].setAttribute('fill',W[i]>=0?'#1D6E73':'#A86A1E'); });
      ins.forEach(function(c,i){ c.setAttribute('fill',X[i]?'#1D6E73':'#fff'); c.setAttribute('stroke','#1D6E73'); c.parentNode.querySelector('.v').textContent=X[i];
        c.parentNode.querySelector('.v').setAttribute('fill',X[i]?'#fff':'#1D6E73'); });
      oc.setAttribute('fill','rgba(201,133,47,'+o.toFixed(2)+')'); ot.textContent=Math.round(o*100)+'%'; ot.setAttribute('fill',o>.55?'#fff':'#20252B');
      $$('#weights .ctl span').forEach(function(s,i){s.textContent=fmt(W[i]);});
      $('#nout').innerHTML='sum = '+W.map(function(w,i){return fmt(w)+'×'+X[i];}).join(' + ')+' − 1.5 = <b>'+fmt(z)+'</b> → '+Math.round(o*100)+'% “wading bird”';
    }
    neuron();
  })();

  // ================= 6 · deep learning =================
  (function(){
    var slide=slideOf('.s-deep'); if(!slide) return;
    var svg=$('#deepnet'), sizes=[4,6,6,5,3], tags=['pixels','edges','shapes','parts','label'], outs=['cat','dog','bird'];
    var seed=3; function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
    var gE=el('g',{},svg), gN=el('g',{},svg), L=[], E=[];
    sizes.forEach(function(n,l){ var x=36+l*90, arr=[];
      for(var i=0;i<n;i++){ var y=150+(i-(n-1)/2)*Math.min(52,250/(n-1)); arr.push({x:x,y:y}); }
      L.push(arr);
      el('text',{x:x,y:318,'font-size':12,'font-weight':700,fill:'#5B636B','text-anchor':'middle','font-family':'Noto Sans'},gN).textContent=tags[l];
    });
    for(var l=0;l<L.length-1;l++) L[l].forEach(function(a){L[l+1].forEach(function(b){
      E.push({w0:rnd()*.6-.3,w1:(rnd()<.62?1:-1)*(.25+rnd()*.85),ph:rnd()*6.28,el:el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,'stroke-linecap':'round'},gE)});
    });});
    var outC=[];
    L.forEach(function(arr,l){ arr.forEach(function(n,i){
      var c=el('circle',{cx:n.x,cy:n.y,r:11,fill:'#fff',stroke:'#1D6E73','stroke-width':2},gN);
      if(l===L.length-1){ outC.push(c); el('text',{x:n.x+18,y:n.y+5,'font-size':14,'font-weight':600,fill:'#20252B','font-family':'Noto Sans'},gN).textContent=outs[i]; }
    });});
    // loss chart
    var ch=$('#loss');
    el('line',{x1:30,y1:8,x2:30,y2:140,stroke:'#C9BFAE','stroke-width':1.5},ch); el('line',{x1:30,y1:140,x2:290,y2:140,stroke:'#C9BFAE','stroke-width':1.5},ch);
    el('text',{x:24,y:16,'font-size':10.5,fill:'#5B636B','text-anchor':'end','font-family':'Noto Sans'},ch).textContent='high';
    el('text',{x:24,y:140,'font-size':10.5,fill:'#5B636B','text-anchor':'end','font-family':'Noto Sans'},ch).textContent='low';
    el('text',{x:160,y:157,'font-size':10.5,fill:'#5B636B','text-anchor':'middle','font-family':'Noto Sans'},ch).textContent='training examples →';
    var lp=el('path',{fill:'none',stroke:'#C9852F','stroke-width':2.5,'stroke-linejoin':'round'},ch);
    var pts=[]; for(var i=0;i<=120;i++){ var u=i/120, v=.06+.9*Math.exp(-4.2*u)+.05*(1-u)*Math.sin(i*1.7)*(i%3?1:-1); pts.push([30+u*260,140-128*Math.max(0,Math.min(1,v))]); }
    function paint(p){
      E.forEach(function(e){ var w=e.w0+(e.w1-e.w0)*p+(p>0&&p<1?.12*Math.sin(p*40+e.ph):0), a=Math.abs(w);
        e.el.setAttribute('stroke',w>=0?'#1D6E73':'#C9852F'); e.el.setAttribute('stroke-width',(.4+3*a).toFixed(2)); e.el.setAttribute('opacity',(.15+.6*a).toFixed(2)); });
      var n=Math.round(p*120), d=''; for(var i=0;i<=n;i++) d+=(i?'L':'M')+pts[i][0].toFixed(1)+','+pts[i][1].toFixed(1);
      lp.setAttribute('d',n?d:'');
      $('#ep').textContent=Math.round(p*60000).toLocaleString();
      $('#acc').textContent=Math.round(33+61*(1-Math.exp(-4*p)))+'%';
      outC.forEach(function(c,i){ var on=p>=1&&i===0; c.setAttribute('fill',on?'#C9852F':'#fff'); c.setAttribute('stroke',on?'#C9852F':'#1D6E73'); });
    }
    paint(0);
    var btn=$('#train'), trained=false, raf=0;
    btn.addEventListener('click',function(){
      cancelAnimationFrame(raf);
      if(trained){ trained=false; btn.textContent='Train'; paint(0); return; }
      var t0=performance.now();
      (function f(ts){ var p=Math.min(1,(ts-t0)/4500); paint(p); if(p<1) raf=requestAnimationFrame(f); else {trained=true;btn.textContent='Reset';} })(t0);
    });
  })();

  // ================= 7 · next word =================
  (function(){
    var slide=slideOf('.s-next'); if(!slide) return;
    var START='The heron stood in the';
    var STEPS=[
      [['water',.46],['shallows',.22],['marsh',.14],['rain',.08],['fog',.06],['library',.04]],
      [['waiting',.36],['watching',.27],['motionless,',.17],['alone,',.12],['humming',.05],['juggling',.03]],
      (function(){ var verb=[['for',.44],['as',.2],['while',.16],['like',.1],['until',.07],['because',.03]],
                         still=[['as',.34],['while',.26],['like',.2],['until',.12],['because',.08]];
        return {'waiting':verb,'watching':verb,'humming':verb,'juggling':verb,'motionless,':still,'alone,':still}; })(),
      { // the ending depends on the word before it, so every sentence stays grammatical
        'for':[['a fish.',.4],['the tide.',.24],['the light.',.16],['its mate.',.11],['nothing.',.06],['Tuesday.',.03]],
        'as':[['a fish appeared.',.38],['the tide turned.',.25],['the sun rose.',.17],['the fog lifted.',.11],['the world woke.',.06],['a poem began.',.03]],
        'while':[['fish circled its feet.',.36],['the tide turned.',.25],['the sun rose.',.17],['the frogs sang.',.12],['the rain fell.',.07],['jazz played.',.03]],
        'like':[['a statue.',.42],['a fence post.',.24],['a question mark.',.15],['an old priest.',.1],['a poem.',.06],['a Tuesday.',.03]],
        'until':[['a fish appeared.',.4],['the tide turned.',.24],['the sun rose.',.16],['the fog lifted.',.11],['nightfall.',.06],['Tuesday.',.03]],
        'because':[['it was hungry.',.42],['the fish were near.',.25],['it was tired.',.15],['herons do.',.1],['it could.',.05],['it liked jazz.',.03]]
      }
    ];
    var T=1, k=0, words=[];
    function step(){ var s=STEPS[k]; return Array.isArray(s)?s:s[words[words.length-1]]; }
    function probs(){ var s=step(), q=s.map(function(c){return Math.pow(c[1],1/T);}), z=q.reduce(function(a,b){return a+b;},0);
      return s.map(function(c,i){return [c[0],q[i]/z];}); }
    function render(){
      var html=START+' '+words.map(function(w,i){return '<span class="'+(i===words.length-1?'new':'')+'">'+w+'</span>';}).join(' ');
      $('#sent').innerHTML=html+(k<STEPS.length?'<span class="caret"></span>':'');
      var box=$('#cands'); box.innerHTML='';
      if(k>=STEPS.length){ box.innerHTML='<p style="margin:8px 0;font-size:16px;color:var(--grey)">Done. Start over, or change the temperature and try again.</p>'; $('#nx').disabled=true; return; }
      $('#nx').disabled=false;
      probs().forEach(function(c){
        var b=document.createElement('button'); b.className='cand';
        b.innerHTML='<span class="w">'+c[0]+'</span><span class="b"><i style="width:'+(c[1]*100).toFixed(1)+'%"></i></span><span class="p">'+Math.round(c[1]*100)+'%</span>';
        b.addEventListener('click',function(){choose(c[0],b);}); box.appendChild(b);
      });
    }
    function choose(w,b){ if(b) b.classList.add('pick'); setTimeout(function(){ words.push(w); k++; render(); },b?260:0); }
    function sample(){
      if(k>=STEPS.length) return;
      var p=probs(), r=Math.random(), acc=0, i=0;
      for(;i<p.length;i++){acc+=p[i][1];if(r<=acc)break;}
      i=Math.min(i,p.length-1); choose(p[i][0],$$('#cands .cand')[i]);
    }
    $('#nx').addEventListener('click',sample);
    $('#nr').addEventListener('click',function(){k=0;words=[];render();});
    group($('#temps'),'data-t',function(v){T=+v;render();});
    render();
  })();

  // ================= 9 · OpenRouter =================
  (function(){
    var slide=slideOf('.s-router'); if(!slide) return;
    var svg=$('#router');
    var P=[['OpenAI','GPT-6 Astra'],['Anthropic','Claude Opus 5.5'],['Google','Gemini 4 Argon'],['Meta','a Llama model'],['Mistral','a Mistral model'],
           ['DeepSeek','a DeepSeek model'],['Qwen','a Qwen model'],['+ 290 more','one of 300+ models']];
    var you={x:58,y:220}, hub={x:205,y:220};
    var gL=el('g',{},svg), gN=el('g',{},svg), gP=el('g',{},svg), provs=[];
    P.forEach(function(p,i){ var y=38+i*50, x=372;
      var ln=el('line',{x1:hub.x,y1:hub.y,x2:x-56,y2:y,stroke:'#3C5560','stroke-width':1.2},gL);
      var g=el('g',{'class':'prov'},gN), r=el('rect',{x:x-56,y:y-16,width:120,height:32,rx:9},g);
      el('text',{x:x+4,y:y+5,'text-anchor':'middle'},g).textContent=p[0];
      g.addEventListener('click',function(){stopAuto=true;send(i);});
      provs.push({g:g,ln:ln,x:x-56,y:y});
    });
    el('line',{x1:you.x,y1:you.y,x2:hub.x,y2:hub.y,stroke:'#3C5560','stroke-width':1.5},gL);
    el('circle',{cx:you.x,cy:you.y,r:30,fill:'#C9852F'},gN);
    el('text',{x:you.x,y:you.y+5,'text-anchor':'middle',fill:'#fff','font-size':15,'font-weight':700,'font-family':'Noto Sans'},gN).textContent='You';
    var hc=el('circle',{cx:hub.x,cy:hub.y,r:50,fill:'#1D6E73',stroke:'#7FC4C0','stroke-width':2},gN);
    el('text',{x:hub.x,y:hub.y-2,'text-anchor':'middle',fill:'#fff','font-size':13.5,'font-weight':700,'font-family':'Noto Sans'},gN).textContent='OpenRouter';
    el('text',{x:hub.x,y:hub.y+15,'text-anchor':'middle',fill:'#CFE6E2','font-size':10.5,'font-family':'Noto Sans'},gN).textContent='one API · credits';
    var status=el('text',{x:24,y:448,fill:'#DCEBE8','font-size':13,'font-family':'Noto Sans'},svg);
    var credit=el('text',{x:24,y:425,fill:'#7F8A93','font-size':11.5,'font-family':'Noto Sans'},svg);
    var dot=el('circle',{r:6,fill:'#F4C27A',opacity:0},gP), halo=el('circle',{r:13,fill:'#F4C27A',opacity:0},gP);
    var job=null, credits=10, stopAuto=false, auto=0, raf=0;
    credit.textContent='credits: $10.00';
    function send(i){ job={i:i,t0:performance.now()}; provs.forEach(function(p,k){p.g.classList.toggle('on',k===i);p.ln.setAttribute('stroke',k===i?'#C9852F':'#3C5560');p.ln.setAttribute('stroke-width',k===i?2.2:1.2);});
      status.textContent='→ routing your prompt to '+P[i][0]+' · '+P[i][1];
      if(!raf) raf=requestAnimationFrame(frame); }
    function lerp(a,b,u){return {x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u};}
    function frame(ts){
      raf=0; if(!job) return;
      var u=(ts-job.t0)/1000, pr=provs[job.i], pt={x:pr.x,y:pr.y}, q, col='#F4C27A';
      if(u<.6) q=lerp(you,hub,u/.6);
      else if(u<1.2) q=lerp(hub,pt,(u-.6)/.6);
      else if(u<1.6) q=pt;
      else if(u<2.2){ q=lerp(pt,hub,(u-1.6)/.6); col='#7FC4C0'; }
      else if(u<2.8){ q=lerp(hub,you,(u-2.2)/.6); col='#7FC4C0'; }
      else { dot.setAttribute('opacity',0); halo.setAttribute('opacity',0);
        credits=Math.max(0,credits-.0042); credit.textContent='credits: $'+credits.toFixed(4)+'  (last request ≈ $0.004)';
        status.textContent='← answer from '+P[job.i][1]; job=null; return; }
      dot.setAttribute('cx',q.x);dot.setAttribute('cy',q.y);dot.setAttribute('fill',col);dot.setAttribute('opacity',1);
      halo.setAttribute('cx',q.x);halo.setAttribute('cy',q.y);halo.setAttribute('fill',col);halo.setAttribute('opacity',.25);
      hc.setAttribute('r',50+(u>.5&&u<.75||u>2.1&&u<2.35?4:0));
      raf=requestAnimationFrame(frame);
    }
    var n=0;
    watch(slide,function(on){ clearInterval(auto);
      if(on&&!reduce){ if(!stopAuto) send(n++%3); auto=setInterval(function(){ if(!stopAuto) send(n++%P.length); },3600); } });
  })();

  // ================= 11 · 1A specificity =================
  (function(){
    var slide=slideOf('.s-spec'); if(!slide) return;
    var S=[
      ['Write about a heron.',
       'Herons are long-legged wading birds found near rivers, lakes and marshes around the world. They hunt fish, frogs and insects by standing still and striking quickly with their sharp bills. The great blue heron is the largest in North America, standing over four feet tall.',8,15,'Generic facts. Is that what you wanted?'],
      ['Write a short poem about a great blue heron.',
       'Upon the shore the heron stands,\nSo tall and graceful, gray and grand;\nIt waits for fish with patient eyes,\nThen off into the sky it flies.',30,40,'A poem — but a greeting-card one.'],
      ['Write a six-line free-verse poem about a great blue heron at dawn on a Florida marsh. Focus on its stillness.',
       'Dawn spills pink across the marsh.\nThe heron does not move.\nMullet flicker at its feet;\nthe world goes on around it —\nwind in the sawgrass, a far-off truck —\nand still it does not move.',60,72,'Now it has a place, a time and a focus.'],
      ['Write a six-line free-verse poem about a great blue heron at dawn on a Florida marsh, for 8th graders. One sense per line. Present tense, no rhyme, never “majestic.” End on a one-word line.',
       'Mist lifts off the marsh like breath.\nA heron, gray as a fence post, waits.\nSomewhere a mullet slaps the water.\nCold mud holds its yellow feet.\nSalt and sulfur ride the wind.\nStrike.',90,95,'Every line does a job you asked for.']
    ];
    function show(i){ var s=S[i]; $('#spec-p').textContent=s[0]; var r=$('#spec-r'); r.style.opacity=0;
      setTimeout(function(){r.textContent=s[1];r.style.transition='opacity .3s';r.style.opacity=1;},150);
      $('#m-work').style.width=s[2]+'%'; $('#m-fit').style.width=s[3]+'%'; $('#spec-c').textContent=s[4]; }
    group($('#spec-steps'),'data-s',function(v){show(+v);});
    show(0);
  })();

  // ================= 13 · 1B level =================
  (function(){
    var slide=slideOf('.s-level'); if(!slide) return;
    var G=['Elementary','Middle school','High school','College'], WHO=['a 2nd grader','a 7th grader','a high school physics student','a college physics major'];
    var LEN=['one sentence','one paragraph','one page','a report with sections and sources'], LN=['One sentence','Paragraph','Page','Report'];
    var TXT=[
      ['Sunlight is made of all the colors, and the air bounces the blue light all around the sky the most, so blue is what we see when we look up.',
       'Sunlight looks white, but it is really all the colors of the rainbow mixed together. When sunlight comes into our air, it bumps into tiny, tiny bits of air that are much too small to see. Those bits bounce blue light all over the sky, much more than red or yellow light. So when you look up, blue light is coming at you from every direction. At sunset, the light has to travel through lots more air, the blue gets bounced away before it reaches you, and the reds and oranges are left for us to see.'],
      ['Sunlight contains all colors, and the gas molecules in the air scatter short blue wavelengths far more than long red ones, so scattered blue light reaches our eyes from every part of the sky.',
       'White sunlight is a mix of colors, each with a different wavelength. Blue light has a short wavelength and red light has a long one. As sunlight passes through the atmosphere, it hits nitrogen and oxygen molecules, which scatter light in all directions. Shorter wavelengths scatter much more strongly, so blue light gets spread across the whole sky. Violet scatters even more, but sunlight contains less of it and our eyes are less sensitive to it. At sunrise and sunset, light passes through much more atmosphere, so most of the blue is scattered out before it reaches you, leaving oranges and reds.'],
      ['The sky is blue because of Rayleigh scattering: air molecules much smaller than the wavelength of light scatter it with an intensity proportional to 1/λ⁴, so blue light (about 450 nm) is scattered almost six times more than red (about 700 nm).',
       'Sunlight\'s oscillating electric field makes the electrons in N₂ and O₂ molecules oscillate, and the molecules re-radiate light in all directions. This is Rayleigh scattering, and its intensity is proportional to 1/λ⁴. Because blue light (~450 nm) has a shorter wavelength than red light (~700 nm), it is scattered almost six times more strongly: (700/450)⁴ ≈ 5.9. Looking at any part of the sky away from the Sun, we see this scattered light, dominated by blue. Violet scatters even more, but the solar spectrum contains less violet, some is absorbed high in the atmosphere, and our cone cells respond weakly to it — so the sky looks blue, not violet.'],
      ['The blue sky is the λ⁻⁴ signature of Rayleigh scattering by molecular density fluctuations in the atmosphere, weighted by the solar spectrum and the response of human vision.',
       'For scatterers much smaller than the wavelength (size parameter x = 2πr/λ ≪ 1), the induced-dipole intensity scales as I ∝ (1 + cos²θ)/λ⁴. In the atmosphere the effective scatterers are fluctuations in molecular number density, as Smoluchowski and Einstein showed — a perfectly uniform medium would not scatter at all. Integrating the scattered spectrum against the solar irradiance and the CIE colour-matching functions gives a perceived hue near sky blue rather than violet. The (1 + cos²θ) term and the polarization of skylight, maximal at 90° from the Sun, follow from the same dipole picture, while larger aerosols enter the Mie regime, scatter more neutrally, and whiten hazy skies.']
    ];
    var PAGE=[
      ['Sunlight has hidden colors — see them with a prism','Tiny bits of air bounce blue light','Why sunsets turn orange and red','Try it: water, a drop of milk and a flashlight'],
      ['Light as waves: wavelength and color','Scattering: molecules redirect light','Why blue and not violet?','Sunsets — and the butterscotch sky on Mars','Quick experiment you can do at home'],
      ['The visible spectrum and wavelength','Rayleigh scattering and the 1/λ⁴ law','A worked ratio: 450 nm vs 700 nm','Blue vs violet: the Sun, ozone and our eyes','Sunsets, clouds and haze (Mie scattering)'],
      ['Dipole radiation from sub-wavelength scatterers','Density fluctuations (Smoluchowski, Einstein)','Spectral integration and perceived hue','Polarization of skylight','The Mie regime: aerosols and white skies']
    ];
    var REP=[
      ['Our Blue Sky: A Class Report',['What is light?','What is air?','Our experiment','What we found','Words to know','Books we used']],
      ['Why Is the Sky Blue? A Science Fair Report',['Question','Background research','Hypothesis','Experiment: milk, water, flashlight','Results and photos','Conclusion','Sources']],
      ['Scattering and the Color of the Sky',['Introduction','History: Tyndall (1859) and Rayleigh (1871)','Theory of Rayleigh scattering','Calculation','Observations and photographs','Discussion and error','References']],
      ['Rayleigh Scattering and the Perceived Color of the Sky',['Abstract','Introduction','Rayleigh theory','Fluctuation theory','Radiative transfer','Color perception','Polarization','Discussion · References']]
    ];
    var PW=['≈ 300 words','≈ 400 words','≈ 500 words','≈ 600 words'], RW=['≈ 1,200 words','≈ 1,800 words','≈ 2,500 words','≈ 4,000 words'];
    var g=0, l=0;
    function words(s){return s.split(/\s+/).length;}
    function show(){
      $('#lv-p').innerHTML='Explain why the sky is blue to <b>'+WHO[g]+'</b> in <b>'+LEN[l]+'</b>.';
      $('#lv-m1').textContent=G[g]+' · '+LN[l];
      var b=$('#lv-b'), h, m;
      if(l<2){ h=TXT[g][l]; m='≈ '+words(h)+' words'; b.className='body'; }
      else if(l===2){ h='<span class="doc">A one-page answer, in five parts</span><ol>'+PAGE[g].map(function(s){return '<li>'+s+'</li>';}).join('')+'</ol>'; m=PW[g]+' · shown as the outline'; b.className='body sm'; }
      else { h='<span class="doc">“'+REP[g][0]+'”</span><ol>'+REP[g][1].map(function(s){return '<li>'+s+'</li>';}).join('')+'</ol>'; m=RW[g]+' · shown as the outline'; b.className='body sm'; }
      $('#lv-m2').textContent=m; b.style.opacity=0; setTimeout(function(){b.innerHTML=h;b.style.opacity=1;},120);
    }
    group($('#lv-grade'),'data-g',function(v){g=+v;show();});
    group($('#lv-len'),'data-l',function(v){l=+v;show();});
    show();
  })();

  // ================= 15 · senses =================
  (function(){
    var slide=slideOf('.s-stand'); if(!slide) return;
    var S=[['What is moving? What is perfectly still?','Write Out choice board: “Notice the contrasts around you.”'],
           ['Close your eyes. Name three sounds, from near to far.','Try a poem in more than one voice — one for each sound.'],
           ['What does this place smell like right now? After rain?','Smell is the sense most tied to memory.'],
           ['What is under your feet? What is the air doing on your skin?','Choice board: “Craft a poem using gathered nature.”'],
           ['What was here a hundred years ago? What will be here tomorrow at dawn?','Choice board: “Watch the sun rise or set.”']];
    function show(i){ var q=$('#sense-q'); q.style.opacity=0; setTimeout(function(){q.textContent=S[i][0];$('#sense-eg').textContent=S[i][1];q.style.opacity=1;},150); }
    group($('#senses'),'data-s',function(v){show(+v);}); show(0);
  })();

  // ================= 16 · haiku / sonnet =================
  (function(){
    var slide=slideOf('.s-poem2'); if(!slide) return;
    var H=[['Moss sways on the oak —',5],['a mockingbird tries three songs.',7],['Wet boards, rising steam.',5]];
    var SN=[['The morning finds me on the back-porch stair,','A'],['where Spanish moss hangs loose from every limb;','B'],['the live oak breathes, and barely stirs the air;','A'],['the light comes through in pieces, soft and dim.','B'],
      ['A mockingbird runs through his borrowed three,','C'],['then starts again, as if he’d lost his place;','D'],['my coffee sends its steam up past the tree,','C'],['a small grey cloud that will not leave a trace.','D'],
      ['The boards are wet and cool beneath my feet;','E'],['a truck downshifts somewhere beyond the hill;','F'],['the day has not yet chosen to be heat,','E'],['and for this minute everything is still.','F'],
      ['I only meant to sit a while, not see —','G'],['but looking long, the morning looked at me.','G']];
    function show(f){
      var box=$('#pverse'), h='';
      if(f==='h'){ h='<div class="verse haiku">'+H.map(function(x){return '<div class="ln"><span>'+x[0]+'</span><span class="k">'+x[1]+'</span></div>';}).join('')+'</div>'+
        '<div class="form">Haiku · 3 lines · 5-7-5 syllables · one moment, no explanation</div>'; }
      else { h='<div class="verse">'+SN.map(function(x,i){return '<div class="ln"><span>'+x[0]+'</span><span class="k">'+x[1]+'</span></div>'+((i===3||i===7||i===11)?'<div class="gap"></div>':'');}).join('')+'</div>'+
        '<div class="form">Shakespearean sonnet · 14 lines · iambic pentameter · ABAB CDCD EFEF GG · the couplet turns</div>'; }
      box.style.opacity=0; setTimeout(function(){box.innerHTML=h;box.style.transition='opacity .3s';box.style.opacity=1;},150);
    }
    group($('#pform'),'data-f',show); show('h');
  })();

  // ================= 1C · expand and condense =================
  (function(){
    var slide=slideOf('.s-ec'); if(!slide) return;
    var NOTES=['live oak, Spanish moss barely moving','mockingbird: three songs, then repeats','coffee steam','boards still wet, cool under bare feet','a truck downshifts, far off','light through the moss in pieces'];
    var E=[
      ['Condense · abstraction','Condense my notes to <b>one word</b> that captures them.','word','Stillness'],
      ['Condense · abstraction','Abstract my notes into <b>one sentence</b>: what are they about?','one','A calm morning, noticed through every sense: sight, sound, touch and smell.'],
      ['Condense · summarization','<b>Summarize</b> my notes in two sentences. Keep every detail that matters.','sum',
       'At 7:10 a.m. on the back steps the air is calm: Spanish moss barely moves on the live oak, and the light comes through it in pieces. A mockingbird cycles through three songs, coffee steams, the wet boards are cool underfoot, and a truck downshifts in the distance.'],
      ['The source','My notes · back steps, 7:10 a.m.','src',null],
      ['Expand · explanation','<b>Expand</b> my notes into a short <b>explanation</b> for a curious reader: what is going on, and why?','',
       'These notes describe an early morning in the coastal South, and almost every detail has a reason behind it. The boards are wet because of dew: on a clear night, surfaces cool below the dew point and water condenses on them. The Spanish moss barely moves because the air is calm — and it is not a moss at all, but a flowering plant in the pineapple family that lives on the oak without feeding on it. The mockingbird sings a phrase, repeats it, then moves on: that is how it shows off a repertoire of songs borrowed from other birds. And the far-off truck sounds close because cool, still morning air lets sound carry farther.'],
      ['Expand · report','<b>Expand</b> my notes into a one-page <b>field report</b> with headings.','rep',
       '<span class="doc">Field Report · Back Steps, 7:10 a.m.</span><div class="cols">'+
       '<p><b>Purpose.</b> Record one place, through the senses, at the start of the day.</p>'+
       '<p><b>Setting.</b> Back steps under a live oak hung with Spanish moss. Early light, calm air.</p>'+
       '<p><b>Sight.</b> Moss barely moving; light falling through it in pieces.</p>'+
       '<p><b>Sound.</b> A mockingbird cycling three songs; a truck downshifting far off.</p>'+
       '<p><b>Touch and smell.</b> Wet, cool boards under bare feet; steam from coffee.</p>'+
       '<p><b>Interpretation.</b> Dew on the boards points to a clear, cool night. Calm air explains both the still moss and the far-carrying sound.</p>'+
       '<p><b>Questions.</b> Which birds did the mockingbird borrow its songs from? How does this scene change by noon?</p>'+
       '<p><b>Next steps.</b> Return at the same time each day for a week; record the sounds; compare the notes.</p></div>']
    ];
    function words(s){return s.replace(/<[^>]+>/g,' ').trim().split(/\s+/).length;}
    var nw=words(NOTES.join(' ')), MAXW=400;  // the full one-page report
    function show(i){
      var e=E[i], b=$('#ec-b'), h, n;
      if(i===3){ h='<ul>'+NOTES.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>'; n=nw; }
      else { h=e[3]; n=words(h); }
      var full=i===5;
      $('#ec-p').innerHTML=e[1]; $('#ec-m1').textContent=e[0];
      $('#ec-meta').className='meta'+(i>3?' x':''); $('#ec-m2').textContent=full?'one page · shown in brief':n+(n===1?' word':' words');
      $('#ec-bar').style.width=(full?100:Math.max(1.5,100*n/MAXW))+'%';
      $$('#ec-steps .btn').forEach(function(x,k){x.classList.toggle('x',k>3);});
      b.style.opacity=0; setTimeout(function(){b.className='body '+e[2];b.innerHTML=h;b.style.opacity=1;},120);
    }
    group($('#ec-steps'),'data-e',function(v){show(+v);}); show(3);
  })();

  // ================= 18 · honeybee: one set of concepts, three structures =================
  (function(){
    var slide=slideOf('.s-graph'); if(!slide) return;
    var svg=$('#graph');
    var NODES={bee:'Honeybee',insect:'Insect',animal:'Animal',hive:'Hive',wax:'Wax',queen:'Queen',worker:'Worker',drone:'Drone',
      honey:'Honey',nectar:'Nectar',flower:'Flower',pollen:'Pollen',poll:'Pollination',waggle:'Waggle dance',
      cBio:'Biology',cCol:'Colony',cFood:'Food',cEco:'Ecology',cTalk:'Communication'};
    var CATS={cBio:[240,['insect','animal'],'#8A6236'],cCol:[165,['hive','wax','queen','worker','drone'],'#1D6E73'],cTalk:[105,['waggle'],'#6E8FA8'],
              cFood:[300,['honey','nectar','pollen'],'#C9852F'],cEco:[15,['flower','poll'],'#5E8C3A']};
    var V={
      sem:{pos:{animal:[90,45],insect:[90,140],bee:[300,200],queen:[110,285],worker:[265,345],drone:[440,370],waggle:[100,372],hive:[545,295],wax:[745,345],
                pollen:[480,170],honey:[470,62],nectar:[680,45],flower:[790,140],poll:[660,200]},
           ed:[['bee','insect','is-a'],['insect','animal','is-a'],['queen','bee','is-a'],['worker','bee','is-a'],['drone','bee','is-a'],['bee','hive','lives-in'],
               ['hive','wax','made-of'],['bee','honey','makes'],['honey','nectar','made-from'],['nectar','flower','comes-from'],['bee','pollen','collects'],
               ['pollen','poll','enables'],['poll','flower','fertilizes'],['worker','waggle','performs']]},
      con:{pos:{bee:[425,32],insect:[80,125],hive:[330,125],nectar:[600,125],pollen:[780,125],animal:[80,225],wax:[150,225],queen:[270,225],worker:[395,225],
                drone:[520,225],honey:[640,225],poll:[780,225],waggle:[395,325],flower:[780,325]},
           ed:[['bee','insect','are a kind of'],['insect','animal','are a kind of'],['bee','hive','live in a'],['hive','wax','built of',.62],['hive','queen','one',.62],
               ['hive','worker','thousands of',.62],['hive','drone','hundreds of',.62],['bee','nectar','collect'],['nectar','honey','is made into'],['bee','pollen','carry'],
               ['pollen','poll','makes possible'],['poll','flower','makes seeds in'],['worker','waggle','share food sites by']]},
      mind:{pos:{bee:[425,200]},ed:[]}
    };
    Object.keys(CATS).forEach(function(c){ var a=CATS[c][0]*Math.PI/180, kids=CATS[c][1];
      V.mind.pos[c]=[425+175*Math.cos(a),200+110*Math.sin(a)]; V.mind.ed.push(['bee',c,'',0,CATS[c][2]]);
      kids.forEach(function(k,i){ var b=a+(i-(kids.length-1)/2)*17*Math.PI/180; V.mind.pos[k]=[425+340*Math.cos(b),200+178*Math.sin(b)]; V.mind.ed.push([c,k,'',0,CATS[c][2]]); });
    });
    var gE=el('g',{},svg), gN=el('g',{},svg), N={}, view='sem', sel=null;
    Object.keys(NODES).forEach(function(id){
      var lab=NODES[id], w=lab.length*7.3+24, g=el('g',{'class':'nd'+(id==='bee'?' root':'')+(/^c[A-Z]/.test(id)?' cat':'')},gN);
      el('rect',{x:-w/2,y:-14,width:w,height:28,rx:14},g); el('text',{x:0,y:0},g).textContent=lab;
      g.style.transition='transform .9s cubic-bezier(.33,0,.2,1), opacity .5s';
      g.addEventListener('click',function(){ sel=sel===id?null:id; mark(); });
      N[id]={g:g};
    });
    function P(id){ return V[view].pos[id]||[425,200]; }
    function edges(){
      gE.innerHTML='';
      V[view].ed.forEach(function(e){
        var a=P(e[0]), b=P(e[1]), g=el('g',{'class':'ed'},gE); g.dataset.from=e[0]; g.dataset.to=e[1];
        var ln=el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1]},g);
        if(e[4]){ ln.style.stroke=e[4]; ln.style.strokeWidth=3.5; ln.style.opacity=.75; }
        if(e[2]){ var t=e[3]||.5; el('text',{x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t+4},g).textContent=e[2]; }
      });
      gE.style.opacity=0; requestAnimationFrame(function(){gE.style.transition='opacity .5s';gE.style.opacity=1;});
    }
    function place(){
      Object.keys(N).forEach(function(id){ var p=P(id), hide=/^c[A-Z]/.test(id)&&view!=='mind';
        N[id].g.style.transform='translate('+p[0]+'px,'+p[1]+'px)'+(hide?' scale(.2)':''); N[id].g.style.opacity=hide?0:''; N[id].g.style.pointerEvents=hide?'none':''; });
    }
    function mark(){
      var near={}; if(sel) near[sel]=1;
      $$('.ed',gE).forEach(function(e){ var on=sel&&(e.dataset.from===sel||e.dataset.to===sel); e.classList.toggle('hl',!!on); e.classList.toggle('dim',!!sel&&!on);
        if(on){near[e.dataset.from]=1;near[e.dataset.to]=1;} });
      Object.keys(N).forEach(function(id){ N[id].g.classList.toggle('hl',id===sel); N[id].g.classList.toggle('dim',!!sel&&!near[id]); });
      var info=$('#ginfo');
      if(!sel){ info.innerHTML=view==='mind'?'A mind map groups ideas into <b>branches</b> by theme. Links are associations, not named relations.':
        view==='con'?'A concept map reads as <b>sentences</b>: “Honeybees — live in a — hive.” General ideas at the top.':
        'A semantic network names each <b>relation</b>: is-a, lives-in, made-of. Click a concept.'; return; }
      var tr=V[view].ed.filter(function(e){return e[0]===sel||e[1]===sel;}).map(function(e){
        return view==='mind'?NODES[e[0]]+' → '+NODES[e[1]]:NODES[e[0]]+' — '+e[2]+' → '+NODES[e[1]]; });
      info.innerHTML='<b>'+NODES[sel]+'</b> &nbsp; <span class="mono">'+tr.join(' &nbsp;·&nbsp; ')+'</span>';
    }
    function setView(v){ view=v; sel=null; gE.style.transition='opacity .25s'; gE.style.opacity=0; place();
      setTimeout(function(){edges();mark();},v===setView.last?0:650); setView.last=v; }
    group($('#gviews'),'data-v',setView);
    place(); edges(); mark(); setView.last='sem';
  })();

  // ================= 19 · roleplay =================
  (function(){
    var slide=slideOf('.s-role'); if(!slide) return;
    var R={
      pip:['You are Pip from Charles Dickens’s Great Expectations (1861), the older Pip looking back. Stay in character; speak in a 19th-century voice; draw only on the novel.',
        [['u','Pip, what was the most frightening moment of your childhood?'],
         ['a','The churchyard on the marshes, without question. I was among the graves of my parents when a fearful man in coarse grey, with a great iron on his leg, started up from the stones and turned me upside down. I was to bring him a file and wittles, or have my heart and liver out. I did as I was told — and it changed my fortunes entirely.'],
         ['u','Do you regret leaving Joe for London?'],
         ['a','Regret is too small a word. I was ashamed of Joe’s manners when I ought to have been ashamed of my own. Give me one evening back at the forge, with Joe calling me “old chap.”']]],
      tim:['You are a Timucua elder near the St. Johns River in northeast Florida in 1564, the year the French built Fort Caroline. Speak from what historians and archaeologists know. When something is uncertain, say so.',
        [['u','What do your people eat?'],
         ['a','From the river and the marsh: fish caught in weirs, oysters and clams — see the shell mounds our ancestors left. We plant maize, beans and squash, gather acorns and palm berries, and hunt deer and alligator.','Out of character: this comes from French accounts such as Laudonnière’s, Spanish mission records and archaeology — all written by outsiders.'],
         ['u','What happened to your people?'],
         ['a','','Stepping out of character, because this is history: disease, war and slave raids followed European contact. A people once estimated at up to 200,000 fell to a few hundred. The last Timucua left Florida for Cuba with the Spanish in 1763. Their language survives in Francisco Pareja’s bilingual texts.']]],
      geo:['You are a field geologist who has worked in Florida for thirty years. Explain things to a curious adult with no science background.',
        [['u','What is under my feet here in Florida?'],
         ['a','Limestone, mostly. Florida sits on a thick platform of rock built from the shells of sea creatures, laid down over tens of millions of years when this was shallow sea. Slightly acidic rain dissolves it — which is why we have springs, caves and sinkholes. Below you is the Floridan aquifer, one of the most productive aquifers in the world.'],
         ['u','How old are the oldest rocks I could see?'],
         ['a','At the surface, around 40 million years: Eocene limestones such as the Ocala Limestone in north-central Florida. Look closely and you’ll find fossil sand dollars and tiny coin-shaped shells called forams.']]],
      poet:['You are a poet who leads writing workshops. Answer briefly, ask me a question back, and never write the poem for me.',
        [['u','I want to write about my grandmother’s kitchen. Where do I start?'],
         ['a','Start with one object you could still find in the dark. Describe it with your hands, not your eyes. What is it?'],
         ['u','Her biscuit cutter. Dented, with a red wooden handle.'],
         ['a','Good — “dented” is already a story. Who dented it, and when? Write three lines that begin “The dent is from…” and don’t name your grandmother. Let the cutter do the remembering.']]]
    };
    var token=0;
    function play(p){
      var my=++token, d=R[p], box=$('#msgs'); box.innerHTML=''; $('#sys').innerHTML='<b>Role</b>'+d[0];
      var i=0;
      function next(){
        if(my!==token||i>=d[1].length) return;
        var m=d[1][i++], div=document.createElement('div'); div.className='m '+m[0]; box.appendChild(div);
        if(m[0]==='u'||reduce){ div.innerHTML=m[1]+(m[2]?'<i class="ooc">'+m[2]+'</i>':''); setTimeout(next,m[0]==='u'?650:900); return; }
        var full=m[1], ooc=m[2]||'', k=0; div.classList.add('typing');
        (function type(){ if(my!==token) return;
          k+=3; var all=full+(ooc?'\u0000'+ooc:''), s=all.slice(0,k), parts=s.split('\u0000');
          div.innerHTML=parts[0]+(parts.length>1?'<i class="ooc">'+parts[1]+'</i>':'');
          if(k<all.length) setTimeout(type,16); else { div.classList.remove('typing'); setTimeout(next,900); } })();
      }
      next();
    }
    group($('#personas'),'data-p',play);
    var started=false;
    watch(slide,function(on){ if(on&&!started){started=true;play('pip');} });
    $('#sys').innerHTML='<b>Role</b>'+R.pip[0];
  })();

  // ================= 20 · disclosure builder =================
  (function(){
    var slide=slideOf('.s-guide'); if(!slide) return;
    var tool='Claude', uses=['editing'];
    function list(a){return a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];}
    function show(){ $('#stmt').textContent=uses.length?('I used '+tool+' for '+list(uses)+'. The ideas, choices and final words are my own.'):'I did not use AI for this work.'; }
    $$('#uses .btn').forEach(function(b){ b.addEventListener('click',function(){
      var u=b.getAttribute('data-u'), i=uses.indexOf(u); if(i<0)uses.push(u); else uses.splice(i,1); b.classList.toggle('on',i<0);
      var order=$$('#uses .btn').map(function(x){return x.getAttribute('data-u');}); uses.sort(function(a,c){return order.indexOf(a)-order.indexOf(c);}); show(); }); });
    group($('#tools'),'data-t',function(v){tool=v;show();});
    show();
  })();

  // ================= 21 · I can be a … =================
  (function(){
    var slide=slideOf('.s-again'); if(!slide) return;
    var W=['a writer','a musician','an artist','a designer','a director'], span=$('#again-role'), timer=0;
    if(reduce){ span.textContent=W[0]; return; }
    function run(){
      var i=0, k=0, dir=1;
      (function tick(){
        var w=W[i]; k+=dir; span.textContent=w.slice(0,k);
        var wait=dir>0?90:45;
        if(dir>0&&k>=w.length){dir=-1;wait=1600;}
        else if(dir<0&&k<=0){dir=1;i=(i+1)%W.length;wait=300;}
        timer=setTimeout(tick,wait);
      })();
    }
    watch(slide,function(on){ clearTimeout(timer); if(on) run(); });
  })();
})();
