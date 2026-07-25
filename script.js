const canvas = document.getElementById('stars');
const ctx = canvas.getContext('2d');
let w, h, stars = [], drifters = [];

function resize(){
  w = canvas.width = window.innerWidth;
  h = canvas.height = document.body.scrollHeight;
}

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

// Su mobile la barra degli indirizzi che appare/scompare durante lo scroll
// scatena molti eventi "resize": se ogni volta rigenerassimo le stelle in
// posizioni nuove e casuali si vedrebbe un fastidioso "salto". Qui invece
// ridimensioniamo il canvas e riposizioniamo le stelle già esistenti in
// proporzione, senza mai rigenerarle da zero dopo il primo avvio.
let resizeTimeout;
function handleResize(){
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(()=>{
    const oldW = w, oldH = h;
    resize();
    if(oldW && oldH && stars.length){
      const scaleX = w / oldW;
      const scaleY = h / oldH;
      stars.forEach(s=>{ s.x *= scaleX; s.y *= scaleY; });
      drifters.forEach(d=>{ d.x *= scaleX; d.y *= scaleY; });
    } else {
      initStars();
    }
    applyCrossfade();
  }, 200);
}
window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', handleResize);

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

// una volta caricate tutte le immagini/video la pagina può essere più alta:
// ricalcoliamo UNA sola volta, riposizionando le stelle esistenti (mai a caso)
window.addEventListener('load', ()=>{
  const oldW = w, oldH = h;
  resize();
  if(oldW && oldH && stars.length){
    const scaleX = w / oldW;
    const scaleY = h / oldH;
    stars.forEach(s=>{ s.x *= scaleX; s.y *= scaleY; });
    drifters.forEach(d=>{ d.x *= scaleX; d.y *= scaleY; });
  }
});

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

let audioEnabled = false;
let userMaxVolume = 0.55; // volume massimo di ciascuna traccia

// Su iOS/Safari la proprietà .volume di <audio> viene IGNORATA (resta sempre
// al massimo): è una limitazione nota del sistema. L'unico modo per avere un
// fade reale su tutti i dispositivi è instradare l'audio nella Web Audio API
// e controllare il volume con dei GainNode, che non hanno questa limitazione.
let audioCtx = null;
let gainGallery = null;
let gainLetter = null;
let audioGraphReady = false;

function setupAudioGraph(){
  if(audioGraphReady) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContextClass();

  const sourceGallery = audioCtx.createMediaElementSource(trackGallery);
  const sourceLetter = audioCtx.createMediaElementSource(trackLetter);

  gainGallery = audioCtx.createGain();
  gainLetter = audioCtx.createGain();

  sourceGallery.connect(gainGallery).connect(audioCtx.destination);
  sourceLetter.connect(gainLetter).connect(audioCtx.destination);

  gainGallery.gain.value = 0;
  gainLetter.gain.value = 0;

  audioGraphReady = true;
}

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

  // il grafo Web Audio va creato/ripreso dentro un gesto utente reale (il click)
  setupAudioGraph();
  if(audioCtx.state === 'suspended'){
    try{ await audioCtx.resume(); }catch(e){ console.warn('Impossibile riprendere AudioContext', e); }
  }

  try{
    trackGallery.currentTime = 0;
    await trackGallery.play();
  }catch(e){
    // i file mp3 potrebbero non essere ancora stati aggiunti dall'utente
    console.warn('Audio non disponibile: aggiungi i file mp3 nella cartella /audio', e);
  }
  // IMPORTANTE per mobile: molti browser (Safari iOS in particolare) permettono
  // il play() automatico via JS solo se l'elemento è già stato "sbloccato" da
  // un gesto reale dell'utente. Qui, nello stesso click, avviamo e mettiamo
  // subito in pausa anche la seconda traccia: da questo momento in poi potrà
  // essere riavviata più avanti dallo scroll senza essere bloccata.
  try{
    await trackLetter.play();
    trackLetter.pause();
    trackLetter.currentTime = 0;
  }catch(e){
    console.warn('Sblocco traccia Fix You non riuscito', e);
  }
  applyCrossfade();
}

function disableAudio(){
  audioEnabled = false;
  soundToggle.classList.remove('playing');
  soundLabel.textContent = "Attiva l'audio";
  trackGallery.pause();
  trackLetter.pause();
  if(gainGallery) gainGallery.gain.value = 0;
  if(gainLetter) gainLetter.gain.value = 0;
  updateNowPlaying(null);
}

soundToggle.addEventListener('click', ()=>{
  if(audioEnabled){ disableAudio(); } else { enableAudio(); }
});

// calcola il progresso di crossfade in base alla posizione della zona di transizione
function applyCrossfade(){
  if(!audioEnabled || !audioGraphReady) return;

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
    gainGallery.gain.value = (1 - progress) * userMaxVolume;
  } else {
    if(!trackGallery.paused){
      trackGallery.pause();
      trackGallery.currentTime = 0;
    }
    gainGallery.gain.value = 0;
  }

  // --- traccia lettera: parte solo quando si entra nella zona di transizione ---
  if(progress > 0){
    if(trackLetter.paused){
      trackLetter.currentTime = 0;
      trackLetter.play().catch(()=>{});
    }
    gainLetter.gain.value = progress * userMaxVolume;
  } else {
    if(!trackLetter.paused){
      trackLetter.pause();
      trackLetter.currentTime = 0;
    }
    gainLetter.gain.value = 0;
  }

  if(progress < 0.5){
    updateNowPlaying('');
  } else {
    updateNowPlaying('');
  }
}

window.addEventListener('scroll', applyCrossfade, {passive:true});
window.addEventListener('resize', applyCrossfade);