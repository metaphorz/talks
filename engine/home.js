// "Class home": when a deck is opened from a hub page with ?home=<relative URL>,
// show a small button (and the H key) that returns to that hub.
// Only relative links inside this site are accepted, so the parameter cannot send
// a viewer somewhere else.
(function(){
  var m=/[?&]home=([^&#]*)/.exec(location.search); if(!m||/[?&]presenter\b/.test(location.search)) return;
  var home=decodeURIComponent(m[1]);
  if(!/^\.\.\/[\w\-./#]*$/.test(home)||home.indexOf('//')>=0) return;
  var a=document.createElement('a'); a.href=home; a.textContent='⌂ Class home'; a.title='Back to the class page (H)';
  a.setAttribute('style','position:fixed;left:14px;top:12px;z-index:20;font:600 13px "Noto Sans",Helvetica,Arial,sans-serif;'+
    'color:#F7F3EA;background:rgba(20,22,25,.72);padding:7px 13px;border-radius:999px;text-decoration:none;opacity:.55;transition:opacity .2s');
  a.addEventListener('mouseenter',function(){a.style.opacity=1;}); a.addEventListener('mouseleave',function(){a.style.opacity=.55;});
  document.body.appendChild(a);
  document.addEventListener('keydown',function(e){ if((e.key==='h'||e.key==='H')&&!e.metaKey&&!e.ctrlKey&&!e.altKey){ location.href=home; } });
})();
