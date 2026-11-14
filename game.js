(() => {
  'use strict';
  const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false});
  const $=id=>document.getElementById(id);
  const ui={title:$('titleScreen'),pause:$('pauseScreen'),over:$('gameoverScreen'),start:$('startButton'),restart:$('restartButton'),resume:$('resumeButton'),pauseBtn:$('pauseButton'),pauseIndicator:$('pauseIndicator'),soundBtn:$('soundButton'),soundIcon:$('soundIcon'),distance:$('distance'),coins:$('coins'),best:$('best'),finalDistance:$('finalDistance'),finalCoins:$('finalCoins'),scoreboard:$('scoreboard'),controls:$('controlsHint'),toast:$('toast'),audioCaption:$('audioCaption')};
  const game={mode:'title',lane:1,laneVisual:1,jump:0,slide:0,distance:0,coins:0,speed:.34,items:[],spawn:.6,time:0,elapsed:0,hitFlash:0,best:Number(localStorage.getItem('marigold-best')||0),audioOn:true,last:0};
  let W=0,H=0,dpr=1,ac=null,master=null,musicTimer=null,beat=0,touchStart=null;
  ui.best.textContent=String(game.best).padStart(3,'0')+'m';
  ui.scoreboard.classList.remove('active');
  ui.controls.classList.add('hidden');
  ui.pauseIndicator.classList.remove('show');
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
  function resize(){const r=canvas.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
  addEventListener('resize',resize);resize();
  function horizon(){return H*(H<620?.31:.33)}
  function depthY(z){return horizon()+Math.pow(clamp(1-z,0,1),1.68)*(H*1.08-horizon())}
  function scaleAt(z){return .105+.94*Math.pow(clamp(1-z,0,1),1.15)}
  function trackX(lane,z){const p=Math.pow(clamp(1-z,0,1),.84);return W/2+(lane-1)*W*(.30*p+.055*(1-p))}
  function seeded(n){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)}
  function drawSky(t){
    const hg=horizon(),sky=ctx.createLinearGradient(0,0,0,hg*1.35);sky.addColorStop(0,'#1b2b2b');sky.addColorStop(.52,'#45504a');sky.addColorStop(1,'#b17f59');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    const glow=ctx.createRadialGradient(W*.5,hg*.9,2,W*.5,hg*.9,W*.48);glow.addColorStop(0,'rgba(231,174,111,.42)');glow.addColorStop(.4,'rgba(193,129,82,.12)');glow.addColorStop(1,'rgba(193,129,82,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,W,hg*1.7);
    ctx.fillStyle='rgba(239,217,169,.83)';ctx.beginPath();ctx.arc(W*.73,hg*.35,Math.min(W,H)*.047,0,Math.PI*2);ctx.fill();
    const baseline=hg+H*.045,step=48,offset=(t*(game.mode==='playing'?8:1))%step;
    for(let i=-1;i<W/step+2;i++){const seed=i+Math.floor(t/step),x=i*step-offset,bw=step*(.62+seeded(seed)*.55),bh=H*(.07+seeded(seed+8)*.16),by=baseline-bh;ctx.fillStyle='#2d3935';ctx.fillRect(x,by,bw,bh);ctx.fillStyle='rgba(221,173,104,.35)';for(let c=0;c<4;c++)for(let r=0;r<4;r++)if(seeded(seed+c*9+r*37)>.68)ctx.fillRect(x+bw*(c+.25)/4,by+H*.014+r*H*.028,Math.max(1,bw*.025),Math.max(2,H*.012))}
    const cx=W*.5,sy=baseline+H*.008,sw=W*.17,sh=H*.098;ctx.fillStyle='#303c37';ctx.fillRect(cx-sw/2,sy,sw,sh);ctx.beginPath();ctx.moveTo(cx-sw*.59,sy);ctx.lineTo(cx,sy-H*.047);ctx.lineTo(cx+sw*.59,sy);ctx.fill();ctx.fillStyle='#d9b677';ctx.fillRect(cx-sw*.42,sy+sh*.32,sw*.84,H*.003);for(let i=-1;i<=1;i++){ctx.fillStyle='#1b2825';ctx.fillRect(cx+i*sw*.23-sw*.035,sy+sh*.42,sw*.07,sh*.58)}ctx.fillStyle='#f0d496';ctx.beginPath();ctx.arc(cx,sy+sh*.25,H*.012,0,Math.PI*2);ctx.fill();ctx.fillStyle='#594a3a';ctx.font=`${Math.max(6,W*.008)}px monospace`;ctx.textAlign='center';ctx.fillText('MARIGOLD CENTRAL',cx,sy+sh*.19);
  }
  function drawTracks(t){
    const hg=horizon(),yb=H*1.08,cx=W/2;ctx.beginPath();ctx.moveTo(cx-W*.08,hg);ctx.lineTo(cx+W*.08,hg);ctx.lineTo(W*1.05,yb);ctx.lineTo(-W*.05,yb);ctx.closePath();const bed=ctx.createLinearGradient(0,hg,0,yb);bed.addColorStop(0,'#574d40');bed.addColorStop(.5,'#433e35');bed.addColorStop(1,'#302f2b');ctx.fillStyle=bed;ctx.fill();
    const speed=game.mode==='playing'?game.speed:.11,phase=t*speed*1.45%1;
    for(let i=0;i<19;i++){const z=(i/19+phase)%1,y=depthY(z),sc=scaleAt(z),half=W*(.06+.58*Math.pow(1-z,.9));ctx.strokeStyle=`rgba(25,27,25,${.36+.36*(1-z)})`;ctx.lineWidth=Math.max(.6,sc*4.5);ctx.beginPath();ctx.moveTo(cx-half,y);ctx.lineTo(cx+half,y);ctx.stroke()}
    for(let lane=0;lane<3;lane++)for(const side of [-1,1]){const off=(lane-1)*W*.30,near=cx+off+side*W*.067,far=cx+off*.12+side*W*.015;ctx.strokeStyle='#9b8b70';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(far,hg);ctx.lineTo(near,yb);ctx.stroke();ctx.strokeStyle='rgba(34,35,31,.6)';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(far+side*2,hg);ctx.lineTo(near+side*2,yb);ctx.stroke()}
    for(let i=0;i<5;i++){const z=(i/5+t*.05)%1,y=depthY(z),sc=scaleAt(z),half=W*(.08+.35*Math.pow(1-z,.8));ctx.strokeStyle='rgba(24,33,30,.4)';ctx.lineWidth=Math.max(1,sc*2.5);ctx.beginPath();ctx.moveTo(cx-half,y-H*.15*sc);ctx.lineTo(cx+half,y-H*.15*sc);ctx.stroke()}
  }
  function drawCoin(x,y,s){const r=13*s;ctx.save();ctx.translate(x,y);ctx.shadowColor='rgba(255,199,92,.85)';ctx.shadowBlur=15*s;ctx.fillStyle='#d5a749';ctx.beginPath();ctx.ellipse(0,0,r*.78,r,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#f9df92';ctx.lineWidth=Math.max(1,2*s);ctx.beginPath();ctx.ellipse(0,0,r*.58,r*.79,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#fff0ba';ctx.font=`${Math.max(6,14*s)}px Georgia`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✦',0,1*s);ctx.restore()}
  function drawItem(item){
    const s=scaleAt(item.z),x=trackX(item.lane,item.z),y=depthY(item.z);
    if(item.type==='coin'){drawCoin(x,y-18*s+Math.sin(game.time*5+item.phase)*3*s,s);return}
    if(item.type==='crate'){const w=42*s,h=39*s;ctx.fillStyle='#76563b';ctx.fillRect(x-w/2,y-h,w,h);ctx.strokeStyle='#c39863';ctx.lineWidth=2*s;ctx.strokeRect(x-w/2+2*s,y-h+2*s,w-4*s,h-4*s);ctx.beginPath();ctx.moveTo(x-w/2+4*s,y-h+4*s);ctx.lineTo(x+w/2-4*s,y-4*s);ctx.moveTo(x+w/2-4*s,y-h+4*s);ctx.lineTo(x-w/2+4*s,y-4*s);ctx.stroke();ctx.fillStyle='#d9bb7b';ctx.font=`${Math.max(5,7*s)}px monospace`;ctx.textAlign='center';ctx.fillText('FRAGILE',x,y-h*.48);return}
    if(item.type==='gate'){const w=58*s,h=69*s;ctx.fillStyle='#a94f3b';ctx.fillRect(x-w/2,y-h,w,h*.15);ctx.fillStyle='#36423b';ctx.fillRect(x-w/2,y-h*.76,w*.12,h*.76);ctx.fillRect(x+w*.38,y-h*.76,w*.12,h*.76);ctx.strokeStyle='#d9bd7a';ctx.lineWidth=2*s;ctx.strokeRect(x-w/2,y-h,w,h*.28);return}
    const w=68*s,h=113*s;ctx.fillStyle='#293a36';ctx.fillRect(x-w/2,y-h,w,h);ctx.fillStyle='#b16048';ctx.fillRect(x-w/2,y-h*.79,w,h*.06);for(let i=0;i<2;i++){ctx.fillStyle='#d4a967';ctx.fillRect(x+(i-.5)*w*.43-7*s,y-h*.68,14*s,19*s)}ctx.fillStyle='#192723';ctx.fillRect(x-w*.36,y-h*.39,w*.72,h*.33);ctx.fillStyle='#c49b62';ctx.font=`${Math.max(5,7*s)}px monospace`;ctx.textAlign='center';ctx.fillText('NIGHT LINE',x,y-h*.13);
  }
  function drawRunner(){
    const x=W/2+(game.laneVisual-1)*W*.30;let y=H*.795;const lift=game.jump>0?Math.sin((1-game.jump/.8)*Math.PI)*H*.19:0,s=clamp(H/700,.7,1.35),sliding=game.slide>0;y-=lift;
    ctx.fillStyle=`rgba(9,15,13,${.35-lift/H*.55})`;ctx.beginPath();ctx.ellipse(x,y+lift*.35+31*s,25*s,6*s,0,0,Math.PI*2);ctx.fill();
    if(sliding){ctx.fillStyle='#a44939';ctx.beginPath();ctx.moveTo(x-25*s,y+3*s);ctx.lineTo(x-38*s,y+22*s);ctx.lineTo(x+27*s,y+7*s);ctx.closePath();ctx.fill();ctx.fillStyle='#293b37';ctx.beginPath();ctx.ellipse(x+5*s,y+4*s,24*s,12*s,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e7c888';ctx.beginPath();ctx.arc(x+17*s,y-6*s,10*s,0,Math.PI*2);ctx.fill();ctx.fillStyle='#273732';ctx.fillRect(x+8*s,y-15*s,21*s,6*s)}else{
      const run=game.mode==='playing'?Math.sin(game.time*17):0;ctx.strokeStyle='#1b2825';ctx.lineWidth=8*s;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-3*s,y+12*s);ctx.lineTo(x+(-9+run*8)*s,y+29*s);ctx.moveTo(x+4*s,y+12*s);ctx.lineTo(x+(9-run*8)*s,y+29*s);ctx.stroke();ctx.fillStyle='#181e1c';ctx.fillRect(x+(-18+run*8)*s,y+26*s,15*s,6*s);ctx.fillRect(x+(4-run*8)*s,y+26*s,15*s,6*s);
      ctx.fillStyle='#a84f3e';ctx.beginPath();ctx.moveTo(x-12*s,y-10*s);ctx.lineTo(x-15*s,y+15*s);ctx.lineTo(x,y+11*s);ctx.lineTo(x+14*s,y+16*s);ctx.lineTo(x+12*s,y-10*s);ctx.closePath();ctx.fill();ctx.fillStyle='#e0bd79';ctx.beginPath();ctx.moveTo(x-4*s,y-8*s);ctx.lineTo(x,y+4*s);ctx.lineTo(x+4*s,y-8*s);ctx.lineTo(x+s,y+14*s);ctx.closePath();ctx.fill();
      ctx.fillStyle='#e7c28b';ctx.beginPath();ctx.arc(x,y-18*s,10*s,0,Math.PI*2);ctx.fill();ctx.fillStyle='#293a35';ctx.fillRect(x-12*s,y-28*s,24*s,5*s);ctx.fillRect(x-7*s,y-38*s,15*s,11*s);ctx.fillStyle='#af5540';ctx.fillRect(x-7*s,y-29*s,15*s,3*s);
    }
  }
  function render(now){const t=now/1000;game.time=t;ctx.clearRect(0,0,W,H);drawSky(t);drawTracks(t);[...game.items].sort((a,b)=>b.z-a.z).forEach(drawItem);drawRunner();for(let i=0;i<10;i++){const x=seeded(i+Math.floor(t*2))*W,y=((seeded(i+200)+t*.04)%1)*H;ctx.fillStyle='rgba(246,219,168,.2)';ctx.fillRect(x,y,1.2,1.2)}if(game.hitFlash>0){ctx.fillStyle=`rgba(180,63,42,${game.hitFlash*.28})`;ctx.fillRect(0,0,W,H);game.hitFlash=Math.max(0,game.hitFlash-.035)}requestAnimationFrame(render)}
  requestAnimationFrame(render);
  function addItem(type,lane,z=1.03,phase=Math.random()*6){game.items.push({type,lane,z,phase,hit:false})}
  function spawnPattern(){
    const n=Math.floor(game.distance/9+game.elapsed*1.1),lane=Math.floor(Math.random()*3),other=(lane+1+Math.floor(Math.random()*2))%3,kind=n%7;
    if(kind===0||kind===4){addItem('crate',lane);for(let i=0;i<5;i++)addItem('coin',other,1.04+i*.082,i*.8)}
    else if(kind===1){addItem('gate',lane);for(let i=0;i<5;i++)addItem('coin',(lane+1)%3,1.03+i*.08,i)}
    else if(kind===2){addItem('train',lane);for(let i=0;i<4;i++)addItem('coin',other,1.05+i*.1,i)}
    else if(kind===3){for(let i=0;i<6;i++)addItem('coin',lane,1.02+i*.085,i*.4);addItem('crate',other,1.31)}
    else if(kind===5){addItem('crate',lane);addItem('gate',other,1.30);for(let i=0;i<4;i++)addItem('coin',(lane+2)%3,1.02+i*.09,i)}
    else {for(let i=0;i<5;i++)addItem('coin',lane,1.02+i*.09,i);addItem('train',other,1.28)}
  }
  function updateHUD(){ui.distance.textContent=String(Math.floor(game.distance)).padStart(3,'0');ui.coins.textContent=String(game.coins).padStart(2,'0')}
  function startGame(){
    stopMusic();game.mode='playing';game.lane=1;game.laneVisual=1;game.jump=0;game.slide=0;game.distance=0;game.coins=0;game.speed=.34;game.items=[];game.spawn=.65;game.elapsed=0;game.last=0;game.hitFlash=0;
    ui.title.classList.remove('visible');ui.pause.classList.remove('visible');ui.over.classList.remove('visible');ui.pauseBtn.style.display='';ui.pauseIndicator.classList.add('show');ui.scoreboard.classList.add('active');ui.controls.classList.remove('hidden');ui.toast.textContent='';updateHUD();startMusic()
  }
  function pauseGame(){if(game.mode!=='playing')return;game.mode='paused';ui.pause.classList.add('visible');ui.pauseIndicator.classList.remove('show');stopMusic()}
  function resumeGame(){if(game.mode!=='paused')return;game.mode='playing';game.last=0;ui.pause.classList.remove('visible');ui.pauseIndicator.classList.add('show');startMusic()}
  function endGame(){if(game.mode!=='playing')return;game.mode='over';stopMusic();game.best=Math.max(game.best,Math.floor(game.distance));localStorage.setItem('marigold-best',String(game.best));ui.best.innerHTML=String(game.best).padStart(3,'0')+'<small>m</small>';ui.finalDistance.innerHTML=String(Math.floor(game.distance)).padStart(3,'0')+'<span>m</span>';ui.finalCoins.textContent=game.coins;ui.over.classList.add('visible');ui.pauseIndicator.classList.remove('show');ui.controls.classList.add('hidden')}
  function move(action){
    if(game.mode!=='playing')return;
    if(action==='left')game.lane=Math.max(0,game.lane-1);
    if(action==='right')game.lane=Math.min(2,game.lane+1);
    if(action==='jump'&&game.jump<=0)game.jump=.8;
    if(action==='slide')game.slide=.72;
  }
  function tick(now){
    if(game.mode!=='playing'){game.last=now;requestAnimationFrame(tick);return}
    if(!game.last)game.last=now;const dt=Math.min(.05,(now-game.last)/1000);game.last=now;game.elapsed+=dt;game.speed=Math.min(.62,.34+game.elapsed*.004);game.distance+=dt*(18+game.elapsed*.24);game.laneVisual=lerp(game.laneVisual,game.lane,Math.min(1,dt*12));game.jump=Math.max(0,game.jump-dt);game.slide=Math.max(0,game.slide-dt);
    game.spawn-=dt;if(game.spawn<=0){spawnPattern();game.spawn=Math.max(.82,1.22-game.elapsed*.003)+Math.random()*.32}
    for(const item of game.items){item.z-=game.speed*dt;if(item.hit||item.z>.235||item.z<.06)continue;
      if(item.lane!==game.lane)continue;
      if(item.type==='coin'){item.hit=true;game.coins++;updateHUD();continue}
      const escaped=item.type==='crate'?game.jump>.22:item.type==='gate'?game.slide>.18:false;
      if(!escaped){game.hitFlash=1;endGame();break}else item.hit=true;
    }
    game.items=game.items.filter(i=>i.z>-.08&&!i.hit);updateHUD();requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick);
  function soundOn(on){game.audioOn=on;ui.soundIcon.textContent=on?'♫':'♪';ui.soundBtn.setAttribute('aria-label',on?'Turn sound off':'Turn sound on');ui.soundBtn.querySelector('.sound-label').textContent=on?'SOUND ON':'SOUND OFF';ui.audioCaption.classList.toggle('muted',!on);if(on&&game.mode==='playing')startMusic();else stopMusic()}
  function tone(freq,duration,when,volume,type='sine'){
    if(!ac||!master)return;const osc=ac.createOscillator(),gain=ac.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,when);gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(volume,when+.025);gain.gain.exponentialRampToValueAtTime(.0001,when+duration);osc.connect(gain);gain.connect(master);osc.start(when);osc.stop(when+duration+.03)
  }
  function startMusic(){
    if(!game.audioOn||game.mode!=='playing'||musicTimer)return;
    try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();ac.resume();master=master||ac.createGain();master.gain.value=.18;master.connect(ac.destination)}catch(e){return}
    const notes=[220,261.63,329.63,293.66,196,246.94,293.66,261.63],chords=[110,130.81,98,123.47];
    musicTimer=setInterval(()=>{if(!ac||game.mode!=='playing')return;const t=ac.currentTime,n=beat++%16; tone(chords[Math.floor(n/4)%4],.42,t,.13,'triangle');if(n%2===0)tone(notes[n%8],.28,t,.075,'sine');if(n%4===0)tone(notes[(n+3)%8]*2,.14,t,.025,'sine')},280)
  }
  function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null}}
  ui.start.addEventListener('click',startGame);ui.restart.addEventListener('click',startGame);ui.resume.addEventListener('click',resumeGame);ui.pauseBtn.addEventListener('click',pauseGame);ui.soundBtn.addEventListener('click',()=>soundOn(!game.audioOn));
  document.querySelectorAll('[data-move]').forEach(button=>button.addEventListener('click',()=>move(button.dataset.move)));
  addEventListener('keydown',event=>{const key=event.key.toLowerCase();if(['arrowleft','arrowright','arrowup','arrowdown',' ','escape'].includes(key))event.preventDefault();if(key==='escape'){game.mode==='paused'?resumeGame():pauseGame();return}if(key==='arrowleft'||key==='a')move('left');else if(key==='arrowright'||key==='d')move('right');else if(key==='arrowup'||key==='w'||key===' ')move('jump');else if(key==='arrowdown'||key==='s')move('slide');else if(key==='p')game.mode==='paused'?resumeGame():pauseGame()});
  canvas.addEventListener('touchstart',event=>{const touch=event.changedTouches[0];touchStart={x:touch.clientX,y:touch.clientY}},{passive:true});
  canvas.addEventListener('touchend',event=>{if(!touchStart)return;const touch=event.changedTouches[0],dx=touch.clientX-touchStart.x,dy=touch.clientY-touchStart.y;if(Math.max(Math.abs(dx),Math.abs(dy))>24)move(Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'jump':'slide'));touchStart=null},{passive:true});
})();
