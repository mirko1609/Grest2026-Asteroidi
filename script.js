import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// -------------------------------------------------------------
// CIELO CONDIVISO (opzionale) — perché tutti vedano le stelle di tutti
// -------------------------------------------------------------
// 1. Vai su https://console.firebase.google.com e crea un progetto gratuito
//    (bastano un paio di minuti, non serve carta di credito).
// 2. Nel menu a sinistra apri "Realtime Database" -> "Crea database" -> scegli
//    modalità TEST (permette lettura/scrittura pubblica, va bene per questo uso).
// 3. Nelle impostazioni del progetto (icona ingranaggio in alto a sinistra ->
//    "Impostazioni progetto" -> scorri fino a "Le tue app" -> aggiungi un'app Web)
//    copia l'oggetto "firebaseConfig" che ti viene mostrato e incollalo qui sotto,
//    al posto dei campi vuoti.
// Se lasci firebaseConfig vuoto, il sito funziona comunque: ogni stella resta
// visibile solo sul dispositivo di chi l'ha accesa, come prima.
const firebaseConfig = {
  apiKey: "AIzaSyBrEqwdwrEQfrU-0XHOIDLAOtZuCGjKbTU",
  databaseURL: "https://asteroidi-93f29-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "asteroidi-93f29"
};

window.stelleCloud = { attivo: false };

if(firebaseConfig.apiKey && firebaseConfig.databaseURL){
  try{
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const stelleRef = ref(db, 'stelle');

    window.stelleCloud = {
      attivo: true,
      aggiungi(nome){
        push(stelleRef, { nome, quando: Date.now() });
      },
      ascolta(callback){
        onValue(stelleRef, (snapshot)=>{
          const dati = snapshot.val() || {};
          const elenco = Object.values(dati)
            .sort((a,b)=> (a.quando||0) - (b.quando||0))
            .map(v=> v.nome);
          callback(elenco);
        });
      }
    };
  }catch(e){
    console.warn('Configurazione Firebase non valida, uso il salvataggio locale', e);
  }
}

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
ctx.lineWidth=2;

for(let i=shootingStars.length-1;i>=0;i--){

    const s=shootingStars[i];

    s.x+=s.vx;

    s.y+=s.vy;

    s.life++;

    ctx.strokeStyle="rgba(255,255,255,"+(1-s.life/s.maxLife)+")";

    ctx.beginPath();

    ctx.moveTo(s.x,s.y);

    ctx.lineTo(s.x-45,s.y-18);

    ctx.stroke();

    if(s.life>s.maxLife){

        shootingStars.splice(i,1);

    }

}

  requestAnimationFrame(animate);
}

resize();
initStars();
// ======================================================
// STELLE CADENTI
// ======================================================

let shootingStars=[];

function spawnShootingStar(){

    shootingStars.push({

        x:Math.random()*w*0.8,

        y:Math.random()*h*0.4,

        vx:10+Math.random()*4,

        vy:4+Math.random()*2,

        life:0,

        maxLife:70

    });

}

setInterval(()=>{

    spawnShootingStar();

},18000);

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
  // la sezione del "silenzio" e le stelle-nome cambiano l'altezza della pagina
  // dopo essere state costruite: ricalcoliamo di nuovo a costellazione pronta
  posizionaCostellazione();
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

  // La galleria si spegne presto, appena si entra nella zona del silenzio;
  // Fix You si accende solo verso la fine, quando ormai si intravede la lettera.
  // Nel mezzo, per un lungo tratto (mentre appaiono la frase e i nomi),
  // non suona nessuna delle due: è la pausa voluta.
  const finePrima = 0.18;     // entro il 18% del percorso la galleria è già a zero
  const inizioSeconda = 0.25; // solo dal 75% in poi comincia a salire Fix You

  const volumeGalleria = progress <= finePrima
    ? (1 - progress / finePrima) * userMaxVolume
    : 0;

  const volumeLettera = progress >= inizioSeconda
    ? ((progress - inizioSeconda) / (1 - inizioSeconda)) * userMaxVolume
    : 0;

  if(volumeGalleria > 0){
    if(trackGallery.paused){
      trackGallery.currentTime = 0;
      trackGallery.play().catch(()=>{});
    }
    gainGallery.gain.value = volumeGalleria;
  } else {
    if(!trackGallery.paused){
      trackGallery.pause();
      trackGallery.currentTime = 0;
    }
    gainGallery.gain.value = 0;
  }

  if(volumeLettera > 0){
    if(trackLetter.paused){
      trackLetter.currentTime = 0;
      trackLetter.play().catch(()=>{});
    }
    gainLetter.gain.value = volumeLettera;
  } else {
    if(!trackLetter.paused){
      trackLetter.pause();
      trackLetter.currentTime = 0;
    }
    gainLetter.gain.value = 0;
  }
}

window.addEventListener('scroll', applyCrossfade, {passive:true});
window.addEventListener('resize', applyCrossfade);

// ======================================================
// ANIMAZIONE GALLERIA
// ======================================================

const observer=new IntersectionObserver(entries=>{

    entries.forEach(entry=>{

        if(entry.isIntersecting){

            entry.target.classList.add("visible");

        }

    });

},{
    threshold:.15
});

document.querySelectorAll(".tile").forEach(tile=>{

    observer.observe(tile);

});

// ======================================================
// 1) IL SILENZIO — testo che respira + costellazione dei nomi
// ======================================================

// Frase che appare parola per parola. Le parole tra ** ** vengono
// evidenziate in bianco (classe "forte"): usale per le 2-3 parole
// che vuoi che pesino di più.
const fraseRespiro = "Cinque settimane fa non vi conoscevate. **Adesso siete una famiglia.** Fermatevi un secondo, prima di continuare a leggere.";

// -------------------------------------------------------------
// SOSTITUISCI QUESTO ELENCO con i nomi veri dei bambini della squadra.
// Ogni nome diventerà una stella che si accende nel cielo, in ordine.
// -------------------------------------------------------------
const nomiAsteroidi = [
"Chiara", "Alessio", "Carlotta", "Matteo", "Mariavittoria", "Elena",
"Perla", "Alessandro", "Loris", "Filippo", "Marta", "Giorgia",
"Sofia", "Beatrice", "Giada", "Roberta", "Alessia", "Matilde", 
"Aurora", "Giada", "Francesco", "Vincenzo", "Anthony", "Edward",
"Gabriele", "Arturo", "Simone"
];


function costruisciRespiro(){
  const contenitore = document.getElementById('respiroTesto');
  if(!contenitore) return;
  const parti = fraseRespiro.split(' ');
  contenitore.innerHTML = parti.map(parola=>{
    const forte = parola.includes('**');
    const pulita = parola.replace(/\*\*/g,'');
    return `<span class="parola${forte ? ' forte' : ''}">${pulita}</span>`;
  }).join(' ');
}

function costruisciCostellazione(){
  const contenitore = document.getElementById('costellazioneNomi');
  if(!contenitore) return;
  contenitore.innerHTML = '';
  // posizioni sparse ma leggibili, calcolate una volta sola
  nomiAsteroidi.forEach((nome, i)=>{
    const el = document.createElement('div');
    el.className = 'stella-nome';
    const colonna = i % 4;
    const riga = Math.floor(i / 4);
    const jitterX = (Math.random()-0.5)*8;
    const jitterY = (Math.random()-0.5)*8;
    el.style.left = `calc(${(colonna/3)*82 + 5 + jitterX}% )`;
    el.style.top = `calc(${(riga/3)*82 + jitterY}% )`;
    el.innerHTML = `<span class="punto" style="animation-delay:${(i*0.3).toFixed(1)}s"></span><span class="nome">${nome}</span>`;
    contenitore.appendChild(el);
  });
}

function posizionaCostellazione(){
  // ricostruisce (senza duplicare) dopo eventuali resize importanti,
  // mantenendo le classi "mostra" già assegnate
  const contenitore = document.getElementById('costellazioneNomi');
  if(!contenitore || contenitore.children.length) return;
  costruisciCostellazione();
}

costruisciRespiro();
costruisciCostellazione();

// rivela le parole una a una quando la sezione del silenzio entra in vista,
// poi accende le stelle-nome una dopo l'altra, poi la chiusura
let respiroAvviato = false;
const respiroObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting && !respiroAvviato){
      respiroAvviato = true;
      avviaSequenzaRespiro();
    }
  });
}, {threshold:0.35});

const sezioneSilenzio = document.getElementById('transizione');
if(sezioneSilenzio) respiroObserver.observe(sezioneSilenzio);

function avviaSequenzaRespiro(){
  const parole = document.querySelectorAll('#respiroTesto .parola');
  parole.forEach((el, i)=>{
    setTimeout(()=> el.classList.add('mostra'), 260 * i);
  });

  const ritardoStelle = 260 * parole.length + 500;
  const stelleEl = document.querySelectorAll('#costellazioneNomi .stella-nome');
  stelleEl.forEach((el, i)=>{
    setTimeout(()=> el.classList.add('mostra'), ritardoStelle + 220 * i);
  });

  const chiusura = document.getElementById('respiroChiusura');
  if(chiusura){
    const ritardoChiusura = ritardoStelle + 220 * stelleEl.length + 600;
    setTimeout(()=> chiusura.classList.add('mostra'), ritardoChiusura);
  }
}

// ======================================================
// 3) ACCENDI LA TUA STELLA — gesto finale, condiviso o locale
// ======================================================

const CHIAVE_STELLE = 'asteroidi_grest2026_stelle'; // usata solo come ripiego locale

function leggiStelleSalvate(){
  try{
    const dati = localStorage.getItem(CHIAVE_STELLE);
    return dati ? JSON.parse(dati) : [];
  }catch(e){
    return [];
  }
}

function salvaStelleLocali(elenco){
  try{
    localStorage.setItem(CHIAVE_STELLE, JSON.stringify(elenco));
  }catch(e){
    console.warn('Impossibile salvare la stella su questo dispositivo', e);
  }
}

function escapeHTML(testo){
  const div = document.createElement('div');
  div.textContent = testo;
  return div.innerHTML;
}

function disegnaStelle(elenco){
  const cielo = document.getElementById('cieloStelle');
  if(!cielo) return;
  if(!elenco.length){
    cielo.innerHTML = '<span class="cielo-vuoto">Non c\'è ancora nessuna stella qui. Sii il primo ad accenderla.</span>';
    return;
  }
  cielo.innerHTML = elenco.map(nome=>`
    <span class="stella-accesa"><span class="puntino"></span>${escapeHTML(nome)}</span>
  `).join('');
}

function inizializzaAccendiStella(){
  const input = document.getElementById('stellaInput');
  const btn = document.getElementById('stellaBtn');
  const cielo = document.getElementById('cieloStelle');
  if(!input || !btn || !cielo) return;

  const cloudAttivo = window.stelleCloud && window.stelleCloud.attivo;

  if(cloudAttivo){
    // modalità condivisa: tutti i visitatori vedono le stelle di tutti,
    // in tempo reale, tramite Firebase Realtime Database
    window.stelleCloud.ascolta((elenco)=> disegnaStelle(elenco));
  } else {
    // ripiego locale: usato solo se Firebase non è configurato
    disegnaStelle(leggiStelleSalvate());
  }

  function accendi(){
    const nome = input.value.trim();
    if(!nome) return;
    const nomePulito = nome.slice(0,30);

    if(cloudAttivo){
      window.stelleCloud.aggiungi(nomePulito);
      // non serve richiamare disegnaStelle qui: arriva già dall'ascolto in tempo reale
    } else {
      const elenco = leggiStelleSalvate();
      elenco.push(nomePulito);
      salvaStelleLocali(elenco);
      disegnaStelle(elenco);
    }
    input.value = '';
    input.focus();
  }

  btn.addEventListener('click', accendi);
  input.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter') accendi();
  });
}

inizializzaAccendiStella();