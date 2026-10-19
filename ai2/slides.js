// AI Part 2 — title animation, music and per-slide interactions.
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
  ['#uml-dia','.s-art .frames','#art-big'].forEach(function(s){var e=$(s);if(e)e.setAttribute('data-noadvance','');});

  // ================= 1 · title: a neural network that fires into the eight media =================
  (function(){
    var cv=$('#nn'); if(!cv) return;
    var slide=cv.closest('.slide'), ctx=cv.getContext('2d'); ctx.scale(2,2);
    var seed=7; function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
    var sizes=[6,9,10,10,9,8], outs=['Diagram','Cartoon','Art','Music','Image','Video','3D','Code'];
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


  // ================= 2 · media map =================
  (function(){
    var slide=slideOf('.s-map'); if(!slide) return;
    var D=[
      ['A description of the picture, the diagram or the joke','Diagrams written as code, cartoons, paintings in a painter’s style','A flowchart, a four-panel cartoon, four painters'],
      ['Patience, and one change at a time','A new version every time you ask','From noise to picture; versions of one image'],
      ['A genre, a mood, an artist to evoke','A whole song: instruments, structure, sometimes a voice','Two songs made with Udio'],
      ['A song and one strong image','A short piece of music with a picture','“Voices Under the Sea,” a YouTube Short'],
      ['An idea for a scene','Music and moving pictures','“Marble Statue with Metal Highlights”'],
      ['Research, a script, and judgment','Shots, voices and music to edit together','A draft scene about Fort Clinch'],
      ['A description or a photo','A textured 3D model you can view from any angle','Three models, six camera shots and an orbit each'],
      ['What the program should do','Working code you can run, read and change','A small program built in four requests']
    ];
    var tiles=$$('.mt',slide), fades=$$('.detail .fade',slide), cur=-1, auto=0;
    function pick(i){ if(i===cur) return; cur=i;
      tiles.forEach(function(t,k){t.classList.toggle('on',k===i);});
      fades.forEach(function(f){f.style.opacity=0;});
      setTimeout(function(){ $('#mp-you').textContent=D[i][0]; $('#mp-ai').textContent=D[i][1]; $('#mp-here').textContent=D[i][2];
        fades.forEach(function(f){f.style.opacity=1;}); },160);
    }
    tiles.forEach(function(t,k){ t.setAttribute('data-noadvance',''); t.addEventListener('click',function(){clearInterval(auto);auto=0;pick(k);}); });
    watch(slide,function(on){ clearInterval(auto); auto=0;
      if(on){ cur=-1; pick(0); var i=0; auto=setInterval(function(){i=(i+1)%8;pick(i);},3200); } });
  })();

  // ================= 3 · PlantUML: text on the left, diagram on the right =================
  (function(){
    var slide=slideOf('.s-uml'), pre=$('#uml-src'), box=$('#uml-dia'); if(!slide||!pre) return;
    var L=['@startuml',"' skinparam … (colours and fonts)",'start',':Describe the picture;','repeat','  :Generate an image;','  :Look closely;',
      '  if (Is it what I meant?) then (no)','    :Change one thing in the prompt;','  else (close)','    :Edit by hand;','  endif',
      'repeat while (Keep going?) is (yes)','->no;',':Save, credit, share;','stop','@enduml'];
    var lines=L.map(function(t){
      var s=document.createElement('span'), m=t.match(/^\s*:(.*);$/), d=t.match(/\((Is it what I meant\?|Keep going\?)\)/);
      s.textContent=t||' ';
      if(m){s.className='a';s.dataset.label=m[1];} else if(d){s.className='d';s.dataset.label=d[1];}
      else if(/^\s*(start|stop|repeat|endif|else|@)/.test(t)) s.className='k';
      pre.appendChild(s); return s;
    });
    var shapes={};
    fetch('img/flow.svg').then(function(r){return r.text();}).then(function(txt){
      box.innerHTML=txt; var svg=$('svg',box); svg.removeAttribute('width'); svg.removeAttribute('height');
      svg.setAttribute('style','width:100%;height:100%'); svg.setAttribute('preserveAspectRatio','xMidYMid meet');
      var cands=$$('rect,polygon',svg).map(function(e){return {e:e,b:e.getBBox()};});
      $$('text',svg).forEach(function(t){
        var label=t.textContent.replace(/\s+/g,' ').trim(), tb=t.getBBox(), cx=tb.x+tb.width/2, cy=tb.y+tb.height/2, best=null;
        cands.forEach(function(c){ var b=c.b;
          if(cx>b.x&&cx<b.x+b.width&&cy>b.y&&cy<b.y+b.height&&b.width>tb.width*.8&&(!best||b.width*b.height<best.b.width*best.b.height)) best=c; });
        if(best&&!shapes[label]) shapes[label]=best.e;
      });
    });
    function hl(label){
      lines.forEach(function(s){s.classList.toggle('hl',!!label&&s.dataset.label===label);});
      for(var k in shapes) shapes[k].classList.toggle('hl',k===label);
    }
    lines.forEach(function(s){ if(s.dataset.label){
      s.addEventListener('mouseenter',function(){stopWalk();hl(s.dataset.label);}); s.addEventListener('mouseleave',function(){hl(null);}); } });
    var seq=['Describe the picture','Generate an image','Look closely','Is it what I meant?','Change one thing in the prompt','Keep going?',
             'Generate an image','Look closely','Is it what I meant?','Edit by hand','Keep going?','Save, credit, share'];
    var wt=0;
    function stopWalk(){clearInterval(wt);wt=0;}
    $('#uml-walk').addEventListener('click',function(){ stopWalk(); var i=0; hl(seq[0]);
      wt=setInterval(function(){ i++; if(i>=seq.length){stopWalk();hl(null);return;} hl(seq[i]); },1100); });
    watch(slide,function(on){ if(!on){stopWalk();hl(null);} });
  })();

  // ================= 4 · cartoon: stick figures and speech bubbles =================
  (function(){
    var slide=slideOf('.s-toon'); if(!slide) return;
    var G=205;   // ground line
    function fig(svg,x,face,pose){
      var g=el('g',{'class':'fig'},svg), hy=G-95, sh=G-74, hip=G-40, s=face;  // face: 1 looks right, -1 left
      el('circle',{cx:x,cy:hy,r:15},g);
      el('circle',{cx:x+s*6,cy:hy-3,r:1.6,style:'fill:#20252B;stroke-width:1'},g);
      el('path',{d:'M'+(x+s*2)+' '+(hy+7)+' q'+(s*5)+' '+(pose==='smile'||pose==='thumb'?4:0)+' '+(s*9)+' 0'},g);
      el('path',{d:'M'+x+' '+(hy+15)+' L'+x+' '+hip},g);
      el('path',{d:'M'+(x-14)+' '+G+' L'+x+' '+hip+' L'+(x+14)+' '+G},g);
      var a={
        rest:'M'+(x-20)+' '+(sh+30)+' L'+x+' '+sh+' L'+(x+20)+' '+(sh+30),
        shrug:'M'+(x-30)+' '+(sh-16)+' L'+(x-22)+' '+(sh+6)+' L'+x+' '+sh+' L'+(x+22)+' '+(sh+6)+' L'+(x+30)+' '+(sh-16),
        hips:'M'+(x-3)+' '+(hip-6)+' L'+(x-22)+' '+(sh+16)+' L'+x+' '+sh+' L'+(x+22)+' '+(sh+16)+' L'+(x+3)+' '+(hip-6),
        robot:'M'+x+' '+sh+' L'+(x+s*34)+' '+sh+' M'+x+' '+(sh+6)+' L'+(x+s*34)+' '+(sh+6)+' M'+x+' '+sh+' L'+(x-s*18)+' '+(sh+28),
        thumb:'M'+(x+s*20)+' '+(sh+30)+' L'+x+' '+sh+' L'+(x-s*24)+' '+(sh-8)+' L'+(x-s*28)+' '+(sh-30)
      };
      el('path',{d:a[pose]||a.rest},g);
      if(pose==='thumb') el('path',{d:'M'+(x-s*28)+' '+(sh-30)+' l'+(s*5)+' -9',style:'stroke-width:4'},g);
      return g;
    }
    function bubble(svg,cx,headx,text){
      var g=el('g',{},svg), t=el('text',{x:cx,y:47,'text-anchor':'middle'},g);
      t.textContent=text; var w=text.length*10.5+34, h=48, x0=Math.max(8,Math.min(408-w,cx-w/2));
      t.setAttribute('x',x0+w/2);
      var tx=Math.max(x0+20,Math.min(x0+w-20,headx));
      var p=el('path',{'class':'bub',d:'M'+(x0+14)+' 14 h'+(w-28)+' q14 0 14 14 v'+(h-28)+' q0 14 -14 14 H'+(tx+8)+' L'+(headx)+' 86 L'+(tx-8)+' '+(14+h)+' H'+(x0+14)+' q-14 0 -14 -14 v'+(-(h-28))+' q0 -14 14 -14z'},g);
      g.insertBefore(p,t); t.dataset.full=text; return t;
    }
    var P=[
      {l:'shrug',r:'rest', say:0,text:'I don’t get AI.'},
      {l:'rest', r:'hips',say:1,text:'Don’t care. Bite the dust.'},
      {l:'robot',r:'rest', say:0,text:'System processing…',spin:1},
      {l:'rest', r:'thumb',say:1,text:'That is more like it.'}
    ];
    var texts=[];
    P.forEach(function(p,i){
      var svg=$('#pn'+(i+1)); var LX=128, RX=290;
      el('path',{'class':'ground',d:'M20 '+(G+1)+' H396'},svg);
      fig(svg,LX,1,p.l); fig(svg,RX,-1,p.r);
      if(p.spin){ var sp=el('circle',{'class':'spinner',cx:LX-44,cy:G-100,r:12},svg); }
      texts.push(bubble(svg,p.say?RX-30:LX+30,p.say?RX-4:LX+4,p.text));
    });
    // type each bubble when its panel appears
    $$('.pn',slide).forEach(function(pn,i){
      var t=texts[i], timer=0;
      new MutationObserver(function(){
        clearInterval(timer);
        if(!pn.classList.contains('shown')){ t.textContent=t.dataset.full; return; }
        if(reduce) return; var n=0, full=t.dataset.full; t.textContent='';
        timer=setInterval(function(){ n++; t.textContent=full.slice(0,n); if(n>=full.length) clearInterval(timer); },45);
      }).observe(pn,{attributes:true,attributeFilter:['class']});
    });
  })();

  // ================= 5 · art: four painters, click to enlarge =================
  (function(){
    var slide=slideOf('.s-art'); if(!slide) return;
    var SUBJECT='A great blue heron standing in a north Florida salt marsh at dawn';
    var A=[['Van Gogh','Vincent van Gogh','img/art-vangogh.jpg','Thick, swirling brushstrokes and strong colour.'],
           ['Picasso','Pablo Picasso, cubist period','img/art-picasso.jpg','Cubist planes: one face seen from several sides at once.'],
           ['Vermeer','Johannes Vermeer','img/art-vermeer.jpg','Soft window light and a quiet interior.'],
           ['Da Vinci','Leonardo da Vinci','img/art-davinci.jpg','Sfumato: smoky edges, a study in warm earth tones.']];
    var big=$('#art-big'), prompt=$('#art-prompt');
    function setPrompt(i){ prompt.textContent=SUBJECT+', in the style of '+(i==null?'…':A[i][1]); }
    setPrompt(null);
    $$('.fr',slide).forEach(function(fr){
      var k=+fr.dataset.k, cv=$('.cv',fr), im=new Image();
      im.onerror=function(){ var m=document.createElement('div'); m.className='missing'; m.textContent='add '+A[k][2]; cv.appendChild(m); };
      im.src=A[k][2];
      fr.addEventListener('mouseenter',function(){setPrompt(k);});
      fr.addEventListener('click',function(){
        $('.im',big).style.backgroundImage='url('+A[k][2]+')'; $('h3',big).textContent=A[k][0];
        $('p',big).innerHTML='<b>Prompt</b><br>'+SUBJECT+', in the style of '+A[k][1]+'<br><br>'+A[k][3];
        big.classList.add('open'); setPrompt(k);
      });
    });
    big.addEventListener('click',function(){big.classList.remove('open');});
    watch(slide,function(on){ if(!on) big.classList.remove('open'); });
  })();

  // ================= 6 · from noise to picture (a diffusion-style simulation) =================
  (function(){
    var cv=$('#noise'); if(!cv) return;
    var slide=cv.closest('.slide'), ctx=cv.getContext('2d'), W=1120, H=630, img=new Image(), ready=false;
    var range=$('#nz'), num=$('#nz-n'), noise=document.createElement('canvas'); noise.width=280; noise.height=158;
    function makeNoise(){ var c=noise.getContext('2d'), d=c.createImageData(280,158);
      for(var i=0;i<d.data.length;i+=4){ d.data[i]=Math.random()*255; d.data[i+1]=Math.random()*255; d.data[i+2]=Math.random()*255; d.data[i+3]=255; }
      c.putImageData(d,0,0); }
    makeNoise();
    function draw(step){
      var t=step/50; num.textContent=step+' / 50';
      ctx.filter='none'; ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
      if(ready&&t>0){ var blur=Math.pow(1-t,1.6)*46, sat=Math.min(1,t*1.6);
        ctx.filter='blur('+blur.toFixed(1)+'px) saturate('+sat.toFixed(2)+')'; ctx.drawImage(img,-20,-11,W+40,H+22); ctx.filter='none'; }
      var a=Math.pow(1-t,1.7); if(a>0.004){ ctx.globalAlpha=a; ctx.imageSmoothingEnabled=step<12; ctx.drawImage(noise,0,0,W,H); ctx.globalAlpha=1; }
    }
    img.onload=function(){ready=true;draw(+range.value);}; img.src='img/3d/birds/low.jpg';
    range.addEventListener('input',function(){stop();draw(+range.value);});
    var raf=0;
    function stop(){cancelAnimationFrame(raf);raf=0;}
    function run(){ stop(); var t0=null;
      function f(ts){ if(t0===null)t0=ts; var u=Math.min(1,(ts-t0)/6000), s=Math.round(50*u); range.value=s; draw(s); if(u<1) raf=requestAnimationFrame(f); }
      raf=requestAnimationFrame(f); }
    $('#nz-play').addEventListener('click',run);
    $('#nz-seed').addEventListener('click',function(){ makeNoise(); range.value=0; draw(0); });
    watch(slide,function(on){ if(!on){stop();} else {range.value=0;draw(0);} });
    draw(0);
  })();

  // ================= 7 · iteration: versions of one picture =================
  (function(){
    var slide=slideOf('.s-iter'); if(!slide) return;
    // Replace with the real versions of one picture, in order.
    var V=[
      ['img/iter/v1.jpg','First test','A single camera, default framing. The top of the object is cut off.'],
      ['img/iter/v2.jpg','Add a floor','A floor for the object to stand on. Now it looks small, and the floor is a grey slab.'],
      ['img/iter/v3.jpg','Move in','Camera closer, floor darker. Better, but the floor still glows under the lights.'],
      ['img/iter/v4.jpg','Take the floor away','No floor at all: the object floats on a dark ground, like a museum photograph.'],
      ['img/iter/v5.jpg','Six camera shots','The same set-up from the front, side, back, low and close.'],
      ['img/iter/v6.jpg','The orbit','A camera circling the object, 240 frames, one full turn.']
    ];
    var strip=$('#it-strip'), ims=$$('#it-stage .im'), front=0, cur=-1, timer=0;
    V.forEach(function(v,i){
      var b=document.createElement('button'); b.style.backgroundImage='url('+v[0]+')'; b.innerHTML='<span>v'+(i+1)+'</span>';
      var im=new Image(); im.onerror=function(){var m=document.createElement('div');m.className='missing';m.textContent=v[0];b.appendChild(m);}; im.src=v[0];
      b.addEventListener('click',function(){stopPlay();show(i);}); strip.appendChild(b);
    });
    var btns=$$('button',strip);
    function show(i){ if(i===cur) return; cur=i;
      btns.forEach(function(b,k){b.classList.toggle('on',k===i);});
      var next=ims[1-front]; next.style.backgroundImage='url('+V[i][0]+')'; next.style.opacity=1; ims[front].style.opacity=0; front=1-front;
      $('#it-v').textContent='v'+(i+1); $('#it-t').textContent=V[i][1]; $('#it-c').textContent=V[i][2];
    }
    function stopPlay(){clearInterval(timer);timer=0;$('#it-play').textContent='Play the sequence';}
    $('#it-play').addEventListener('click',function(){
      if(timer){stopPlay();return;} var i=0; show(0); this.textContent='Pause';
      timer=setInterval(function(){ i++; if(i>=V.length){stopPlay();return;} show(i); },2200);
    });
    ims[1].style.opacity=0;
    watch(slide,function(on){ if(!on) stopPlay(); else if(cur<0) show(0); });
  })();

  // ================= 8 · Udio players (load on click, remove on leave) and a shimmering waveform =================
  (function(){
    var slide=slideOf('.s-udio'); if(!slide) return;
    $$('.wave',slide).forEach(function(w,j){ for(var i=0;i<56;i++) w.appendChild(document.createElement('i')); });
    $$('.ud',slide).forEach(function(u){
      u.addEventListener('click',function(e){
        if(e.target.closest('a')||$('iframe',u)) return;
        var f=document.createElement('iframe'); f.src='https://www.udio.com/embed/'+u.dataset.udio+'?embedVariant=default';
        f.allow='encrypted-media; fullscreen; autoplay'; f.referrerPolicy='strict-origin-when-cross-origin'; u.appendChild(f);
        u.closest('.card').classList.add('loaded');
      });
    });
    var raf=0;
    function frame(ts){ var t=ts/1000;
      $$('.wave',slide).forEach(function(w,j){ var live=w.closest('.card').classList.contains('loaded');
        $$('i',w).forEach(function(b,i){
          var base=.25+.45*Math.abs(Math.sin(i*.37+j*2)*Math.cos(i*.11+j)), h=live?base*(.55+.45*Math.sin(t*(3+j)+i*.6)):base*.6;
          b.style.height=(h*100).toFixed(1)+'%'; });
      });
      raf=requestAnimationFrame(frame); }
    watch(slide,function(on){
      if(on&&!raf) raf=requestAnimationFrame(frame);
      if(!on){ cancelAnimationFrame(raf); raf=0; $$('.ud iframe',slide).forEach(function(f){f.remove();}); $$('.card',slide).forEach(function(c){c.classList.remove('loaded');}); }
    });
  })();

  // ================= YouTube: load the player only when clicked; remove it when the slide is left =================
  (function(){
    $$('#stage .yt').forEach(function(v){
      var id=v.getAttribute('data-yt'), slide=v.closest('.slide'); if(!id) return;
      var a=document.createElement('a'); a.className='ytlink'; a.target='_blank'; a.rel='noopener';
      a.href=v.hasAttribute('data-short')?'https://www.youtube.com/shorts/'+id:'https://www.youtube.com/watch?v='+id; a.textContent='Open on YouTube ↗';
      v.parentNode.insertBefore(a,v.nextSibling);
      var cs=getComputedStyle(v); a.style.left=cs.left; a.style.top=(parseFloat(cs.top)+parseFloat(cs.height)+6)+'px'; a.style.width=cs.width;
      if(v.hasAttribute('data-b')) a.setAttribute('data-b',v.getAttribute('data-b'));
      v.addEventListener('click',function(){
        if($('iframe',v)) return;
        var f=document.createElement('iframe');
        f.src='https://www.youtube.com/embed/'+id+'?autoplay=1&rel=0&playsinline=1&origin='+encodeURIComponent(location.origin);
        f.referrerPolicy='strict-origin-when-cross-origin';
        f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen; web-share'; f.allowFullscreen=true;
        v.appendChild(f); v.classList.add('playing');
      });
      watch(slide,function(on){ if(!on){ var f=$('iframe',v); if(f) f.remove(); v.classList.remove('playing'); } });
    });
  })();

  // ================= 11 · 3D pipeline: file sizes =================
  (function(){
    var box=$('#sizes'); if(!box) return;
    var M=[['Ancient Sentinel','5.2 million points',260.7,3.9],['Ichabod Crane and Katrina','626 thousand points',40.4,1.3],['Two Birds on a Crown','107 thousand points',29.3,0.8]];
    var bars=[];
    M.forEach(function(m,i){
      if(i) { var s=document.createElement('div'); s.className='sep'; box.appendChild(s); }
      [['glb','3D file (GLB)',m[2]],['web','pictures + orbit movie',m[3]]].forEach(function(r,j){
        var d=document.createElement('div'); d.className='bar '+r[0];
        d.innerHTML='<div class="nm">'+(j?'':m[0])+'<small>'+(j?r[1]:m[1]+' · '+r[1])+'</small></div><div class="tr"><i style="width:0"></i></div><div class="val">'+r[2].toFixed(1)+' MB</div>';
        box.appendChild(d); bars.push([$('i',d),Math.max(.6,r[2]/260.7*100)]);
      });
    });
    new MutationObserver(function(){ var on=box.classList.contains('shown');
      bars.forEach(function(b){ b[0].style.width=on?b[1]+'%':'0'; }); }).observe(box,{attributes:true,attributeFilter:['class']});
  })();

  // ================= 12 · 3D viewer: orbit movie with drag-to-turn, plus fixed camera shots =================
  (function(){
    var slide=slideOf('.s-3d'), view=$('#v3d'); if(!slide||!view) return;
    var vid=$('video',view), still=$('img',view), deg=$('.deg',view), shots=$('#shots'), obtn=$('#orbit-btn');
    var SH=[['orbit','Orbit'],['hero','Hero'],['front','Front'],['profile','Side'],['back','Back'],['low','Low'],['detail','Detail']];
    var model='birds', paused=false, mode='orbit';
    SH.forEach(function(s){ var b=document.createElement('button'); b.dataset.s=s[0]; b.innerHTML='<span>'+s[1]+'</span>';
      b.addEventListener('click',function(){ setShot(s[0]); }); shots.appendChild(b); });
    var sb=$$('button',shots);
    function thumbs(){ sb.forEach(function(b){ var s=b.dataset.s; b.style.backgroundImage='url(img/3d/'+model+'/'+(s==='orbit'?'hero':s)+'.jpg)'; }); }
    function setShot(s){ mode=s; sb.forEach(function(b){b.classList.toggle('on',b.dataset.s===s);});
      if(s==='orbit'){ view.classList.remove('still'); if(!paused&&slide.classList.contains('on')) vid.play().catch(function(){}); }
      else { still.src='img/3d/'+model+'/'+s+'.jpg'; view.classList.add('still'); vid.pause(); } }
    function setModel(k){ model=k; $$('#models button[data-k]').forEach(function(b){b.classList.toggle('on',b.dataset.k===k);});
      vid.src='img/3d/'+k+'/orbit.mp4'; vid.poster='img/3d/'+k+'/hero.jpg'; thumbs(); setShot(mode); }
    $$('#models button[data-k]').forEach(function(b){ b.addEventListener('click',function(){ setModel(b.dataset.k); }); });
    obtn.addEventListener('click',function(){ paused=!paused; obtn.textContent=paused?'Play orbit':'Pause orbit';
      if(paused) vid.pause(); else setShot('orbit'); });
    vid.addEventListener('timeupdate',function(){ if(vid.duration) deg.textContent=Math.round(vid.currentTime/vid.duration*360)+'°'; });
    // drag to turn
    var drag=null;
    view.addEventListener('pointerdown',function(e){ if(mode!=='orbit'||!vid.duration) return;
      drag={x:e.clientX,t:vid.currentTime,was:!vid.paused}; vid.pause(); view.classList.add('drag'); view.setPointerCapture(e.pointerId); });
    view.addEventListener('pointermove',function(e){ if(!drag) return;
      var r=view.getBoundingClientRect(), d=vid.duration, t=(drag.t-(e.clientX-drag.x)/r.width*d*.8)%d; if(t<0)t+=d;
      vid.currentTime=t; deg.textContent=Math.round(t/d*360)+'°'; });
    function end(){ if(!drag) return; view.classList.remove('drag'); if(drag.was&&!paused) vid.play().catch(function(){}); drag=null; }
    view.addEventListener('pointerup',end); view.addEventListener('pointercancel',end);
    setModel('birds');
    watch(slide,function(on){ if(on&&mode==='orbit'&&!paused) vid.play().catch(function(){}); if(!on) vid.pause(); });
  })();

  // ================= 13 · code in conversation: a bouncing-ball program, four requests =================
  (function(){
    var cv=$('#ball'); if(!cv) return;
    var slide=cv.closest('.slide'), ctx=cv.getContext('2d'), W=434, H=300, chat=$('#chat'), grav=$('#grav'), gr=$('#grav-r');
    ctx.scale(2,2);
    var R=[
      ['Make a web page with a red ball bouncing around inside a box.',
       'Here is a single HTML page with a canvas. Each frame the ball moves, and it turns around when it hits a wall.',
       'x += vx;  y += vy;\nif (x < r || x > W - r) vx = -vx;\nif (y < r || y > H - r) vy = -vy;'],
      ['Add gravity, so it falls and bounces on the floor.',
       'Done. Each frame the ball speeds up downward, and each bounce loses a little energy.',
       'vy += g;\nif (y > H - r) { y = H - r; vy *= -0.88; }'],
      ['Leave a fading trail behind it.',
       'Instead of clearing the canvas, each frame paints a see-through white layer, so old positions fade away.',
       "ctx.fillStyle = 'rgba(255,255,255,0.18)';\nctx.fillRect(0, 0, W, H);"],
      ['Let me click to add more balls, and give me a slider for gravity.',
       'Balls are now a list: a click adds one where you click, in a new colour. The slider sets the gravity.',
       'canvas.onclick = e => balls.push(ball(e));\nslider.oninput = () => g = +slider.value;']
    ];
    var v=0, balls=[], cols=['#C9852F','#1D6E73','#8A6236','#5FA9A6','#B5523B'];
    function ball(x,y,c){ return {x:x,y:y,vx:(Math.random()<.5?-1:1)*(2+Math.random()*1.5),vy:-1-Math.random()*2,r:16,c:c||'#C0392B'}; }
    function say(cls,html){ var m=document.createElement('div'); m.className='msg '+cls; m.innerHTML=html; chat.appendChild(m);
      while(chat.scrollHeight>chat.clientHeight&&chat.children.length>2) chat.removeChild(chat.firstChild); }
    function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;');}
    function go(i){ v=i;
      say('u',esc(R[i][0]));
      setTimeout(function(){ say('c',esc(R[i][1])+'<code>'+esc(R[i][2])+'</code>'); $('#win-t').textContent='bounce.html · version '+(i+1);
        grav.classList.toggle('off',i<3); if(i===0) balls=[ball(120,90)];
        $('#code-next').textContent=i<3?'Ask for the next change':'Click inside the box to add balls'; $('#code-next').disabled=i>=3; },500);
    }
    function reset(){ chat.innerHTML=''; balls=[ball(120,90)]; gr.value=1; ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H); go(0); }
    $('#code-next').addEventListener('click',function(){ if(v<3) go(v+1); });
    $('#code-reset').addEventListener('click',reset);
    cv.addEventListener('click',function(e){ if(v<3) return; var r=cv.getBoundingClientRect();
      balls.push(ball((e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H,cols[balls.length%cols.length])); if(balls.length>40) balls.shift(); });
    function step(){
      var g=v>=1?(v>=3?+gr.value:1)*.35:0;
      if(v>=2){ ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.fillRect(0,0,W,H); } else { ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H); }
      balls.forEach(function(b){
        b.vy+=g; b.x+=b.vx; b.y+=b.vy;
        if(b.x<b.r){b.x=b.r;b.vx=-b.vx;} if(b.x>W-b.r){b.x=W-b.r;b.vx=-b.vx;}
        if(b.y<b.r){b.y=b.r;b.vy=-b.vy;}
        if(b.y>H-b.r){ b.y=H-b.r; b.vy*=v>=1?-.88:-1; if(v>=1&&Math.abs(b.vy)<2.2&&g>0) b.vy=-(7+Math.random()*3); }
        ctx.fillStyle=b.c; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,6.283); ctx.fill();
      });
    }
    var raf=0; function frame(){ step(); raf=requestAnimationFrame(frame); }
    watch(slide,function(on){ if(on){ if(!chat.children.length) reset(); if(!raf) raf=requestAnimationFrame(frame); } else { cancelAnimationFrame(raf); raf=0; } });
  })();

  // ================= 15 · Egans Creek: the live site in a frame, loaded the first time the slide is shown =================
  (function(){
    var slide=slideOf('.s-egan'), site=$('#egan-site'); if(!slide||!site) return;
    var URL='https://metaphorz.github.io/eganscreek/', f=null;
    function load(p){
      if(!f){ f=document.createElement('iframe'); f.title='Egans Creek atlas'; f.referrerPolicy='strict-origin-when-cross-origin'; site.appendChild(f); }
      f.src=URL+'#page='+p;
    }
    group($('#egan-pages'),'data-p',function(p){ load(p); });
    watch(slide,function(on){ if(on&&!f&&!presenter) load('map'); });
  })();
})();
