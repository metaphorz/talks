// Modeling — title animation and per-slide interactions.
// Loads before deck.js so the build steps it creates are counted.
(function(){
  var NS='http://www.w3.org/2000/svg';
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
  // label boxes: estimated from text length so layout works before fonts load
  function boxW(label){return Math.round(label.length*7.3+24);}
  // where the line from a toward b leaves a's box
  function clip(a,b,hw,hh){
    var dx=b.x-a.x, dy=b.y-a.y; if(!dx&&!dy) return {x:a.x,y:a.y};
    var t=Math.min(dx?hw/Math.abs(dx):1e9, dy?hh/Math.abs(dy):1e9);
    return {x:a.x+dx*t,y:a.y+dy*t};
  }
  function arrowDefs(svg,id,color){
    var d=el('defs',{},svg), m=el('marker',{id:id,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'},d);
    el('path',{d:'M0 0 L10 5 L0 10 z',fill:color},m);
  }

  // keep clicks on interactive boards from advancing the slide
  ['#fgraph','.s-keep .pool','.s-keep .bin'].forEach(function(s){$$(s).forEach(function(e){e.setAttribute('data-noadvance','');});});

  // ================= 1 · title: the same pieces as blocks, a village and a graph =================
  (function(){
    var cv=$('#morph'); if(!cv) return;
    var slide=cv.closest('.slide'), ctx=cv.getContext('2d'); ctx.scale(2,2);
    var cap=$('#morph-cap'), chips=$$('.s-title .five span');
    var seed=11; function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
    var N=40;
    // a house: a body of w×h blocks and a stepped roof, bottom-left at (x0,y0)
    function house(w,h,roof,s,x0,y0){
      var out=[];
      for(var r=0;r<h;r++) for(var c=0;c<w;c++) out.push({x:x0+c*s+s/2,y:y0-r*s-s/2,s:s*.9,r:s*.14});
      roof.forEach(function(n,k){ var off=(w-n)/2; for(var c=0;c<n;c++) out.push({x:x0+(off+c)*s+s/2,y:y0-(h+k)*s-s/2,s:s*.9,r:s*.14}); });
      return out;
    }
    var F0=house(6,5,[4,3,2,1],42,604,560);
    var F1=house(4,3,[3,2,1],38,566,520)
      .concat(house(4,3,[3,2,1],38/3,746,520))
      .concat(house(2,2,[],38/9,816,520));
    // F2: a small graph, laid out once by a force simulation
    var gn=[], ge=[];
    for(var i=0;i<N;i++) gn.push({x:600+rnd()*300,y:150+rnd()*420,vx:0,vy:0});
    for(i=1;i<N;i++) ge.push([i,Math.floor(rnd()*Math.min(i,6+i/3))]);
    for(i=0;i<14;i++){var a=Math.floor(rnd()*N),b=Math.floor(rnd()*N); if(a!==b) ge.push([a,b]);}
    var deg=gn.map(function(){return 0;}); ge.forEach(function(e){deg[e[0]]++;deg[e[1]]++;});
    for(var it=0;it<400;it++){
      for(i=0;i<N;i++) for(var j=i+1;j<N;j++){
        var dx=gn[j].x-gn[i].x, dy=gn[j].y-gn[i].y, d2=dx*dx+dy*dy+.01, f=900/d2, d=Math.sqrt(d2);
        gn[i].vx-=f*dx/d; gn[i].vy-=f*dy/d; gn[j].vx+=f*dx/d; gn[j].vy+=f*dy/d;
      }
      ge.forEach(function(e){var A=gn[e[0]],B=gn[e[1]],dx=B.x-A.x,dy=B.y-A.y,d=Math.sqrt(dx*dx+dy*dy)||1,f=(d-58)*.03;
        A.vx+=f*dx/d;A.vy+=f*dy/d;B.vx-=f*dx/d;B.vy-=f*dy/d;});
      gn.forEach(function(n){n.vx+=(750-n.x)*.004;n.vy+=(360-n.y)*.004;n.x+=n.vx*.5;n.y+=n.vy*.5;n.vx*=.6;n.vy*=.6;
        n.x=Math.max(560,Math.min(930,n.x));n.y=Math.max(130,Math.min(600,n.y));});
    }
    var F2=gn.map(function(n,k){var s=deg[k]>=5?22:deg[k]>=3?15:11;return {x:n.x,y:n.y,s:s,r:s/2};});
    var F=[F0,F1,F2], caps=['a house of blocks','a village that holds a copy of itself','a graph of what we know'];
    // each block keeps its place in reading order, so the morph looks like a rebuild
    var hub=F2.map(function(p){return p.s>=22;});
    var cur=0, nxt=0, t0=null, HOLD=3.4, MORPH=1.8, running=false, raf=0;
    function setCap(k){ cap.textContent=caps[k]; chips.forEach(function(c){c.classList.toggle('hot',+c.getAttribute('data-k')===k);}); }
    function rr(x,y,s,r){ var h=s/2; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x-h,y-h,s,s,r); else ctx.rect(x-h,y-h,s,s); }
    function draw(a,b,u,t){
      ctx.clearRect(0,0,960,720);
      var gw=(a===2?1-u:0)+(b===2?u:0);   // how much of the graph is showing
      var P=[];
      for(var i=0;i<N;i++){
        var p=F[a][i], q=F[b][i], k=ease(Math.min(1,Math.max(0,u*1.25-(i%10)*.025)));
        var wob=Math.sin(t*1.3+i)*1.2;
        P.push({x:p.x+(q.x-p.x)*k, y:p.y+(q.y-p.y)*k+wob, s:p.s+(q.s-p.s)*k, r:p.r+(q.r-p.r)*k});
      }
      if(gw>0.01){
        ctx.strokeStyle='rgba(127,196,192,'+(.45*gw)+')'; ctx.lineWidth=1.4;
        ge.forEach(function(e){ctx.beginPath();ctx.moveTo(P[e[0]].x,P[e[0]].y);ctx.lineTo(P[e[1]].x,P[e[1]].y);ctx.stroke();});
      }
      P.forEach(function(p,i){
        var amber=hub[i]&&gw>.5;
        rr(p.x,p.y,p.s,p.r);
        ctx.fillStyle=amber?'#C9852F':'rgba(29,110,115,.85)'; ctx.fill();
        ctx.strokeStyle=amber?'#E6B36E':'#7FC4C0'; ctx.lineWidth=1.3; ctx.stroke();
      });
      // ground line under the houses
      var hw=1-gw;
      if(hw>.01){
        var ya=a===0?562:522, yb=b===0?562:522, gy=ya+(yb-ya)*ease(u);
        ctx.strokeStyle='rgba(201,133,47,'+(.6*hw)+')'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(540,gy); ctx.lineTo(930,gy); ctx.stroke();
      }
    }
    function frame(now){
      if(!running) return;
      if(t0===null) t0=now;
      var e=(now-t0)/1000;
      if(e<HOLD) draw(cur,cur,0,now/1000);
      else if(e<HOLD+MORPH){ if(nxt===cur){nxt=(cur+1)%3;setCap(nxt);} draw(cur,nxt,(e-HOLD)/MORPH,now/1000); }
      else { cur=nxt; t0=now; draw(cur,cur,0,now/1000); }
      raf=requestAnimationFrame(frame);
    }
    setCap(0);
    if(reduce){ draw(2,2,0,0); setCap(2); return; }
    watch(slide,function(on){ running=on; cancelAnimationFrame(raf); if(on) raf=requestAnimationFrame(frame); });
  })();

  // ================= 5 · what a model keeps: drag cards into kept / lost =================
  (function(){
    var slide=slideOf('.s-keep'); if(!slide) return;
    var stage=document.getElementById('stage');
    var pool=slide.querySelector('.pool'), kept=slide.querySelector('.bin.kept .drop'), lost=slide.querySelector('.bin.lost .drop');
    function binAt(x,y){
      var els=document.elementsFromPoint(x,y);
      for(var i=0;i<els.length;i++){ var b=els[i].closest&&els[i].closest('.bin,.pool'); if(b&&slide.contains(b)) return b; }
      return null;
    }
    function target(b){ return b.classList.contains('pool')?pool:b.querySelector('.drop'); }
    $$('.prop',slide).forEach(function(c){
      var x0,y0,drag=false,over=null;
      c.addEventListener('pointerdown',function(e){ x0=e.clientX;y0=e.clientY;drag=false; c.setPointerCapture(e.pointerId); });
      c.addEventListener('pointermove',function(e){
        if(x0==null) return;
        var k=stage.getBoundingClientRect().width/1280, dx=(e.clientX-x0)/k, dy=(e.clientY-y0)/k;
        if(!drag&&Math.abs(dx)+Math.abs(dy)>6){ drag=true; c.classList.add('dragging'); }
        if(drag){ c.style.transform='translate('+dx+'px,'+dy+'px)';
          var b=binAt(e.clientX,e.clientY); if(over&&over!==b) over.classList.remove('hover'); if(b&&!b.classList.contains('pool')) b.classList.add('hover'); over=b; }
      });
      c.addEventListener('pointerup',function(e){
        if(x0==null) return; x0=null;
        if(over) over.classList.remove('hover');
        if(drag){ var b=binAt(e.clientX,e.clientY); if(b) target(b).appendChild(c); }
        else { var from=c.parentNode; (from===pool?kept:from===kept?lost:pool).appendChild(c); }
        c.classList.remove('dragging'); c.style.transform=''; drag=false; over=null;
      });
    });
  })();

  // ================= 7 · the village as knowledge: each sentence adds triples =================
  (function(){
    var svg=$('#vk-graph'), list=$('#vk-trips'); if(!svg) return;
    arrowDefs(svg,'vk-arrow','#7FA9A5');
    var N={
      mv:{l:'Model village',x:228,y:252,hub:1}, bow:{l:'Bourton-on-the-Water',s:'Bourton',x:228,y:62}, riv:{l:'River Windrush',x:410,y:150},
      inn:{l:'Old New Inn',x:432,y:316}, cam:{l:'C. A. Morris',x:420,y:436}, st:{l:'Cotswold stone',x:78,y:150},
      sc:{l:'1 : 9',x:62,y:282}, yr:{l:'Coronation Day 1937',x:100,y:400}, mm:{l:'Model of the model',x:222,y:474}
    };
    // [build, subject, relation, object, bend]
    var T=[
      [1,'mv','copies','bow'],[1,'riv','flows through','bow'],
      [2,'mv','stands behind','inn'],[2,'cam','landlord of','inn'],[2,'cam','conceived (1936)','mv'],
      [3,'mv','built of','st'],[3,'mv','scale','sc'],
      [4,'mv','opened','yr'],
      [5,'mv','contains','mm',-46],[5,'mm','copies','mv',-46]
    ];
    var gEdges=el('g',{},svg), gNodes=el('g',{},svg), seen={}, groups={};
    function grp(b,parent){ var k=parent===gNodes?'n'+b:'e'+b; if(!groups[k]) groups[k]=el('g',{'data-b':b},parent); return groups[k]; }
    T.forEach(function(t){
      var b=t[0], A=N[t[1]], B=N[t[3]], bend=t[4]||0;
      [t[1],t[3]].forEach(function(id){
        if(seen[id]) return; seen[id]=1; var n=N[id], w=boxW(n.l);
        var g=el('g',{class:'node'+(n.hub?' hub':''),transform:'translate('+n.x+' '+n.y+')'},grp(b,gNodes));
        el('rect',{x:-w/2,y:-15,width:w,height:30,rx:15},g); var tx=el('text',{},g); tx.textContent=n.l; n.w=w;
      });
      if(!A.w) A.w=boxW(A.l); if(!B.w) B.w=boxW(B.l);
      var mx=(A.x+B.x)/2, my=(A.y+B.y)/2, dx=B.x-A.x, dy=B.y-A.y, L=Math.sqrt(dx*dx+dy*dy);
      var cx=mx-dy/L*bend, cy=my+dx/L*bend;
      var p=clip(A,{x:cx,y:cy},A.w/2+3,18), q=clip(B,{x:cx,y:cy},B.w/2+5,20);
      var g=grp(b,gEdges);
      var path=el('path',{class:'edge draw',d:'M'+p.x+' '+p.y+' Q'+cx+' '+cy+' '+q.x+' '+q.y,'marker-end':'url(#vk-arrow)'},g);
      path.style.setProperty('--len',Math.ceil(L+40));
      var lx=(p.x+2*cx+q.x)/4, ly=(p.y+2*cy+q.y)/4;
      var tx=el('text',{class:'rel',x:lx,y:ly+4,'text-anchor':'middle'},g); tx.textContent=t[2];
      var li=document.createElement('li'); li.setAttribute('data-b',b);
      li.innerHTML=(N[t[1]].s||N[t[1]].l)+' – <b>'+t[2]+'</b> – '+(N[t[3]].s||N[t[3]].l); list.appendChild(li);
    });
  })();

  // ================= 8 · one village, four maps: the same concepts in four structures =================
  (function(){
    var svg=$('#fgraph'); if(!svg) return;
    var side=$('#fside'), info=$('#finfo');
    arrowDefs(svg,'f-arrow','#7FA9A5');
    var L={bow:'Bourton-on-the-Water',mv:'Model village',riv:'River Windrush',st:'Cotswold stone',inn:'Old New Inn',cam:'C. A. Morris',
      sc:'1 : 9 scale',yr:'1937',mm:'Model of the model',vil:'Village',mod:'Model',cots:'The Cotswolds'};
    var BR={place:'#1D6E73',makers:'#C9852F',making:'#8A6236',copy:'#6E8FA8'};
    var V={
      sem:{title:'Semantic network',who:'Ross Quillian, 1968',
        text:'Concepts joined by a few strict kinds of link: is-a, has, part-of. Built as a model of human memory.',ex:'Model village —is-a→ Model',
        rx:15,arrows:1,labels:1,
        pos:{vil:[100,52],mod:[330,52],mm:[490,128],bow:[175,150],cots:[75,250],riv:[130,350],inn:[275,290],mv:[420,235],yr:[555,195],st:[505,340],sc:[400,420],cam:[235,420]},
        E:[['bow','is-a','vil'],['mv','is-a','mod'],['mm','is-a','mod'],['bow','part-of','cots'],['bow','has','riv'],['bow','has','inn'],
           ['mv','copy-of','bow'],['mv','made-of','st'],['mv','has','sc'],['mv','has','mm'],['cam','owns','inn'],['cam','made','mv'],['mv','opened','yr']]},
      con:{title:'Concept map',who:'Joseph Novak, Cornell, 1970s',
        text:'Most general idea at the top. Each link has a phrase, so every path reads as a sentence.',ex:'Model village → is a small copy of → Bourton-on-the-Water',
        rx:5,arrows:1,labels:1,
        pos:{mv:[297,36],bow:[105,150],cam:[288,150],yr:[393,150],mm:[502,150],vil:[45,260],riv:[150,350],cots:[75,440],inn:[235,260],st:[350,350],sc:[440,260],mod:[540,350]},
        E:[['mv','is a small copy of','bow',.64],['mv','was dreamed up by','cam',.38],['mv','opened in','yr',.78],['mv','contains a','mm'],
           ['bow','is a','vil'],['bow','is crossed by','riv'],['bow','lies in','cots',.62],['cam','ran the','inn'],['cam','had it built of','st',.6],
           ['mm','is built at','sc'],['mm','is itself a','mod']]},
      mind:{title:'Mind map',who:'Tony Buzan, 1974',
        text:'One central idea with branches by theme, coloured and unlabeled. Quick and personal: links say “goes with”, not how.',ex:'Model village ─ Place ─ River Windrush',
        rx:13,arrows:0,labels:0,
        pos:{mv:[297,233],bow:[150,130],riv:[80,40],cots:[72,215],vil:[245,40],cam:[450,120],inn:[515,35],st:[125,345],sc:[205,440],yr:[60,425],mm:[455,345],mod:[525,440]},
        br:{bow:'place',riv:'place',cots:'place',vil:'place',cam:'makers',inn:'makers',st:'making',sc:'making',yr:'making',mm:'copy',mod:'copy'},
        E:[['mv','','bow'],['bow','','riv'],['bow','','cots'],['bow','','vil'],['mv','','cam'],['cam','','inn'],['mv','','st'],['st','','sc'],['st','','yr'],['mv','','mm'],['mm','','mod']]},
      kg:{title:'Knowledge graph',who:'Google, 2012 · Wikidata',
        text:'Every link is a triple, subject – relation – object, with a shared vocabulary so machines can join graphs together.',ex:'(Model village, located in, Bourton-on-the-Water)',
        rx:15,arrows:1,labels:1,
        pos:{mv:[300,240],bow:[300,105],cots:[100,40],vil:[500,40],riv:[490,175],inn:[500,280],cam:[440,400],st:[110,180],sc:[100,300],yr:[180,410],mm:[300,420],mod:[110,110]},
        E:[['mv','located in','bow'],['bow','located in','cots'],['bow','instance of','vil'],['riv','flows through','bow'],['mv','next to','inn'],['cam','landlord of','inn'],
           ['cam','creator of','mv'],['mv','made from','st'],['mv','scale','sc'],['mv','opened','yr'],['mv','has part','mm'],['mv','instance of','mod']]}
    };
    var ids=Object.keys(L), nodes={}, gE=el('g',{},svg), gN=el('g',{},svg);
    ids.forEach(function(id){
      var w=boxW(L[id]), g=el('g',{class:'node'+(id==='mv'?' hub':''),'data-id':id},gN);
      var r=el('rect',{x:-w/2,y:-15,width:w,height:30,rx:15},g), t=el('text',{},g); t.textContent=L[id];
      nodes[id]={g:g,r:r,w:w,x:297,y:233};
      g.addEventListener('click',function(){ pick(id); });
    });
    var view='sem', from=null, edgesShown=null, picked=null;
    function place(){ ids.forEach(function(id){var n=nodes[id]; n.g.setAttribute('transform','translate('+n.x.toFixed(1)+' '+n.y.toFixed(1)+')');}); }
    function drawEdges(v,alpha){
      gE.innerHTML=''; gE.setAttribute('opacity',alpha);
      v.E.forEach(function(e){
        var A=nodes[e[0]], B=nodes[e[2]];
        if(v===V.mind){
          var c=BR[v.br[e[2]]], mx=(A.x+B.x)/2, my=(A.y+B.y)/2;
          var cx=mx+(A.y-B.y)*.18, cy=my-(A.x-B.x)*.18;
          el('path',{class:'branch',d:'M'+A.x+' '+A.y+' Q'+cx+' '+cy+' '+B.x+' '+B.y,stroke:c,opacity:.75},gE);
          return;
        }
        var p=clip(A,B,A.w/2+2,17), q=clip(B,A,B.w/2+5,20);
        var lit=picked&&(e[0]===picked||e[2]===picked);
        el('line',{class:'edge',x1:p.x,y1:p.y,x2:q.x,y2:q.y,'marker-end':v.arrows?'url(#f-arrow)':'',
          style:lit?'stroke:#C9852F;stroke-width:2.6':''},gE);
        if(v.labels&&e[1]){ var f=e[3]||.5, t=el('text',{class:'rel',x:p.x+(q.x-p.x)*f,y:p.y+(q.y-p.y)*f+4,'text-anchor':'middle'},gE); t.textContent=e[1]; }
      });
    }
    function styleNodes(v){
      ids.forEach(function(id){ var n=nodes[id];
        n.r.setAttribute('rx',v.rx);
        n.r.style.stroke=v===V.mind&&v.br[id]?BR[v.br[id]]:'';
        n.r.style.strokeWidth=v===V.mind&&v.br[id]?'3':'';
        n.g.classList.toggle('lit',id===picked);
      });
    }
    function sideFor(v){ side.innerHTML='<div class="tag">'+v.title+'</div><div class="who">'+v.who+'</div><p>'+v.text+'</p><div class="ex">'+v.ex+'</div>'; }
    function pick(id){
      picked=picked===id?null:id; var v=V[view]; styleNodes(v); drawEdges(v,1);
      if(!picked){info.textContent='Click a concept to see its links.';return;}
      var rows=v.E.filter(function(e){return e[0]===picked||e[2]===picked;}).map(function(e){
        return L[e[0]]+(e[1]?' – <b>'+e[1]+'</b> – ':' ─ ')+L[e[2]];});
      info.innerHTML=rows.join(' &nbsp;·&nbsp; ')||'No links in this view.';
    }
    var raf=0;
    function go(next,instant){
      var v=V[next], old=V[view], start={};
      ids.forEach(function(id){start[id]={x:nodes[id].x,y:nodes[id].y};});
      view=next; picked=null; info.textContent='Click a concept to see its links.'; sideFor(v);
      cancelAnimationFrame(raf);
      if(instant||reduce){ ids.forEach(function(id){nodes[id].x=v.pos[id][0];nodes[id].y=v.pos[id][1];}); place(); styleNodes(v); drawEdges(v,1); return; }
      var t0=null, D=1000, swapped=false;
      function step(now){
        if(t0===null) t0=now; var u=Math.min(1,(now-t0)/D), k=ease(u);
        ids.forEach(function(id){var s=start[id],p=v.pos[id]; nodes[id].x=s.x+(p[0]-s.x)*k; nodes[id].y=s.y+(p[1]-s.y)*k;});
        place();
        if(u<.35) drawEdges(old,1-u/.35);
        else { if(!swapped){swapped=true;styleNodes(v);} drawEdges(v,(u-.35)/.65); }
        if(u<1) raf=requestAnimationFrame(step);
      }
      raf=requestAnimationFrame(step);
      // finish even if animation frames are throttled (background tab, slow machine)
      clearTimeout(go.t); go.t=setTimeout(function(){ if(view===next){ cancelAnimationFrame(raf); if(t0===null) t0=performance.now()-D; step(t0+D); } },D+200);
    }
    $$('#fviews button').forEach(function(b){ b.addEventListener('click',function(){
      $$('#fviews button').forEach(function(x){x.classList.toggle('on',x===b);}); go(b.getAttribute('data-v'));
    });});
    go('sem',true);
  })();

  // ================= 9 · sentences become triples (runs by itself) =================
  (function(){
    var slide=slideOf('.s-tri'); if(!slide) return;
    var page=$('.page',slide), sent=$('#tri-sent'), slotsBox=$('.slots',slide), slots=$$('.slot',slide), svg=$('#tri-graph');
    arrowDefs(svg,'t-arrow','#7FA9A5');
    // sentence pieces: [text, role]; role s/r/o marks the triple
    var S=[
      [['The ',''],['model village','s'],[' is ',''],['built of','r'],[' ',''],['Cotswold stone','o'],['.','']],
      [['',''],['C. A. Morris','s'],[' ',''],['conceived','r'],[' the ',''],['model village','o'],[' in 1936.','']],
      [['',''],['Worker bees','s'],[' ',''],['make','r'],[' ',''],['honey','o'],[' from nectar.','']],
      [['',''],['Worker bees','s'],[' ',''],['pollinate','r'],[' ',''],['flowers','o'],[' as they forage.','']],
      [['In 1588 ',''],['Agostino Ramelli','s'],[' ',''],['designed','r'],[' a ',''],['bookwheel','o'],['.','']],
      [['The ',''],['Industrial Revolution','s'],[' ',''],['began in','r'],[' ',''],['Britain','o'],['.','']]
    ];
    var P={'model village':[150,70],'Cotswold stone':[150,180],'C. A. Morris':[330,120],'Worker bees':[470,115],'honey':[600,45],'flowers':[600,190],
      'Agostino Ramelli':[735,60],'bookwheel':[735,135],'Industrial Revolution':[735,190],'Britain':[540,205]};
    P['Industrial Revolution']=[700,200]; P['Britain']=[800,140]; P['Agostino Ramelli']=[740,35]; P['bookwheel']=[740,95];
    var gE=el('g',{},svg), gN=el('g',{},svg), have={}, timers=[], k=0;
    function later(f,ms){ timers.push(setTimeout(f,ms)); }
    function node(name){
      if(have[name]) return have[name]; var p=P[name], w=boxW(name);
      var g=el('g',{class:'node',transform:'translate('+p[0]+' '+p[1]+')'},gN);
      el('rect',{x:-w/2,y:-14,width:w,height:28,rx:14},g); var t=el('text',{},g); t.textContent=name;
      g.animate&&g.animate([{opacity:0},{opacity:1}],{duration:400});
      return have[name]={x:p[0],y:p[1],w:w,g:g};
    }
    function link(s,r,o){
      var A=node(s), B=node(o), p=clip(A,B,A.w/2+2,16), q=clip(B,A,B.w/2+5,19);
      var len=Math.ceil(Math.hypot(q.x-p.x,q.y-p.y));
      var ln=el('line',{class:'edge',x1:p.x,y1:p.y,x2:q.x,y2:q.y,'marker-end':'url(#t-arrow)','stroke-dasharray':len,'stroke-dashoffset':len},gE);
      ln.style.transition='stroke-dashoffset .8s cubic-bezier(.33,0,.2,1)';
      setTimeout(function(){ln.setAttribute('stroke-dashoffset',0);},40);
      var t=el('text',{class:'rel',x:(p.x+q.x)/2,y:(p.y+q.y)/2-5,'text-anchor':'middle'},gE); t.textContent=r;
      [A,B].forEach(function(n){n.g.classList.add('lit'); later(function(){n.g.classList.remove('lit');},1600);});
    }
    function reset(){ timers.forEach(clearTimeout); timers=[]; gE.innerHTML=''; gN.innerHTML=''; have={}; k=0;
      sent.innerHTML=''; slots.forEach(function(s){s.textContent='';s.classList.remove('full');}); $$('.fly',page).forEach(function(f){f.remove();}); }
    function one(){
      if(k===S.length){ gE.innerHTML=''; gN.innerHTML=''; have={}; k=0; }
      var parts=S[k++], spans={};
      sent.innerHTML=''; sent.style.opacity=1;
      parts.forEach(function(pt){ var sp=document.createElement('span'); sp.textContent=pt[0]; sent.appendChild(sp); if(pt[1]){ spans[pt[1]]=sp; sp.className='k'; } });
      sent.animate&&sent.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:450});
      ['s','r','o'].forEach(function(r,i){ later(function(){spans[r].classList.add(r);},700+i*260); });
      later(function(){
        ['s','r','o'].forEach(function(r,i){
          var sp=spans[r], f=document.createElement('div'); f.className='fly'; f.textContent=sp.textContent;
          f.style.left=(sent.offsetLeft+sp.offsetLeft)+'px'; f.style.top=(sent.offsetTop+sp.offsetTop)+'px'; f.style.fontSize='27px'; f.style.lineHeight='60px';
          f.style.color=getComputedStyle(sp).color; page.appendChild(f);
          var slot=slots[i];
          requestAnimationFrame(function(){requestAnimationFrame(function(){
            f.style.left=(slotsBox.offsetLeft+slot.offsetLeft+slot.offsetWidth/2-f.offsetWidth*19/27/2)+'px';
            f.style.top=(slotsBox.offsetTop+slot.offsetTop+12)+'px'; f.style.fontSize='19px';
          });});
          later(function(){ slot.textContent=sp.textContent; slot.classList.add('full'); f.remove(); },780);
        });
      },1800);
      later(function(){ link(spans.s.textContent,spans.r.textContent,spans.o.textContent); },2800);
      later(function(){ sent.style.opacity=0; slots.forEach(function(s){s.textContent='';s.classList.remove('full');}); },5000);
      later(one,5600);
    }
    watch(slide,function(on){ reset(); if(on) later(one,400); });
  })();

  // ================= 12 · pipeline: stages light up with the builds =================
  (function(){
    var svg=$('#pipe'); if(!svg) return;
    var cards=$$('.s-pipe .cards .tile');
    var st=[['13','chunks'],['308','triples'],['192','entities'],['↔','new links'],['260','links']];
    el('path',{class:'pipe',d:'M40 75 H809'},svg);
    var stages=st.map(function(s,i){
      var x=85+i*170, g=el('g',{class:'st'},svg);
      el('rect',{x:x-62,y:28,width:124,height:94,rx:16},g);
      var a=el('text',{class:'n',x:x,y:72},g); a.textContent=s[0];
      var b=el('text',{x:x,y:100},g); b.textContent=s[1];
      return g;
    });
    if(!reduce) for(var i=0;i<4;i++){
      var c=el('circle',{class:'pulse',cx:20,cy:75,r:5,opacity:.9},svg);
      el('animate',{attributeName:'cx',from:20,to:829,dur:'4s',begin:(i*1)+'s',repeatCount:'indefinite'},c);
      svg.insertBefore(c,stages[0]);
    }
    function sync(){ cards.forEach(function(c,i){ stages[i].classList.toggle('lit',c.classList.contains('shown')); }); }
    cards.forEach(function(c){ new MutationObserver(sync).observe(c,{attributes:true,attributeFilter:['class']}); });
  })();

  // ================= 16 · shape: a honeycomb-worm colony adding tubes one by one =================
  (function(){
    var cv=$('#colony'); if(!cv) return;
    var slide=cv.closest('.slide'), ctx=cv.getContext('2d'); ctx.scale(2,2);
    var W=400,H=200, seed=7; function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
    var T=[], order=[], shown=0, raf=0, t0=null;
    function build(){
      T=[]; var S=19;
      for(var r=0;r*S*.87<H+S;r++) for(var c=0;c*S<W+S;c++){
        var x=c*S+(r%2?S/2:0)+(rnd()-.5)*5, y=r*S*.87+(rnd()-.5)*5;
        T.push({x:x,y:y,R:8+rnd()*2.4,h:3.2+rnd()*1.6,g:[]});
      }
      var seeds=[[60+rnd()*80,40+rnd()*120],[220+rnd()*120,40+rnd()*120]];
      T.forEach(function(p){ p.d=Math.min.apply(null,seeds.map(function(s){return Math.hypot(p.x-s[0],p.y-s[1]);}))+rnd()*40;
        for(var k=0;k<14;k++){ var a=rnd()*6.283, rr=p.h+1+rnd()*(p.R-p.h-1); p.g.push([Math.cos(a)*rr,Math.sin(a)*rr,.8+rnd()*1.1]); } });
      order=T.slice().sort(function(a,b){return a.d-b.d;}); shown=0;
    }
    function draw(n,grow){
      ctx.fillStyle='#EFE6D3'; ctx.fillRect(0,0,W,H);
      for(var i=0;i<n&&i<order.length;i++){ var p=order[i], k=i===n-1?grow:1;
        ctx.fillStyle='#C9B48F'; ctx.beginPath(); ctx.arc(p.x,p.y,p.R*k,0,6.283); ctx.fill();
        ctx.strokeStyle='#A8926C'; ctx.lineWidth=1; ctx.stroke();
        p.g.forEach(function(g){ ctx.fillStyle='rgba(92,74,54,.45)'; ctx.beginPath(); ctx.arc(p.x+g[0]*k,p.y+g[1]*k,g[2],0,6.283); ctx.fill(); });
        ctx.fillStyle='#3E3226'; ctx.beginPath(); ctx.arc(p.x,p.y,p.h*k,0,6.283); ctx.fill(); }
    }
    function frame(t){
      if(t0===null) t0=t;
      var e=(t-t0)/1000, rate=26, n=Math.floor(e*rate)+1;
      if(n>order.length+40){ build(); t0=t; n=1; }
      draw(Math.min(n,order.length),Math.min(1,(e*rate)%1+.2));
      raf=requestAnimationFrame(frame);
    }
    build();
    if(reduce){ draw(order.length,1); return; }
    draw(order.length,1);
    watch(slide,function(on){ cancelAnimationFrame(raf); t0=null; if(on){ build(); raf=requestAnimationFrame(frame); } });
  })();

  // ================= 18 · dynamic: the toaster's control flow (a token) and data flow (packets) =================
  (function(){
    var svg=$('#ctl'); if(!svg) return;
    var slide=svg.closest('.slide');
    arrowDefs(svg,'cf-arrow','#9FB8B5');
    var LX={you:105,toaster:310};
    el('line',{x1:207,y1:14,x2:207,y2:406,stroke:'#E3D9C6','stroke-width':2,'stroke-dasharray':'5 5'},svg);
    [['you','You'],['toaster','Toaster']].forEach(function(l){ var t=el('text',{x:LX[l[0]],y:26,'text-anchor':'middle',style:'font:700 12px var(--sans);letter-spacing:.06em;fill:#5B636B'},svg); t.textContent=l[1].toUpperCase(); });
    // [id, lane, y, label, type]
    var N=[['start','you',50,'','start'],['load','you',90,'Drop in bread'],['push','you',138,'Push the lever'],['latch','toaster',138,'Latch, power on'],
      ['heat','toaster',190,'Heat the bread'],['bent','toaster',248,'Strip bent enough?','decision'],['watch','you',190,'Watch the toast','side'],
      ['trip','toaster',306,'Release latch'],['pop','toaster',352,'Pop up toast'],['take','you',352,'Take the toast'],['end','you',396,'','end']];
    var gE=el('g',{},svg), gN=el('g',{},svg), B={};
    N.forEach(function(n){
      var x=LX[n[1]], y=n[2], g=el('g',{transform:'translate('+x+' '+y+')'},gN), shp;
      if(n[4]==='start'||n[4]==='end'){ shp=el('circle',{r:9,fill:n[4]==='start'?'#20252B':'#fff',stroke:'#20252B','stroke-width':3},g); B[n[0]]={x:x,y:y,w:20,h:20,s:shp}; return; }
      if(n[4]==='decision'){ shp=el('path',{d:'M0 -24 L82 0 L0 24 L-82 0 Z',fill:'#fff',stroke:'#C9852F','stroke-width':2},g); }
      else shp=el('rect',{x:-72,y:-15,width:144,height:30,rx:8,fill:'#fff',stroke:n[4]==='side'?'#C9BFAE':'#1D6E73','stroke-width':1.8,'stroke-dasharray':n[4]==='side'?'4 3':''},g);
      var t=el('text',{y:4,'text-anchor':'middle',style:'font:600 12px var(--sans);fill:'+(n[4]==='side'?'#8C949B':'#20252B')},g); t.textContent=n[3];
      B[n[0]]={x:x,y:y,w:n[4]==='decision'?164:144,h:n[4]==='decision'?48:30,s:shp};
    });
    function line(a,b,lab,opt){ opt=opt||{}; var A=B[a],Q=B[b], d;
      if(opt.d) d=opt.d; else { var p=clip(A,Q,A.w/2,A.h/2), q=clip(Q,A,Q.w/2+3,Q.h/2+3); d='M'+p.x+' '+p.y+' L'+q.x+' '+q.y; }
      el('path',{d:d,fill:'none',stroke:opt.dash?'#C9BFAE':'#9FB8B5','stroke-width':1.8,'stroke-dasharray':opt.dash?'4 3':'','marker-end':'url(#cf-arrow)'},gE);
      if(lab){ var t=el('text',{x:opt.lx,y:opt.ly,'text-anchor':'middle',style:'font:italic 600 11px var(--sans);fill:#C9852F'},gE); t.textContent=lab; } }
    line('start','load'); line('load','push'); line('push','latch'); line('latch','heat'); line('heat','bent');
    line('bent','heat','not yet',{d:'M392 248 C404 248 404 190 384 190',lx:388,ly:224});
    line('bent','trip','yes',{lx:322,ly:282}); line('trip','pop'); line('pop','take'); line('take','end');
    line('latch','watch','meanwhile',{dash:1,lx:207,ly:158});
    var tok=el('circle',{r:8,fill:'#C9852F',stroke:'#fff','stroke-width':2.5},svg);
    var SEQ=['start','load','push','latch','heat','bent','heat','bent','heat','bent','trip','pop','take','end'];
    var t0=null, STEP=750;
    function lit(id){ Object.keys(B).forEach(function(k){ var s=B[k].s; if(s.tagName==='circle') return; s.setAttribute('fill',k===id?'#DCEBE8':'#fff'); }); }
    function frame(t){
      if(t0===null) t0=t;
      var e=(t-t0)/STEP, i=Math.floor(e);
      if(i>=SEQ.length+1){ t0=t; i=0; e=0; }
      var a=B[SEQ[Math.min(i,SEQ.length-1)]], b=B[SEQ[Math.min(i+1,SEQ.length-1)]], u=ease(Math.min(1,(e-i)*1.6));
      tok.setAttribute('cx',a.x+(b.x-a.x)*u); tok.setAttribute('cy',a.y+(b.y-a.y)*u);
      lit(SEQ[Math.min(i+(u>.95?1:0),SEQ.length-1)]);
    }
    tok.setAttribute('cx',B.start.x); tok.setAttribute('cy',B.start.y);

    // data flow
    var df=$('#dfl'), COL={matter:'#8A6236',energy:'#C9852F',signal:'#1D6E73'};
    ['matter','energy','signal'].forEach(function(k){ arrowDefs(df,'df-'+k,COL[k]); });
    var D={};
    // rows: sensing on top, the bread in the middle, input and output at the bottom
    [['slice','Slice',62,330],['load','Load',168,330],['heat','Heat',262,110],['toast','Toast',262,226],['sense','Sense',366,110],['release','Release',366,226],['pop','Pop',366,330]].forEach(function(n){
      var x=n[2], y=n[3], g=el('g',{transform:'translate('+x+' '+y+')'},df);
      el('rect',{x:-36,y:-17,width:72,height:34,rx:17,fill:'#fff',stroke:'#20252B','stroke-width':1.8},g);
      var t=el('text',{y:5,'text-anchor':'middle',style:'font:700 13px var(--sans);fill:#20252B'},g); t.textContent=n[1];
      D[n[0]]={x:x,y:y,w:72,h:34};
    });
    var gF=el('g',{},df); df.insertBefore(gF,df.firstChild.nextSibling);
    // [from, to, label, kind, path override, label x, label y]
    var F=[[null,'slice','loaf','matter','M8 330 L22 330',14,316],['slice','load','slices','matter',null,115,320],
      ['load','toast','slices held','matter','M196 316 C214 290 228 262 240 244',188,282],
      ['load','heat','contacts closed','signal','M168 313 C168 200 190 120 224 112',148,214],[null,'heat','mains power','energy','M262 34 L262 90',262,28],
      ['heat','toast','radiant heat','energy','M262 128 L262 206',226,170],['heat','sense','warmth','energy','M300 110 L326 110',313,98],
      [null,'sense','shade setting','signal','M366 34 L366 90',366,28],['sense','release','trip','signal','M366 128 L366 206',382,170],
      ['release','heat','contacts open','signal','M340 212 C320 190 300 160 282 130',318,160],['release','pop','spring push','energy','M366 244 L366 310',330,280],
      ['toast','pop','toast','matter','M282 240 C300 280 316 310 330 322',286,292],['pop',null,'hot toast','matter','M366 348 L366 384',366,402]];
    var paths=[];
    F.forEach(function(f){
      var d=f[4];
      if(!d){ var A=D[f[0]],Q=D[f[1]], p=clip(A,Q,A.w/2,A.h/2), q=clip(Q,A,Q.w/2+3,Q.h/2+3); d='M'+p.x+' '+p.y+' L'+q.x+' '+q.y; }
      var pa=el('path',{d:d,fill:'none',stroke:COL[f[3]],'stroke-width':2,opacity:.55,'marker-end':'url(#df-'+f[3]+')'},gF); paths.push([pa,f[3]]);
      var t=el('text',{x:f[5],y:f[6],'text-anchor':'middle',style:'font:italic 600 10.5px var(--sans);fill:'+COL[f[3]]+';paint-order:stroke;stroke:#fff;stroke-width:3px'},gF); t.textContent=f[2];
    });
    var lg=el('g',{transform:'translate(18 402)'},df);
    [['matter','matter'],['energy','energy'],['signal','signal']].forEach(function(k,i){ var g=el('g',{transform:'translate('+(i*74)+' 0)'},lg); el('circle',{r:5,fill:COL[k[0]]},g); var t=el('text',{x:10,y:4,style:'font:600 11px var(--sans);fill:#5B636B'},g); t.textContent=k[1]; });
    var dots=paths.map(function(p){ return [0,1].map(function(j){ return el('circle',{r:4,fill:COL[p[1]]},df); }); });
    function flow(t){ paths.forEach(function(p,i){ var L=p[0].getTotalLength(); dots[i].forEach(function(c,j){ var u=((t/1800)+j*.5+i*.13)%1, q=p[0].getPointAtLength(u*L); c.setAttribute('cx',q.x); c.setAttribute('cy',q.y); }); }); }
    flow(0);
    var raf=0;
    function loop(t){ frame(t); flow(t); raf=requestAnimationFrame(loop); }
    if(!reduce) watch(slide,function(on){ cancelAnimationFrame(raf); t0=null; if(on) raf=requestAnimationFrame(loop); });
  })();

  // ================= live apps: load when first shown, pass the clicker through =================
  $$('#stage iframe[data-src]').forEach(function(f){
    var slide=f.closest('.slide'), wait=f.parentNode.querySelector('.wait');
    f.addEventListener('load',function(){
      if(wait) wait.remove();
      // PageUp/PageDown (presentation clickers) still move the deck when the app has focus
      try{ f.contentWindow.addEventListener('keydown',function(e){
        var tag=(e.target.tagName||'').toLowerCase();
        if((e.key==='PageDown'||e.key==='PageUp')&&tag!=='textarea'&&tag!=='input'){
          e.preventDefault(); document.dispatchEvent(new KeyboardEvent('keydown',{key:e.key}));
        }
      }); }catch(err){}
    });
    watch(slide,function(on){ if(on&&!f.getAttribute('src')) f.setAttribute('src',f.getAttribute('data-src')); });
  });

  // ================= 10 · send a passage to the knowledge graph app =================
  (function(){
    var f=$('.s-maker iframe'); if(!f) return;
    var T={
      bourton:'Bourton-on-the-Water is a village in the Cotswolds, in Gloucestershire, England. The River Windrush runs through its centre under a series of low stone bridges. Behind the Old New Inn stands a model village: a copy of Bourton itself, built of Cotswold stone at one-ninth scale. It was conceived in 1936 by C. A. Morris, the landlord of the inn, built by local craftsmen, and opened on Coronation Day 1937. Inside the model village is a model of the model village, and inside that, a smaller model still.',
      bees:'Honeybees live in colonies of thousands, each with a single queen who lays the eggs. Worker bees are female; they build wax comb, care for the young, and fly out to collect nectar and pollen from flowers. In the hive they turn nectar into honey and store it in the comb for winter. Drones are male bees whose role is to mate with a queen. As workers forage from flower to flower, they carry pollen with them and pollinate many of the crops people eat.',
      sandbox:'A child kneels in a sandbox with a bucket, a shovel and a cup of water. She pushes the sand into a long ridge and calls it a mountain, then digs a channel down its side and pours in the water to make a river. Where the river ends she presses out a flat lake and builds a castle beside it with the bucket. A stick becomes a bridge across the river. When the water soaks away she digs the channel deeper and tries again.'
    };
    $$('#feed button').forEach(function(b){ b.addEventListener('click',function(){
      $$('#feed button').forEach(function(x){x.classList.toggle('on',x===b);});
      var target=location.origin==='null'?'*':location.origin;
      if(f.contentWindow) f.contentWindow.postMessage({text:T[b.getAttribute('data-p')],detail:3},target);
    });});
  })();
})();
