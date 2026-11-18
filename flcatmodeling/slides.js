// Certifying a Hurricane Model — title animation and per-slide interactions.
// Loads before deck.js so the build steps it creates are counted.
(function(){
  var NS='http://www.w3.org/2000/svg';
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(sel,root){return (root||document).querySelector(sel);}
  function $$(sel,root){return [].slice.call((root||document).querySelectorAll(sel));}
  function el(tag,attrs,parent){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
  function txt(parent,x,y,s,cls){var t=el('text',{x:x,y:y,'class':cls||''},parent);t.textContent=s;return t;}
  function slideOf(sel){return $('#stage '+sel);}
  // call on(true/false) whenever the slide is shown or hidden
  function watch(slide,on){
    if(!slide) return; var was=null;
    function check(){var now=slide.classList.contains('on'); if(now!==was){was=now;on(now);}}
    new MutationObserver(check).observe(slide,{attributes:true,attributeFilter:['class']}); check();
  }
  function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
  function arrowDefs(svg,id,color){
    var d=el('defs',{},svg), m=el('marker',{id:id,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'},d);
    el('path',{d:'M0 0 L10 5 L0 10 z',fill:color},m);
  }
  // a labelled box centred on (x,y)
  function box(parent,x,y,w,h,title,desc,cls){
    var g=el('g',{'class':'box '+(cls||''),transform:'translate('+x+' '+y+')'},parent);
    el('rect',{x:-w/2,y:-h/2,width:w,height:h,rx:12},g);
    txt(g,0,desc?-3:5,title,'t'); if(desc) txt(g,0,14,desc,'d');
    g.c={x:x,y:y,w:w,h:h}; return g;
  }
  // where the line from a toward b leaves a's box
  function edge(a,b,pad){
    pad=pad||4; var dx=b.x-a.x, dy=b.y-a.y; if(!dx&&!dy) return {x:a.x,y:a.y};
    var t=Math.min(dx?(a.w/2+pad)/Math.abs(dx):1e9, dy?(a.h/2+pad)/Math.abs(dy):1e9);
    return {x:a.x+dx*t,y:a.y+dy*t};
  }
  function link(parent,A,B,label,opt){
    opt=opt||{}; var a=A.c||A, b=B.c||B, p=edge(a,b,3), q=edge(b,a,7), d;
    if(opt.bend){ var mx=(p.x+q.x)/2, my=(p.y+q.y)/2, L=Math.hypot(q.x-p.x,q.y-p.y), cx=mx-(q.y-p.y)/L*opt.bend, cy=my+(q.x-p.x)/L*opt.bend;
      d='M'+p.x+' '+p.y+' Q'+cx+' '+cy+' '+q.x+' '+q.y; var lx=(p.x+2*cx+q.x)/4, ly=(p.y+2*cy+q.y)/4; }
    else { d='M'+p.x+' '+p.y+' L'+q.x+' '+q.y; lx=(p.x+q.x)/2; ly=(p.y+q.y)/2; }
    var path=el('path',{'class':'lnk '+(opt.cls||''),d:d,'marker-end':'url(#'+(opt.arrow||'ar')+')'},parent);
    var t=null; if(label){ t=txt(parent,lx+(opt.dx||0),ly+4+(opt.dy||0),label,'lab'); }
    return {path:path,label:t};
  }

  // ---------------- the six groups of standards (from the ROA table of contents) ----------------
  var GROUPS=[
    {k:'G',n:'General',c:'var(--g)',lead:'Team leader · whole team',forms:7,S:[['G-1','Scope of the model and its implementation','Scope'],['G-2','Qualifications of personnel and consultants','Personnel'],['G-3','Artificial intelligence use','AI use'],['G-4','Editorial compliance','Editorial']]},
    {k:'M',n:'Meteorology',c:'var(--m)',lead:'Meteorologists',forms:4,S:[['M-1','Model base hurricane set','Base hurricane set'],['M-2','Meteorological overview and parameters','Parameters'],['M-3','Hurricane probability distributions','Probabilities'],['M-4','Hurricane windfield structure','Windfield'],['M-5','Intensity change methodologies','Intensity change'],['M-6','Logical relationships of hurricane characteristics','Logical relations']]},
    {k:'S',n:'Statistics',c:'var(--s)',lead:'Statisticians',forms:6,S:[['S-1','Modeled results and goodness-of-fit','Goodness-of-fit'],['S-2','Sensitivity analysis for model output','Sensitivity'],['S-3','Uncertainty analysis for model output','Uncertainty'],['S-4','County level aggregation','County totals'],['S-5','Replication of known hurricane losses','Known losses'],['S-6','Comparison of projected loss costs','Loss cost comparison']]},
    {k:'V',n:'Vulnerability',c:'var(--v)',lead:'Structural engineers',forms:5,S:[['V-1','Building vulnerability functions','Buildings'],['V-2','Contents vulnerability functions','Contents'],['V-3','Time element vulnerability functions','Time element'],['V-4','Mitigation measures and secondary characteristics','Mitigation']]},
    {k:'A',n:'Actuarial',c:'var(--a)',lead:'Actuaries',forms:7,S:[['A-1','Loss cost and probable maximum loss considerations','Loss cost & PML'],['A-2','Independence of model components','Independent'],['A-3','Insured exposure','Exposure'],['A-4','Hurricane events resulting in modeled losses','Events'],['A-5','Model input data and output reports','Inputs & outputs'],['A-6','Hurricane coverages','Coverages'],['A-7','Policy limits and deductibles','Limits & deductibles'],['A-8','Loss outputs and logical relationships to risk','Logical relations']]},
    {k:'CI',n:'Computer/Information',c:'var(--ci)',lead:'Computer/information scientists',forms:0,S:[['CI-1','General system traceability and change tracking','Traceability'],['CI-2','AI-based software engineering','AI-based SWE'],['CI-3','Model documentation','Documents'],['CI-4','Model requirements','Requirements'],['CI-5','Organization and component design','Design'],['CI-6','Model implementation','Code'],['CI-7','Implementation verification','Verification'],['CI-8','Human-computer interaction','HCI'],['CI-9','Maintenance and revision','Maintenance'],['CI-10','Model security','Security']]}
  ];

  // keep clicks on interactive boards from advancing the slide
  ['#roa-groups'].forEach(function(s){$$(s).forEach(function(e){e.setAttribute('data-noadvance','');});});

  // ================= 1 · title: a hurricane seen from above =================
  (function(){
    var cv=$('#storm'); if(!cv) return;
    var slide=cv.closest('.slide'), ctx=cv.getContext('2d'); ctx.scale(2,2);
    var CX=712, CY=350, R=290, N=1300, P=[];
    var seed=5; function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
    function spawn(p,outer){ p.r=outer?R*(.85+rnd()*.15):34+Math.pow(rnd(),.8)*R; p.a=rnd()*6.283; p.s=.6+rnd()*.9; return p; }
    for(var i=0;i<N;i++) P.push(spawn({},false));
    function band(a,r){ var v=.5+.5*Math.cos(2*(a+1.9*Math.log(r))); return Math.pow(v,2.2); }
    var last=null, raf=0, running=false;
    function frame(now){
      if(!running) return;
      var dt=last?Math.min(.05,(now-last)/1000):.016; last=now;
      ctx.clearRect(0,0,960,720);
      // eye and eyewall glow
      var g=ctx.createRadialGradient(CX,CY,0,CX,CY,90);
      g.addColorStop(0,'rgba(10,14,18,.9)'); g.addColorStop(.32,'rgba(10,14,18,.6)'); g.addColorStop(.55,'rgba(220,235,232,.16)'); g.addColorStop(1,'rgba(220,235,232,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(CX,CY,90,0,6.283); ctx.fill();
      ctx.lineCap='round';
      for(var i=0;i<N;i++){
        var p=P[i], w=p.s*95/Math.pow(p.r,.75);           // faster near the eye
        var a0=p.a; p.a-=w*dt;                               // counter-clockwise, as seen from above in the north
        p.r-=dt*(4+60/p.r);                                  // slow inflow
        if(p.r<34) spawn(p,true);
        var b=band(p.a,p.r), edgeF=Math.min(1,(R-p.r)/80), wall=p.r<75?.6:0;
        var al=(.02+.62*b+wall)*edgeF; if(al<.05) continue;
        var tail=Math.min(.5,w*.22);
        ctx.strokeStyle='rgba('+(200+40*b|0)+','+(222+20*b|0)+','+(228+20*b|0)+','+al.toFixed(3)+')';
        ctx.lineWidth=.8+1.6*b;
        ctx.beginPath(); ctx.arc(CX,CY,p.r,p.a,p.a+tail,false); ctx.stroke();
      }
      raf=requestAnimationFrame(frame);
    }
    if(reduce){ running=true; frame(0); running=false; return; }
    watch(slide,function(on){ running=on; last=null; cancelAnimationFrame(raf); if(on) raf=requestAnimationFrame(frame); });
  })();

  // ================= 2 · how it began: Andrew, and counters that run up =================
  (function(){
    var cv=$('#andrew'); if(!cv) return;
    var slide=cv.closest('.slide'), ctx=cv.getContext('2d'), raf=0;
    function frame(t){
      ctx.clearRect(0,0,600,600); ctx.save(); ctx.translate(300,300); ctx.rotate(-t/5000);
      for(var k=0;k<3;k++){ ctx.rotate(2.094);
        for(var i=0;i<40;i++){ var r=40+i*6, a=i*.09; ctx.fillStyle='rgba(220,235,232,'+(.5-i*.011).toFixed(3)+')'; ctx.beginPath(); ctx.arc(r*Math.cos(a),r*Math.sin(a),9-i*.15,0,6.283); ctx.fill(); } }
      ctx.fillStyle='#141C22'; ctx.beginPath(); ctx.arc(0,0,26,0,6.283); ctx.fill(); ctx.restore();
      raf=requestAnimationFrame(frame);
    }
    function count(){ $$('.cnt',slide).forEach(function(c){
      var to=+c.getAttribute('data-to'), dec=+(c.getAttribute('data-dec')||0), pre=c.getAttribute('data-pre')||'', post=c.getAttribute('data-post')||'', t0=null;
      if(reduce) return;
      (function step(t){ if(t0===null) t0=t; var u=Math.min(1,(t-t0)/1600); c.textContent=pre+(to*ease(u)).toFixed(dec)+post; if(u<1) requestAnimationFrame(step); })(performance.now());
      setTimeout(function(){ c.textContent=pre+to.toFixed(dec)+post; },1800);
    }); }
    watch(slide,function(on){ cancelAnimationFrame(raf); if(on){ count(); if(!reduce) raf=requestAnimationFrame(frame); else frame(0); } });
  })();

  // ================= 3 · why: a timeline that builds =================
  (function(){
    var svg=$('#why'); if(!svg) return;
    var Y=190, x=function(yr){return 30+(yr-1990)*21.3;};
    el('line',{'class':'axis',x1:20,y1:Y,x2:830,y2:Y},svg);
    for(var yr=1990;yr<=2027;yr++){ var big=yr%5===0; el('line',{'class':'tick',x1:x(yr),y1:Y-(big?7:4),x2:x(yr),y2:Y+(big?7:4)},svg); if(big) txt(svg,x(yr),Y+24,yr,'yr'); }
    // [year, label x, above?, heading, detail lines, big]
    var E=[
      [1992,40,1,'Hurricane Andrew','Insured losses far beyond what|rates had assumed. Insurers fail.'],
      [1993,150,0,'The Cat Fund','Florida Hurricane Catastrophe|Fund: reinsurance for insurers'],
      [1995,262,1,'s. 627.0628, F.S.','The Legislature creates the|Commission: a panel of experts',1],
      [1996,380,0,'Audits begin','First standards, June 3, 1996;|Professional Team reviews start'],
      [2009,500,1,'Every two years','Standards revised in every|odd-numbered year'],
      [2014,600,0,'Flood','Flood models added to the|Commission’s work'],
      [2025,690,1,'2025 standards','Adopted October 28, 2025;|reviews in 2027',1]
    ];
    E.forEach(function(e,k){
      var g=el('g',{'class':'ev'+(e[5]?' big':''),'data-b':k+1},svg), up=e[2], ly=up?40:270;
      var stemY=up?ly+78:ly-16;
      el('path',{'class':'stem',d:'M'+x(e[0])+' '+Y+' L'+x(e[0])+' '+(up?Y-30:Y+30)+' L'+(e[1]+8)+' '+stemY,fill:'none'},g);
      el('circle',{cx:x(e[0]),cy:Y,r:e[5]?8:6},g);
      txt(g,e[1],ly,e[0],'y'); txt(g,e[1],ly+20,e[3],'h');
      e[4].split('|').forEach(function(s,i){ txt(g,e[1],ly+38+i*16,s,'d'); });
    });
  })();

  // ================= 3 · who does what =================
  (function(){
    var svg=$('#cast'); if(!svg) return;
    arrowDefs(svg,'ar','#9FB8B5');
    var W=214,H=58, L={}, links=el('g',{},svg), boxes=el('g',{},svg);
    var D={
      leg:[424,40,'Florida Legislature','writes the statute',0], sba:[120,160,'State Board of Administration','houses the Commission · staff',0], com:[424,160,'The Commission','adopts standards · votes',0],
      pt:[424,300,'Professional Team','11 experts · 5 disciplines',1,'me'], mo:[424,440,'Modeling organization','builds and submits a model',1],
      ins:[728,300,'Insurers','file rates with an accepted model',2], oir:[728,160,'Office of Insurance Regulation','reviews rate filings',2],
      fhcf:[120,440,'Florida Hurricane Cat Fund','reinsures residential insurers',3], home:[728,440,'Homeowners','pay the premiums',3]
    };
    var groups={};
    Object.keys(D).forEach(function(k){ var d=D[k];
      var parent=d[4]===0?boxes:(groups['b'+d[4]]||(groups['b'+d[4]]=el('g',{'data-b':d[4]},boxes)));
      L[k]=box(parent,d[0],d[1],W,H,d[2],d[3],d[5]);
    });
    var E=[['leg','com','creates (s. 627.0628)',0],['sba','com','houses',0],['mo','pt','Submission · on-site review',1],['pt','com','report',1],
      ['com','ins','accepted models',2,{bend:-20}],['ins','oir','rate filing',2],['home','ins','premiums',3],['ins','fhcf','reimbursement premiums',3,{dx:-150,dy:24}],['com','fhcf','accepted methods',3,{dx:-30}]];
    var lk=E.map(function(e){
      var g=e[3]===0?links:(groups['l'+e[3]]||(groups['l'+e[3]]=el('g',{'data-b':e[3]},links)));
      var r=link(g,L[e[0]],L[e[1]],e[2],e[4]); r.a=e[0]; r.b=e[1]; return r;
    });
    Object.keys(L).forEach(function(k){
      L[k].addEventListener('mouseenter',function(){ L[k].classList.add('hot'); lk.forEach(function(r){ if(r.a===k||r.b===k){ r.path.classList.add('hot'); L[r.a===k?r.b:r.a].classList.add('hot'); } }); });
      L[k].addEventListener('mouseleave',function(){ $$('.hot',svg).forEach(function(n){n.classList.remove('hot');}); });
    });
  })();

  // ================= 4 · ROA: six groups of standards =================
  (function(){
    var host=$('#roa-groups'), list=$('#roa-list'); if(!host) return;
    var slide=host.closest('.slide');
    GROUPS.forEach(function(g,i){
      var r=document.createElement('div'); r.className='grp'; r.style.setProperty('--c',g.c);
      var bars=''; for(var k=0;k<g.S.length;k++) bars+='<b style="transition-delay:'+(i*.08+k*.03)+'s"></b>';
      for(k=0;k<g.forms;k++) bars+='<b class="f" style="transition-delay:'+(i*.08+.3+k*.03)+'s"></b>';
      r.innerHTML='<div class="n"><i>'+g.k+'</i>'+g.n+'</div><div class="bars">'+bars+'</div>';
      r.addEventListener('click',function(){ show(i); }); host.appendChild(r);
    });
    var lg=document.createElement('div'); lg.className='legend'; lg.innerHTML='<b></b>standard <b class="f"></b>form · 38 standards, 29 forms'; host.appendChild(lg);
    function show(i){
      var g=GROUPS[i]; $$('.grp',host).forEach(function(r,k){r.classList.toggle('on',k===i);});
      list.style.setProperty('--c',g.c);
      list.innerHTML='<div class="tag">'+g.n+' Hurricane Standards · '+g.S.length+' standards</div><ul>'+g.S.map(function(s){return '<li><b>'+s[0]+'</b>'+s[1]+'</li>';}).join('')+'</ul>';
    }
    show(0);
    var n=$('#roa-n');
    watch(slide,function(on){ if(!on||reduce) return; var t0=null; (function step(now){ if(t0===null) t0=now; var u=Math.min(1,(now-t0)/1400); n.textContent=Math.round(386*ease(u)); if(u<1) requestAnimationFrame(step); })(performance.now()); });
  })();

  // ================= 6 · the two-year cycle =================
  (function(){
    var svg=$('#cyc'), list=$('#cyc-list'); if(!svg) return;
    var slide=svg.closest('.slide'), CX=235, CY=262, R=186;
    var MON=['S','O','N','D','J','F','M','A','M','J','J','A'], MONF=['September','October','November','December','January','February','March','April','May','June','July','August'];
    // [start month, end month (exclusive), lane, colour, when, what]  month 0 = September 2025
    var PH=[
      [0,1,0,'#8A6236','Sep 2025','Committee meetings draft the 2025 standards'],
      [1,2,0,'#C9852F','Oct 2025','Commission adopts the standards (Oct 28)'],
      [2,3,0,'#1D6E73','Nov 2025','Report of Activities published'],
      [3,14,0,'#9FB8B5','Nov 2025 – Oct 2026','Modeling organizations update models and write Submissions'],
      [14,15,0,'#B5412F','Nov 1, 2026','Deadline: notification and Submission'],
      [16,17,1,'#5B636B','Jan 2027','Commission meeting reviews Submissions'],
      [16,20,0,'#2F6FA3','Jan – Apr 2027','Professional Team on-site reviews'],
      [19,21,1,'#7A5AA6','Apr – May 2027','Additional verification reviews, if needed'],
      [20,23,0,'#2E8A5C','May – Jul 2027','Commission meetings on acceptability']
    ];
    function ang(m){ return -Math.PI/2+m/24*2*Math.PI; }
    function pt(m,r){ var a=ang(m); return [CX+r*Math.cos(a),CY+r*Math.sin(a)]; }
    function arc(m0,m1,r){ var a=pt(m0,r), b=pt(m1,r), big=(m1-m0)>12?1:0; return 'M'+a[0]+' '+a[1]+' A'+r+' '+r+' 0 '+big+' 1 '+b[0]+' '+b[1]; }
    el('circle',{'class':'rim',cx:CX,cy:CY,r:R},svg);
    var arcs=PH.map(function(p){ return el('path',{'class':'arc',d:arc(p[0]+.04,p[1]-.04,p[2]?R-26:R),stroke:p[3]},svg); });
    for(var m=0;m<24;m++){ var a=pt(m,R-12), b=pt(m,R+12); el('line',{'class':'mtick',x1:a[0],y1:a[1],x2:b[0],y2:b[1]},svg); var l=pt(m+.5,R+24); txt(svg,l[0],l[1]+4,MON[m%12],'mlab'); }
    var y1=pt(4,R+46), y2=pt(16,R+46); txt(svg,y1[0],y1[1]+4,'2026','ylab'); txt(svg,y2[0],y2[1]+4,'2027','ylab'); var y0=pt(.5,R+46); txt(svg,y0[0]+26,y0[1]+4,'2025','ylab');
    var now=txt(svg,CX,CY-4,'','now'), nowd=txt(svg,CX,CY+18,'','nowd');
    var dot=el('circle',{'class':'dot',cx:CX,cy:CY-R,r:11},svg);
    PH.forEach(function(p){ var li=document.createElement('li'); li.style.setProperty('--c',p[3]); li.innerHTML='<b><i></i>'+p[4]+'</b><span>'+p[5]+'</span>'; list.appendChild(li); });
    var lis=$$('li',list), raf=0, t0=null, SPAN=14000;
    function paint(mf){
      var d=pt(mf,R); dot.setAttribute('cx',d[0]); dot.setAttribute('cy',d[1]);
      var mi=Math.floor(mf), yr=2025+Math.floor((mi+8)/12);
      now.textContent=MONF[mi%12]+' '+yr; nowd.textContent=mi>=23?'and the 2027 standards begin':'month '+(mi+1)+' of 24';
      PH.forEach(function(p,k){ var on=mf>=p[0]&&mf<p[1]; arcs[k].classList.toggle('on',on); lis[k].classList.toggle('on',on); });
    }
    function frame(t){ if(t0===null) t0=t; paint(((t-t0)%SPAN)/SPAN*24); raf=requestAnimationFrame(frame); }
    paint(16.5);
    if(!reduce) watch(slide,function(on){ cancelAnimationFrame(raf); t0=null; if(on) raf=requestAnimationFrame(frame); });
  })();

  // ================= 7 · the pipeline, with a token that runs through it =================
  (function(){
    var svg=$('#flow'), cap=$('#flow-cap'); if(!svg) return;
    arrowDefs(svg,'ar','#9FB8B5'); arrowDefs(svg,'ar2','#C9852F');
    var W=180,H=52, gl=el('g',{},svg), gb=el('g',{},svg), B={};
    var N={roa:[95,40,'Report of Activities','38 standards'],sub:[305,40,'Submission','by Nov 1, 2026'],def:[515,40,'Deficiencies fixed','Commission meeting'],pre:[740,40,'Pre-visit letter','issues to address'],
      site:[740,200,'On-site review','standard by standard'],rep:[515,200,'Team report','to the Commission'],com:[305,200,'Commission meeting','overview · changes'],closed:[95,200,'Closed meeting','trade secrets'],
      vote:[95,360,'Public vote','every standard'],acc:[305,360,'Accepted','until Nov 1, 2029'],rate:[515,360,'Rate filings','insurers · OIR'],fhcf:[740,360,'Cat Fund premiums','FHCF']};
    Object.keys(N).forEach(function(k){ var n=N[k]; B[k]=box(gb,n[0],n[1],W,H,n[2],n[3]); });
    var loop=el('g',{'class':'loop'},svg);
    B.rev=box(loop,560,122,186,44,'Additional verification','7 days · 60 days · revisit','bad');
    ['roa','sub','def','pre','site','rep','com','closed','vote','acc','rate','fhcf'].reduce(function(a,b){ link(gl,B[a],B[b]); return b; });
    link(loop,B.site,B.rev,'',{arrow:'ar2',bend:-26}); link(loop,B.rev,B.site,'',{arrow:'ar2',bend:-26});
    var tok=el('circle',{'class':'token',r:10,cx:B.roa.c.x,cy:B.roa.c.y,opacity:0},svg);
    var C={roa:'The 2025 Report of Activities sets 38 standards.',sub:'By November 1, 2026: evidence for every standard, disclosure and form.',
      def:'The team reviews the Submission; the Commission meets on deficiencies, which are corrected before the visit.',pre:'A pre-visit letter lists the specific issues the team wants addressed.',
      site:'The on-site review: standard by standard, with live runs of the model.',siteBad:'A standard is not met, and it cannot be fixed while the team is there.',
      rev:'Request an additional verification review within 7 days, send revised documents within 60, and the team returns.',siteOk:'The corrections are verified.',
      rep:'The Professional Team report goes to the Commission.',com:'The modeling organization presents its model and what changed.',closed:'Closed meeting: trade secrets are reviewed. No voting.',
      vote:'Public meeting: each standard is voted on.',acc:'Accepted: a letter to the modeling organization, copied to the Office of Insurance Regulation.',
      rate:'Insurers may now use the model in hurricane rate filings.',fhcf:'And the Cat Fund uses accepted models to set its reimbursement premiums.'};
    var timers=[], run=0;
    function reset(){ run++; timers.forEach(clearTimeout); timers=[]; $$('.box',svg).forEach(function(b){b.classList.remove('lit','win','bad');}); B.rev.classList.add('bad'); loop.classList.remove('on'); tok.setAttribute('opacity',0); cap.textContent='Choose a run.'; }
    function move(to,ms,done){
      var my=run, x0=+tok.getAttribute('cx'), y0=+tok.getAttribute('cy'), x1=B[to].c.x, y1=B[to].c.y, t0=null;
      if(reduce){ tok.setAttribute('cx',x1); tok.setAttribute('cy',y1); done(); return; }
      (function step(t){ if(my!==run) return; if(t0===null) t0=t; var u=Math.min(1,(t-t0)/ms), k=ease(u);
        tok.setAttribute('cx',x0+(x1-x0)*k); tok.setAttribute('cy',y0+(y1-y0)*k); if(u<1) requestAnimationFrame(step); else done(); })(performance.now());
    }
    function go(kind){
      reset(); var my=run;
      var seq=['roa','sub','def','pre','site'].concat(kind==='issues'?['siteBad','rev','siteOk']:[]).concat(['rep','com','closed','vote','acc','rate','fhcf']);
      tok.setAttribute('cx',B.roa.c.x); tok.setAttribute('cy',B.roa.c.y); tok.setAttribute('opacity',1);
      var i=0;
      (function next(){
        if(my!==run||i>=seq.length) return; var s=seq[i++], node=s==='siteBad'||s==='siteOk'?'site':s;
        if(s==='siteBad') loop.classList.add('on');
        move(node,s==='roa'?10:700,function(){
          if(my!==run) return;
          B[node].classList.remove('bad'); B[node].classList.add(s==='siteBad'?'bad':s==='acc'?'win':'lit');
          if(s==='rev') B.rev.classList.add('lit');
          cap.textContent=C[s]; timers.push(setTimeout(next,s==='siteBad'||s==='rev'?1900:1300));
        });
      })();
    }
    $$('#flow-ctl button').forEach(function(b){ b.addEventListener('click',function(){ $$('#flow-ctl button').forEach(function(x){x.classList.toggle('on',x===b);}); go(b.getAttribute('data-run')); }); });
    watch(svg.closest('.slide'),function(on){ if(!on){ reset(); $$('#flow-ctl button').forEach(function(x){x.classList.remove('on');}); } });
  })();

  // ================= 8 · inside the on-site review =================
  (function(){
    var host=$('#site-cols'); if(!host) return;
    var slide=host.closest('.slide'), cap=$('#site-cap'), open=$('#site-open'), exit=$('#site-exit'), base=cap.textContent;
    GROUPS.forEach(function(g){
      var c=document.createElement('div'); c.className='col'; c.style.setProperty('--c',g.c);
      c.innerHTML='<h4>'+g.n+'</h4><div class="lead">'+g.lead+'</div>'+g.S.map(function(s){return '<div class="chip"><b>'+s[0]+'</b>'+s[2]+'</div>';}).join('');
      host.appendChild(c);
    });
    var cols=$$('.col',host), timers=[];
    function reset(){ timers.forEach(clearTimeout); timers=[]; cols.forEach(function(c){c.classList.remove('on');}); $$('.chip',host).forEach(function(c){c.classList.remove('done');}); open.classList.remove('on'); exit.classList.remove('on'); cap.textContent=base; }
    function play(){
      reset(); var t=0, step=reduce?0:260;
      timers.push(setTimeout(function(){ open.classList.add('on'); cap.textContent='Opening briefing: the team leader sets out the schedule and the process.'; },t)); t+=reduce?0:1400;
      GROUPS.forEach(function(g,i){
        timers.push(setTimeout(function(){ open.classList.remove('on'); cols.forEach(function(c,k){c.classList.toggle('on',k===i);}); cap.textContent=g.n+' · led by '+(i?g.lead.toLowerCase():'the team leader')+'.'; },t));
        t+=reduce?0:500;
        $$('.chip',cols[i]).forEach(function(ch){ timers.push(setTimeout(function(){ ch.classList.add('done'); },t)); t+=step; });
        t+=reduce?0:500;
      });
      timers.push(setTimeout(function(){ cols.forEach(function(c){c.classList.remove('on');}); exit.classList.add('on'); cap.textContent='Exit briefing: a preliminary draft of the Professional Team report, checked for factual errors and trade secrets.'; },t));
    }
    $('#site-play').addEventListener('click',play);
    watch(slide,function(on){ reset(); if(on&&!reduce) timers.push(setTimeout(play,900)); });
  })();

  // ================= 10 · pass, or revisit =================
  (function(){
    var svg=$('#out'); if(!svg) return;
    arrowDefs(svg,'ar','#9FB8B5');
    var W=190,H=54, g1=el('g',{'data-b':1},svg), g2=el('g',{'data-b':2},svg);
    var site=box(svg,280,40,W,H,'On-site review','the team’s finding');
    var ok=box(g1,120,160,W,H,'Complies','team reports to the Commission','ok');
    link(g1,site,ok,'yes');
    var no=box(g2,440,160,W,H,'Does not comply','one or more standards','no');
    var fix=box(g2,440,262,W,H,'Fixed while on-site?','team reviews the correction');
    var req=box(g2,440,364,W,H,'Request a revisit','in writing to the Chair');
    var docs=box(g2,440,466,W,H,'Revised documents','with annotated revisions');
    var avr=box(g2,120,466,W,H,'Additional verification','team, or part of it, returns');
    link(g2,site,no,'no'); link(g2,no,fix); link(g2,fix,ok,'yes · verified',{bend:18}); link(g2,fix,req,'no');
    link(g2,req,docs); link(g2,docs,avr); link(g2,avr,ok,'',{});
    txt(g2,520,318,'≤ 7 days','clock'); txt(g2,530,420,'≤ 60 days','clock'); txt(g2,280,456,'≥ 7 days before','clock');
  })();

  // ================= 11 · the vote =================
  (function(){
    var host=$('#vote-board'), verdict=$('#vote-verdict'); if(!host) return;
    var base=verdict.textContent;
    GROUPS.forEach(function(g){
      var c=document.createElement('div'); c.className='gcol'; c.style.setProperty('--c',g.c);
      c.innerHTML='<h4>'+g.n+'</h4>'+g.S.map(function(s){return '<div class="st"><span>'+s[0]+'</span><span class="v"></span></div>';}).join('');
      host.appendChild(c);
    });
    var tiles=$$('.st',host), timers=[];
    function reset(){ timers.forEach(clearTimeout); timers=[]; tiles.forEach(function(t){t.classList.remove('y','n'); t.querySelector('.v').textContent='';}); verdict.className='verdict'; verdict.textContent=base; }
    function vote(kind){
      reset(); var fail=kind==='one'?Math.floor(Math.random()*tiles.length):-1, d=reduce?0:110;
      tiles.forEach(function(t,i){ timers.push(setTimeout(function(){
        if(i===fail){ t.classList.add('n'); t.querySelector('.v').textContent='✗'; } else { t.classList.add('y'); t.querySelector('.v').textContent='✓'; }
      },i*d)); });
      timers.push(setTimeout(function(){
        if(fail<0){ verdict.className='verdict y'; verdict.textContent='Accepted on all 38 standards. A letter goes to the modeling organization; acceptance expires November 1, 2029.'; }
        else { verdict.className='verdict n'; verdict.textContent=tiles[fail].firstChild.textContent+' fails a majority vote, so the model is not acceptable. The modeling organization may appeal within 30 days.'; }
      },tiles.length*d+300));
    }
    $$('#vote-ctl button').forEach(function(b){ b.addEventListener('click',function(){ $$('#vote-ctl button').forEach(function(x){x.classList.toggle('on',x===b);}); vote(b.getAttribute('data-v')); }); });
    watch(host.closest('.slide'),function(on){ if(!on){ reset(); $$('#vote-ctl button').forEach(function(x){x.classList.remove('on');}); } });
  })();

  // ================= 12 · what acceptance unlocks =================
  (function(){
    var svg=$('#unl'); if(!svg) return;
    arrowDefs(svg,'ar','#9FB8B5');
    var a=box(svg,120,90,200,64,'Accepted model','Commission finding','me');
    var b=box(svg,424,90,200,64,'Insurer’s rate filing','hurricane loss factors, PML');
    var c=box(svg,728,90,200,64,'Office of Insurance Regulation','reviews under s. 627.062');
    var d=box(svg,424,230,240,64,'Cat Fund reimbursement premiums','s. 627.0628(3)(c)');
    [link(svg,a,b,'shall employ'),link(svg,b,c,'files'),link(svg,a,d,'to the extent feasible',{bend:30})].forEach(function(r){ r.path.style.strokeDasharray='7 5'; r.path.style.animation='flow 1.2s linear infinite'; });
    var st=el('g',{transform:'translate(120 36) rotate(-8)'},svg);
    el('rect',{x:-58,y:-15,width:116,height:28,rx:5,fill:'none',stroke:'#C9852F','stroke-width':2.5},st); txt(st,0,6,'ACCEPTED','stamp');
    if(!reduce&&st.animate) watch(svg.closest('.slide'),function(on){ if(on) st.animate([{transform:'translate(120px,36px) rotate(-8deg) scale(2.4)',opacity:0},{transform:'translate(120px,36px) rotate(-8deg) scale(1)',opacity:1}],{duration:600,delay:500,easing:'cubic-bezier(.3,1.4,.5,1)',fill:'backwards'}); });
  })();

  // ================= 13 · follow the money =================
  (function(){
    var svg=$('#money'), cap=$('#money-cap'); if(!svg) return;
    var slide=svg.closest('.slide');
    arrowDefs(svg,'ar','#9FB8B5');
    var W=210,H=60;
    var home=box(svg,120,70,W,H,'Homeowners','pay premiums'), ins=box(svg,424,70,W,H,'Insurers','buy FHCF coverage'), fund=box(svg,728,70,W,H,'Cat Fund (FHCF)','state reinsurance fund');
    var storm=el('g',{'class':'storm'},svg);
    var pol=box(storm,120,340,W,H,'Florida policyholders','most property & casualty lines'), inv=box(storm,728,340,W,H,'Bondholders','buy FHCF revenue bonds');
    var spiral=el('g',{transform:'translate(424 290)'},storm);
    for(var k=0;k<3;k++) el('path',{d:'M0 0 C 30 -10 45 -40 20 -62',fill:'none',stroke:'#7FA9C9','stroke-width':6,'stroke-linecap':'round',transform:'rotate('+(k*120)+')'},spiral);
    el('circle',{r:9,fill:'#243846'},spiral);
    var P={
      prem:link(svg,home,ins,'premiums').path, rp:link(svg,ins,fund,'reimbursement premiums').path,
      reimb:link(storm,fund,ins,'reimbursements',{bend:-40}).path, claims:link(storm,ins,home,'claims paid',{bend:-40}).path,
      bonds:link(storm,inv,fund,'bond proceeds').path, assess:link(storm,pol,fund,'emergency assessments',{dy:-6}).path, repay:link(storm,fund,inv,'repay bonds',{bend:-40,dx:44}).path
    };
    var coins=el('g',{},svg), raf=0, mode='quiet';
    var FLOWS={quiet:['prem','rp'],big:['prem','rp','reimb','claims','bonds','assess','repay']};
    var CAP={quiet:'Every year: part of each premium becomes a mandatory reimbursement premium paid to the Fund, priced with accepted models.',
      big:'After a major storm the Fund reimburses insurers. If it needs more than it holds, it borrows with bonds, repaid by emergency assessments on most Florida property and casualty policies.'};
    var C=[]; for(var i=0;i<7*4;i++) C.push(el('circle',{'class':'coin'+(i%7===4?' b':''),r:6,opacity:0},coins));
    function frame(t){
      var f=FLOWS[mode];
      C.forEach(function(c,i){ var fl=Object.keys(P)[i%7], p=P[fl];
        if(f.indexOf(fl)<0){ c.setAttribute('opacity',0); return; }
        var L=p.getTotalLength(), u=((t/2600)+Math.floor(i/7)/4)%1, q=p.getPointAtLength(u*L);
        c.setAttribute('cx',q.x); c.setAttribute('cy',q.y); c.setAttribute('opacity',Math.min(1,Math.min(u,1-u)*8)); });
      spiral.setAttribute('transform','translate(424 290) rotate('+(-t/12%360)+')');
      raf=requestAnimationFrame(frame);
    }
    function set(m){ mode=m; slide.classList.toggle('big',m==='big'); cap.textContent=CAP[m]; $$('#money-ctl button').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-y')===m);}); }
    $$('#money-ctl button').forEach(function(b){ b.addEventListener('click',function(){ set(b.getAttribute('data-y')); }); });
    set('quiet');
    watch(slide,function(on){ cancelAnimationFrame(raf); if(on&&!reduce) raf=requestAnimationFrame(frame); });
  })();

  // ================= 14 · thirty years of accepted models =================
  (function(){
    var svg=$('#yrs'); if(!svg) return;
    var slide=svg.closest('.slide');
    var Y=[]; for(var y=1996;y<=2009;y++) Y.push(y); for(y=2011;y<=2023;y+=2) Y.push(y);
    function span(a,b){ return Y.filter(function(y){return y>=a&&y<=b;}); }
    var O=[['Verisk',span(1996,2023)],['Cotality',span(1997,2023)],['Moody’s',span(1997,2023)],['E.W. Blanch Company',span(1998,2000)],['Tillinghast–Towers Perrin',[1998]],
      ['Applied Research Associates',span(1999,2021)],['Florida Public Hurricane Loss Model',span(2006,2023)],['Karen Clark & Company',span(2017,2023)],['Impact Forecasting',span(2019,2023)]];
    var X0=262, DX=27, Y0=60, DY=44;
    Y.forEach(function(y,i){ txt(svg,X0+i*DX,34,"'"+String(y).slice(2),'yr'); });
    txt(svg,X0-22,34,'standards year','yr').setAttribute('text-anchor','end');
    var dots=[];
    O.forEach(function(o,r){
      var g=el('g',{'class':'rowg'},svg), cy=Y0+r*DY;
      el('rect',{'class':'rowbg',x:0,y:cy-DY/2+3,width:849,height:DY-6,rx:8},g);
      txt(g,X0-18,cy+4,o[0],'org');
      Y.forEach(function(y,i){ if(o[1].indexOf(y)>=0){ var d=el('circle',{'class':'dot',cx:X0+i*DX,cy:cy,r:0},g); d.col=i; dots.push(d);} });
      txt(g,X0+Y.length*DX-4,cy+4,o[1].length,'count');
    });
    var cy2=Y0+O.length*DY+12;
    txt(svg,X0-18,cy2+4,'models accepted','org').style.fill='var(--grey)';
    var cnt=Y.map(function(y,i){ var n=O.filter(function(o){return o[1].indexOf(y)>=0;}).length; return txt(svg,X0+i*DX,cy2+4,n,'count'); });
    cnt.forEach(function(t){t.setAttribute('text-anchor','middle');});
    var cur=el('line',{'class':'cursor',x1:X0,y1:44,x2:X0,y2:cy2-14,opacity:0},svg);
    var raf=0;
    function show(upto){ dots.forEach(function(d){ d.setAttribute('r',d.col<=upto?8:0); }); cnt.forEach(function(t,i){ t.style.opacity=i<=upto?1:0; }); }
    watch(slide,function(on){
      cancelAnimationFrame(raf); if(!on) return;
      if(reduce){ show(Y.length); return; }
      show(-1); var t0=null;
      (function step(t){ if(t0===null) t0=t; var u=Math.min(1,(t-t0)/4200), c=u*(Y.length-1);
        cur.setAttribute('opacity',u<1?1:0); cur.setAttribute('x1',X0+c*DX); cur.setAttribute('x2',X0+c*DX); show(Math.floor(c+.001));
        if(u<1) raf=requestAnimationFrame(step); })(performance.now());
    });
  })();

  // ================= 15 · computer/information: a Code Dive =================
  (function(){
    var svg=$('#ci'); if(!svg) return;
    var W=138,H=48;
    function vb(x,y,c,t,cls,w){ w=w||W; var g=el('g',{'class':'vbox '+(cls||''),transform:'translate('+x+' '+y+')'},svg); el('rect',{x:-w/2,y:-H/2,width:w,height:H,rx:10},g); txt(g,0,-4,c,'c'); txt(g,0,13,t); g.c={x:x,y:y}; return g; }
    var thread=el('path',{'class':'thread'},svg);
    var S=[vb(85,40,'M · V · A','Requirement'),vb(130,125,'CI-3','Documentation'),vb(175,210,'CI-4','Requirements'),vb(222,295,'CI-5','Design'),vb(285,385,'CI-6','Implementation'),vb(350,295,'CI-7','Verification'),vb(358,210,'forms · runs','Model output')];
    [['CI-2','AI-based SWE',40],['CI-8','HCI',120],['CI-9','Maintenance',200],['CI-10','Security',280]].forEach(function(o){ vb(496,o[2],o[0],o[1],'',110); });
    var d='M'+S.map(function(s){return s.c.x+' '+s.c.y;}).join(' L');
    thread.setAttribute('d',d); var L=thread.getTotalLength();
    thread.style.strokeDasharray=L; thread.style.strokeDashoffset=L;
    var line=$('.s-ci .line'), raf=0;
    function run(){
      cancelAnimationFrame(raf); var t0=null;
      (function step(t){ if(t0===null) t0=t; var u=Math.min(1,(t-t0)/3200);
        thread.style.strokeDashoffset=L*(1-u);
        S.forEach(function(s,i){ s.classList.toggle('lit',u>=i/(S.length-1)-.001); });
        if(u<1) raf=requestAnimationFrame(step); })(performance.now());
    }
    function clear(){ cancelAnimationFrame(raf); thread.style.strokeDashoffset=L; S.forEach(function(s){s.classList.remove('lit');}); }
    new MutationObserver(function(){ if(line.classList.contains('shown')) run(); else clear(); }).observe(line,{attributes:true,attributeFilter:['class']});
  })();

  // ================= 18 · one loop, every two years =================
  (function(){
    var svg=$('#endloop'); if(!svg) return;
    var CX=424, CY=210, RX=340, RY=165;
    el('ellipse',{'class':'loopr',cx:CX,cy:CY,rx:RX,ry:RY},svg);
    var S=['Statute','Standards (ROA)','Submission','On-site audit','Commission vote','Rate filings','Premiums','Cat Fund'];
    var D=['the Legislature','every odd year','modeling organization','Professional Team','standard by standard','insurers · OIR','homeowners','reinsurance · bonds'];
    S.forEach(function(s,i){ var a=-Math.PI/2+i/S.length*2*Math.PI; box(svg,CX+RX*Math.cos(a),CY+RY*Math.sin(a),168,48,s,D[i],i===3?'me':''); });
    txt(svg,CX,CY-6,'revise the standards,','lab').style.fontSize='15px'; txt(svg,CX,CY+16,'and go round again','lab').style.fontSize='15px';
    var p=el('circle',{'class':'pulse',r:9},svg), raf=0;
    function frame(t){ var a=-Math.PI/2+(t/16000%1)*2*Math.PI; p.setAttribute('cx',CX+RX*Math.cos(a)); p.setAttribute('cy',CY+RY*Math.sin(a)); raf=requestAnimationFrame(frame); }
    svg.insertBefore(p,svg.querySelector('.box'));
    if(!reduce) watch(svg.closest('.slide'),function(on){ cancelAnimationFrame(raf); if(on) raf=requestAnimationFrame(frame); });
    else { p.setAttribute('cx',CX); p.setAttribute('cy',CY-RY); }
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
