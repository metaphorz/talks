// Florida Hurricane Models — title animation and per-slide drawings.
// Loads before deck.js so the build steps it creates are counted.
(function(){
  var NS='http://www.w3.org/2000/svg';
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(sel,root){return (root||document).querySelector(sel);}
  function $$(sel,root){return [].slice.call((root||document).querySelectorAll(sel));}
  function el(tag,attrs,parent){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
  function txt(parent,x,y,s,cls){var t=el('text',{x:x,y:y,'class':cls||''},parent);t.textContent=s;return t;}
  // call on(true/false) whenever the slide is shown or hidden
  function watch(slide,on){
    if(!slide) return; var was=null;
    function check(){var now=slide.classList.contains('on'); if(now!==was){was=now;on(now);}}
    new MutationObserver(check).observe(slide,{attributes:true,attributeFilter:['class']}); check();
  }
  function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
  function rng(seed){return function(){seed=(seed*16807)%2147483647;return (seed-1)/2146483646;};}
  // Saffir-Simpson colours, as in the Tracks app legend
  var CAT=['#6CA6D9','#3DBB6A','#E9C12E','#EDA33A','#E5852F','#D9503A','#8A4FB5'];
  function catOf(kt){return kt<34?0:kt<64?1:kt<83?2:kt<96?3:kt<113?4:kt<137?5:6;}

  // ================= 1 · title: hurricane tracks recurving across the Atlantic =================
  (function(){
    var cv=$('#tracks'); if(!cv) return;
    var slide=cv.closest('.slide'), ctx=cv.getContext('2d'); ctx.scale(2,2);
    var R=rng(9), T=[], raf=0, last=null, spawn=0;
    function make(){
      return {x:720+R()*230,y:470+R()*150,h:Math.PI*(1.02+R()*.12),turn:.25+R()*.45,sp:28+R()*14,age:0,life:9+R()*7,pts:[],kt:30+R()*10,peak:70+R()*90};
    }
    for(var i=0;i<10;i++){ var t=make(); for(var k=0;k<60+i*25;k++) step(t,.12); T.push(t); }
    function step(t,dt){
      t.age+=dt;
      var u=t.age/t.life;                               // heading swings from west to north-east (recurvature)
      t.h-= t.turn*dt*(u>.35?1.4:.35);
      var sp=t.sp*(u>.5?1+1.2*(u-.5):1);
      t.x+=Math.cos(t.h)*sp*dt; t.y+=Math.sin(t.h)*sp*dt;
      t.kt=Math.max(25,t.peak*Math.sin(Math.min(Math.PI,u*Math.PI*1.05)));
      t.pts.push([t.x,t.y,t.kt]); if(t.pts.length>220) t.pts.shift();
    }
    function draw(){
      ctx.clearRect(0,0,960,720);
      ctx.strokeStyle='rgba(127,196,192,.07)'; ctx.lineWidth=1;
      for(var gx=480;gx<=960;gx+=60){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,720);ctx.stroke();}
      for(var gy=60;gy<=720;gy+=60){ctx.beginPath();ctx.moveTo(480,gy);ctx.lineTo(960,gy);ctx.stroke();}
      T.forEach(function(t){
        for(var i=1;i<t.pts.length;i++){ var a=t.pts[i-1], b=t.pts[i], fade=i/t.pts.length*(t.age>t.life?Math.max(0,1-(t.age-t.life)/2):1);
          ctx.strokeStyle=CAT[catOf(b[2])]; ctx.globalAlpha=.85*fade; ctx.lineWidth=1.6+b[2]/60;
          ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); }
        var p=t.pts[t.pts.length-1]; if(p&&t.age<t.life){ ctx.globalAlpha=1; ctx.fillStyle='#F7F3EA'; ctx.beginPath(); ctx.arc(p[0],p[1],2.6,0,6.283); ctx.fill(); }
      });
      ctx.globalAlpha=1;
    }
    function frame(now){
      var dt=last?Math.min(.05,(now-last)/1000):.016; last=now;
      spawn-=dt; if(spawn<=0&&T.length<16){ T.push(make()); spawn=.8+R()*.9; }
      T.forEach(function(t){ if(t.age<t.life) step(t,dt*1.6); else t.age+=dt; });
      T=T.filter(function(t){return t.age<t.life+2;});
      draw(); raf=requestAnimationFrame(frame);
    }
    if(reduce){ draw(); return; }
    watch(slide,function(on){ cancelAnimationFrame(raf); last=null; if(on) raf=requestAnimationFrame(frame); });
  })();

  // ================= 2 · the chain, and where each app sits =================
  (function(){
    var svg=$('#chain'); if(!svg) return;
    var S=[['TRACKS','Where storms go','meteorology · statistics'],['WIND','How strong, where','meteorology'],['DAMAGE','What wind does|to a structure','vulnerability (engineering)'],['LOSS','What it costs','actuarial science']];
    var X=[106,318,530,742], W=184;
    for(var i=0;i<3;i++) el('path',{'class':'flow',d:'M'+(X[i]+W/2+4)+' 75 L'+(X[i+1]-W/2-4)+' 75'},svg);
    S.forEach(function(s,i){ var g=el('g',{'class':'stage',transform:'translate('+X[i]+' 75)'},svg);
      el('rect',{x:-W/2,y:-48,width:W,height:96,rx:14},g); txt(g,0,-24,(i+1)+' · '+s[0],'n');
      var lines=s[1].split('|'); lines.forEach(function(l,k){ txt(g,0,(lines.length>1?-6:4)+k*20,l,'t'); });   // '|' breaks a long title
      txt(g,0,lines.length>1?35:26,s[2],'d'); });
    // [build, from stage, to stage, colour, name, what]
    var A=[[1,0,1,'#5B636B','1 · meteoearth','the winds that steer a storm, the warm air that feeds it'],[2,0,0,'#2F6FA3','2 · Synthetic Tracks','storms like real ones'],[3,1,1,'#B5562F','3 · Storm Animator','three windfields, hourly'],[4,1,3,'#1D6E73','4 · Pro Team Multimodel','wind → damage → loss on the Form S-6 grid, with sensitivity and uncertainty']];
    var links=el('g',{},svg), bars=el('g',{},svg);             // connectors sit behind every bar
    A.forEach(function(a,k){
      var g=el('g',{'class':'bar','data-b':a[0]},bars), lg=el('g',{'data-b':a[0]},links), x0=X[a[1]]-W/2, x1=X[a[2]]+W/2, y=160+k*72;
      el('path',{d:'M'+(X[a[1]]-W/2+24)+' 124 L'+(X[a[1]]-W/2+24)+' '+y,stroke:a[3],'stroke-width':2,'stroke-dasharray':'3 4',fill:'none'},lg);
      if(a[2]!==a[1]) el('path',{d:'M'+(X[a[2]]+W/2-24)+' 124 L'+(X[a[2]]+W/2-24)+' '+y,stroke:a[3],'stroke-width':2,'stroke-dasharray':'3 4',fill:'none'},lg);
      el('rect',{x:x0,y:y,width:x1-x0,height:56,fill:a[3]},g);
      txt(g,x0+16,y+23,a[4]); txt(g,x0+16,y+42,a[5],'s');
    });
    txt(svg,424,458,'Computer/Information runs underneath all of it: every link is software, and every one is audited.','d').setAttribute('style','font-size:13px;fill:var(--grey);text-anchor:middle;font-style:italic');
  })();

  // ================= 3 · meteoearth: wind particles through trades, westerlies and a hurricane =================
  (function(){
    var cv=$('#flow'); if(!cv) return;
    var slide=cv.closest('.slide'), ctx=cv.getContext('2d'); ctx.scale(2,2);
    var W=472,H=430, R=rng(21), N=1400, P=[], raf=0, t=0;
    var CX=250, CY=230;                                       // the hurricane's eye
    function wind(x,y){
      var lat=1-y/H;                                          // 0 south (tropics) .. 1 north
      var u=lat<.45?-1.1:lat>.62?1.5:-1.1+(lat-.45)/.17*2.6;  // trades blow west, westerlies east
      var v=.15*Math.sin(x/70+t*.2);
      var dx=x-CX, dy=y-CY, r=Math.hypot(dx,dy)+1, Rm=26, vt=r<Rm?r/Rm:Math.pow(Rm/r,.6);
      u+=  4.2*vt*dy/r - 1.1*vt*dx/r;                          // counter-clockwise on screen, with inflow
      v+= -4.2*vt*dx/r - 1.1*vt*dy/r;
      return [u,v];
    }
    function spawn(p){ p.x=R()*W; p.y=R()*H; p.age=0; p.life=40+R()*80; return p; }
    for(var i=0;i<N;i++) P.push(spawn({}));
    function speedCol(s){ return s<1.2?'rgba(120,170,200,.55)':s<2.4?'rgba(140,210,190,.7)':s<3.4?'rgba(233,193,46,.8)':'rgba(229,133,47,.9)'; }
    function frame(){
      t+=.016;
      ctx.fillStyle='rgba(14,20,25,.18)'; ctx.fillRect(0,0,W,H);
      ctx.lineWidth=1.1;
      for(var i=0;i<N;i++){ var p=P[i], w=wind(p.x,p.y), s=Math.hypot(w[0],w[1]);
        ctx.strokeStyle=speedCol(s); ctx.beginPath(); ctx.moveTo(p.x,p.y); p.x+=w[0]; p.y+=w[1]; ctx.lineTo(p.x,p.y); ctx.stroke();
        if(++p.age>p.life||p.x<0||p.x>W||p.y<0||p.y>H||Math.hypot(p.x-CX,p.y-CY)<6) spawn(p); }
      ctx.fillStyle='#F7F3EA'; ctx.font='700 12px Noto Sans';
      ctx.fillText('westerlies →',24,40); ctx.fillText('← trade winds',360,410); ctx.fillText('hurricane',CX-28,CY+52);
      raf=requestAnimationFrame(frame);
    }
    ctx.fillStyle='#0E1419'; ctx.fillRect(0,0,W,H);
    if(reduce){ for(var k=0;k<60;k++) frame(); cancelAnimationFrame(raf); return; }
    watch(slide,function(on){ cancelAnimationFrame(raf); if(on) raf=requestAnimationFrame(frame); });
  })();

  // ================= 5 · tracks: a storm stopped at a cutoff, and its possible futures =================
  (function(){
    var cv=$('#fan'); if(!cv) return;
    var slide=cv.closest('.slide'), ctx=cv.getContext('2d'); ctx.scale(2,2);
    // a schematic Florida peninsula (not to scale)
    var FL=[[60,40],[230,40],[236,70],[214,120],[222,190],[244,262],[252,320],[238,372],[214,396],[196,384],[188,340],[170,300],[150,250],[128,210],[110,170],[98,120],[60,104]];
    function inFL(x,y){ var c=false; for(var i=0,j=FL.length-1;i<FL.length;j=i++){ var a=FL[i],b=FL[j]; if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])) c=!c; } return c; }
    var OBS=[[468,410],[440,392],[412,372],[386,350],[364,326],[346,302],[334,278]], N=40, raf=0, seed=3, M=[], t0=null;
    function members(){
      var R=rng(seed++), out=[];
      for(var m=0;m<N;m++){
        var x=334,y=278, h=Math.atan2(-24,-12)+(R()-.5)*.25, sp=12+R()*5, pts=[[x,y]], hit=false, bend=(R()-.35)*.06;
        for(var k=0;k<22;k++){ h+=bend+(R()-.5)*.18; x+=Math.cos(h)*sp; y+=Math.sin(h)*sp; pts.push([x,y]); if(!hit&&inFL(x,y)) hit=k; }
        out.push({pts:pts,hit:hit});
      }
      return out;
    }
    function draw(u){
      ctx.clearRect(0,0,472,430);
      ctx.fillStyle='#E9DDC7'; ctx.strokeStyle='#C9BFAE'; ctx.lineWidth=1.5; ctx.beginPath(); FL.forEach(function(p,i){ i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]); }); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#8A6236'; ctx.font='italic 600 13px Noto Sans'; ctx.fillText('Florida (schematic)',96,74);
      var n=Math.floor(u*22), hits=0;
      M.forEach(function(m){
        ctx.strokeStyle=m.hit!==false&&m.hit<=n?'rgba(201,133,47,.75)':'rgba(29,110,115,.35)'; ctx.lineWidth=1.4; ctx.beginPath();
        for(var k=0;k<=n&&k<m.pts.length;k++){ var p=m.pts[k]; k?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]); } ctx.stroke();
        if(m.hit!==false&&m.hit<=n) hits++;
      });
      ctx.strokeStyle='#20252B'; ctx.lineWidth=3; ctx.beginPath(); OBS.forEach(function(p,i){ i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]); }); ctx.stroke();
      ctx.fillStyle='#C9852F'; ctx.beginPath(); ctx.arc(334,278,6,0,6.283); ctx.fill();
      ctx.fillStyle='#20252B'; ctx.font='700 13px Noto Sans'; ctx.fillText('observed',388,388); ctx.fillText('cutoff',346,274);
      ctx.fillStyle='#1D6E73'; ctx.font='700 14px Noto Sans'; ctx.fillText(N+' possible continuations',272,30);
      ctx.fillStyle='#C9852F'; ctx.fillText('Florida landfall: '+Math.round(hits/N*100)+'%',272,50);
    }
    function frame(t){ if(t0===null){ t0=t; M=members(); } var u=(t-t0)/3600; if(u>1.6){ t0=t; M=members(); u=0; } draw(Math.min(1,u)); raf=requestAnimationFrame(frame); }
    M=members(); draw(1);
    if(!reduce) watch(slide,function(on){ cancelAnimationFrame(raf); t0=null; if(on) raf=requestAnimationFrame(frame); });
  })();

  // ================= 5 · storm animator: wind profiles, and the stronger right side =================
  (function(){
    var svg=$('#prof'); if(!svg) return;
    var slide=svg.closest('.slide');
    var X0=56,X1=452,Y0=396,Y1=186, RMAX=200, VMAX=80;   // chart area: r 0–200 km, V 0–80 m/s
    function sx(r){return X0+r/RMAX*(X1-X0);} function sy(v){return Y0-v/VMAX*(Y0-Y1);}
    var ax=el('g',{},svg);
    el('line',{x1:X0,y1:Y0,x2:X1,y2:Y0,stroke:'#5B636B','stroke-width':1.5},ax); el('line',{x1:X0,y1:Y0,x2:X0,y2:Y1-6,stroke:'#5B636B','stroke-width':1.5},ax);
    [0,50,100,150,200].forEach(function(r){ txt(ax,sx(r),Y0+16,r,'').setAttribute('style','font-size:11px;fill:#5B636B;text-anchor:middle'); });
    [0,20,40,60,80].forEach(function(v){ txt(ax,X0-8,sy(v)+4,v,'').setAttribute('style','font-size:11px;fill:#5B636B;text-anchor:end'); el('line',{x1:X0,y1:sy(v),x2:X1,y2:sy(v),stroke:'#ECE4D4'},ax); });
    txt(ax,(X0+X1)/2,Y0+32,'distance from the centre (km)','').setAttribute('style','font-size:12px;fill:#5B636B;text-anchor:middle');
    var yl=txt(ax,18,(Y0+Y1)/2,'wind (m/s)',''); yl.setAttribute('style','font-size:12px;fill:#5B636B;text-anchor:middle'); yl.setAttribute('transform','rotate(-90 18 '+((Y0+Y1)/2)+')');
    var rm=el('line',{x1:sx(30),y1:Y0,x2:sx(30),y2:Y1,stroke:'#C9852F','stroke-dasharray':'4 4'},ax);
    txt(ax,sx(30)+5,Y1+10,'R max','').setAttribute('style','font-size:11px;font-weight:700;fill:#C9852F');
    var hol=el('path',{fill:'none',stroke:'#1D6E73','stroke-width':3},svg), wil=el('path',{fill:'none',stroke:'#B5562F','stroke-width':3,'stroke-dasharray':'7 5'},svg);
    var lg=el('g',{transform:'translate(300 200)'},svg);
    el('line',{x1:0,y1:0,x2:24,y2:0,stroke:'#1D6E73','stroke-width':3},lg); txt(lg,30,4,'Holland','').setAttribute('style','font-size:12.5px;font-weight:700;fill:#1D6E73');
    el('line',{x1:0,y1:20,x2:24,y2:20,stroke:'#B5562F','stroke-width':3,'stroke-dasharray':'7 5'},lg); txt(lg,30,24,'Willoughby','').setAttribute('style','font-size:12.5px;font-weight:700;fill:#B5562F');
    var DP=6000, RHO=1.15, F=5e-5, RM=30;
    function holland(r,B){ r=Math.max(r,.5)*1000; var a=Math.pow(RM*1000/r,B); return Math.sqrt(B*DP/RHO*a*Math.exp(-a)+Math.pow(r*F/2,2))-r*F/2; }
    function willo(r,vm){ return r<RM?vm*Math.pow(r/RM,1.1):vm*Math.exp(-(r-RM)/110); }
    function path(fn){ var d=''; for(var r=0;r<=RMAX;r+=2){ d+=(r?' L':'M')+sx(r).toFixed(1)+' '+sy(Math.max(0,fn(r))).toFixed(1); } return d; }
    var B=1.5, shown=1.5, raf=0;
    function paint(b){ hol.setAttribute('d',path(function(r){return holland(r,b);})); var vm=0; for(var r=2;r<120;r+=1) vm=Math.max(vm,holland(r,b)); wil.setAttribute('d',path(function(r){return willo(r,vm);})); }
    paint(B);
    $$('#prof-ctl button').forEach(function(btn){ btn.addEventListener('click',function(){
      $$('#prof-ctl button').forEach(function(x){x.classList.toggle('on',x===btn);});
      var from=shown, to=+btn.getAttribute('data-hb'), t0=null;
      (function step(t){ if(t0===null) t0=t; var u=reduce?1:Math.min(1,(t-t0)/600); shown=from+(to-from)*ease(u); paint(shown); if(u<1) requestAnimationFrame(step); })(performance.now());
    }); });
    $('#prof-ctl').setAttribute('data-noadvance','');
    // the moving storm: wind arrows = rotation + translation, longer on the right of the motion
    var top=el('g',{},svg), sg=el('g',{},top);
    txt(top,236,22,'Moving east: the right side (south) adds the storm’s speed','').setAttribute('style','font-size:12.5px;font-weight:700;fill:#20252B;text-anchor:middle');
    el('line',{x1:30,y1:96,x2:442,y2:96,stroke:'#E3D9C6','stroke-dasharray':'4 6'},top);
    el('circle',{r:8,fill:'#243846'},sg);
    var arrows=[]; for(var k=0;k<12;k++){ var a=el('line',{stroke:'#1D6E73','stroke-width':2.4,'stroke-linecap':'round'},sg); arrows.push(a); }
    function storm(t){
      var x=60+((t/80)%380); sg.setAttribute('transform','translate('+x+' 96)');
      arrows.forEach(function(a,k){ var th=k/12*2*Math.PI, r=34, px=r*Math.cos(th), py=r*Math.sin(th);
        var vx=py/r*14, vy=-px/r*14; vx+=8;                    // counter-clockwise rotation (screen y down) plus eastward motion
        var L=Math.hypot(vx,vy); a.setAttribute('x1',px); a.setAttribute('y1',py); a.setAttribute('x2',px+vx*1.4); a.setAttribute('y2',py+vy*1.4);
        a.setAttribute('stroke',L>17?'#D9503A':L>10?'#C9852F':'#6CA6D9'); });
    }
    storm(0);
    function frame(t){ storm(t); raf=requestAnimationFrame(frame); }
    if(!reduce) watch(slide,function(on){ cancelAnimationFrame(raf); if(on) raf=requestAnimationFrame(frame); });
  })();

  // ================= 7 · multimodel: the Form S-6 grid, and a storm crossing it =================
  (function(){
    var svg=$('#grid'); if(!svg) return;
    var slide=svg.closest('.slide');
    // land (1) / water (0), rows north (ns = 45) to south (ns = −15), columns east (ew = 0) to west (ew = 117), from the Form S-6 Land-Water ID sheet
    var MASK='0011111111111111111111111111111111111111|0011111111111111111111111111111111111111|0011111111111111111111111111111111111111|0011111111111111111111111111111111111110|0011111111111111111111111111111111111110|0001111111111111111111111111111111111110|0001111111111111111111111111111111111110|0001111111111111111111111111111111111110|0001111111111111111111111111111111111110|0001111111111111111111111111111111111110|0001111111111111111111111111111111111100|0001111111111111111111111111111111111000|0001111111111111111111111111111111111000|0001111111111111111111111111111111111000|0000111111111111111111111111111111111000|0001011111111111111111111111110110000000|0000011111111111111111111111101000000000|0000111111111111111111111111110000000000|0000001111111111111111111101100000000000|0000101111111111111111111111000000000000|0000000111111111111111111110000000000000'.split('|');
    function sx(ew){return 446-ew/117*410;} function sy(ns){return 340-(ns+15)/60*250;}
    var P=[];
    MASK.forEach(function(row,ri){ var ns=45-ri*3; for(var ci=0;ci<40;ci++){ var ew=ci*3, land=row[ci]==='1';
      var c=el('circle',{cx:sx(ew),cy:sy(ns),r:3.4,fill:land?'#C9BFAE':'#9FC5D6'},svg); P.push({ew:ew,ns:ns,land:land,c:c,peak:0}); } });
    el('line',{x1:sx(-6),y1:sy(0),x2:sx(123),y2:sy(0),stroke:'#B5412F','stroke-width':1.5,'stroke-dasharray':'5 4'},svg);
    txt(svg,sx(9),sy(0)-10,'landfall','').setAttribute('style','font-size:11px;font-weight:700;fill:#B5412F;text-anchor:middle');
    txt(svg,236,30,'Form S-6 grid · 40 × 21 = 840 points · track due west','').setAttribute('style','font-size:12.5px;font-weight:700;fill:#20252B;text-anchor:middle');
    var eye=el('g',{},svg); el('circle',{r:14,fill:'none',stroke:'#243846','stroke-width':2,'stroke-dasharray':'3 3'},eye); el('circle',{r:4,fill:'#243846'},eye);
    var lab=txt(svg,236,392,'','');lab.setAttribute('style','font-size:12px;fill:#5B636B;text-anchor:middle');
    var LEG=[[0,'#C9BFAE','< 40 mph'],[50,'#9FD3C7','40–73'],[75,'#E9C12E','74–95'],[100,'#E5852F','96–110'],[125,'#D9503A','111+']];
    LEG.forEach(function(l,i){ var g=el('g',{transform:'translate('+(90+i*64)+' 412)'},svg); el('circle',{r:5,fill:l[1]},g); txt(g,10,4,l[2],'').setAttribute('style','font-size:11px;fill:#5B636B'); });
    function col(v){ return v<40?null:v<74?'#9FD3C7':v<96?'#E9C12E':v<111?'#E5852F':'#D9503A'; }
    // Holland wind in mph at distance d (statute miles), plus motion on the right (north) side, minus 15% over land
    function wind(d,dy,land,inland){ var R=12, B=1.6, a=Math.pow(R/Math.max(d,.5),B), v=135*Math.exp(-inland/260)*Math.sqrt(a*Math.exp(1-a)); v+=12*Math.max(-1,Math.min(1,dy/R))*Math.min(1,d/R); return land?v*.85:v; }
    var raf=0, t0=null;
    function frame(t){
      if(t0===null){ t0=t; P.forEach(function(p){p.peak=0;p.c.setAttribute('fill',p.land?'#C9BFAE':'#9FC5D6');}); }
      var u=(t-t0)/7000, ewc=-24+u*170;                       // storm centre moves west across the grid
      if(u>1.35){ t0=null; raf=requestAnimationFrame(frame); return; }
      eye.setAttribute('transform','translate('+sx(ewc)+' '+sy(0)+')'); eye.style.opacity=u<1?1:0;
      P.forEach(function(p){ var dx=p.ew-ewc, dy=p.ns, d=Math.hypot(dx,dy), v=wind(d,dy,p.land,Math.max(0,ewc-9));
        if(v>p.peak){ p.peak=v; var c=col(v); if(c) p.c.setAttribute('fill',c); } });
      lab.textContent=u<1?'each point keeps the peak wind it has seen so far':'the peak-wind footprint: strongest near landfall and north of the track, fading inland';
      raf=requestAnimationFrame(frame);
    }
    if(!reduce) watch(slide,function(on){ cancelAnimationFrame(raf); t0=null; if(on) raf=requestAnimationFrame(frame); });
  })();

  // ================= 6 · storm animator live: switch storms and models =================
  (function(){
    var f=$('#sa-frame'), open=$('#sa-open'); if(!f) return;
    $$('#sa-feed button').forEach(function(b){ b.addEventListener('click',function(){
      $$('#sa-feed button').forEach(function(x){x.classList.toggle('on',x===b);});
      var s=b.getAttribute('data-src'); f.setAttribute('src',s); open.setAttribute('href',s);
    }); });
  })();

  // ================= live apps: load when first shown, pass the clicker through =================
  $$('#stage iframe[data-src]').forEach(function(f){
    var slide=f.closest('.slide'), wait=f.parentNode.querySelector('.wait');
    f.addEventListener('load',function(){
      if(wait) wait.remove();
      try{ f.contentWindow.addEventListener('keydown',function(e){
        var tag=(e.target.tagName||'').toLowerCase();
        if((e.key==='PageDown'||e.key==='PageUp')&&tag!=='textarea'&&tag!=='input'){ e.preventDefault(); document.dispatchEvent(new KeyboardEvent('keydown',{key:e.key})); }
      }); }catch(err){}
    });
    watch(slide,function(on){ if(on&&!f.getAttribute('src')) f.setAttribute('src',f.getAttribute('data-src')); });
  });
})();
