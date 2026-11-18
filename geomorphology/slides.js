// Modeling Florida — the class hub: a slowly reshaping terrain, and the live Egans Creek slide.
// Loads before deck.js.
(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(sel,root){return (root||document).querySelector(sel);}
  function $$(sel,root){return [].slice.call((root||document).querySelectorAll(sel));}
  // call on(true/false) whenever the slide is shown or hidden
  function watch(slide,on){
    if(!slide) return; var was=null;
    function check(){var now=slide.classList.contains('on'); if(now!==was){was=now;on(now);}}
    new MutationObserver(check).observe(slide,{attributes:true,attributeFilter:['class']}); check();
  }

  // ================= title and close: topographic contours of a terrain that slowly reshapes =================
  function topo(id,x0){
    var cv=$(id); if(!cv) return;
    var slide=cv.closest('.slide'), ctx=cv.getContext('2d'); ctx.scale(2,2);
    var GX=72, GY=54, CW=960/GX, CH=720/GY, raf=0, t=Math.random()*50;
    // a smooth height field: a few hills and valleys drifting slowly (erosion in fast-forward)
    var H=[[.28,.35,.5,1],[.68,.62,.42,.9],[.55,.25,.3,-.7],[.82,.3,.35,.8],[.4,.75,.4,-.6],[.9,.82,.3,.6]];
    function h(x,y){ var v=0; for(var i=0;i<H.length;i++){ var c=H[i], cx=c[0]+.05*Math.sin(t*.07+i), cy=c[1]+.05*Math.cos(t*.05+i*2), d=((x-cx)*(x-cx)+(y-cy)*(y-cy))/(c[2]*c[2]);
      v+=c[3]*Math.exp(-d*2.2); } return v+.08*Math.sin(x*9+t*.1)*Math.cos(y*7-t*.08); }
    var F=[];
    function sample(){ for(var j=0;j<=GY;j++){ F[j]=F[j]||[]; for(var i=0;i<=GX;i++) F[j][i]=h(i/GX*1.33,j/GY); } }
    function edge(a,b,l){ return (l-a)/(b-a); }
    function draw(){
      ctx.clearRect(0,0,960,720); sample();
      for(var L=-1.2;L<=1.6;L+=.12){
        var major=Math.abs((L*100)%60)<1;
        ctx.strokeStyle=L>0?'rgba(127,196,192,'+(major?.5:.22)+')':'rgba(201,133,47,'+(major?.45:.2)+')'; ctx.lineWidth=major?1.4:.9;
        ctx.beginPath();
        for(var j=0;j<GY;j++) for(var i=0;i<GX;i++){
          var a=F[j][i],b=F[j][i+1],c=F[j+1][i+1],d=F[j+1][i], k=(a>L?8:0)|(b>L?4:0)|(c>L?2:0)|(d>L?1:0); if(k===0||k===15) continue;
          var x=i*CW, y=j*CH, T=[x+edge(a,b,L)*CW,y], R=[x+CW,y+edge(b,c,L)*CH], B=[x+edge(d,c,L)*CW,y+CH], Lf=[x,y+edge(a,d,L)*CH], S=[];
          switch(k){ case 1:case 14:S=[Lf,B];break; case 2:case 13:S=[B,R];break; case 3:case 12:S=[Lf,R];break; case 4:case 11:S=[T,R];break;
            case 6:case 9:S=[T,B];break; case 7:case 8:S=[Lf,T];break; case 5:S=[Lf,T,B,R];break; case 10:S=[T,R,Lf,B];break; }
          for(var s=0;s<S.length;s+=2){ ctx.moveTo(S[s][0],S[s][1]); ctx.lineTo(S[s+1][0],S[s+1][1]); }
        }
        ctx.stroke();
      }
    }
    var last=0;
    function frame(now){ if(now-last>66){ t+=.35; draw(); last=now; } raf=requestAnimationFrame(frame); }
    draw();
    if(!reduce) watch(slide,function(on){ cancelAnimationFrame(raf); if(on) raf=requestAnimationFrame(frame); });
  }
  topo('#topo'); topo('#topo2');

  // ================= the poster: click a model to zoom into its tile =================
  (function(){
    var img=$('#pz img'); if(!img) return;
    // centre of each tile on the 1800 × 2700 poster, as a fraction of its width and height
    var C=[[.19,.36],[.5,.36],[.81,.36],[.19,.58],[.5,.58],[.81,.58],[.19,.795],[.5,.795],[.81,.795]];
    var bs=$$('#pz-nine button');
    function zoom(k){
      bs.forEach(function(b,i){ b.classList.toggle('on',i===k); });
      if(k<0){ img.style.transformOrigin='0 0'; img.style.transform='translate(0,0) scale(1)'; return; }
      var W=img.parentNode.clientWidth, H=img.parentNode.clientHeight, S=2.9;   // centre the tile in the frame
      img.style.transformOrigin='0 0'; img.style.transform='translate('+(W/2-S*C[k][0]*W)+'px,'+(H/2-S*C[k][1]*H)+'px) scale('+S+')';
    }
    bs.forEach(function(b,i){ b.addEventListener('click',function(){ zoom(b.classList.contains('on')?-1:i); }); });
    $('#pz-all').addEventListener('click',function(){ zoom(-1); });
    watch(img.closest('.slide'),function(on){ if(!on) zoom(-1); });
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
