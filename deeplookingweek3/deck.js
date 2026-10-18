// Deep Looking deck engine. No dependencies.
// Keys: → / space / click advance · ← back · ↑↓ whole slides · Home/End
//       F fullscreen · P presenter window · type a number + Enter to jump
(function(){
  var vp=document.getElementById('viewport');
  var stage=document.getElementById('stage');
  var slides=[].slice.call(stage.querySelectorAll('.slide'));
  var hint=document.getElementById('hint');
  var presenter=/[?&]presenter\b/.test(location.search);
  var footer=document.body.getAttribute('data-footer')||'';
  var si=0, bi=0, prev=0;

  // footer + slide number on every page
  slides.forEach(function(s,k){
    var page=s.querySelector('.page'); if(!page) return;
    if(footer){var f=document.createElement('div');f.className='foot';f.textContent=footer;page.appendChild(f);}
    var n=document.createElement('div');n.className='num';n.textContent=k+1;page.appendChild(n);
  });

  // build steps per slide: elements sharing a data-b number appear together
  var steps=slides.map(function(s){
    var max=0, groups={};
    [].forEach.call(s.querySelectorAll('[data-b]'),function(el){
      var n=parseInt(el.getAttribute('data-b'),10); if(!n) return;
      (groups[n]=groups[n]||[]).push(el); if(n>max) max=n;
    });
    return {max:max, groups:groups};
  });

  // Magic move: an element tagged data-mm animates from the position and size of
  // its twin on the slide we just left.
  function magicMove(from,to){
    [].forEach.call(to.querySelectorAll('[data-mm]'),function(el){
      var twin=from.querySelector('[data-mm="'+el.getAttribute('data-mm')+'"]');
      if(!twin) return;
      var a=twin.getBoundingClientRect(), b=el.getBoundingClientRect();
      if(!a.width||!b.width) return;
      var k=stage.getBoundingClientRect().width/1280;   // undo stage scale
      var dx=(a.left-b.left)/k, dy=(a.top-b.top)/k, sx=a.width/b.width, sy=a.height/b.height;
      if(Math.abs(dx)<.5&&Math.abs(dy)<.5&&Math.abs(sx-1)<.005) return;
      el.classList.remove('mm-move');
      el.style.transformOrigin='0 0';
      el.style.transform='translate('+dx+'px,'+dy+'px) scale('+sx+','+sy+')';
      requestAnimationFrame(function(){requestAnimationFrame(function(){
        el.classList.add('mm-move'); el.style.transform='';
        setTimeout(function(){el.classList.remove('mm-move');el.style.transformOrigin='';},540);
      });});
    });
  }

  var chan=('BroadcastChannel' in window)?new BroadcastChannel('deck:'+location.pathname):null;

  function paint(remote){
    var from=slides[prev], to=slides[si];
    if(prev!==si){
      from.classList.remove('on'); from.classList.add('leaving');
      setTimeout(function(){from.classList.remove('leaving');},600);
    }
    slides.forEach(function(s,k){ if(k===si) s.classList.add('on'); else if(k!==prev) s.classList.remove('on','leaving'); });
    if(!to.dataset.seenTimer){
      to.dataset.seenTimer='1';
      setTimeout(function(){to.classList.add('seen');},2700);
    }
    if(prev!==si) magicMove(from,to);
    prev=si;
    var st=steps[si];
    for(var n=1;n<=st.max;n++) st.groups[n].forEach(function(el){el.classList.toggle('shown',n<=bi);});
    history.replaceState(null,'','#'+(si+1)+(bi?'.'+bi:''));
    if(presenter) paintPresenter();
    if(chan&&!remote) chan.postMessage({si:si,bi:bi});
  }

  function go(d){
    var st=steps[si];
    if(d>0){
      if(bi<st.max){bi++;}
      else if(si<slides.length-1){si++;bi=0;}
      else return;
    }else{
      if(bi>0){bi--;}
      else if(si>0){si--;bi=steps[si].max;}
      else return;
    }
    startTimer(); paint();
  }
  function jump(n,b){
    si=Math.max(0,Math.min(slides.length-1,n));
    bi=b==null?steps[si].max:Math.max(0,Math.min(steps[si].max,b));
    paint();
  }
  function fromHash(){
    var m=/^#(\d+)(?:\.(\d+))?/.exec(location.hash);
    if(m){si=Math.max(0,Math.min(slides.length-1,m[1]-1));bi=Math.min(steps[si].max,+(m[2]||0));}
  }

  // ---- fit the fixed 1280x720 stage into its box ----
  function fitInto(box,el){
    var r=box.getBoundingClientRect(), s=Math.min(r.width/1280,r.height/720);
    el.style.transform='translate('+((r.width-1280*s)/2)+'px,'+((r.height-720*s)/2)+'px) scale('+s+')';
  }
  function fit(){
    fitInto(vp,stage);
    if(presenter) fitInto(document.getElementById('pv-next'),document.getElementById('pv-nextstage'));
  }

  // ---- presenter view: current slide, next slide, notes, timer ----
  var t0=null;
  function startTimer(){ if(presenter&&t0===null) t0=Date.now(); }
  function mmss(ms){var s=Math.floor(ms/1000);return Math.floor(s/60)+':'+('0'+s%60).slice(-2);}
  function paintPresenter(){
    var notes=slides[si].querySelector('.notes');
    document.getElementById('pv-notes').innerHTML=notes?notes.innerHTML:'';
    document.getElementById('pv-count').textContent='Slide '+(si+1)+' / '+slides.length;
    var st=steps[si];
    document.getElementById('pv-build').textContent=st.max?('Build '+bi+' / '+st.max):'';
    var box=document.getElementById('pv-nextstage'); box.innerHTML='';
    var label=document.querySelector('#pv-next .label');
    if(bi<st.max){
      // next is another build on this slide: preview the slide one step further on
      var c=slides[si].cloneNode(true); c.classList.add('on','seen');
      [].forEach.call(c.querySelectorAll('[data-b]'),function(el){
        el.classList.toggle('shown',+el.getAttribute('data-b')<=bi+1);
        el.style.opacity=(+el.getAttribute('data-b')<=bi+1)?'':'0';
      });
      box.appendChild(c); label.textContent='Next build';
    }else if(si<slides.length-1){
      var c2=slides[si+1].cloneNode(true); c2.classList.add('on','seen');
      [].forEach.call(c2.querySelectorAll('[data-b]'),function(el){el.style.opacity='0';});
      box.appendChild(c2); label.textContent='Next slide';
    }else{ label.textContent='End'; }
  }
  if(presenter){
    document.body.classList.add('presenter');
    var timer=document.getElementById('pv-timer'), clock=document.getElementById('pv-clock');
    timer.addEventListener('click',function(){t0=null;timer.textContent='0:00';});
    setInterval(function(){
      timer.textContent=t0===null?'0:00':mmss(Date.now()-t0);
      clock.textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    },500);
  }

  // ---- sync between audience and presenter windows ----
  if(chan){
    chan.onmessage=function(e){
      var m=e.data;
      if(m.hello){ if(!presenter) chan.postMessage({si:si,bi:bi}); return; }
      if(m.si===si&&m.bi===bi) return;
      si=m.si; bi=m.bi; startTimer(); paint(true);
    };
  }

  // ---- input ----
  var typed='';
  document.addEventListener('keydown',function(e){
    if(e.metaKey||e.ctrlKey||e.altKey) return;
    var k=e.key;
    if(/^\d$/.test(k)){typed+=k;return;}
    if(k==='Enter'&&typed){e.preventDefault();jump(+typed-1,0);typed='';return;}
    typed='';
    if(k==='ArrowRight'||k==='PageDown'||k===' '||k==='Enter'){e.preventDefault();go(1);}
    else if(k==='ArrowLeft'||k==='PageUp'||k==='Backspace'){e.preventDefault();go(-1);}
    else if(k==='ArrowDown'){e.preventDefault();if(si<slides.length-1)jump(si+1);}
    else if(k==='ArrowUp'){e.preventDefault();if(si>0)jump(si-1);}
    else if(k==='Home'){jump(0,0);}
    else if(k==='End'){jump(slides.length-1);}
    else if(k==='f'||k==='F'){
      if(document.fullscreenElement) document.exitFullscreen();
      else if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    }
    else if((k==='p'||k==='P')&&!presenter){
      window.open(location.pathname+'?presenter'+location.hash,'deck-presenter','width=1280,height=800');
    }
  });
  vp.addEventListener('click',function(e){
    if(e.target.closest('a,[data-lens],button')) return;
    var r=vp.getBoundingClientRect();
    if(window.matchMedia('(pointer: coarse)').matches){go(1);return;}
    go(e.clientX-r.left<r.width*.2?-1:1);
  });
  (function(){
    var x0=null,y0=0,t=0;
    vp.addEventListener('touchstart',function(e){
      if(e.touches.length!==1){x0=null;return;}
      x0=e.touches[0].clientX;y0=e.touches[0].clientY;t=Date.now();
    },{passive:true});
    vp.addEventListener('touchend',function(e){
      if(x0===null) return;
      var p=e.changedTouches[0], dx=p.clientX-x0, dy=p.clientY-y0; x0=null;
      if(Date.now()-t>800||Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)) return;
      go(dx<0?1:-1);
    },{passive:true});
  })();

  // linked hover: [data-lens="X"] elements light up together
  stage.addEventListener('mouseover',function(e){
    var el=e.target.closest('[data-lens]'); if(!el) return;
    var s=el.closest('.slide'), id=el.getAttribute('data-lens');
    [].forEach.call(s.querySelectorAll('[data-lens="'+id+'"]'),function(x){x.classList.add('hot');});
  });
  stage.addEventListener('mouseout',function(e){
    var el=e.target.closest('[data-lens]'); if(!el) return;
    [].forEach.call(el.closest('.slide').querySelectorAll('.hot'),function(x){x.classList.remove('hot');});
  });

  window.addEventListener('resize',fit);
  window.addEventListener('hashchange',function(){fromHash();paint();});
  fromHash(); prev=si; fit(); paint();
  if(presenter&&chan) chan.postMessage({hello:1});
  if(hint) setTimeout(function(){hint.style.opacity='0';},4500);
})();
