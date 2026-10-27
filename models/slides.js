// Models of Amelia Island — title animation, music and per-slide interactions.
// Island geometry, sea level and tree points come from data.js (src/build_data.py).
(function(){
  var NS='http://www.w3.org/2000/svg';
  var A=window.AMELIA||{island:{},sea:[],trees:{pts:[],species:[],counts:[]}};
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var presenter=/[?&]presenter\b/.test(location.search);
  function $(sel,root){return (root||document).querySelector(sel);}
  function $$(sel,root){return [].slice.call((root||document).querySelectorAll(sel));}
  function el(tag,attrs,parent){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
  function slideOf(sel){return $('#stage '+sel);}
  function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
  function lerp(a,b,u){return a+(b-a)*u;}
  function ease(u){return u*u*(3-2*u);}
  // call on(true/false) whenever the slide is shown or hidden
  function watch(slide,on){
    if(!slide) return; var was=null;
    function check(){var now=slide.classList.contains('on'); if(now!==was){was=now;on(now);}}
    new MutationObserver(check).observe(slide,{attributes:true,attributeFilter:['class']}); check();
  }
  // run frame(t,dt) only while the slide is on screen
  function loop(slide,frame){
    var raf=0,last=null,t=0;
    function f(ts){var dt=last===null?0:Math.min(.05,(ts-last)/1000);last=ts;t+=dt;frame(t,dt);raf=requestAnimationFrame(f);}
    watch(slide,function(on){ if(on&&!raf&&!reduce){last=null;raf=requestAnimationFrame(f);} if(!on&&raf){cancelAnimationFrame(raf);raf=0;} });
    frame(0,0);
  }
  // a single-choice button group
  function group(root,attr,cb){
    var bs=$$('button['+attr+']',root);
    bs.forEach(function(b){b.addEventListener('click',function(){
      bs.forEach(function(x){x.classList.toggle('on',x===b);}); cb(b.getAttribute(attr),b);
    });});
  }
  // seeded random numbers (Park–Miller), so every drawing is repeatable
  function prng(seed){var s=seed%2147483647||1;return function(){s=(s*16807)%2147483647;return (s-1)/2147483646;};}
  ['#nm-map','#scale','#web','.s-weld .xs','.s-orig .grid'].forEach(function(s){var e=$(s);if(e)e.setAttribute('data-noadvance','');});

  // ---------- island geometry (metres east / south of 81.52°W, 30.72°N) ----------
  function ringsD(id){
    var f=A.island[id]; if(!f) return '';
    return f.rings.map(function(r){return 'M'+r.map(function(p){return p[0]+' '+p[1];}).join('L')+(f.kind==='jetty'?'':'Z');}).join('');
  }
  function lonlat(lon,lat){return [(lon+81.52)*95795,(30.72-lat)*110540];}
  var MODERN=['holocene-modern','pleistocene-core','egans-creek'];
  var FILL={'holocene-modern':'#E6CE98','pleistocene-core':'#9C7A4E','egans-creek':'#6A8F4D'};
  // eastern shore x for any y, from the modern outline
  var EAST=(function(){
    var band={}; MODERN.slice(0,2).forEach(function(id){ var f=A.island[id]; if(!f) return;
      f.rings.forEach(function(r){ for(var i=0;i<r.length;i++){ var b=Math.round(r[i][1]/250); band[b]=Math.max(band[b]||-1e9,r[i][0]); }}); });
    return function(y){ var b=Math.round(y/250); for(var d=0;d<8;d++){ if(band[b+d]!=null) return band[b+d]; if(band[b-d]!=null) return band[b-d]; } return 9000; };
  })();
  function islandSVG(svg,ids,cls){
    var g=el('g',{'class':cls||''},svg);
    (ids||MODERN).forEach(function(id){ el('path',{d:ringsD(id),fill:FILL[id]||'#ccc',stroke:'rgba(60,45,25,.35)','stroke-width':40,'stroke-linejoin':'round'},g); });
    return g;
  }
  // where each model lives on the island
  var PLACES=[
    {n:'Geomorphology',p:lonlat(-81.457,30.625)},
    {n:'Drumstick',p:lonlat(-81.445,30.700)},
    {n:'Dunes',p:null,y:lonlat(0,30.600)[1],dx:-150},
    {n:'Egans Creek',p:lonlat(-81.446,30.655)},
    {n:'Tree Atlas',p:lonlat(-81.452,30.672)},
    {n:'Live Oak',p:lonlat(-81.452,30.585)},
    {n:'Wormstone',p:null,y:lonlat(0,30.545)[1],dx:-120},
    {n:'Water',p:lonlat(-81.444,30.560)},
    {n:'Victorian',p:lonlat(-81.463,30.670)}
  ];
  PLACES.forEach(function(P){ if(!P.p) P.p=[EAST(P.y)+P.dx,P.y]; });

  // ================= 1 · title: the island, waves from the northeast, sand drifting south =================
  (function(){
    var cv=$('#isle'); if(!cv) return;
    var slide=cv.closest('.slide'), ctx=cv.getContext('2d'); ctx.scale(2,2);
    var S=640/27800, OX=548, OY=40;
    function X(x){return OX+(x-3000)*S;} function Y(y){return OY+(y+2200)*S;}
    var paths={}; ['holocene-modern','pleistocene-core','egans-creek','ridge-5ka','ridge-4ka','ridge-3ka','ridge-2ka','ridge-1ka'].forEach(function(id){
      var f=A.island[id]; if(!f) return; var p=new Path2D();
      f.rings.forEach(function(r){ r.forEach(function(q,i){ if(i)p.lineTo(X(q[0]),Y(q[1])); else p.moveTo(X(q[0]),Y(q[1])); }); p.closePath(); });
      paths[id]=p; });
    // the sea: everything east of the shore
    var sea=new Path2D(); sea.moveTo(960,0); for(var y=-2200;y<=25600;y+=250) sea.lineTo(X(EAST(y))+1,Y(y)); sea.lineTo(960,720); sea.closePath();
    var rnd=prng(11), grains=[], dust=[];
    for(var i=0;i<130;i++) grains.push({y:-2200+rnd()*27800,o:2+rnd()*9,v:300+rnd()*500,r:.6+rnd()*1.1,ph:rnd()*6.28});
    for(i=0;i<60;i++) dust.push({x:rnd()*960,y:rnd()*720,r:.5+rnd()*1.2,v:3+rnd()*8,ph:rnd()*6.28});
    // labels on the right, in north-to-south order of the place they point at
    var order=PLACES.map(function(P,k){return k;}).sort(function(a,b){return PLACES[a].p[1]-PLACES[b].p[1];});
    var labels=order.map(function(k,j){ return {k:k,n:PLACES[k].n,x:X(PLACES[k].p[0]),y:Y(PLACES[k].p[1]),lx:808,ly:92+j*64,a:0,ph:rnd()*6.28}; });
    var pulses=[], spawn=0;
    function draw(t,dt){
      ctx.clearRect(0,0,960,720);
      dust.forEach(function(p){ var y=(p.y-t*p.v)%720; if(y<0)y+=720;
        ctx.fillStyle='rgba(127,196,192,'+(.08+.07*Math.sin(t+p.ph)).toFixed(3)+')'; ctx.beginPath(); ctx.arc(p.x+Math.sin(t*.3+p.ph)*8,y,p.r,0,6.283); ctx.fill(); });
      // waves: crests travelling toward the southwest, clipped to the sea
      ctx.save(); ctx.clip(sea);
      var dx=-.7071, dy=.7071, sp=26, gap=34;
      ctx.lineWidth=1.3;
      for(var k=-40;k<40;k++){
        var d=k*gap+(t*sp)%gap;          // distance along the travel direction
        var cx=760-dx*0+dx*d, cy=300+dy*d;
        var fade=Math.max(0,1-Math.abs(k)/40);
        ctx.strokeStyle='rgba(127,196,192,'+(.10+.16*fade).toFixed(3)+')';
        ctx.beginPath(); ctx.moveTo(cx-dy*900,cy+dx*900); ctx.lineTo(cx+dy*900,cy-dx*900); ctx.stroke();
      }
      ctx.restore();
      // the island
      [['holocene-modern','#E6CE98'],['pleistocene-core','#9C7A4E']].forEach(function(q){ if(!paths[q[0]])return; ctx.fillStyle=q[1]; ctx.fill(paths[q[0]]); });
      if(paths['egans-creek']){ ctx.fillStyle='rgba(106,143,77,'+(.78+.18*Math.sin(t*.9)).toFixed(3)+')'; ctx.fill(paths['egans-creek']); }
      ['ridge-5ka','ridge-4ka','ridge-3ka','ridge-2ka','ridge-1ka'].forEach(function(id,j){ if(!paths[id])return;
        ctx.fillStyle='rgba(201,166,107,'+(.55+.4*Math.max(0,Math.sin(t*1.2-j*.7))).toFixed(3)+')'; ctx.fill(paths[id]); });
      // longshore drift: sand grains running south along the beach
      grains.forEach(function(g){ var y=-2200+((g.y+t*g.v+2200)%27800); var x=X(EAST(y))+g.o+Math.sin(t*2+g.ph)*1.2;
        ctx.fillStyle='rgba(244,194,122,'+(.45+.4*Math.sin(t*1.5+g.ph)).toFixed(3)+')'; ctx.beginPath(); ctx.arc(x,Y(y),g.r,0,6.283); ctx.fill(); });
      // leaders and labels, with a pulse running from label to place
      spawn-=dt; if(spawn<=0){spawn=.5+rnd()*.5; pulses.push({l:labels[Math.floor(rnd()*labels.length)],u:0});}
      for(var q=pulses.length-1;q>=0;q--){ var p=pulses[q]; p.u+=dt*.9; if(p.u>=1){p.l.a=1;pulses.splice(q,1);} }
      labels.forEach(function(L){
        L.a=Math.max(0,L.a-dt*.7);
        var mx=(L.x+L.lx)/2+20;
        ctx.strokeStyle='rgba(127,196,192,'+(.25+.5*L.a).toFixed(3)+')'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(L.lx-8,L.ly); ctx.quadraticCurveTo(mx,L.ly,L.x,L.y); ctx.stroke();
        if(L.a>.02){ var gr=ctx.createRadialGradient(L.x,L.y,0,L.x,L.y,16); gr.addColorStop(0,'rgba(240,170,80,'+(.7*L.a).toFixed(3)+')'); gr.addColorStop(1,'rgba(240,170,80,0)');
          ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(L.x,L.y,16,0,6.283); ctx.fill(); }
        ctx.fillStyle=L.a>.3?'#C9852F':'#1F2E36'; ctx.strokeStyle='#F4C27A'; ctx.lineWidth=1.4;
        ctx.beginPath(); ctx.arc(L.x,L.y,3.6,0,6.283); ctx.fill(); ctx.stroke();
        ctx.font='600 13.5px "Noto Sans", Arial'; ctx.textBaseline='middle';
        ctx.fillStyle='rgba(247,243,234,'+(.6+.4*L.a).toFixed(3)+')'; ctx.fillText(L.n,L.lx,L.ly);
        ctx.fillStyle='rgba(201,133,47,.9)'; ctx.font='700 10px "Noto Sans", Arial'; ctx.fillText(String(L.k+1),L.lx-22,L.ly);
      });
      pulses.forEach(function(p){ var L=p.l, u=ease(p.u), mx=(L.x+L.lx)/2+20;
        var x=(1-u)*(1-u)*(L.lx-8)+2*(1-u)*u*mx+u*u*L.x, y=(1-u)*(1-u)*L.ly+2*(1-u)*u*L.ly+u*u*L.y;
        ctx.fillStyle='#F4C27A'; ctx.beginPath(); ctx.arc(x,y,2.4,0,6.283); ctx.fill(); });
      // compass
      ctx.fillStyle='rgba(185,194,200,.7)'; ctx.font='700 10px "Noto Sans", Arial'; ctx.fillText('N',X(15400),24);
      ctx.strokeStyle='rgba(185,194,200,.6)'; ctx.beginPath(); ctx.moveTo(X(15400)+3,30); ctx.lineTo(X(15400)+3,52); ctx.stroke();
      ctx.fillText('ATLANTIC',880,690); ctx.fillText('waves from the NE',846,672);
    }
    loop(slide,draw);
  })();

  // ================= music: plays on the title slide, fades out on slide 2 =================
  (function(){
    var slide=slideOf('.s-title'), btn=$('#music-btn'); if(!slide||!btn) return;
    var state=$('.state',btn);
    if(presenter){ state.textContent='plays in the audience window'; return; }
    var audio=new Audio('audio/luminous_tide_arrival_loop.m4a'); audio.loop=true; audio.preload='auto'; audio.volume=0;
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

  // ================= 2 · nine models: tiles, pins and a detail box =================
  (function(){
    var slide=slideOf('.s-nine'), svg=$('#nm-map'); if(!slide||!svg) return;
    var D=[
      ['How did Amelia become a “double island”? What happened over 125,000 years?','Hand-built geologic snapshots on a Leaflet map, a log time slider, the Hawkes sea-level curve and a cross-section.','Claude Code · Leaflet · OSM + NOAA chart data · Selenium · LaTeX'],
      ['Can waves, sand and rising sea grow an island like Amelia from first principles?','Ashton–Murray one-line shoreline with CERC transport, overwash and Bruun retreat, from 8000 BCE onward.','Claude Code · HTML canvas · validated against Ashton–Murray 2006'],
      ['How does wind sort sand into ripples and dunes?','Werner slab cellular automaton (from Jim Elder’s C#), plus AeoLiS and ACM continuum versions on WebGPU.','HTML + WebGPU · ports of C#, Python AeoLiS and an ACM paper'],
      ['What happens in the marsh between the two islands, tide by tide?','A six-chapter field atlas: USGS channel map, live NOAA tides, formation stages, cordgrass, 32 animals.','Codex & Claude Code · Vite · Leaflet · Playwright'],
      ['Where are the island’s trees, and which ones?','Seven public inventories merged on one map with filters, galleries and per-view statistics.','Codex & Claude Code · Leaflet + MarkerCluster · ArcGIS REST'],
      ['How does salt wind shape a coastal live oak over centuries?','A grown skeleton with a shear surface, wind training, root buttressing, moss and light seeking.','Claude Code · Three.js · Blender 5.1 · Unreal Engine 5.8'],
      ['Can code reproduce a beach stone riddled with borings?','A seeded Fourier profile and 2,400 bores carved from a field by marching cubes, in a worker.','OpenAI Codex · Three.js · marching cubes'],
      ['Why do pool floors show bright webs and black discs?','A heightfield plus a stable-fluids flow; ~1M photons per frame refracted onto the floor.','WebGL2 · after Evan Wallace’s WebGL Water · Selenium GPU readback'],
      ['What makes a Fernandina Victorian, and can we breed new ones?','Procedural 3D houses from a genome, with breeding, crossover and gene locks, odds from 53 photos.','Three.js · CC0 PBR textures · vision analysis via OpenRouter']
    ];
    el('rect',{x:2400,y:-2600,width:13800,height:28400,fill:'#C9DCE2'},svg);
    islandSVG(svg);
    var pins=PLACES.map(function(P,k){ var g=el('g',{'class':'pin'},svg);
      el('circle',{'class':'ring',cx:P.p[0],cy:P.p[1],r:330},g);
      el('circle',{cx:P.p[0],cy:P.p[1],r:330},g);
      var t=el('text',{x:P.p[0],y:P.p[1]+20},g); t.textContent=k+1; return g; });
    var tiles=$$('.s-nine .mt'), cur=0, timer=0;
    function show(k){ cur=k;
      tiles.forEach(function(t,j){t.classList.toggle('on',j===k);}); pins.forEach(function(p,j){p.classList.toggle('on',j===k); if(j===k) svg.appendChild(p);});
      $('#nm-q').textContent=D[k][0]; $('#nm-m').textContent=D[k][1]; $('#nm-b').textContent=D[k][2]; }
    function auto(){ clearInterval(timer); timer=setInterval(function(){show((cur+1)%9);},4200); }
    tiles.forEach(function(t,j){ t.addEventListener('click',function(){show(j);clearInterval(timer);}); });
    watch(slide,function(on){ if(on){show(0);auto();} else clearInterval(timer); });
    show(0);
  })();

  // ================= 3 · scale: space × time =================
  (function(){
    var svg=$('#scale'); if(!svg) return;
    function X(lm){return 80+(lm+1.5)/6.8*740;} function Y(ly){return 18+(5.5-ly)/12*392;}
    var SY=424, SH=36;   // the "a moment" row
    var g0=el('g',{},svg);
    [[-1,'10 cm'],[0,'1 m'],[1,'10 m'],[2,'100 m'],[3,'1 km'],[4,'10 km'],[5,'100 km']].forEach(function(t){
      el('line',{'class':'gl',x1:X(t[0]),x2:X(t[0]),y1:12,y2:SY+SH},g0);
      el('text',{'class':'ax',x:X(t[0]),y:SY+SH+16,'text-anchor':'middle'},g0).textContent=t[1]; });
    [[-5.72,'1 minute'],[-2.56,'1 day'],[0,'1 year'],[2,'100 years'],[4,'10,000 years'],[5.1,'125,000 years']].forEach(function(t){
      el('line',{'class':'gl',x1:76,x2:826,y1:Y(t[0]),y2:Y(t[0])},g0);
      el('text',{'class':'ax',x:72,y:Y(t[0])+4,'text-anchor':'end'},g0).textContent=t[1]; });
    el('rect',{x:76,y:SY,width:750,height:SH,fill:'rgba(201,191,174,.25)'},g0);
    el('text',{'class':'ax',x:72,y:SY+23,'text-anchor':'end'},g0).textContent='a moment';
    el('text',{'class':'axt',x:450,y:500,'text-anchor':'middle'},g0).textContent='SIZE OF THE THING MODELLED →';
    var ya=el('text',{'class':'axt',x:12,y:240,'text-anchor':'middle',transform:'rotate(-90 12 240)'},g0); ya.textContent='TIME THE MODEL COVERS →';
    // [name, x0, x1, y0, y1 (null = a moment), label dx, label dy, note]
    var M=[['Wormstone',-1.1,-.5,null,null,'15 cm stone'],['Water',0,.7,-6.5,-4.7,'a pool · seconds'],['Victorian',1,1.4,null,null,'one house'],
      ['Live Oak',1.3,1.8,1.3,2.7,'55 m crown · 500 yr'],['Dunes',2,3.3,-1,2,'a dune field'],['Egans Creek',3,3.8,-2.86,4,'12.4 h tide → formation'],
      ['Tree Atlas',3.4,4.1,null,null,'a 2023 inventory'],['Drumstick',3.9,4.6,2,4.05,'40 km · 10,000 yr'],['Geomorphology',4.1,5.15,2.16,5.1,'130 km · 125,000 yr']];
    M.forEach(function(m,k){
      var g=el('g',{'class':'m pop','data-b':k+1,'data-lens':'sc'+k},svg);
      var x0=X(m[1]),x1=X(m[2]), y0=m[3]==null?SY+5:Y(m[4]), y1=m[3]==null?SY+SH-5:Y(m[3]);
      el('rect',{x:x0,y:y0,width:x1-x0,height:y1-y0},g);
      var tx=m[3]==null?x0+4:x0+7, ty=m[3]==null?y0-6:y0+17;
      if(m[0]==='Drumstick'){ty=y1+15;} if(m[0]==='Egans Creek'){ty=y1-22;}
      var t=el('text',{x:tx,y:ty},g); t.textContent=m[0];
      var s=el('text',{'class':'k',x:tx,y:ty+14},g); s.textContent=m[5];
      if(m[3]==null){ t.setAttribute('y',y0-20); s.setAttribute('y',y0-7); }
    });
  })();

  // ================= 4 · geomorphology: deep time on one slider =================
  var SEA=A.sea.slice().sort(function(a,b){return a[0]-b[0];});   // [yearsBP, metres]
  function seaAt(yr){ for(var i=1;i<SEA.length;i++){ if(yr<=SEA[i][0]){ var a=SEA[i-1],b=SEA[i]; return lerp(a[1],b[1],(yr-a[0])/(b[0]-a[0])); } } return SEA[SEA.length-1][1]; }
  (function(){
    var slide=slideOf('.s-geo'), svg=$('#geo-map'); if(!slide||!svg) return;
    var ERAS=[
      [125,110,'Eemian highstand (MIS 5e)','Sea level stands ~6 m above today. The Pleistocene Amelia barrier island forms on the Silver Bluff terrace. Behind it: a lagoon and salt marsh, the same system that built neighboring Cumberland Island.','Hawkes 2016; Toscano 2003'],
      [110,25,'Wisconsinan lowstand','Sea level falls toward –120 m as ice sheets grow. The Pleistocene Amelia is exposed and slowly weathers: soils deepen, slopes round, oak hammocks colonize. For 100,000 years it is a hill on the dry shelf.','Lambeck 2014'],
      [25,15,'Last Glacial Maximum','Sea level reaches its lowest, ~–120 m, around 20 ka. The Atlantic shore is ~130 km east, on the outer continental shelf. The Pleistocene Amelia is an inland hill, far from any sea.','Lambeck 2014; Clark 2009'],
      [15,13,'Meltwater Pulse 1A','Deglaciation accelerates. Sea level rises ~18 m in 500 years. Any sandbars that form are drowned and re-formed farther landward: the system is transgressive.','Lin et al. 2021'],
      [13,9,'Late transgression','Sea-level rise slows somewhat. Short-lived bars keep migrating landward across the shelf. No lasting island yet.','Engelhart 2012; Toscano 2003'],
      [9,7,'Sandbar offshore','By 8 ka sea level is at –5.7 m and a lasting Holocene sandbar sits ~4 mi east of the core. Behind it a protected lagoon traps biogenic mud: the future Egans Creek marsh begins.','Hawkes 2016'],
      [7,5.2,'Sandbar approaches','The bar has migrated to about a mile offshore. Sea-level rise nears the ~2 mm/yr threshold below which barriers stabilize. The marsh is well established between the two.','Mariotti 2021'],
      [5.2,4.5,'Welding event','Around 5 ka the Holocene sandbar welds onto the Pleistocene core, first at the south end, then northward. Egans Creek is trapped between the two. Amelia becomes today’s double island.','Hoyt & Hails 1967; Mariotti 2021'],
      [4.5,.5,'Progradation','With slow rise and plenty of longshore sand from the St. Marys River, the Atlantic face builds seaward. Old shorelines survive as beach ridges, ~80–150 years apart, clearest at Fort Clinch.','Rink & Forrest 2005; Forrest 2008'],
      [.5,.145,'Late prehistoric → pre-jetty','From ~500 years ago (Timucua occupation) to the eve of the jetties in 1881. Modern Amelia is essentially complete, at its natural pre-industrial shape.','USACE archival; Rink 2005'],
      [.145,0,'Post-jetty (1881) → present','The St. Marys Entrance jetties intercept longshore drift. Fort Clinch gains a fillet of new dunes in 145 years; the central beaches are now renourished by the Nassau County Shore Protection Project.','USACE · Nassau County SPP']
    ];
    var bg=el('rect',{x:2400,y:-2600,width:13800,height:28400,fill:'#A9C9D6'},svg);
    var L={}, order=['holocene-modern','holocene-500yr','holocene-1ka','holocene-2ka','holocene-3ka','holocene-4ka','holocene-5ka','pleistocene-core','egans-creek','ridge-5ka','ridge-4ka','ridge-3ka','ridge-2ka','ridge-1ka','south-jetty','north-jetty'];
    order.forEach(function(id){ var f=A.island[id]; if(!f) return;
      var c=f.kind==='pleistocene'?'#9C7A4E':f.kind==='marsh'?'#6A8F4D':f.kind==='beach-ridge'?'#C9A66B':f.kind==='jetty'?'none':'#E6CE98';
      L[id]=el('path',{d:ringsD(id),fill:c,stroke:f.kind==='jetty'?'#3A4148':'rgba(60,45,25,.35)','stroke-width':f.kind==='jetty'?110:35,'stroke-linecap':'round',opacity:0},svg);
      L[id].style.transition='opacity .35s'; });
    // the sandbar morphs from its 8 ka to its 6 ka position
    var b8=A.island['sandbar-8ka'], b6=A.island['sandbar-6ka'];
    var bar=el('path',{fill:'#EFDDB0',stroke:'#B89A5E','stroke-width':35,opacity:0},svg);
    function barD(u){ if(!b8||!b6) return ''; var r8=b8.rings[0], r6=b6.rings[0], n=Math.min(r8.length,r6.length), d='';
      for(var i=0;i<n;i++) d+=(i?'L':'M')+lerp(r8[i][0],r6[i][0],u).toFixed(0)+' '+lerp(r8[i][1],r6[i][1],u).toFixed(0); return d+'Z'; }
    // the slider is logarithmic: u in [0,1] → years before present
    var a=2, b=Math.log10(125100);
    function yrOf(u){return Math.max(0,Math.pow(10,a+(b-a)*(1-u))-100);}
    function uOf(yr){return 1-(Math.log10(yr+100)-a)/(b-a);}
    // the sea-level curve
    var cv=$('#geo-curve'), W=574, H=200, PX0=46, PX1=560, PY0=16, PY1=170;
    function CX(u){return PX0+u*(PX1-PX0);} function CY(m){return PY0+(8-m)/133*(PY1-PY0);}
    [[0,'0 m'],[-60,'−60 m'],[-120,'−120 m']].forEach(function(t){ el('line',{x1:PX0,x2:PX1,y1:CY(t[0]),y2:CY(t[0]),stroke:'#E3D9C6'},cv);
      el('text',{x:PX0-5,y:CY(t[0])+4,'text-anchor':'end','font-size':10.5,fill:'#5B636B'},cv).textContent=t[1]; });
    [[125000,'125 ka'],[20000,'20 ka'],[5000,'5 ka'],[1000,'1 ka'],[145,'1881'],[0,'today']].forEach(function(t){ var x=CX(uOf(t[0]));
      el('line',{x1:x,x2:x,y1:PY1,y2:PY1+4,stroke:'#5B636B'},cv); el('text',{x:x,y:PY1+16,'text-anchor':'middle','font-size':10.5,fill:'#5B636B'},cv).textContent=t[1]; });
    var d=''; for(var i=0;i<=300;i++){ var u=i/300; d+=(i?'L':'M')+CX(u).toFixed(1)+' '+CY(seaAt(yrOf(u))).toFixed(1); }
    el('path',{d:d+'L'+PX1+' '+PY1+'L'+PX0+' '+PY1+'Z',fill:'rgba(31,111,181,.12)'},cv);
    el('path',{d:d,fill:'none',stroke:'#1F6FB5','stroke-width':2.2},cv);
    el('text',{x:CX(uOf(20000))+6,y:CY(-120)+14,'font-size':10.5,'font-weight':700,fill:'#1F6FB5'},cv).textContent='Last Glacial Maximum';
    el('text',{x:PX0+6,y:PY0+8,'font-size':10.5,'font-weight':700,fill:'#5B636B'},cv).textContent='RELATIVE SEA LEVEL · NE FLORIDA';
    var cur=el('line',{y1:PY0,y2:PY1,stroke:'#C9852F','stroke-width':2},cv), dot=el('circle',{r:5,fill:'#C9852F',stroke:'#fff','stroke-width':2},cv);
    var rng=$('#geo-t');
    function set(u){
      u=clamp(u,0,1); rng.value=Math.round(u*1000);
      var yr=Math.min(125000,yrOf(u)), ka=yr/1000, sl=seaAt(yr);
      var era=ERAS.filter(function(e){return ka<=e[0]&&ka>=e[1];})[0]||ERAS[ERAS.length-1];
      $('#geo-ka').innerHTML=(yr<145?(Math.round(2026-yr)+' CE'):ka>=10?Math.round(ka)+' ka':ka>=1?ka.toFixed(1)+' ka':Math.round(yr)+' yr')+'<small>'+(yr<145?'':'years ago')+'</small>';
      $('#geo-sl').textContent=(sl>=0?'+':'−')+Math.abs(sl).toFixed(sl<-10?0:1)+' m';
      $('#geo-name').textContent=era[2]; $('#geo-txt').textContent=era[3]; $('#geo-src').textContent='Source: '+era[4];
      // sea or dry shelf
      var w=clamp((sl+40)/32,0,1);
      bg.setAttribute('fill','rgb('+Math.round(lerp(214,169,w))+','+Math.round(lerp(196,201,w))+','+Math.round(lerp(150,214,w))+')');
      $('#geo-badge').textContent=w<.5?'Dry continental shelf':'Atlantic Ocean';
      Object.keys(L).forEach(function(id){ var f=A.island[id], on;
        if(f.kind==='holocene'){ on=ka<=f.from+(f.from===5?.2:0)&&ka>f.to||(ka===0&&f.to===0); }
        else on=ka<=f.from+(f.kind==='beach-ridge'?0:0)&&ka>=f.to;
        if(f.kind==='marsh') on=ka<=8;
        L[id].setAttribute('opacity',on?(f.kind==='marsh'?Math.min(1,(8-ka)/1.5):1):0); });
      if(ka<=9&&ka>5.2){ bar.setAttribute('d',barD(clamp((9-ka)/3.8,0,1))); bar.setAttribute('opacity',1); } else bar.setAttribute('opacity',0);
      cur.setAttribute('x1',CX(u)); cur.setAttribute('x2',CX(u)); dot.setAttribute('cx',CX(u)); dot.setAttribute('cy',CY(sl));
    }
    rng.addEventListener('input',function(){stopPlay();set(rng.value/1000);});
    function fromEvent(e){ var r=cv.getBoundingClientRect(); return ((e.clientX-r.left)/r.width*W-PX0)/(PX1-PX0); }
    var drag=false;
    cv.addEventListener('pointerdown',function(e){drag=true;stopPlay();set(fromEvent(e));cv.setPointerCapture(e.pointerId);});
    cv.addEventListener('pointermove',function(e){if(drag)set(fromEvent(e));});
    cv.addEventListener('pointerup',function(){drag=false;});
    var raf=0, pb=$('#geo-play');
    function stopPlay(){ if(raf){cancelAnimationFrame(raf);raf=0;} pb.textContent='▶ Play the island'; }
    pb.addEventListener('click',function(){
      if(raf){stopPlay();return;}
      var u0=rng.value/1000; if(u0>.995) u0=0; var t0=null, dur=18000*(1-u0)+800;
      pb.textContent='❚❚ Pause';
      function f(ts){ if(t0===null)t0=ts; var k=Math.min(1,(ts-t0)/dur); set(lerp(u0,1,k)); if(k<1) raf=requestAnimationFrame(f); else stopPlay(); }
      raf=requestAnimationFrame(f);
    });
    $$('.s-geo [data-ka]').forEach(function(bt){ bt.addEventListener('click',function(){stopPlay();set(uOf(+bt.getAttribute('data-ka')*1000));}); });
    watch(slide,function(on){ if(!on) stopPlay(); });
    set(0);
  })();

  // ================= 5 · the weld: rate of rise, and a cross-section that builds =================
  (function(){
    var svg=$('#weld-rate'); if(!svg) return;
    var X0=60,X1=830,Y0=26,Y1=176;
    function X(ka){return X0+(20-ka)/20*(X1-X0);} function Y(r){return Y1-(Math.log10(clamp(r,.1,30))+1)/(Math.log10(30)+1)*(Y1-Y0);}
    [[.1,'0.1'],[1,'1'],[2,'2'],[10,'10 mm/yr']].forEach(function(t){ el('line',{x1:X0,x2:X1,y1:Y(t[0]),y2:Y(t[0]),stroke:t[0]===2?'#C9852F':'#E3D9C6','stroke-width':t[0]===2?1.6:1,'stroke-dasharray':t[0]===2?'6 4':''},svg);
      el('text',{x:X0-6,y:Y(t[0])+4,'text-anchor':'end','font-size':10.5,fill:t[0]===2?'#C9852F':'#5B636B','font-weight':t[0]===2?700:400},svg).textContent=t[1]; });
    el('rect',{x:X0,y:Y(2),width:X1-X0,height:Y1-Y(2),fill:'rgba(106,143,77,.12)'},svg);
    el('text',{x:X1-6,y:Y1-6,'text-anchor':'end','font-size':11,'font-weight':700,fill:'#6A8F4D'},svg).textContent='BARRIER BUILDS (below ~2 mm/yr, Mariotti 2021)';
    for(var k=20;k>=0;k-=2) el('text',{x:X(k),y:Y1+16,'text-anchor':'middle','font-size':10.5,fill:'#5B636B'},svg).textContent=k?k+' ka':'today';
    var bars=el('g',{},svg);
    for(var i=1;i<SEA.length;i++){ var a=SEA[i-1],b=SEA[i]; if(b[0]>20000) continue;
      var r=(a[1]-b[1])/(b[0]-a[0])*1000; if(r<=0) continue;
      var xa=X(b[0]/1000), xb=X(a[0]/1000), slow=r<2;
      var rc=el('rect',{x:xa+1,y:Y(r),width:Math.max(1.5,xb-xa-2),height:Y1-Y(r),fill:slow?'#6A8F4D':'#1F6FB5',opacity:.85},bars);
      rc.style.transformOrigin='0 '+Y1+'px'; rc.style.transformBox='view-box';
      rc.style.transition='transform .9s cubic-bezier(.33,0,.2,1) '+(i*.04)+'s'; }
    el('text',{x:X(14.2),y:Y(15)-6,'text-anchor':'middle','font-size':10.5,'font-weight':700,fill:'#1F6FB5'},svg).textContent='Meltwater Pulse 1A';
    var wx=X(5); el('line',{x1:wx,x2:wx,y1:Y0-6,y2:Y1,stroke:'#C9852F','stroke-width':2},svg);
    el('text',{x:wx+5,y:Y0+4,'font-size':11,'font-weight':700,fill:'#C9852F'},svg).textContent='weld · ~5 ka';
    var slide=svg.closest('.slide');
    watch(slide,function(on){ $$('rect',bars).forEach(function(r){ r.style.transform=on?'scaleY(1)':'scaleY(0)'; }); });

    // cross-section, west → east
    var xs=$('#weld-xs'), SL=118;
    function grass(x0,x1,y,g,col){ for(var x=x0;x<x1;x+=6) el('path',{d:'M'+x+' '+y+' l'+((x*7)%5-2)+' -'+(7+(x*13)%6),stroke:col,'stroke-width':1.4,'stroke-linecap':'round'},g); }
    function txt(g,x,y,s,c,anchor){var t=el('text',{x:x,y:y,'font-size':11.5,'font-weight':700,fill:c||'#20252B','text-anchor':anchor||'middle'},g);t.textContent=s;return t;}
    var gW=el('g',{'data-b':2},xs);
    el('rect',{x:0,y:SL,width:849,height:112,fill:'#7FA9B5',opacity:.75},gW);
    el('line',{x1:0,x2:849,y1:SL,y2:SL,stroke:'#1F6FB5','stroke-width':1.5,'stroke-dasharray':'6 5'},gW);
    txt(gW,820,SL-6,'sea level','#1F6FB5','end');
    var g1=el('g',{'data-b':1},xs);
    el('path',{d:'M0 168 Q420 158 849 176 V230 H0Z',fill:'#7A6650'},g1);
    el('path',{d:'M0 168 L0 70 Q60 64 120 72 L160 112 L190 168Z',fill:'#8A7E60'},g1);
    el('path',{d:'M230 168 Q245 120 290 82 Q340 58 390 78 Q430 100 450 168Z',fill:'#9C7A4E'},g1);
    grass(262,420,84,g1,'#4F6B3A');
    txt(g1,340,112,'Pleistocene core · ~125 ka','#F7F3EA'); txt(g1,60,98,'mainland','#F7F3EA'); txt(g1,520,206,'estuarine mud','#E9DDC7');
    var g4=el('g',{'data-b':4,id:'xs-b4'},xs);
    el('path',{d:'M440 168 Q470 128 505 124 L520 124 Q545 80 585 72 Q630 66 660 96 Q700 116 760 150 L849 172 V176 H440Z',fill:'#E6CE98'},g4);
    el('path',{d:'M436 128 Q470 120 512 126 L512 134 Q470 136 440 140Z',fill:'#6A8F4D'},g4);
    grass(446,508,126,g4,'#4F6B3A'); grass(560,650,76,g4,'#8C9A55');
    txt(g4,610,104,'Holocene dunes · < 5 ka'); txt(g4,476,150,'Egans Creek marsh','#F7F3EA');
    txt(g4,640,24,'“Two piles of sand on a bed of mud”','#8A6236');
    var g3=el('g',{'data-b':3,id:'xs-bar'},xs);
    el('path',{d:'M690 168 Q720 124 750 116 Q780 120 810 168Z',fill:'#EFDDB0',stroke:'#B89A5E'},g3);
    el('path',{d:'M455 118 H690',stroke:'#1F6FB5','stroke-width':1},g3);
    txt(g3,750,104,'sandbar · ~8 ka'); txt(g3,575,140,'lagoon · biogenic mud','#F7F3EA');
    var st=document.createElement('style');
    st.textContent='.s-weld #xs-b4.shown ~ #xs-bar{opacity:0}';
    document.head.appendChild(st);
  })();

  // ================= 6 · drumstick: a live one-line shoreline model =================
  (function(){
    var cv=$('#drum'); if(!cv) return;
    var slide=cv.closest('.slide'), ctx=cv.getContext('2d'); ctx.scale(2,2);
    var W=584, H=404, N=202, dy=H/N;
    var P={hat:[1.5,8,.75,.55,'Hatteras'],ob:[1.3,7.5,.55,.60,'Outer Banks'],sea:[1.0,7,.30,.65,'Sea Islands'],low:[1.0,7,0,.5,'Low-angle'],high:[1.2,7.5,1,.6,'High-angle (theory)']};
    var p=P.sea, xs=[], x0=[], step=0, hist=new Array(18).fill(0), waves=[];
    var rnd=prng(41);
    function sample(){ var hi=Math.random()<p[2], s=Math.random()<p[3]?1:-1;
      var m=(hi?45+35*Math.random():45*Math.random())*Math.PI/180; return {phi:s*m,H:Math.max(.2,p[0]*(1+.35*(Math.random()*2-1)))}; }
    function mu2(){ var s=0,n=4000; for(var i=0;i<n;i++){ var w=sample(); s+=Math.cos(w.phi)*Math.cos(2*w.phi); } return s/n; }
    function reset(){
      xs=[]; for(var i=0;i<N;i++){ var y=i/N, v=300; for(var k=1;k<=12;k++) v+=3/Math.sqrt(k)*Math.sin(2*Math.PI*k*y+k*1.7); xs.push(v+ (rnd()-.5)*1.2); }
      x0=xs.slice(); step=0; hist.fill(0); waves=[];
      var m=mu2(), e=$('#drum-mu'); e.textContent=(m>=0?'+':'−')+Math.abs(m).toFixed(2); e.classList.toggle('neg',m<0);
      $('#drum-mu-t').textContent=m>0.05?'Positive: bumps smooth out.':m<-0.05?'Negative: bumps grow into capes.':'Near zero: on the edge of instability.';
    }
    function advance(nw){
      var K=1.4, eps=.025;
      for(var w=0;w<nw;w++){
        var wv=sample(); var b=Math.floor((wv.phi+Math.PI/2)/Math.PI*18); hist[clamp(b,0,17)]++;
        var q=new Array(N), Hf=Math.pow(wv.H,2.4);
        for(var i=0;i<N;i++){ var j=(i+1)%N, th=Math.atan2(xs[j]-xs[i],dy), al=wv.phi-th;
          q[i]=(Math.abs(al)>=Math.PI/2)?0:K*Hf*Math.pow(Math.cos(al),1.2)*Math.sin(al); }
        var nx=xs.slice();
        for(i=0;i<N;i++){ var im=(i-1+N)%N, i2=(i-2+N)%N, ip=(i+1)%N, ip2=(i+2)%N;
          nx[i]+= (q[im]-q[i])*.35 - eps*(xs[i2]-4*xs[im]+6*xs[i]-4*xs[ip]+xs[ip2]); }
        xs=nx; step++;
        if(w===nw-1&&waves.length<3&&Math.random()<.25) waves.push({phi:wv.phi,d:0});
      }
    }
    function draw(t,dt){
      // sea
      var g=ctx.createLinearGradient(0,0,W,0); g.addColorStop(0,'#2C6E8E'); g.addColorStop(1,'#0F2F4A'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // wave crests travelling in from the east at the drawn angle
      ctx.lineWidth=1.2;
      waves.forEach(function(wv){ wv.d+=dt*120; var c=Math.cos(wv.phi), s=Math.sin(wv.phi);
        for(var r=0;r<5;r++){ var d=(wv.d+r*38)%260, cx=W-20-d*c, cy=H/2+d*s;
          ctx.strokeStyle='rgba(220,235,232,'+(.18*(1-d/260)).toFixed(3)+')';
          ctx.beginPath(); ctx.moveTo(cx-s*500,cy-c*500); ctx.lineTo(cx+s*500,cy+c*500); ctx.stroke(); } });
      waves=waves.filter(function(w){return w.d<300;});
      // land: dunes and vegetation behind the shoreline
      ctx.beginPath(); ctx.moveTo(0,0); for(var i=0;i<N;i++) ctx.lineTo(xs[i],i*dy+dy/2); ctx.lineTo(xs[N-1],H); ctx.lineTo(0,H); ctx.closePath();
      var lg=ctx.createLinearGradient(0,0,340,0); lg.addColorStop(0,'#4E6B3D'); lg.addColorStop(.55,'#7E8F55'); lg.addColorStop(.8,'#D9C08A'); lg.addColorStop(1,'#E9D6A6');
      ctx.fillStyle=lg; ctx.fill();
      // surf
      ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=2; ctx.beginPath();
      for(i=0;i<N;i++){ var xx=xs[i]+3+Math.sin(t*3+i*.3)*1.2; if(i) ctx.lineTo(xx,i*dy+dy/2); else ctx.moveTo(xx,dy/2); } ctx.stroke();
      // starting shoreline, for comparison
      ctx.setLineDash([4,5]); ctx.strokeStyle='rgba(244,194,122,.75)'; ctx.lineWidth=1.2; ctx.beginPath();
      for(i=0;i<N;i++){ if(i) ctx.lineTo(x0[i],i*dy+dy/2); else ctx.moveTo(x0[i],dy/2); } ctx.stroke(); ctx.setLineDash([]);
      // drift arrows
      ctx.fillStyle='rgba(244,194,122,.9)'; ctx.font='700 11px "Noto Sans", Arial';
      ctx.fillText('mainland',16,22); ctx.fillText('ATLANTIC',W-74,H-14);
      ctx.fillText('- - start',16,H-14);
      $('#drum-yr').textContent=step.toLocaleString()+' waves · '+p[4];
    }
    function rose(){
      var svg=$('#drum-rose'); svg.innerHTML=''; var max=Math.max.apply(null,hist)||1;
      el('circle',{r:64,fill:'none',stroke:'#E3D9C6'},svg); el('path',{d:'M0 -70 V70',stroke:'#C9BFAE'},svg);
      [-45,45].forEach(function(a){ var r=a*Math.PI/180; el('line',{x1:0,y1:0,x2:70*Math.cos(r),y2:-70*Math.sin(r),stroke:'#C9852F','stroke-dasharray':'3 3'},svg); });
      hist.forEach(function(c,k){ var a0=(-90+k*10)*Math.PI/180, a1=a0+10*Math.PI/180, r=8+56*c/max, hi=Math.abs(-85+k*10)>45;
        el('path',{d:'M0 0 L'+(r*Math.cos(a0)).toFixed(1)+' '+(-r*Math.sin(a0)).toFixed(1)+' A'+r+' '+r+' 0 0 0 '+(r*Math.cos(a1)).toFixed(1)+' '+(-r*Math.sin(a1)).toFixed(1)+'Z',fill:hi?'#C9852F':'#1D6E73',opacity:.85},svg); });
      el('text',{x:68,y:-48,'font-size':10,fill:'#5B636B','text-anchor':'end'},svg).textContent='from N';
      el('text',{x:68,y:58,'font-size':10,fill:'#5B636B','text-anchor':'end'},svg).textContent='from S';
      el('text',{x:-70,y:4,'font-size':9.5,fill:'#C9852F'},svg).textContent='>45°';
    }
    var rt=0;
    loop(slide,function(t,dt){ if(dt>0) advance(6); draw(t,dt); rt+=dt; if(rt>.3||t===0){rt=0;rose();} });
    var hb=document.createElement('button'); hb.className='btn sm'; hb.setAttribute('data-p','high'); hb.textContent='High-angle (theory)';
    $('.s-drum .presets .row:nth-child(3)').insertBefore(hb,$('#drum-reset'));
    group($('.s-drum .presets'),'data-p',function(k){p=P[k];reset();});
    $('#drum-reset').addEventListener('click',reset);
    reset(); draw(0,0); rose();
  })();

  // ================= 7 · origin theories: three looping sketches =================
  (function(){
    var slide=slideOf('.s-orig'); if(!slide) return;
    var bar=$('#og-bar'), ridge=$('#og-ridge'), spit=$('#og-spit');
    function f(svg,html){svg.innerHTML=html;}
    function grassStr(x0,x1,y,o){var s='';for(var x=x0;x<x1;x+=5)s+='<path d="M'+x+' '+y+' l'+((x%3)-1)+' -'+(5+(x*7)%4)+'" stroke="#4F6B3A" stroke-width="1.3" opacity="'+o+'"/>';return s;}
    function draw(t){
      var u=(t%7)/7;
      // de Beaumont: a bar rises through the sea surface and greens
      var h=lerp(16,-14,ease(clamp(u/.7,0,1))), v=clamp((u-.6)/.25,0,1);
      f(bar,'<rect width="250" height="118" fill="#DDE8EA"/><rect y="60" width="250" height="58" fill="#7FA9B5"/>'+
        '<path d="M0 104 Q125 96 250 108 V118 H0Z" fill="#7A6650"/><path d="M0 104 L0 46 Q30 42 48 50 L62 104Z" fill="#8A7E60"/>'+
        '<path d="M120 104 Q160 '+(60+h)+' 185 '+(60+h)+' Q210 '+(60+h)+' 240 104Z" fill="#E6CE98" stroke="#B89A5E"/>'+
        grassStr(165,206,60+h,v)+'<line x1="0" x2="250" y1="60" y2="60" stroke="#1F6FB5" stroke-dasharray="4 4"/>'+
        '<text x="244" y="56" font-size="9.5" text-anchor="end" fill="#1F6FB5">sea level</text>');
      // Hoyt: sea rises behind a coastal ridge
      var s=lerp(84,58,ease(clamp(u/.75,0,1)));
      f(ridge,'<rect width="250" height="118" fill="#DDE8EA"/><rect y="'+s+'" width="250" height="'+(118-s)+'" fill="#7FA9B5"/>'+
        '<path d="M0 50 Q40 46 70 62 Q100 80 120 86 Q150 92 160 70 Q170 46 182 46 Q196 48 204 76 Q220 98 250 104 V118 H0Z" fill="#B5A27B"/>'+
        grassStr(166,198,48,1)+'<line x1="0" x2="250" y1="'+s+'" y2="'+s+'" stroke="#1F6FB5" stroke-dasharray="4 4"/>'+
        '<text x="182" y="40" font-size="9.5" text-anchor="middle" fill="#3A4148">ridge</text><text x="122" y="'+(s+14)+'" font-size="9.5" text-anchor="middle" fill="#F7F3EA">'+(u>.45?'lagoon':'')+'</text>');
      // Fisher: plan view, a spit grows south and is breached
      var L=lerp(10,92,ease(clamp(u/.6,0,1))), cut=u>.68, gap=cut?clamp((u-.68)/.1,0,1)*10:0;
      var sp='<path d="M150 22 Q158 '+(22+L*.5)+' 156 '+(22+L)+'" stroke="#E6CE98" stroke-width="9" stroke-linecap="round" fill="none"/>';
      f(spit,'<rect width="250" height="118" fill="#7FA9B5"/><path d="M0 0 H150 Q140 14 112 22 Q96 40 92 118 H0Z" fill="#8A7E60"/>'+sp+
        (cut?'<rect x="146" y="50" width="20" height="'+gap+'" fill="#7FA9B5"/>':'')+
        '<path d="M222 20 l-12 10 M222 20 l-2 13" stroke="#F7F3EA" stroke-width="1.6"/><text x="230" y="16" font-size="9.5" fill="#F7F3EA" text-anchor="end">drift ↓</text>'+
        (cut&&gap>6?'<text x="176" y="56" font-size="9.5" fill="#F7F3EA">inlet</text>':'')+'<text x="40" y="60" font-size="9.5" fill="#F7F3EA">headland</text>');
    }
    loop(slide,draw);
  })();

  // ================= 8 · Egans Creek tides: chart, marsh scene and a heron at the water’s edge =================
  (function(){
    var slide=slideOf('.s-tide'), sc=$('#tide-scene'), ch=$('#tide-chart'); if(!slide||!sc) return;
    var R=1.83, PER=12.42;
    function level(h){return R/2*(1-Math.cos(h/PER*2*Math.PI));}
    // terrain: height in metres above low water, west → east across the creek
    function ground(x){ var u=x/849;
      return 1.5+.07*Math.sin(u*37)+.05*Math.sin(u*83)-1.35*Math.exp(-Math.pow((u-.5)/.055,2))-.25*Math.exp(-Math.pow((u-.5)/.14,2))+(u<.14?1.3*Math.pow((.14-u)/.14,1.5):0)+(u>.84?1.5*Math.pow((u-.84)/.16,1.5):0); }
    var Y=function(m){return 250-m*82;};
    var water=el('rect',{x:0,width:849,height:300,fill:'#739E9E',opacity:.82},sc);
    var d='M0 278'; for(var x=0;x<=849;x+=6) d+='L'+x+' '+Y(ground(x)).toFixed(1); d+='L849 278Z';
    el('path',{d:d,fill:'#8C7B5B'},sc);
    el('path',{d:d,fill:'none',stroke:'#5E5340','stroke-width':1.5},sc);
    // cordgrass on the low marsh
    var gg=el('g',{stroke:'#6E7F3F','stroke-width':1.6,'stroke-linecap':'round'},sc);
    for(x=40;x<820;x+=7){ var gy=ground(x); if(gy>1.2&&gy<1.95){ el('path',{d:'M'+x+' '+Y(gy)+' q'+((x%5)-2)+' -10 '+((x%7)-3)+' -'+(16+(x*13)%10)},gg); } }
    // a cover of water over grass when it floods
    var flood=el('rect',{x:0,width:849,height:300,fill:'#739E9E',opacity:.45},sc);
    var fish=el('g',{},sc); for(var i=0;i<5;i++) el('ellipse',{rx:6,ry:2.4,fill:'#4A6E70'},fish);
    // a heron: body, neck, legs
    var heron=el('g',{},sc);
    el('path',{d:'M0 0 l-3 -26 M6 0 l3 -26',stroke:'#3A4148','stroke-width':1.6},heron);
    el('ellipse',{cx:2,cy:-34,rx:14,ry:8,fill:'#9FB0BC'},heron);
    el('path',{d:'M12 -38 q6 -10 0 -20 q-2 -6 4 -8 l12 2',stroke:'#9FB0BC','stroke-width':3.4,fill:'none','stroke-linecap':'round'},heron);
    el('path',{d:'M28 -66 l10 1',stroke:'#C9852F','stroke-width':2},heron);
    var lab=el('g',{'font-size':11,'font-weight':700,fill:'#3A4148'},sc);
    el('text',{x:18,y:60},lab).textContent='WEST · upland edge'; el('text',{x:832,y:46,'text-anchor':'end'},lab).textContent='EAST · dune side';
    el('text',{x:424,y:270,'text-anchor':'middle',fill:'#F7F3EA'},lab).textContent='creek channel';
    // the chart: two cycles
    var X0=40,X1=570,T=2*PER;
    function CX(h){return X0+h/T*(X1-X0);} function CY(m){return 150-m/2*120;}
    [0,6,12,18,24].forEach(function(h){ el('line',{x1:CX(h),x2:CX(h),y1:26,y2:150,stroke:'#E3D9C6'},ch); el('text',{x:CX(h),y:164,'text-anchor':'middle','font-size':10.5,fill:'#5B636B'},ch).textContent=h+' h'; });
    [0,1,1.83].forEach(function(m){ el('text',{x:X0-5,y:CY(m)+4,'text-anchor':'end','font-size':10.5,fill:'#5B636B'},ch).textContent=m.toFixed(m%1?2:0)+' m'; });
    var pd=''; for(var k=0;k<=240;k++){var h=k/240*T; pd+=(k?'L':'M')+CX(h).toFixed(1)+' '+CY(level(h)).toFixed(1);}
    el('path',{d:pd+'L'+X1+' 150 L'+X0+' 150Z',fill:'rgba(31,111,181,.12)'},ch); el('path',{d:pd,fill:'none',stroke:'#1F6FB5','stroke-width':2.2},ch);
    el('text',{x:X0+4,y:16,'font-size':10.5,'font-weight':700,fill:'#5B636B'},ch).textContent='ILLUSTRATIVE CYCLE · 12.42 h · drag';
    var cur=el('line',{y1:22,y2:150,stroke:'#C9852F','stroke-width':2},ch), dot=el('circle',{r:5,fill:'#C9852F',stroke:'#fff','stroke-width':2},ch);
    var hr=1.5;
    function set(h,t){
      hr=((h%T)+T)%T; var lv=level(hr), y=Y(lv);
      water.setAttribute('y',y); flood.setAttribute('y',y); flood.setAttribute('opacity',lv>1.45?.4:0);
      // the heron wades at the western water’s edge
      var ex=60; for(var x=40;x<420;x+=2){ if(ground(x)<=lv+.08){ex=x;break;} }
      heron.setAttribute('transform','translate('+(ex-30)+' '+(Y(ground(ex-30))+2)+')');
      $$('ellipse',fish).forEach(function(f,i){ var fx=360+((t||0)*18*(i%2?1:-1)+i*31)%130, fy=Math.min(Y(ground(fx))-6,y+14+i*8);
        f.setAttribute('cx',fx); f.setAttribute('cy',fy); f.setAttribute('opacity',fy>y+4?1:0); });
      cur.setAttribute('x1',CX(hr)); cur.setAttribute('x2',CX(hr)); dot.setAttribute('cx',CX(hr)); dot.setAttribute('cy',CY(lv));
      var rising=Math.sin(hr/PER*2*Math.PI)>0;
      $('#tide-dir').textContent=rising?'Rising · flood':'Falling · ebb';
      $('#tide-v').innerHTML=lv.toFixed(2)+' <small>m · '+(lv/0.3048).toFixed(1)+' ft above low</small>';
      var ph=(hr%PER)/PER;
      $('#tide-t').textContent=lv>1.4?'Water stands among the cordgrass stems; small fish move into the flooded marsh.':lv<.35?'Mud banks exposed. Birds feed along the channel edge.':rising?'Shallows widen; the heron steps back up the bank.':'The marsh drains back into the channel.';
    }
    function fromEvent(e){var r=ch.getBoundingClientRect();return ((e.clientX-r.left)/r.width*580-X0)/(X1-X0)*T;}
    var drag=false, playing=false, pb=$('#tide-play');
    ch.addEventListener('pointerdown',function(e){drag=true;playing=false;pb.textContent='▶ Run a tidal cycle';set(fromEvent(e));ch.setPointerCapture(e.pointerId);});
    ch.addEventListener('pointermove',function(e){if(drag)set(fromEvent(e));});
    ch.addEventListener('pointerup',function(){drag=false;});
    pb.addEventListener('click',function(){playing=!playing;pb.textContent=playing?'❚❚ Pause':'▶ Run a tidal cycle';});
    $('#tide-lo').addEventListener('click',function(){playing=false;pb.textContent='▶ Run a tidal cycle';set(0);});
    $('#tide-hi').addEventListener('click',function(){playing=false;pb.textContent='▶ Run a tidal cycle';set(PER/2);});
    loop(slide,function(t,dt){ if(playing) hr+=dt*1.1; set(hr,t); });
    watch(slide,function(on){ if(on){playing=true;pb.textContent='❚❚ Pause';} });
  })();

  // ================= 9 · the honest atlas: datums, and three AI builds =================
  (function(){
    var out=$('#dp-out'); if(!out) return;
    function depth(water,bed){ if(water.datum!==bed.datum) throw Error('Vertical datums must match'); return Math.max(0,water.value-bed.value); }
    function run(bed){ var w={value:1.6,datum:'MLLW'};
      try{ out.classList.remove('err'); out.textContent='depth({1.6, MLLW}, {'+bed.value+', '+bed.datum+'})  →  '+depth(w,bed).toFixed(2)+' m'; }
      catch(e){ out.classList.add('err'); out.textContent='depth({1.6, MLLW}, {'+bed.value+', '+bed.datum+'})  →  Error: '+e.message; } }
    $('#dp-ok').addEventListener('click',function(){run({value:0.4,datum:'MLLW'});});
    $('#dp-bad').addEventListener('click',function(){run({value:-0.5,datum:'NAVD88'});});
    var V=[['Egans Creek: A Model · the main atlas','Six chapters (Map, Tides, Formation, Marsh, Animals, History), a field notebook kept in the browser, and an offline service worker. Every photo has a credit and a license in PROVENANCE.md.'],
      ['Deep Looking Explorer · ChatGPT','One dependency-free HTML file: four illustrated subjects, a six-lens question explorer (Language, Art, Mathematics, Engineering, Science, History) and an animated conceptual water-level model.'],
      ['Greenway Explorer · Gemini','Built from two prompts: the three field photos with “create a thorough and detailed web app,” then “more types of animals, with representative photos.” The AI found and fixed its own error while testing.']];
    var vs=$$('.s-hon .ver');
    function show(k){ vs.forEach(function(v,j){v.classList.toggle('on',j===k);}); $('#vt-tag').textContent=V[k][0]; $('#vt-p').textContent=V[k][1]; }
    vs.forEach(function(v,j){v.addEventListener('click',function(){show(j);});}); show(0);
  })();

  // ================= 10 · trees: every city-inventory point =================
  (function(){
    var cv=$('#trees'); if(!cv||!A.trees.pts.length) return;
    var slide=cv.closest('.slide'), ctx=cv.getContext('2d'); ctx.scale(2,2);
    var T=A.trees, n=T.pts.length/3, COL=['#9BD17A','#4FA36B','#F4C27A','#7FC4C0','#4A9BC0','#D9785A','#E6CE98','#B59BD9','#8A949C'];
    var W=384,H=520, minx=4800,maxx=8760,miny=3180,maxy=13400, s=Math.min((W-30)/(maxx-minx),(H-40)/(maxy-miny));
    var ox=(W-(maxx-minx)*s)/2, oy=24;
    function X(x){return ox+(x-minx)*s;} function Y(y){return oy+(y-miny)*s;}
    var isle={}; MODERN.forEach(function(id){ var f=A.island[id]; if(!f) return; var p=new Path2D();
      f.rings.forEach(function(r){ r.forEach(function(q,i){ if(i)p.lineTo(X(q[0]),Y(q[1])); else p.moveTo(X(q[0]),Y(q[1])); }); p.closePath(); }); isle[id]=p; });
    var ord=[]; for(var i=0;i<n;i++) ord.push(i);
    var r=prng(5); for(i=n-1;i>0;i--){ var j=Math.floor(r()*(i+1)), t=ord[i]; ord[i]=ord[j]; ord[j]=t; }
    var shown=n, focus=-1, dead=false, t0=null;
    function draw(){
      ctx.fillStyle='#16232B'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#243540'; ['holocene-modern','pleistocene-core'].forEach(function(id){ if(isle[id]) ctx.fill(isle[id]); });
      ctx.fillStyle='#1F3A33'; if(isle['egans-creek']) ctx.fill(isle['egans-creek']);
      for(var q=0;q<shown;q++){ var i=ord[q], x=T.pts[3*i], y=T.pts[3*i+1], c=T.pts[3*i+2], sp=c>>1, dd=c&1;
        if(dead){ ctx.fillStyle=dd?'#E5533A':'rgba(138,148,156,.18)'; }
        else if(focus>=0){ ctx.fillStyle=sp===focus?COL[sp]:'rgba(138,148,156,.13)'; }
        else ctx.fillStyle=COL[sp];
        ctx.fillRect(X(x)-.9,Y(y)-.9,1.8,1.8); }
      $('#tr-n').innerHTML=shown.toLocaleString()+' records<br>'+(dead?'593 recorded dead':focus>=0?T.species[focus]+' · '+T.counts[focus].toLocaleString():'');
    }
    // species bars
    var bars=$('#tr-bars'), max=T.counts[0];
    bars.innerHTML=T.species.map(function(sp,k){ return '<div class="br" data-lens="sp'+k+'" data-k="'+k+'"><span class="nm"><i style="background:'+COL[k]+'"></i>'+sp+'</span><div class="tr"><span style="background:'+COL[k]+'" data-w="'+(T.counts[k]/max*100).toFixed(1)+'"></span></div><span class="val">'+T.counts[k].toLocaleString()+'</span></div>'; }).join('');
    $$('.br',bars).forEach(function(b){ b.addEventListener('mouseenter',function(){focus=+b.getAttribute('data-k');dead=false;draw();}); b.addEventListener('mouseleave',function(){focus=-1;draw();}); });
    // condition strip
    var CC={Good:'#4FA36B',Fair:'#C9A66B',Poor:'#C9852F',Dead:'#B5452F',New:'#7FC4C0',Excellent:'#1D6E73',Heritage:'#8A6236'};
    $('#tr-st').innerHTML=T.conditions.map(function(c){return '<span title="'+c[0]+' '+c[1]+'" style="width:'+(c[1]/T.total*100)+'%;background:'+(CC[c[0]]||'#999')+'"></span>';}).join('');
    $('#tr-lg').innerHTML=T.conditions.map(function(c){return '<span><i style="background:'+(CC[c[0]]||'#999')+'"></i>'+c[0]+' '+c[1].toLocaleString()+'</span>';}).join('');
    $('#tr-dead').addEventListener('click',function(){dead=!dead;this.classList.toggle('on',dead);focus=-1;draw();});
    var raf=0;
    function f(ts){ if(t0===null)t0=ts; var k=Math.min(1,(ts-t0)/3800); shown=Math.round(n*ease(k)); draw(); if(k<1) raf=requestAnimationFrame(f); else raf=0; }
    function run(){ if(raf) cancelAnimationFrame(raf); t0=null; raf=requestAnimationFrame(f); }
    $('#tr-play').addEventListener('click',run);
    watch(slide,function(on){
      $$('.tr span',bars).forEach(function(s,k){ s.style.transitionDelay=(k*.08)+'s'; s.style.width=on?s.getAttribute('data-w')+'%':'0'; });
      if(on&&!slide.dataset.planted){ slide.dataset.planted='1'; if(reduce){shown=n;draw();} else run(); } });
    draw();
  })();

  // ================= 11 · live oak: salt pruning from a wind vector =================
  (function(){
    var svg=$('#oak'); if(!svg) return;
    var slide=svg.closest('.slide');
    var st={az:90,w:.7,a:20,age:150,moss:.5,sk:false,sh:false};
    var GY=308, BX=300;
    function build(age){
      var r=prng(1925), mr=prng(77), segs=[], tips=[], stubs=[], moss=[];
      var mat=Math.min(1,age/100), wx=-Math.sin(st.az*Math.PI/180)*st.w;  // + = wind blowing right
      var sgn=wx>=0?1:-1, lean=Math.abs(wx)*Math.min(1,age/250);
      // the crown is a dome; salt wind cuts it with a ramp rising leeward
      var Rc=70+170*mat, Hc=50+120*mat, th=16+20*mat, tr=5+13*Math.min(1,age/200);
      var tx=BX+sgn*lean*24, cx=tx+sgn*lean*Rc*.18, cy=GY-th;
      var edge=cx-sgn*Rc, low=GY-(40+50*mat)*(1-.4*st.w), tan=Math.tan(st.a*Math.PI/180);
      function shear(x){ if(Math.abs(wx)<.05) return -1e9; return low-Math.max(0,(x-edge)*sgn)*tan; }
      function inside(x,y){ var dx=(x-cx)/Rc; if(y>cy) return Math.abs(dx)<1.02; var dy=(cy-y)/Hc; return dx*dx+dy*dy<=1; }
      function limb(x,y,a,len,rad,depth){
        var px=x, py=y, n=Math.max(2,Math.round(len/11)), side=r()<.5?1:-1;
        if(Math.sin(a)*sgn<-.2) len*=1-.4*Math.abs(wx);            // windward limbs are flagged short
        for(var i=0;i<n;i++){
          var hz=Math.sin(a);                                        // + = leaning right of vertical
          a+=(r()-.5)*.38;                                           // crooked, sympodial wandering
          if(rad>3&&Math.abs(hz)>.55) a+=(hz>0?1:-1)*.045*(i/n);    // heavy near-horizontal limbs sag
          a+=sgn*lean*.03;                                           // young wood trained downwind
          var nx=px+Math.sin(a)*11, ny=py-Math.cos(a)*11;
          if(ny>GY-5){ ny=GY-5; a=(hz>0?1:-1)*(Math.PI/2-.35); }    // an elbow rests on the ground, then rises
          if(!inside(nx,ny)){ tips.push([px,py,rad,false]); return; }
          var sy=shear(nx);
          if(ny<sy){
            if(rad<2.4){ stubs.push([px,py,nx,ny]); tips.push([px,py+5,rad,true]); return; }   // a thin shoot dies at the surface
            ny=Math.max(sy+3,py-2); a=sgn*(Math.PI/2-.08);           // thick wood grows along beneath it
          }
          segs.push([px,py,nx,ny,rad]);
          if(rad>2.2&&Math.abs(Math.sin(a))>.7&&mr()<.2*st.moss&&(nx-cx)*sgn>-Rc*.35)
            moss.push([nx,ny,Math.min(GY-ny-4,8+mr()*34*st.moss+6)]);
          if(depth<4&&i>0&&i%2===0&&rad>1.1){ side=-side; limb(nx,ny,a+side*(.55+r()*.4),len*.5,rad*.62,depth+1); }
          rad*=.965; px=nx; py=ny;
        }
        tips.push([px,py,rad,false]);
      }
      // trunk: short and massive, dividing low into heavy limbs
      var L=5+Math.round(r()*3);
      for(var k=0;k<L;k++){ var f=(k+.5)/L, ang=(-1.25+2.5*f)+(r()-.5)*.18;
        limb(tx,cy,ang,Rc*(1.05+r()*.25),tr*.55,0); }
      var roots=[]; for(k=0;k<7;k++){ var s2=k<4?-1:1, along=1+(s2===-sgn?.9:.4)*st.w;   // buttressed along the wind axis
        roots.push([BX,GY,BX+s2*(16+r()*34)*along*(.5+.5*mat),GY+3+r()*6,tr*.32*(s2===-sgn?1+.6*st.w:1)]); }
      return {segs:segs,tips:tips,stubs:stubs,moss:moss,roots:roots,shear:shear,edge:edge,wx:wx,trunk:[BX,GY,tx,cy,tr],shift:-sgn*Math.abs(wx)*70*mat};
    }
    function draw(age){
      var label='', m=build(age), h='<g transform="translate('+m.shift.toFixed(1)+' 0)">';
      if(st.sh&&Math.abs(m.wx)>.05){ var d='M0 '+clamp(m.shear(0),-50,GY).toFixed(1); for(var x=10;x<=584;x+=10) d+=' L'+x+' '+clamp(m.shear(x),-50,GY).toFixed(1);
        h+='<path d="'+d+'" fill="none" stroke="#B5452F" stroke-width="2" stroke-dasharray="7 5"/>'; label='<text x="'+((m.wx<0?560:24)-m.shift).toFixed(0)+'" y="'+(clamp(m.shear((m.wx<0?560:24)-m.shift),20,GY)-8)+'" font-size="11" font-weight="700" fill="#B5452F" stroke="#F2EEE3" stroke-width="4" paint-order="stroke" text-anchor="'+(m.wx<0?'end':'start')+'">shear surface</text>'; }
      m.roots.forEach(function(s){ h+='<path d="M'+s[0]+' '+s[1]+' Q'+((s[0]+s[2])/2)+' '+(s[1]-3)+' '+s[2]+' '+s[3]+'" stroke="#5E4A35" stroke-width="'+s[4].toFixed(1)+'" stroke-linecap="round" fill="none"/>'; });
      var bark=st.sk?'#3A4148':'#5E4A35', T=m.trunk;
      if(!st.sk) h+='<path d="M'+(T[0]-T[4]*1.5)+' '+T[1]+' Q'+(T[0]-T[4]*.8)+' '+(T[1]-6)+' '+(T[2]-T[4]*.8)+' '+T[3]+' L'+(T[2]+T[4]*.8)+' '+T[3]+' Q'+(T[0]+T[4]*.8)+' '+(T[1]-6)+' '+(T[0]+T[4]*1.5)+' '+T[1]+'Z" fill="'+bark+'"/>';
      else h+='<line x1="'+T[0]+'" y1="'+T[1]+'" x2="'+T[2]+'" y2="'+T[3]+'" stroke="'+bark+'" stroke-width="1.6"/>';
      m.segs.forEach(function(s){ h+='<line x1="'+s[0].toFixed(1)+'" y1="'+s[1].toFixed(1)+'" x2="'+s[2].toFixed(1)+'" y2="'+s[3].toFixed(1)+'" stroke="'+bark+'" stroke-width="'+(st.sk?1.2:Math.max(.8,s[4])).toFixed(1)+'" stroke-linecap="round"/>'; if(st.sk) h+='<circle cx="'+s[2].toFixed(1)+'" cy="'+s[3].toFixed(1)+'" r="1.6" fill="#C9852F"/>'; });
      m.stubs.forEach(function(s){ h+='<line x1="'+s[0].toFixed(1)+'" y1="'+s[1].toFixed(1)+'" x2="'+s[2].toFixed(1)+'" y2="'+s[3].toFixed(1)+'" stroke="#A9A49A" stroke-width="1.2"/>'; });
      if(!st.sk){
        var lr=prng(9), back='', front='';
        m.tips.forEach(function(t){ var sy=m.shear(t[0]), burn=t[3]||(Math.abs(m.wx)>.25&&t[1]-sy<16);
          for(var q=0;q<3;q++){ var ox=(lr()-.5)*16, oy=(lr()-.6)*12, rx=8+lr()*7, ry=rx*.62, sh=lr();
            var c=burn&&lr()<.7?['#8E8A46','#9C8E52','#7D7F43'][q]:sh<.33?'#3B6332':sh<.66?'#4A7638':'#5E8C44';
            var e='<ellipse cx="'+(t[0]+ox).toFixed(1)+'" cy="'+(t[1]+oy-3).toFixed(1)+'" rx="'+rx.toFixed(1)+'" ry="'+ry.toFixed(1)+'" fill="'+c+'"/>';
            if(q===0) back+=e.replace('fill="','opacity=".9" fill="'); else front+=e; } });
        h+=back+front;
        m.moss.forEach(function(q){ h+='<path class="moss" d="M'+q[0].toFixed(1)+' '+q[1].toFixed(1)+' q3 '+(q[2]/3).toFixed(1)+' -1 '+(q[2]*.66).toFixed(1)+' t1 '+(q[2]/3).toFixed(1)+'" stroke="#A3AE94" stroke-width="2" fill="none" stroke-linecap="round" opacity=".9"/>'; });
      }
      h+=label+'</g>';
      // wind arrows
      if(Math.abs(m.wx)>.05){ var dir=m.wx>0?1:-1, ax=dir>0?30:554; for(var k=0;k<3;k++){ var y=70+k*36, l=30+40*st.w;
        h+='<path d="M'+ax+' '+y+' h'+(dir*l)+' m'+(-dir*8)+' -5 l'+(dir*8)+' 5 l'+(-dir*8)+' 5" stroke="#1D6E73" stroke-width="2" fill="none" opacity=".6"><animateTransform attributeName="transform" type="translate" values="0 0;'+(dir*14)+' 0;0 0" dur="'+(2.4-st.w)+'s" repeatCount="indefinite"/></path>'; } }
      h+='<text x="18" y="'+(GY+24)+'" font-size="11" font-weight="700" fill="#8A6236">WEST</text><text x="566" y="'+(GY+24)+'" font-size="11" font-weight="700" fill="#8A6236" text-anchor="end">EAST · ATLANTIC</text>';
      h+='<text x="292" y="'+(GY+44)+'" font-size="11" fill="#5B636B" text-anchor="middle">age '+Math.round(age)+' years · '+(st.sk?'skeleton':'flesh')+'</text>';
      svg.innerHTML=h;
    }
    // compass dial
    var dial=$('#oak-dial');
    function dialDraw(){ var a=(st.az-90)*Math.PI/180; dial.innerHTML='<circle r="52" fill="#fff" stroke="#E3D9C6" stroke-width="2"/>'+
      ['N','E','S','W'].map(function(c,i){var t=i*Math.PI/2-Math.PI/2;return '<text x="'+(42*Math.cos(t))+'" y="'+(42*Math.sin(t)+4)+'" font-size="11" font-weight="700" text-anchor="middle" fill="#5B636B">'+c+'</text>';}).join('')+
      '<line x1="'+(46*Math.cos(a))+'" y1="'+(46*Math.sin(a))+'" x2="0" y2="0" stroke="#1D6E73" stroke-width="3.4" stroke-linecap="round"/><circle cx="'+(46*Math.cos(a))+'" cy="'+(46*Math.sin(a))+'" r="6" fill="#C9852F"/>'+
      '<text y="58" font-size="9.5" text-anchor="middle" fill="#5B636B">wind from '+Math.round(st.az)+'°</text>'; }
    var dd=false;
    function dialSet(e){ var r=dial.getBoundingClientRect(), x=e.clientX-r.left-r.width/2, y=e.clientY-r.top-r.height/2; st.az=(Math.atan2(y,x)*180/Math.PI+90+360)%360; dialDraw(); draw(st.age); }
    dial.addEventListener('pointerdown',function(e){dd=true;dial.setPointerCapture(e.pointerId);dialSet(e);});
    dial.addEventListener('pointermove',function(e){if(dd)dialSet(e);}); dial.addEventListener('pointerup',function(){dd=false;});
    function sl(id,key,fmt,scale){ var i=$('#'+id); i.addEventListener('input',function(){ st[key]=i.value*(scale||1); $('#'+id+'o').textContent=fmt(st[key]); draw(st.age); }); }
    sl('oak-w','w',function(v){return v.toFixed(2);},.01); sl('oak-a','a',function(v){return v+'°';}); sl('oak-g','age',function(v){return v+' y';}); sl('oak-m','moss',function(v){return v.toFixed(2);},.01);
    $('#oak-sk').addEventListener('click',function(){st.sk=!st.sk;this.classList.toggle('on',st.sk);draw(st.age);});
    $('#oak-sh').addEventListener('click',function(){st.sh=!st.sh;this.classList.toggle('on',st.sh);draw(st.age);});
    var raf=0;
    $('#oak-grow').addEventListener('click',function(){ cancelAnimationFrame(raf); var t0=null, to=st.age;
      function f(ts){ if(t0===null)t0=ts; var k=Math.min(1,(ts-t0)/4500); draw(lerp(10,to,ease(k))); if(k<1) raf=requestAnimationFrame(f); }
      raf=requestAnimationFrame(f); });
    watch(slide,function(on){ if(!on) cancelAnimationFrame(raf); });
    dialDraw(); draw(st.age);
  })();

  // ================= 12 · one skeleton, three renderers =================
  (function(){
    var v=$('#ren-v'); if(!v) return;
    var slide=v.closest('.slide');
    var R={threejs:['video/oak-threejs.mp4','video/oak-threejs.jpg','Three.js · 30–60 fps in the browser'],unreal:['video/oak-unreal.mp4','video/oak-unreal.jpg','Unreal Engine 5.8 · Lumen, hardware ray tracing']};
    function use(k){ var on=slide.classList.contains('on'); v.poster=R[k][1]; v.src=R[k][0]; $('#ren-b').textContent=R[k][2];
      $$('.s-ren .pipe .st').forEach(function(s){ s.classList.toggle('hot',s.getAttribute('data-lens')===k||s.getAttribute('data-lens')==='sk'); });
      if(on){ var p=v.play(); if(p&&p.catch) p.catch(function(){}); } }
    group($('.s-ren .pick'),'data-r',use);
    watch(slide,function(on){ if(on){ var p=v.play(); if(p&&p.catch) p.catch(function(){}); } else v.pause(); });
    // light-seeking bars grow when their build is shown
    var box=$('.s-ren .light');
    new MutationObserver(function(){ var on=box.classList.contains('shown');
      $$('.tr span',box).forEach(function(s,k){ s.style.transitionDelay=(k*.15)+'s'; s.style.width=on?s.getAttribute('data-w')+'%':'0'; }); }).observe(box,{attributes:true,attributeFilter:['class']});
  })();

  // ================= 13 · wormstone: the seeded Fourier profile =================
  (function(){
    var svg=$('#worm'); if(!svg) return;
    var TAU=2*Math.PI;
    // the same generator and curve as wormstone/model.js
    function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; var t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
    function curve(p){ var rand=rng(p.seed>>>0), c=[]; for(var i=0;i<24;i++) c.push({q:.2+.8*rand(),phase:TAU*rand()});
      var w=c.slice(0,p.terms).map(function(v,i){return v.q/Math.pow(i+1,p.smooth);}), sum=w.reduce(function(a,b){return a+b;},0);
      return function(t){ var s=0; for(var i=0;i<w.length;i++) s+=p.rough*w[i]/sum*Math.cos((i+1)*t+c[i].phase); return p.radius*(1+s); }; }
    var P={seed:1925,terms:9,rough:.38,smooth:1.2,radius:100}, shown=null, target=null, t0=0, raf=0;
    function pts(p){ var f=curve(p), a=[]; for(var i=0;i<240;i++){ var t=i/240*TAU; a.push(f(t)); } return a; }
    function path(a,k){ var d=''; for(var i=0;i<a.length;i++){ var t=i/a.length*TAU, r=a[i]*k; d+=(i?'L':'M')+(Math.cos(t)*r).toFixed(1)+' '+(Math.sin(t)*r).toFixed(1); } return d+'Z'; }
    function render(a){
      var h='<path d="'+path(a,1)+'" fill="#CFC3A6" stroke="#8A6236" stroke-width="2"/>';
      [.78,.56,.34].forEach(function(k){ h+='<path d="'+path(a,k)+'" fill="none" stroke="#8A6236" stroke-opacity=".35" stroke-dasharray="3 4"/>'; });
      // bore mouths, scattered inside the outline
      var r=rng(P.seed+901); for(var i=0;i<60;i++){ var t=r()*TAU, j=Math.floor(t/TAU*a.length)%a.length, rr=a[j]*Math.sqrt(r())*.88;
        h+='<circle cx="'+(Math.cos(t)*rr).toFixed(1)+'" cy="'+(Math.sin(t)*rr).toFixed(1)+'" r="'+(2+r()*4.5).toFixed(1)+'" fill="#4A3B2A" opacity=".75"/>'; }
      svg.innerHTML=h; }
    function go(){ target=pts(P); if(!shown){shown=target;render(shown);return;}
      var from=shown.slice(); t0=performance.now(); cancelAnimationFrame(raf);
      function f(ts){ var k=Math.min(1,(ts-t0)/600), e=ease(k); shown=from.map(function(v,i){return lerp(v,target[i],e);}); render(shown); if(k<1) raf=requestAnimationFrame(f); }
      raf=requestAnimationFrame(f); }
    function bind(id,key,div,fmt){ var i=$('#'+id); i.addEventListener('input',function(){ P[key]=i.value/div; $('#'+id+'o').textContent=fmt(P[key]); go(); }); }
    bind('wm-n','terms',1,function(v){return v;}); bind('wm-r','rough',100,function(v){return v.toFixed(2);}); bind('wm-s','smooth',10,function(v){return v.toFixed(1);});
    $('#wm-seed').addEventListener('click',function(){ P.seed=Math.floor(Math.random()*9000)+1000; $('#wm-sd').textContent='seed '+P.seed; go(); });
    $('#wm-passes').innerHTML=[1,2,3,4,5,6,7].map(function(k){return '<div style="background-image:url(img/worm-pass'+k+'.jpg)"><span>pass '+k+'</span></div>';}).join('')+'<div class="f" style="background-image:url(img/worm-wet.jpg)"><span>final · wet</span></div>';
    go();
  })();

  // ================= 14 · water: caustics by photon splatting, on the CPU =================
  (function(){
    var cv=$('#pool'); if(!cv) return;
    var slide=cv.closest('.slide'), ctx=cv.getContext('2d');
    var W=cv.width, H=cv.height, N=W*H;
    var h=new Float32Array(N), v=new Float32Array(N), E=new Float32Array(N), acc=new Float32Array(N);
    var img=ctx.createImageData(W,H), mode='shallow', vx=0, vy=0;
    function drop(x,y,a,r){ for(var j=-r;j<=r;j++) for(var i=-r;i<=r;i++){ var X=x+i,Y=y+j; if(X<1||Y<1||X>=W-1||Y>=H-1) continue; var d=(i*i+j*j)/(r*r); if(d<1) h[Y*W+X]+=a*Math.cos(d*Math.PI/2); } }
    cv.addEventListener('pointerdown',function(e){ var r=cv.getBoundingClientRect(); drop(Math.round((e.clientX-r.left)/r.width*W),Math.round((e.clientY-r.top)/r.height*H),2.2,7); });
    group($('.s-water .ctl'),'data-z',function(k){mode=k;});
    $('#pool-calm').addEventListener('click',function(){h.fill(0);v.fill(0);});
    // tile pattern for the floor
    var tile=new Float32Array(N); for(var y=0;y<H;y++) for(var x=0;x<W;x++){ var g=(x%20<1||y%20<1)?.55:1; tile[y*W+x]=g; }
    function step(t){
      // two wall nozzles near the surface push waves in
      if(mode!=='deep'){ var a=Math.sin(t*7)*1.6; drop(6,Math.round(H*.32),a,5); drop(W-7,Math.round(H*.7),Math.sin(t*6.3+1)*1.6,5); }
      for(var y=1;y<H-1;y++) for(var x=1;x<W-1;x++){ var i=y*W+x; v[i]+=(h[i-1]+h[i+1]+h[i-W]+h[i+W]-4*h[i])*.24; v[i]*=.992; }
      for(var i=0;i<N;i++) h[i]+=v[i];
      // the vortex dimple wanders slowly around the pool: eta = -k*omega^2
      vx=W*(.5+.18*Math.cos(t*.35)); vy=H*(.5+.2*Math.sin(t*.5));
      var vs=mode==='shallow'?0:1;
      for(y=0;y<H;y++) for(x=0;x<W;x++){ var dx=x-vx, dy=y-vy; E[y*W+x]=h[y*W+x]-vs*22*Math.exp(-(dx*dx+dy*dy)/260); }
      // photons: one per texel, jittered, displaced by the surface slope
      var irr=new Float32Array(N), G=7.5;
      for(y=1;y<H-1;y++) for(x=1;x<W-1;x++){ var k=y*W+x, gx=(E[k+1]-E[k-1])*.5, gy=(E[k+W]-E[k-W])*.5;
        var lx=x+Math.random()-.5+gx*G, ly=y+Math.random()-.5+gy*G, ix=lx|0, iy=ly|0;
        if(ix<0||iy<0||ix>=W-1||iy>=H-1) continue; var fx=lx-ix, fy=ly-iy, b=iy*W+ix;
        irr[b]+=(1-fx)*(1-fy); irr[b+1]+=fx*(1-fy); irr[b+W]+=(1-fx)*fy; irr[b+W+1]+=fx*fy; }
      for(i=0;i<N;i++) acc[i]=acc[i]*.8+irr[i]*.2;
      var d=img.data;
      for(i=0;i<N;i++){ var L=acc[i]*tile[i], q=i*4; d[q]=clamp(18+L*70+Math.max(0,L-1.2)*120,0,255); d[q+1]=clamp(70+L*95+Math.max(0,L-1.2)*110,0,255); d[q+2]=clamp(96+L*95+Math.max(0,L-1.2)*80,0,255); d[q+3]=255; }
      ctx.putImageData(img,0,0);
    }
    loop(slide,function(t,dt){ if(dt>0||t===0) step(t); });
    // the lens diagram
    var ls=$('#lens'); if(ls){ var s='';
      s+='<path d="M10 34 Q70 6 130 34" fill="#7FA9B5" opacity=".5"/><path d="M10 34 Q70 6 130 34" fill="none" stroke="#1F6FB5" stroke-width="2"/>';
      for(var k=0;k<7;k++){ var x0=22+k*16, xs2=70+(x0-70)*.15; s+='<path d="M'+x0+' 4 V'+(34-14*Math.sin((x0-10)/120*Math.PI))+' L'+xs2+' 86" stroke="#C9852F" stroke-width="1.2" fill="none"/>'; }
      s+='<circle cx="70" cy="88" r="5" fill="#F4C27A"/><text x="70" y="96" font-size="0" />';
      s+='<path d="M150 20 Q210 50 270 20" fill="#7FA9B5" opacity=".5"/><path d="M150 20 Q210 50 270 20" fill="none" stroke="#1F6FB5" stroke-width="2"/>';
      for(k=0;k<7;k++){ x0=162+k*16; xs2=210+(x0-210)*2.1; s+='<path d="M'+x0+' 4 V'+(20+14*Math.sin((x0-150)/120*Math.PI))+' L'+xs2+' 86" stroke="#C9852F" stroke-width="1.2" fill="none"/>'; }
      s+='<circle cx="210" cy="88" r="7" fill="#151B21"/>';
      s+='<text x="70" y="52" font-size="10" text-anchor="middle" fill="#20252B" font-weight="700">crest</text><text x="210" y="14" font-size="10" text-anchor="middle" fill="#20252B" font-weight="700">vortex dimple</text>';
      ls.innerHTML=s; }
  })();

  // ================= 15 · Gaussian variation and the boundary instability =================
  (function(){
    var svg=$('#var-svg'); if(!svg) return;
    var slide=svg.closest('.slide'), mu=.18, sig=.1, zs=[], r=prng(2026), timer=0;
    function randn(){ var u=0,v=0; while(!u)u=r(); while(!v)v=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
    function X(v){return 20+v*336;}
    function draw(){
      var s='<line x1="20" x2="356" y1="160" y2="160" stroke="#C9BFAE" stroke-width="6" stroke-linecap="round"/>';
      s+='<rect x="'+X(Math.max(0,mu-sig))+'" y="154" width="'+(X(Math.min(1,mu+sig))-X(Math.max(0,mu-sig)))+'" height="12" rx="6" fill="rgba(201,133,47,.35)"/>';
      var bins={}, pile0=0, pile1=0;
      zs.forEach(function(z,k){ var raw=mu+z*sig, v=clamp(raw,0,1); if(raw<=0)pile0++; if(raw>=1)pile1++;
        var b=Math.round(v*60); bins[b]=(bins[b]||0)+1; var yy=140-(bins[b]-1)*7, last=k===zs.length-1;
        s+='<circle cx="'+X(v).toFixed(1)+'" cy="'+yy+'" r="'+(last?4.6:3)+'" fill="'+(last?'#C9852F':(raw<=0||raw>=1)?'#B5452F':'#1D6E73')+'" opacity="'+(last?1:.75)+'"/>'; });
      if(pile0) s+='<rect x="14" y="'+(146-pile0*3)+'" width="8" height="'+(pile0*3)+'" fill="#B5452F"/>';
      if(pile1) s+='<rect x="352" y="'+(146-pile1*3)+'" width="8" height="'+(pile1*3)+'" fill="#B5452F"/>';
      s+='<circle cx="'+X(mu)+'" cy="160" r="9" fill="#fff" stroke="#1D6E73" stroke-width="3"/>';
      s+='<text x="20" y="184" font-size="10.5" fill="#5B636B">0</text><text x="356" y="184" font-size="10.5" fill="#5B636B" text-anchor="end">1</text>';
      s+='<text x="188" y="184" font-size="10.5" fill="#5B636B" text-anchor="middle">'+zs.length+' rolls · thumb stays at μ · red = clipped to an end stop</text>';
      svg.innerHTML=s;
    }
    function roll(){ zs.push(randn()); if(zs.length>60) zs.shift(); draw(); }
    $('#var-roll').addEventListener('click',roll);
    $('#var-mu').addEventListener('input',function(){ mu=this.value/100; $('#var-muo').textContent=mu.toFixed(2); draw(); });
    var ab=$('#var-auto');
    function stopAuto(){ clearInterval(timer); timer=0; ab.classList.remove('on'); }
    ab.addEventListener('click',function(){ if(timer){stopAuto();return;} ab.classList.add('on'); timer=setInterval(roll,1000); });
    watch(slide,function(on){ if(!on) stopAuto(); });
    for(var i=0;i<24;i++) zs.push(randn()); draw();
    // stability: one kick decays slowly; a kick every step piles up
    var ss=$('#stab-svg'); if(!ss) return;
    var lam=.99925, X0=40, X1=366, Y0=12, Y1=118, s='';
    function SX(t){return X0+t/60*(X1-X0);}
    [0,20,40,60].forEach(function(t){ s+='<line x1="'+SX(t)+'" x2="'+SX(t)+'" y1="'+Y0+'" y2="'+Y1+'" stroke="#E3D9C6"/><text x="'+SX(t)+'" y="'+(Y1+14)+'" font-size="10.5" text-anchor="middle" fill="#5B636B">'+t+' s</text>'; });
    var d1='',d2='';
    for(var k=0;k<=120;k++){ var t=k/2, n=t*60, one=Math.pow(lam,n), pile=(1-Math.pow(lam,n+1))/(1-lam)/1333;
      d1+=(k?'L':'M')+SX(t).toFixed(1)+' '+(Y1-one*(Y1-Y0)).toFixed(1); d2+=(k?'L':'M')+SX(t).toFixed(1)+' '+(Y1-pile*(Y1-Y0)).toFixed(1); }
    s+='<path d="'+d2+'" fill="none" stroke="#B5452F" stroke-width="2.4"/><path d="'+d1+'" fill="none" stroke="#1D6E73" stroke-width="2.4"/>';
    s+='<line x1="'+SX(22.2)+'" x2="'+SX(22.2)+'" y1="'+Y0+'" y2="'+Y1+'" stroke="#1D6E73" stroke-dasharray="4 3"/>';
    s+='<text x="'+(SX(22.2)+4)+'" y="'+(Y1-28)+'" font-size="10.5" fill="#1D6E73" font-weight="700">one kick · e-fold 22 s</text>';
    s+='<text x="'+SX(34)+'" y="'+(Y0+24)+'" font-size="10.5" fill="#B5452F" font-weight="700">a kick every step → ~1,300×</text>';
    s+='<text x="'+(X0-4)+'" y="'+(Y1+4)+'" font-size="10" text-anchor="end" fill="#5B636B">0</text><text x="'+(X0-4)+'" y="'+(Y0+8)+'" font-size="10" text-anchor="end" fill="#5B636B">max</text>';
    s+='<text x="'+X1+'" y="'+(Y1+28)+'" font-size="10.5" text-anchor="end" fill="#5B636B">|λ| = √d = 0.99925 for every mode, at 60 steps/s</text>';
    ss.innerHTML=s;
  })();

  // ================= 16 · Victorian houses: genomes, breeding and crossover =================
  (function(){
    var box=$('#vic'); if(!box) return;
    var r=Math.random;
    var PAL=[['Sage & Cream','#9bae9f','#efe9d8','#8a3324','#26323a'],['Heritage Red','#8a4b3a','#f2ead2','#3d2b22','#2a2a2a'],['Coastal Blue','#6f8aa1','#f5f5ef','#b9542f','#243018'],
      ['Mustard & Plum','#c2a14a','#efe7d0','#5e3550','#2c2c2c'],['Painted Lady','#7d9b76','#e9dfca','#9c4a2f','#34232e'],['Williams Taupe','#9a8b7d','#f5f2ea','#7c6a58','#2c3a30'],
      ['Field #3','#9b3c33','#efe0c7','#5b5d5e','#212629'],['Field #1','#f1e5af','#ffffff','#a1b1c2','#31465d'],['Field #13','#b8c9cd','#ffffff','#1c1c1c','#0c0a0a']];
    function pick(items){ var t=0,i; for(i=0;i<items.length;i++) t+=items[i][1]; var x=r()*t; for(i=0;i<items.length;i++){ x-=items[i][1]; if(x<=0) return items[i][0]; } return items[0][0]; }
    var STYLE=[['Queen Anne',52],['Second Empire',20],['Folk Victorian',11],['Italianate',5],['Gothic Revival',5]];
    var ROOF=[['mansard',31],['hip',31],['cross_gable',22],['gable',16]];
    var GRID=[[[1,2],74],[[2,2],18],[[2,3],5],[[3,3],3]];
    var TUR=[[8,53],[4,27],[16,13],[6,7]];
    var CLAD=[['clapboard',41],['shingle',34],['brick',21],['board_batten',8]];
    var PORCH=[['partial',56],['wrap',29],['full',11],['none',4]];
    function rand(){ var p=PAL[Math.floor(r()*PAL.length)];
      return {style:pick(STYLE),stories:r()<.52?2:3,width:.85+r()*.35,roof:pick(ROOF),pitch:.7+r()*.6,turret:r()<.28?{sides:pick(TUR),side:r()<.5?-1:1}:null,
        porch:pick(PORCH),clad:pick(CLAD),chimneys:r()<.3?0:r()<.7?1:2,grid:pick(GRID),bay:r()<.39,ginger:r()<.6,paint:{name:p[0],body:p[1],trim:p[2],accent:p[3],sash:p[4]}}; }
    function hsl(hex,dh,ds,dl){ var n=parseInt(hex.slice(1),16), R=(n>>16&255)/255, G=(n>>8&255)/255, B=(n&255)/255, mx=Math.max(R,G,B), mn=Math.min(R,G,B), l=(mx+mn)/2, s=0, h=0, d=mx-mn;
      if(d){ s=l>.5?d/(2-mx-mn):d/(mx+mn); h=mx===R?(G-B)/d+(G<B?6:0):mx===G?(B-R)/d+2:(R-G)/d+4; h/=6; }
      h=(h+dh+1)%1; s=clamp(s+ds,0,1); l=clamp(l+dl,.08,.95);
      function f(p,q,t){ if(t<0)t+=1; if(t>1)t-=1; return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p; }
      var q=l<.5?l*(1+s):l+s-l*s, p2=2*l-q; return '#'+[f(p2,q,h+1/3),f(p2,q,h),f(p2,q,h-1/3)].map(function(c){return ('0'+Math.round(c*255).toString(16)).slice(-2);}).join(''); }
    function clone(g){return JSON.parse(JSON.stringify(g));}
    function locks(){ var L={}; $$('#vic-locks input').forEach(function(i){L[i.getAttribute('data-k')]=i.checked;}); return L; }
    function mutate(g){ var c=clone(g), L=locks(), fresh=rand();
      if(!L.paint){ if(r()<.25) c.paint=fresh.paint; else ['body','trim','accent'].forEach(function(k){ c.paint[k]=hsl(c.paint[k],(r()-.5)*.08,(r()-.5)*.12,(r()-.5)*.1); }); }
      if(!L.roof&&r()<.3){ c.roof=fresh.roof; } c.pitch=clamp(c.pitch+(r()-.5)*.25,.6,1.4);
      if(!L.turret&&r()<.25){ c.turret=c.turret&&r()<.6?null:{sides:pick(TUR),side:r()<.5?-1:1}; }
      if(!L.stories&&r()<.2){ c.stories=c.stories===2?3:2; }
      if(!L.porch&&r()<.25){ c.porch=fresh.porch; }
      if(r()<.2) c.clad=fresh.clad; if(r()<.2) c.grid=fresh.grid; if(r()<.15) c.style=fresh.style;
      if(r()<.2) c.bay=!c.bay; if(r()<.2) c.ginger=!c.ginger; c.width=clamp(c.width+(r()-.5)*.12,.8,1.25); return c; }
    function cross(a,b){ var c={}; Object.keys(a).forEach(function(k){ c[k]=clone(r()<.5?a[k]:b[k]); }); return mutate(c); }
    function svgHouse(g){
      var P=g.paint, sh='', W=88*g.width, fl=32, H=fl*g.stories, x0=90-W/2-(g.turret?g.turret.side*12:0), gy=118, top=gy-H;
      var body=g.clad==='brick'?hsl(P.body,0,-.1,-.08):P.body;
      // chimneys behind the roof
      for(var c=0;c<g.chimneys;c++){ var cx=x0+W*(.25+.5*c); sh+='<rect x="'+(cx-4)+'" y="'+(top-36*g.pitch)+'" width="9" height="'+(36*g.pitch)+'" fill="#7a3b2e"/>'; }
      // roof
      var rh=g.roof==='mansard'?24:30*g.pitch;
      if(g.roof==='mansard') sh+='<path d="M'+(x0-4)+' '+top+' L'+(x0+6)+' '+(top-rh)+' H'+(x0+W-6)+' L'+(x0+W+4)+' '+top+'Z" fill="#4a4f56"/><path d="M'+(x0+4)+' '+(top-rh)+' H'+(x0+W-4)+'" stroke="'+P.trim+'" stroke-width="2"/>'+
        [.3,.7].map(function(f){var dx=x0+W*f;return '<rect x="'+(dx-6)+'" y="'+(top-rh+6)+'" width="12" height="14" fill="'+P.trim+'"/><rect x="'+(dx-4)+'" y="'+(top-rh+8)+'" width="8" height="11" fill="'+P.sash+'"/>';}).join('');
      else if(g.roof==='hip') sh+='<path d="M'+(x0-6)+' '+top+' L'+(x0+W*.28)+' '+(top-rh)+' H'+(x0+W*.72)+' L'+(x0+W+6)+' '+top+'Z" fill="#5a4a42"/>';
      else if(g.roof==='gable') sh+='<path d="M'+(x0-6)+' '+top+' L'+(x0+W/2)+' '+(top-rh*1.2)+' L'+(x0+W+6)+' '+top+'Z" fill="#5a4a42"/>';
      else sh+='<path d="M'+(x0-6)+' '+top+' L'+(x0+W*.3)+' '+(top-rh)+' H'+(x0+W*.7)+' L'+(x0+W+6)+' '+top+'Z" fill="#5a4a42"/><path d="M'+(x0+W*.45)+' '+top+' L'+(x0+W*.72)+' '+(top-rh*1.25)+' L'+(x0+W+4)+' '+top+'Z" fill="'+P.trim+'"/><path d="M'+(x0+W*.5)+' '+(top-1)+' L'+(x0+W*.72)+' '+(top-rh*1.1)+' L'+(x0+W-1)+' '+(top-1)+'Z" fill="'+(g.clad==='shingle'?P.accent:body)+'"/>';
      // body and cladding
      sh+='<rect x="'+x0+'" y="'+top+'" width="'+W+'" height="'+H+'" fill="'+body+'"/>';
      var lines=''; if(g.clad==='clapboard'||g.clad==='shingle') for(var y=top+4;y<gy;y+=4) lines+='M'+x0+' '+y+'h'+W;
      if(g.clad==='board_batten') for(var x=x0+5;x<x0+W;x+=6) lines+='M'+x+' '+top+'v'+H;
      if(g.clad==='brick') for(y=top+3;y<gy;y+=3) lines+='M'+x0+' '+y+'h'+W;
      sh+='<path d="'+lines+'" stroke="rgba(0,0,0,.12)" stroke-width=".7"/>';
      sh+='<rect x="'+(x0-2)+'" y="'+(top-3)+'" width="'+(W+4)+'" height="4" fill="'+P.trim+'"/>';
      // windows with pane grids
      var cols=Math.max(2,Math.round(W/26));
      for(var s=0;s<g.stories;s++) for(var k=0;k<cols;k++){ var wx=x0+W*(k+.5)/cols-6, wy=top+s*fl+7, ww=12, wh=19;
        if(s===g.stories-1&&k===Math.floor(cols/2)&&g.porch!=='none'){ sh+='<rect x="'+(wx-1)+'" y="'+(wy-1)+'" width="'+(ww+2)+'" height="'+(wh+4)+'" fill="'+P.accent+'"/>'; continue; }
        sh+='<rect x="'+(wx-1.5)+'" y="'+(wy-1.5)+'" width="'+(ww+3)+'" height="'+(wh+3)+'" fill="'+P.trim+'"/><rect x="'+wx+'" y="'+wy+'" width="'+ww+'" height="'+wh+'" fill="'+P.sash+'"/>';
        var gc=g.grid[0], gr=g.grid[1], mul='';
        for(var a=1;a<gc;a++) mul+='M'+(wx+ww*a/gc)+' '+wy+'v'+wh; for(a=1;a<gr;a++) mul+='M'+wx+' '+(wy+wh*a/gr)+'h'+ww;
        sh+='<path d="'+mul+'" stroke="'+P.trim+'" stroke-width="1"/>'; }
      if(g.bay) sh+='<path d="M'+(x0+4)+' '+(gy-4)+' v-24 l6 -5 h14 l6 5 v24z" fill="'+body+'" stroke="'+P.trim+'" stroke-width="1.5"/><rect x="'+(x0+11)+'" y="'+(gy-26)+'" width="12" height="17" fill="'+P.sash+'"/>';
      // turret
      if(g.turret){ var tx=g.turret.side<0?x0-14:x0+W-10, tw=24, ttop=top-14, cap=g.turret.sides===4?'M'+tx+' '+ttop+' L'+(tx+tw/2)+' '+(ttop-26)+' L'+(tx+tw)+' '+ttop+'Z':'M'+(tx-2)+' '+ttop+' Q'+(tx+tw/2)+' '+(ttop-8)+' '+(tx+tw/2)+' '+(ttop-36)+' Q'+(tx+tw/2)+' '+(ttop-8)+' '+(tx+tw+2)+' '+ttop+'Z';
        sh+='<rect x="'+tx+'" y="'+ttop+'" width="'+tw+'" height="'+(gy-ttop)+'" fill="'+body+'"/>';
        if(g.turret.sides>4) sh+='<path d="M'+(tx+tw*.3)+' '+ttop+'v'+(gy-ttop)+'M'+(tx+tw*.7)+' '+ttop+'v'+(gy-ttop)+'" stroke="rgba(0,0,0,.15)"/>';
        sh+='<path d="'+cap+'" fill="#4a4f56"/><path d="M'+(tx+tw/2)+' '+(ttop-36)+' v-6" stroke="'+P.accent+'" stroke-width="1.6"/>';
        for(s=0;s<g.stories;s++) sh+='<rect x="'+(tx+7)+'" y="'+(ttop+10+s*fl)+'" width="10" height="16" fill="'+P.sash+'" stroke="'+P.trim+'" stroke-width="1.5"/>'; }
      // porch
      if(g.porch!=='none'){ var px0=g.porch==='partial'?x0+W*.35:x0-(g.porch==='wrap'?8:2), px1=g.porch==='partial'?x0+W+3:x0+W+(g.porch==='wrap'?8:2), py=gy-26;
        sh+='<rect x="'+px0+'" y="'+(py-3)+'" width="'+(px1-px0)+'" height="4" fill="'+P.trim+'"/><rect x="'+px0+'" y="'+(gy-3)+'" width="'+(px1-px0)+'" height="4" fill="#8a7a66"/>';
        for(x=px0+2;x<=px1-2;x+=(px1-px0-4)/Math.max(2,Math.round((px1-px0)/18))){ sh+='<rect x="'+(x-1.2)+'" y="'+py+'" width="2.4" height="23" fill="'+P.trim+'"/>';
          if(g.ginger) sh+='<path d="M'+(x-6)+' '+(py+1)+' q6 1 6 7 q0-6 6-7" stroke="'+P.trim+'" stroke-width="1.2" fill="none"/>'; }
        sh+='<path d="M'+px0+' '+(gy-11)+' H'+px1+'" stroke="'+P.trim+'" stroke-width="1.4"/>'; }
      return '<svg viewBox="0 0 180 166"><g transform="translate(0 32)">'+sh+'</g></svg>';
    }
    var pop=[], sel=[];
    function render(born){
      box.innerHTML=pop.map(function(g,k){ return '<div class="h'+(sel.indexOf(k)>=0?' sel':'')+(born&&born.indexOf(k)>=0?' born':'')+'" data-k="'+k+'" style="animation-delay:'+(k*.05)+'s">'+svgHouse(g)+'<span class="g">'+g.style+'</span></div>'; }).join('');
      $$('.h',box).forEach(function(h){ h.addEventListener('click',function(){ var k=+h.getAttribute('data-k'), i=sel.indexOf(k);
        if(i>=0) sel.splice(i,1); else { sel.push(k); if(sel.length>2) sel.shift(); } render(); dna(); }); });
    }
    function dna(){ var g=pop[sel[0]!=null?sel[0]:4];
      $('#vic-dna').innerHTML='<b>style</b> '+g.style+' · <b>stories</b> '+g.stories+' · <b>roof</b> '+g.roof+' '+g.pitch.toFixed(2)+' · <b>turret</b> '+(g.turret?({4:'square',6:'hexagonal',8:'octagonal',16:'round'})[g.turret.sides]:'none')+
        ' · <b>porch</b> '+g.porch+' · <b>clad</b> '+g.clad+' · <b>panes</b> '+g.grid.join('×')+' · <b>chimneys</b> '+g.chimneys+' · <b>paint</b> '+g.paint.name+
        ' <span style="display:inline-flex;gap:2px;vertical-align:middle">'+['body','trim','accent','sash'].map(function(k){return '<i style="display:inline-block;width:11px;height:11px;border-radius:2px;background:'+g.paint[k]+';box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)"></i>';}).join('')+'</span>'; }
    $('#vic-breed').addEventListener('click',function(){ var k=sel[0]!=null?sel[0]:4, p=pop[k], born=[];
      pop=pop.map(function(g,j){ if(j===k) return g; born.push(j); return mutate(p); }); sel=[k]; render(born); dna(); });
    $('#vic-x').addEventListener('click',function(){ if(sel.length<2) return; var a=pop[sel[0]], b=pop[sel[1]], keep=sel.slice(), born=[];
      pop=pop.map(function(g,j){ if(keep.indexOf(j)>=0) return g; born.push(j); return cross(a,b); }); render(born); dna(); });
    $('#vic-rnd').addEventListener('click',function(){ pop=[]; for(var i=0;i<9;i++) pop.push(rand()); sel=[]; render([0,1,2,3,4,5,6,7,8]); dna(); });
    $('#vic-dist').innerHTML=[['Queen Anne',52],['Second Empire',20],['Folk Vict.',11],['mansard roof',31],['turret',28],['1-over-1',78]].map(function(d){return '<div class="db"><span>'+d[0]+'</span><i style="width:'+d[1]+'%"></i><span>'+d[1]+'%</span></div>';}).join('');
    // start from the Williams House (1856) palette in the centre
    for(var i=0;i<9;i++) pop.push(rand()); pop[4].paint={name:'Williams Taupe',body:'#9a8b7d',trim:'#f5f2ea',accent:'#7c6a58',sash:'#2c3a30'}; pop[4].style='Queen Anne'; pop[4].turret={sides:8,side:1};
    render(); dna();
  })();

  // ================= 17 · dunes: Werner (1995) slab cellular automaton =================
  (function(){
    var cv=$('#dune'); if(!cv) return;
    var slide=cv.closest('.slide'), ctx=cv.getContext('2d'), pc=$('#dune-p').getContext('2d');
    var N=128, M=N-1, h=new Int16Array(N*N), sh=new Uint8Array(N*N), HOP=5, PS=.6, PNS=.4, SLOPE=.803847577, REPOSE=2;
    var img=ctx.createImageData(N,N), running=true, events=0;
    function I(x,y){return ((y&M)<<7)|(x&M);}
    // shadow for one row, swept downwind (+x) twice to wrap around
    function shadowRow(y){ var s=0, b=y<<7; for(var k=0;k<2*N;k++){ var x=k&M, z=h[b|x]; s=Math.max(s-SLOPE,0); if(k>=N) sh[b|x]=(s>z)?1:0; if(z>=s) s=z; } }
    function allShadow(){ for(var y=0;y<N;y++) shadowRow(y); }
    function avalanche(x,y,dir){ // move slabs downhill until no neighbour difference exceeds repose
      for(var guard=0;guard<40;guard++){ var i=I(x,y), z=h[i], bx=x, by=y, bd=REPOSE;
        var nb=[[1,0],[-1,0],[0,1],[0,-1]]; for(var k=0;k<4;k++){ var j=I(x+nb[k][0],y+nb[k][1]), d=dir>0?z-h[j]:h[j]-z; if(d>bd){bd=d;bx=x+nb[k][0];by=y+nb[k][1];} }
        if(bx===x&&by===y) return;
        if(dir>0){ h[i]--; h[I(bx,by)]++; } else { h[I(bx,by)]--; h[i]++; }
        x=bx; y=by; } }
    function event(){
      var x=(Math.random()*N)|0, y=(Math.random()*N)|0, i=I(x,y);
      if(h[i]<=0||sh[i]) return;
      h[i]--; avalanche(x,y,-1); shadowRow(y);
      for(var hop=0;hop<60;hop++){ x=(x+HOP)&M; var j=I(x,y);
        if(sh[j]||Math.random()<(h[j]>0?PS:PNS)){ h[j]++; avalanche(x,y,1); shadowRow(y); return; } }
      h[I(x,y)]++;
    }
    function init(kind){ for(var i=0;i<N*N;i++) h[i]=kind==='flat'?3:Math.max(0,Math.round(3+(Math.random()+Math.random()+Math.random()-1.5)*3)); allShadow(); events=0; }
    function draw(){
      var d=img.data;
      for(var y=0;y<N;y++) for(var x=0;x<N;x++){ var i=I(x,y), z=h[i], sx=h[I(x+1,y)]-h[I(x-1,y)], sy=h[I(x,y+1)]-h[I(x,y-1)];
        var light=clamp(.78-.11*sx-.06*sy,.25,1.15), t=clamp(z/12,0,1), q=i*4;
        d[q]=clamp((176+52*t)*light,0,255); d[q+1]=clamp((138+42*t)*light,0,255); d[q+2]=clamp((86+36*t)*light,0,255); d[q+3]=255; }
      ctx.putImageData(img,0,0);
      // profile along the wind on the middle row
      pc.fillStyle='#fff'; pc.fillRect(0,0,880,128); pc.strokeStyle='#E3D9C6'; pc.beginPath(); pc.moveTo(0,110); pc.lineTo(880,110); pc.stroke();
      pc.fillStyle='rgba(201,166,107,.55)'; pc.strokeStyle='#8A6236'; pc.lineWidth=2; pc.beginPath(); pc.moveTo(0,128);
      for(x=0;x<N;x++) pc.lineTo(x/(N-1)*880,110-h[I(x,64)]*7); pc.lineTo(880,128); pc.closePath(); pc.fill(); pc.stroke();
      pc.fillStyle='#5B636B'; pc.font='600 20px "Noto Sans", Arial'; pc.fillText('profile along the wind · row 64',12,26);
      $('#dune-t').textContent=(events/(N*N)).toFixed(1)+' sweeps';
    }
    loop(slide,function(t,dt){ if(running&&dt>0){ for(var k=0;k<10000;k++) event(); events+=10000; allShadow(); } draw(); });
    $('#dune-run').addEventListener('click',function(){running=!running;this.textContent=running?'Pause':'Run';});
    $('#dune-rnd').addEventListener('click',function(){init('rnd');});
    $('#dune-flat').addEventListener('click',function(){init('flat');});
    init('rnd'); draw();
  })();

  // ================= 18 · the web of models =================
  (function(){
    var svg=$('#web'); if(!svg) return;
    var names=['Geomorphology','Drumstick','Dunes','Live Oak','Tree Atlas','Victorian','Wormstone','Water','Egans Creek'];
    var pos=names.map(function(n,k){ var a=-Math.PI/2+k/names.length*2*Math.PI; return [280+205*Math.cos(a),262+215*Math.sin(a)]; });
    var E=[[0,1,'e1'],[0,8,'e2'],[0,2,'e3'],[1,2,'e4'],[4,3,'e5'],[3,2,'e6'],[0,3,'e7'],[5,4,'e8'],[7,6,'e9'],[6,5,'e9']];
    var LK={e1:['One sea-level file','Drumstick reads the geomorphology app’s sea_level.json (Hawkes 2016) directly.'],
      e2:['The weld made the marsh','The ~5 ka weld trapped the lagoon that the Egans Creek atlas maps today.'],
      e3:['Sacrificial dunes','Hopf: dunes erode in storms to build a protective bar; the automaton shows how wind rebuilds them.'],
      e4:['Waves bring it, wind piles it','Longshore drift delivers the sand that the dune models blow inland.'],
      e5:['4,519 oaks → one','The atlas counts live oaks; the explorer grows a single one in detail.'],
      e6:['The same salt wind','The onshore wind that prunes the oak crown also moves the dune sand.'],
      e7:['Old soil, old trees','Live oak hammocks grow on the weathered Pleistocene core, not on young dune sand.'],
      e8:['Heritage on historic streets','Heritage tree records cluster in the Victorian district downtown.'],
      e9:['Seeded and repeatable','Water, wormstone and the houses all draw from seeds, so a scene can be made again.']};
    E.forEach(function(e){ var a=pos[e[0]],b=pos[e[1]], mx=(a[0]+b[0])/2+(280-(a[0]+b[0])/2)*.25, my=(a[1]+b[1])/2+(262-(a[1]+b[1])/2)*.25;
      el('path',{'class':'ed','data-lens':e[2],d:'M'+a[0]+' '+a[1]+' Q'+mx+' '+my+' '+b[0]+' '+b[1]},svg); });
    names.forEach(function(n,k){ var g=el('g',{'class':'nd','data-lens':'n'+k},svg); el('circle',{cx:pos[k][0],cy:pos[k][1],r:13},g);
      var t=el('text',{x:pos[k][0],y:pos[k][1]+(pos[k][1]<262?-20:30)},g); t.textContent=n; });
    $('#web-links').innerHTML=Object.keys(LK).map(function(k){return '<div class="lk" data-lens="'+k+'"><b>'+LK[k][0]+'</b>'+LK[k][1]+'</div>';}).join('');
    // a node lights its edges and cards
    $$('.nd',svg).forEach(function(g,k){ g.addEventListener('mouseenter',function(){ E.forEach(function(e){ if(e[0]===k||e[1]===k) $$('[data-lens="'+e[2]+'"]',svg.closest('.slide')).forEach(function(x){x.classList.add('hot');}); }); });
      g.addEventListener('mouseleave',function(){ $$('.hot',svg.closest('.slide')).forEach(function(x){x.classList.remove('hot');}); }); });
  })();
})();
