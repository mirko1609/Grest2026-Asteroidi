const canvas = document.getElementById('stars');
const ctx = canvas.getContext('2d');
let w, h, stars = [], drifters = [];

function resize(){
  w = canvas.width = window.innerWidth;
  h = canvas.height = document.body.scrollHeight;
}
window.addEventListener('resize', ()=>{ resize(); initStars(); });

function initStars(){
  stars = [];
  const count = Math.floor((w*h)/9000);
  for(let i=0;i<count;i++){
    stars.push({
      x: Math.random()*w,
      y: Math.random()*h,
      r: Math.random()*1.4+0.3,
      phase: Math.random()*Math.PI*2,
      speed: 0.4+Math.random()*0.8
    });
  }
  drifters = [];
  for(let i=0;i<6;i++){
    drifters.push({
      x: Math.random()*w,
      y: Math.random()*h,
      r: 1.5+Math.random()*2,
      vx: (Math.random()-0.5)*0.15,
      vy: (Math.random()-0.5)*0.05
    });
  }
}

let t = 0;
function animate(){
  t += 0.016;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = '#f6f4ee';
  for(const s of stars){
    const alpha = 0.35 + 0.65*Math.abs(Math.sin(t*s.speed + s.phase));
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#f2c46d';
  for(const d of drifters){
    d.x += d.vx; d.y += d.vy;
    if(d.x < -10) d.x = w+10;
    if(d.x > w+10) d.x = -10;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI*2);
    ctx.fill();
  }
  requestAnimationFrame(animate);
}

resize();
initStars();
animate();
setTimeout(()=>{ resize(); initStars(); }, 300);

// ---------------- Audio crossfade ----------------
const trackGallery = document.getElementById('trackGallery');
const trackLetter = document.getElementById('trackLetter');
const soundToggle = document.getElementById('soundToggle');
const soundLabel = document.getElementById('soundLabel');
const nowPlaying = document.getElementById('nowPlaying');
const transizione = document.getElementById('transizione');
const audioGate = document.getElementById('audioGate');
const gateBtn = document.getElementById('gateBtn');

// blocca lo scroll finché il gate è visibile
document.body.style.overflow = 'hidden';

gateBtn.addEventListener('click', async ()=>{
  await enableAudio();
  audioGate.classList.add('hidden');
  document.body.style.overflow = '';
});

trackGallery.volume = 0;
trackLetter.volume = 0;

let audioEnabled = false;
let userMaxVolume = 0.55; // volume massimo di ciascuna traccia

function updateNowPlaying(text){
  if(!text){
    nowPlaying.classList.remove('visible');
    return;
  }
  nowPlaying.textContent = '♫ ' + text;
  nowPlaying.classList.add('visible');
}

async function enableAudio(){
  audioEnabled = true;
  soundToggle.classList.add('playing');
  soundLabel.textContent = 'Audio attivo';
  try{
    trackGallery.currentTime = 0;
    await trackGallery.play();
  }catch(e){
    // i file mp3 potrebbero non essere ancora stati aggiunti dall'utente
    console.warn('Audio non disponibile: aggiungi i file mp3 nella cartella /audio', e);
  }
  applyCrossfade();
}

function disableAudio(){
  audioEnabled = false;
  soundToggle.classList.remove('playing');
  soundLabel.textContent = "Attiva l'audio";
  trackGallery.pause();
  trackLetter.pause();
  updateNowPlaying(null);
}

soundToggle.addEventListener('click', ()=>{
  if(audioEnabled){ disableAudio(); } else { enableAudio(); }
});

// calcola il progresso di crossfade in base alla posizione della zona di transizione
function applyCrossfade(){
  if(!audioEnabled) return;

  const rect = transizione.getBoundingClientRect();
  const vh = window.innerHeight;

  // progress 0 = transizione non ancora raggiunta (tutta galleria)
  // progress 1 = transizione superata (tutta lettera)
  let progress;
  if(rect.top >= vh){
    progress = 0;
  } else if(rect.bottom <= 0){
    progress = 1;
  } else {
    const total = rect.height + vh;
    const traveled = vh - rect.top;
    progress = Math.min(1, Math.max(0, traveled / total));
  }

  // --- traccia galleria: resta in play finché non siamo arrivati in fondo del tutto ---
  if(progress < 1){
    if(trackGallery.paused){
      trackGallery.currentTime = 0;
      trackGallery.play().catch(()=>{});
    }
    trackGallery.volume = (1 - progress) * userMaxVolume;
  } else {
    if(!trackGallery.paused){
      trackGallery.pause();
      trackGallery.currentTime = 0;
    }
    trackGallery.volume = 0;
  }

  // --- traccia lettera: parte solo quando si entra nella zona di transizione ---
  if(progress > 0){
    if(trackLetter.paused){
      trackLetter.currentTime = 0;
      trackLetter.play().catch(()=>{});
    }
    trackLetter.volume = progress * userMaxVolume;
  } else {
    if(!trackLetter.paused){
      trackLetter.pause();
      trackLetter.currentTime = 0;
    }
    trackLetter.volume = 0;
  }

  if(progress < 0.5){
    updateNowPlaying('');
  } else {
    updateNowPlaying('');
  }
}

window.addEventListener('scroll', applyCrossfade, {passive:true});
window.addEventListener('resize', applyCrossfade);