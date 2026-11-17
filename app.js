
/* ---------- Simgeler ---------- */
const SVG=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${p}</svg>`;
const ICON={
  trash:SVG('<path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6"/>'),
  history:SVG('<path d="M3 11a9 9 0 1 1 2.6 7M3 5v6h6"/><path d="M12 7v5l3 2"/>'),
  eye:SVG('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  eyeOff:SVG('<path d="M3 3l18 18"/><path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.5-.6 4.9-1.4"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
  copy:SVG('<rect x="9" y="9" width="11" height="11" rx="1"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>'),
  edit:SVG('<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>')
};

/* ---------- Tarih ---------- */
const now=new Date();now.setHours(0,0,0,0);
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parseDay=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
function past(n){const d=new Date(now);d.setDate(d.getDate()-n);return iso(d)}
/* Ay ekler; hedef ayda o gün yoksa ayın son gününe sabitler (31 Ağu + 6 ay = 28/29 Şub). */
function addMonths(date,n){const d=new Date(date.getFullYear(),date.getMonth()+n,1);const lastDay=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(date.getDate(),lastDay));return d}
const fmt=d=>d.toLocaleDateString('tr-TR',{day:'numeric',month:'short',year:'numeric'});

/* ---------- Veri (yalnızca bellek) ---------- */
let people=[];
let records=[];
let person='Tümü',editing=null,selectedRecord=null;
const visible=new Set();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);

function due(r){return r.months?addMonths(parseDay(r.last),Number(r.months)):null}
function days(r){const d=due(r);return d?Math.round((d-now)/86400000):Infinity}
function status(r){const d=days(r);return d<0?'late':d<=30?'soon':'ok'}
function byUrgency(a,b){const da=days(a),db=days(b);if(da!==db)return da<db?-1:1;return a.name.localeCompare(b.name,'tr')}

/* ---------- Görünüm ---------- */
function render(){
  queueVaultSave();
  const scoped=records.filter(r=>person==='Tümü'||r.person===person);

  $('people').innerHTML=
    `<button type="button" class="person" data-person="all" aria-pressed="${person==='Tümü'}">Tümü</button>`+
    people.map((p,i)=>`<button type="button" class="person" data-person="${i}" aria-pressed="${p===person}">${esc(p)}</button>`).join('');
  $('people').classList.toggle('many',people.length+1>4);


  const q=$('search').value.toLocaleLowerCase('tr');
  const rows=scoped
    .filter(r=>(r.name+' '+r.person).toLocaleLowerCase('tr').includes(q))
    ;

  const emptyText='Aramana uygun kayıt bulunamadı.';
  $('cards').innerHTML=rows.length?rows.map(card).join(''):q?`<div class="empty">${emptyText}</div>`:!people.length?'<div class="empty">Kişileri yönet ile ilk aile üyesini ekle.</div>':!scoped.length?'<div class="empty">Yeni kayıt ile ilk hesabı ekle.</div>':'';
}

function card(r){
  const s=status(r),d=days(r),shown=visible.has(r.id),n=esc(r.name);
  const label=d===Infinity?'Süresiz':d<0?`${-d} gün gecikti`:d===0?'Bugün değiştir':`Değişime ${d} gün`;
  return `<article class="card${selectedRecord===r.id?' selected':''}" data-card-id="${r.id}" tabindex="0" aria-label="${n}${selectedRecord===r.id?' · Seçili':''}">
    <div class="card-head">
      <div><h3>${n}</h3><div class="owner">${esc(r.person)} hesabı</div></div>
      <div class="card-actions"><button type="button" class="icon" data-action="delete" data-id="${r.id}" aria-label="${n} kaydını sil" title="Kaydı sil">${ICON.trash}</button><button type="button" class="icon" data-action="history" data-id="${r.id}" aria-label="${n} geçmiş şifreleri" title="Şifre geçmişi">${ICON.history}</button><button type="button" class="icon" data-action="edit" data-id="${r.id}" aria-label="${n} kaydını düzenle" title="Kaydı düzenle">${ICON.edit}</button></div>
    </div>
    <div class="pass-head"><span class="label">ŞİFRE</span><span class="due ${s}" title="${due(r)?'Sonraki değişiklik: '+fmt(due(r)):'Düzenli değişim yok'}">${label}</span></div>
    <div class="password">
      <code>${shown?esc(r.pass):'<span aria-hidden="true">••••••••••••</span><span class="sr-only">Gizli</span>'}</code>
      <button type="button" class="icon" data-action="toggle" data-id="${r.id}" aria-pressed="${shown}" aria-label="${n} şifresini ${shown?'gizle':'göster'}" title="${shown?'Gizle':'Göster'}">${shown?ICON.eyeOff:ICON.eye}</button>
      <button type="button" class="icon" data-action="copy" data-id="${r.id}" aria-label="${n} şifresini kopyala" title="Kopyala">${ICON.copy}</button>
    </div>
    ${r.draft?`<div class="draft-note">Yeni şifre taslakta bekliyor. Kaydı güncelleyene kadar mevcut şifre değişmez.</div>`:''}
    <button type="button" class="renew${r.draft?' pending':''}" data-action="renew" data-id="${r.id}">${r.draft?'↻ &nbsp; Taslağı tamamla':'↻ &nbsp; Şifreyi güncelle'}</button>
  </article>`;
}

let toastTimer;
function toast(t){const e=$('toast');e.textContent=t;e.style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.style.display='none',2600)}

async function writeClipboard(text){
  if(navigator.clipboard?.writeText&&window.isSecureContext){
    try{await navigator.clipboard.writeText(text);return}catch{/* Try the selection method below. */}
  }
  const focused=document.activeElement;
  const selection=window.getSelection?.();
  const ranges=selection?Array.from({length:selection.rangeCount},(_,i)=>selection.getRangeAt(i).cloneRange()):[];
  const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');
  area.style.cssText='position:fixed;top:0;left:0;width:2px;height:2px;opacity:0;font-size:16px;pointer-events:none';
  const host=document.querySelector('dialog[open]')||document.body;
  host.appendChild(area);
  let copied=false;
  try{area.focus({preventScroll:true});area.select();area.setSelectionRange(0,area.value.length);copied=document.execCommand('copy')}
  finally{area.remove();focused?.focus?.({preventScroll:true});if(selection&&ranges.length){selection.removeAllRanges();ranges.forEach(r=>selection.addRange(r))}}
  if(!copied)throw Error('Clipboard unavailable');
}
const passwordFlashTimers=new WeakMap();
function flashPassword(field){
  if(!field)return;
  clearTimeout(passwordFlashTimers.get(field));
  field.classList.remove('copy-flash');void field.offsetWidth;field.classList.add('copy-flash');
  passwordFlashTimers.set(field,setTimeout(()=>{field.classList.remove('copy-flash');passwordFlashTimers.delete(field)},2000));
}
async function copyPass(id){
  try{await writeClipboard(records.find(r=>r.id===id).pass);flashPassword(document.querySelector(`[data-card-id="${id}"] .password`));}
  catch{toast('Tarayıcı kopyalamayı engelledi. Şifreyi gösterip seçerek kopyalayabilirsin.')}
}

/* ---------- Olaylar: ana ekran ---------- */
$('people').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  person=b.dataset.person==='all'?'Tümü':people[Number(b.dataset.person)];render();
});
$('search').addEventListener('input',render);
$('cards').addEventListener('click',e=>{
  const b=e.target.closest('[data-action]');
  if(!b){const card=e.target.closest('[data-card-id]');if(card)toggleCard(Number(card.dataset.cardId));return}
  const id=Number(b.dataset.id),a=b.dataset.action;
  if(selectedRecord!==id)toggleCard(id);
  if(a==='delete')openDeleteRecord(id)
  else if(a==='history')openHistory(id);
  else if(a==='edit')openForm(id);
  else if(a==='renew')openRenew(id);
  else if(a==='copy')copyPass(id);
  else if(a==='toggle'){visible.has(id)?visible.delete(id):visible.add(id);render();document.querySelector(`[data-action="toggle"][data-id="${id}"]`)?.focus()}
});
let pendingShine=null,shineCleanup;
function shineCard(id){
  pendingShine=id;
  const card=document.querySelector(`[data-card-id="${id}"]`);if(!card)return;
  clearTimeout(shineCleanup);
  document.querySelectorAll('.save-shine').forEach(c=>c.classList.remove('save-shine'));
  void card.offsetWidth;card.classList.add('save-shine');
  shineCleanup=setTimeout(()=>{document.querySelectorAll('.save-shine').forEach(c=>c.classList.remove('save-shine'));pendingShine=null},2000);
}
function toggleCard(id){selectedRecord=selectedRecord===id?null:id;document.querySelectorAll('[data-card-id]').forEach(card=>{const active=Number(card.dataset.cardId)===selectedRecord;card.classList.toggle('selected',active);const r=records.find(x=>x.id===Number(card.dataset.cardId));card.setAttribute('aria-label',`${r?.name||'Hesap'}${active?' · Seçili':''}`)})}
$('cards').addEventListener('keydown',e=>{if(e.target.matches('[data-card-id]')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();toggleCard(Number(e.target.dataset.cardId))}});
$('newBtn').addEventListener('click',()=>openForm());
$('manageBtn').addEventListener('click',()=>openPeople());

/* ---------- Kayıt formu ---------- */
const modal=$('modal'),form=$('form');

function openForm(id){
  pendingRecordDeletion=null;$('deleteRecordConfirm').hidden=true;
  if(!people.length){openPeople();peopleMsg('Kayıt eklemek için önce bir kişi ekle.',true);return}
  resetGeneratedCopy();
  editing=id||null;
  form.reset();
  form.elements.person.innerHTML=people.map(p=>`<option>${esc(p)}</option>`).join('');
  if(person!=='Tümü')form.elements.person.value=person;
  $('formTitle').textContent=id?'Kaydı düzenle':'Yeni kayıt';
  $('passLabel').textContent=id?'Yeni şifre':'Şifre';
  $('rulesBox').hidden=true;
  $('deleteBtn').hidden=!id;
  const r=id?records.find(x=>x.id===id):null;
  if(r)['name','person','pass','months'].forEach(k=>form.elements[k].value=r[k]);
  loadRules(r?r.rules:null);
  modal.showModal();
}

$('cancelBtn').addEventListener('click',()=>modal.close());
const quickDeleteModal=$('quickDeleteModal');let quickDeleteId=null;
function openDeleteRecord(id){
  const r=records.find(x=>x.id===id);if(!r)return;
  quickDeleteId=id;
  $('quickDeleteText').textContent=`“${r.name}” kaydı ve şifre geçmişi silinecek.`;
  quickDeleteModal.showModal();$('quickDeleteCancel').focus();
}
$('quickDeleteCancel').addEventListener('click',()=>quickDeleteModal.close());
$('quickDeleteYes').addEventListener('click',()=>{
  const id=quickDeleteId;if(id===null)return;
  records=records.filter(r=>r.id!==id);visible.delete(id);
  if(selectedRecord===id)selectedRecord=null;
  quickDeleteModal.close();render();;
});
quickDeleteModal.addEventListener('close',()=>{quickDeleteId=null});

let pendingRecordDeletion=null;
$('deleteBtn').addEventListener('click',()=>{
  const r=records.find(x=>x.id===editing);if(!r)return;
  pendingRecordDeletion=r.id;
  $('deleteRecordText').textContent=`“${r.name}” (${r.person}) kaydı ve şifre geçmişi silinsin mi? Bu işlem geri alınamaz.`;
  $('deleteRecordConfirm').hidden=false;
  $('deleteRecordCancel').focus();
});
$('deleteRecordCancel').addEventListener('click',()=>{pendingRecordDeletion=null;$('deleteRecordConfirm').hidden=true});
$('deleteRecordYes').addEventListener('click',()=>{
  const id=pendingRecordDeletion;if(id===null||!records.some(r=>r.id===id))return;
  records=records.filter(r=>r.id!==id);visible.delete(id);
  if(selectedRecord===id)selectedRecord=null;
  pendingRecordDeletion=null;$('deleteRecordConfirm').hidden=true;
  modal.close();render();;
});
modal.addEventListener('close',()=>{pendingRecordDeletion=null;$('deleteRecordConfirm').hidden=true});

/* Kural: {type, min, max, upper, lower, digit, symbol, symbols}. min = max ise tam uzunluk. */
function readRules(scope=form){
  const f=scope.elements,sel=f.ruleLength.value;let min,max;
  if(sel==='range'){min=Number(f.rangeMin.value);max=Number(f.rangeMax.value)}
  else{min=max=Number(sel==='custom'?f.customLength.value:sel)}
  return {type:f.ruleType.value,min,max,upper:f.reqUpper.checked,lower:f.reqLower.checked,digit:f.reqDigit.checked,symbol:f.reqSymbol.checked,symbols:[...new Set(f.allowedSymbols.value)].join('')};
}
function loadRules(r,scope=form,prefix=''){
  const f=scope.elements;
  r=r||{type:'unset',min:8,max:8,upper:true,lower:true,digit:true,symbol:true,symbols:'!@#*'};
  f.ruleType.value=r.type;
  if(r.min!==r.max){f.ruleLength.value='range';f.rangeMin.value=r.min;f.rangeMax.value=r.max}
  else{f.ruleLength.value=[6,8,12,16].includes(r.min)?String(r.min):'custom';f.customLength.value=r.min}
  f.reqUpper.checked=r.upper;f.reqLower.checked=r.lower;f.reqDigit.checked=r.digit;f.reqSymbol.checked=r.symbol;f.allowedSymbols.value=r.symbols;
  rulesChanged(false,scope,prefix);
}
function showFeedback(message,ok=false){const el=$('ruleFeedback');el.textContent=message;el.style.color=ok?'#4d6373':'#a34532'}
function rulesChanged(check=true,scope=form,prefix=''){
  const r=readRules(scope),sel=scope.elements.ruleLength.value,g=id=>$(prefix+id);
  g('ruleDetails').hidden=r.type==='unset';
  g('customLengthRow').hidden=sel!=='custom';
  g('rangeRow').hidden=sel!=='range';
  g('requiredTypes').hidden=r.type==='numeric';
  g('symbolsRow').hidden=r.type!=='special';
  g('reqSymbolRow').hidden=r.type!=='special';
  const feedback=prefix?renewMsg:showFeedback;
  feedback('');
  if(check&&r.type!=='unset'){
    const value=prefix?$('draftPass').value:scope.elements.pass.value;
    const err=ruleError(r)||(value?checkPassword(value,r):'');
    if(err)feedback(err);else if(value)feedback('Şifre bu kurallara uygun.',true);
  }
}
function regenerateForRules(scope,prefix){
  rulesChanged(false,scope,prefix);
  const rules=readRules(scope),feedback=prefix?renewMsg:showFeedback;
  if(rules.type==='unset'){if(prefix)syncRenew();return}
  const err=ruleError(rules);if(err){feedback(err);if(prefix)syncRenew();return}
  const value=createPassword(rules);
  if(prefix){$('draftPass').value=value;saveDraft()}else{form.elements.pass.value=value;resetGeneratedCopy()}
  feedback('');
}
form.querySelector('.rules').addEventListener('change',()=>regenerateForRules(form,''));

const CHAR_UPPER='ABCDEFGHIJKLMNOPQRSTUVWXYZ',CHAR_LOWER='abcdefghijklmnopqrstuvwxyz',CHAR_DIGIT='0123456789';
function ruleError(r){
  if(r.type==='unset')return '';
  if(!['numeric','alnum','special'].includes(r.type))return 'Karakter türünü seç.';
  if(![r.min,r.max].every(n=>Number.isInteger(n)&&n>=4&&n<=64))return 'Uzunluk 4–64 arasında tam sayı olmalı.';
  if(r.min>r.max)return 'En az uzunluk, en çok uzunluktan büyük olamaz.';
  if(r.type==='special'&&(!r.symbols||!/^[!-\/:-@[-`{-~]+$/.test(r.symbols)))return 'Özel karakter listesine yalnızca işaret yaz; harf, rakam veya boşluk kullanma.';
  const count=r.type==='numeric'?1:Number(r.upper)+Number(r.lower)+Number(r.digit)+Number(r.type==='special'&&r.symbol);
  if(count>r.min)return 'Uzunluk zorunlu karakterlerin sayısından az olamaz.';
  return '';
}
function checkPassword(pass,r){
  const err=ruleError(r);if(err||r.type==='unset')return err;
  if(pass.length<r.min||pass.length>r.max)return r.min===r.max?`Şifre tam ${r.min} karakter olmalı.`:`Şifre ${r.min}–${r.max} karakter arasında olmalı.`;
  const allowed=r.type==='numeric'?CHAR_DIGIT:CHAR_UPPER+CHAR_LOWER+CHAR_DIGIT+(r.type==='special'?r.symbols:'');
  if([...pass].some(c=>!allowed.includes(c)))return r.type==='numeric'?'Şifre yalnızca rakamlardan oluşmalı.':'Şifrede izin verilmeyen karakter var.';
  if(r.type!=='numeric'){
    if(r.upper&&!/[A-Z]/.test(pass))return 'En az bir büyük harf gerekli.';
    if(r.lower&&!/[a-z]/.test(pass))return 'En az bir küçük harf gerekli.';
    if(r.digit&&!/[0-9]/.test(pass))return 'En az bir rakam gerekli.';
    if(r.type==='special'&&r.symbol&&![...pass].some(c=>r.symbols.includes(c)))return 'En az bir izin verilen özel karakter gerekli.';
  }
  return '';
}
function randomIndex(n){const a=new Uint32Array(1),limit=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(a)}while(a[0]>=limit);return a[0]%n}
function createPassword(r){
  const err=ruleError(r);if(err)throw Error(err);
  if(r.type==='unset')throw Error('Üretmek için önce kurumun karakter türünü seç.');
  const pool=r.type==='numeric'?CHAR_DIGIT:CHAR_UPPER+CHAR_LOWER+CHAR_DIGIT+(r.type==='special'?r.symbols:'');
  const required=r.type==='numeric'?[]:[...(r.upper?[CHAR_UPPER]:[]),...(r.lower?[CHAR_LOWER]:[]),...(r.digit?[CHAR_DIGIT]:[]),...(r.type==='special'&&r.symbol?[r.symbols]:[])];
  const result=required.map(chars=>chars[randomIndex(chars.length)]);
  while(result.length<r.max)result.push(pool[randomIndex(pool.length)]);
  for(let i=result.length-1;i>0;i--){const j=randomIndex(i+1);[result[i],result[j]]=[result[j],result[i]]}
  return result.join('');
}
/* Kural menüsü ilk "Üret"te açılır; kural seçiliyse aynı basışta şifre de üretilir. */
function generate(){
  resetGeneratedCopy();
  $('rulesBox').hidden=false;
  if(readRules().type==='unset')loadRules(DEFAULT_RULE);
  try{form.elements.pass.value=createPassword(readRules());showFeedback('Şifre seçtiğin kurallara göre üretildi.',true)}
  catch(e){showFeedback(e.message)}
}
$('generateBtn').addEventListener('click',generate);

let copyResetTimer,copyAttempt=0;
function resetGeneratedCopy(){copyAttempt++;clearTimeout(copyResetTimer);$('copyStatus').textContent=''}
form.elements.pass.addEventListener('input',()=>{resetGeneratedCopy();showFeedback('')});
modal.addEventListener('close',resetGeneratedCopy);

form.onsubmit=e=>{
  e.preventDefault();
  const rules=readRules();
  const data={};['name','person','pass','months'].forEach(k=>data[k]=form.elements[k].value);
  data.months=Number(data.months);data.rules=rules;
  if(editing){
    const r=records.find(x=>x.id===editing);
    if(data.pass!==r.pass){archivePassword(r);data.last=iso(now);delete r.draft;delete r.draftRules}   // şifre değiştiyse değişim tarihi bugün
    Object.assign(r,data);visible.delete(editing);
  }
  else records.push({...data,last:iso(now),id:nextRecordId(),ink:'#68798c',symbol:data.name.trim()[0].toLocaleUpperCase('tr')});
  modal.close();render();
  ;
};

/* ---------- Şifre yenileme: üret → kaydı güncelle ----------
   Yeni şifre r.draft'ta durur. r.pass ve r.last yalnızca "Kaydı güncelle" ile değişir. */
const renewModal=$('renewModal'),renewRulesForm=$('renewRulesForm');let renewing=null;
const DEFAULT_RULE={type:'special',min:12,max:12,upper:true,lower:true,digit:true,symbol:true,symbols:'!@#*'};
const activeRule=r=>r.rules&&r.rules.type!=='unset'?r.rules:null;
function ruleSummary(rule){
  if(!rule)return 'Bu kayıtta kurum kuralı yok; Üret varsayılan olarak 12 karakter (harf + rakam + !@#*) üretir.';
  const len=rule.min===rule.max?`${rule.min} karakter`:`${rule.min}–${rule.max} karakter`;
  const kind={numeric:'yalnızca rakam',alnum:'harf + rakam',special:`harf + rakam + ${rule.symbols}`}[rule.type];
  return `Kurum kuralı: ${len}, ${kind}.`;
}
function renewMsg(t,ok=false){const el=$('renewFeedback');el.textContent=t;el.style.color=ok?'#4d6373':'#a34532'}
function draftError(r,draft){
  if(!draft)return 'Önce yeni şifreyi üret ya da yaz.';
  if(draft===r.pass)return 'Yeni şifre mevcut şifreyle aynı olamaz.';
  return '';
}
function syncRenew(){
  const r=records.find(x=>x.id===renewing);if(!r)return;
  const err=draftError(r,$('draftPass').value);
  $('renewConfirm').disabled=!!err;
}
function openRenew(id){
  const r=records.find(x=>x.id===id);if(!r)return;
  renewing=id;
  $('renewFor').textContent=`${r.name} · ${r.person}`;
  $('draftPass').value=r.draft||'';
  renewRulesForm.reset();
  loadRules(r.draftRules||r.rules||null,renewRulesForm,'renew');
  $('renewrulesBox').hidden=true;
  renewMsg('');
  syncRenew();
  renewModal.showModal();
}
function saveDraft(){
  const r=records.find(x=>x.id===renewing);if(!r)return;
  const v=$('draftPass').value;
  if(v){r.draft=v;r.draftRules=readRules(renewRulesForm)}else{delete r.draft;delete r.draftRules}
  syncRenew();queueVaultSave();
}
$('draftGenerate').addEventListener('click',()=>{
  if(!records.some(x=>x.id===renewing))return;
  $('renewrulesBox').hidden=false;
  if(readRules(renewRulesForm).type==='unset')loadRules(DEFAULT_RULE,renewRulesForm,'renew');
  regenerateForRules(renewRulesForm,'renew');
});
$('draftPass').addEventListener('input',()=>{saveDraft();const r=records.find(x=>x.id===renewing);renewMsg(r&&$('draftPass').value===r.pass?'Yeni şifre mevcut şifreyle aynı olamaz.':'')});
renewRulesForm.addEventListener('submit',e=>e.preventDefault());
renewRulesForm.addEventListener('change',()=>regenerateForRules(renewRulesForm,'renew'));

$('renewConfirm').addEventListener('click',()=>{
  const r=records.find(x=>x.id===renewing);if(!r)return;
  const draft=$('draftPass').value,err=draftError(r,draft);
  if(err){renewMsg(err);return}
  archivePassword(r);
  r.pass=draft;r.rules=readRules(renewRulesForm);r.last=iso(now);delete r.draft;delete r.draftRules;visible.delete(r.id);
  const updatedId=r.id;
  renewModal.close();
  render();
  shineCard(updatedId);
  ;
});
$('renewCancel').addEventListener('click',()=>renewModal.close());
renewModal.addEventListener('close',()=>{renewing=null;render();if(pendingShine!==null)shineCard(pendingShine)});

/* ---------- Önceki şifreler (yalnızca demo oturumu) ---------- */
function archivePassword(r){
  if(!r.pass)return;
  if(!Array.isArray(r.history))r.history=[];
  r.history.unshift({pass:r.pass,since:r.last,replacedAt:new Date().toISOString()});
}
const historyModal=$('historyModal');let historyRecord=null;const historyShown=new Set();
function renderHistory(){
  const r=records.find(x=>x.id===historyRecord);if(!r)return;
  $('historyFor').textContent=`${r.name} · ${r.person}`;
  $('historyList').innerHTML=r.history?.length?r.history.map((h,i)=>{
    const shown=historyShown.has(i);
    return `<article class="history-entry"><div class="history-date">${esc(fmt(parseDay(h.since)))} → ${esc(fmt(parseDay(h.replacedAt.slice(0,10))))}</div><div class="password"><code>${shown?esc(h.pass):'••••••••••••'}</code><button type="button" class="icon" data-history="show" data-index="${i}" aria-label="Önceki şifreyi ${shown?'gizle':'göster'}" aria-pressed="${shown}">${shown?ICON.eyeOff:ICON.eye}</button><button type="button" class="icon" data-history="copy" data-index="${i}" aria-label="Önceki şifreyi kopyala">${ICON.copy}</button></div></article>`;
  }).join(''):'<div class="history-empty">Henüz önceki şifre yok. Şifreyi değiştirdiğinde mevcut şifre burada görünür.</div>';
}
function openHistory(id){historyRecord=id;historyShown.clear();$('historyFeedback').textContent='';renderHistory();historyModal.showModal()}
$('historyList').addEventListener('click',async e=>{
  const b=e.target.closest('[data-history]');if(!b)return;
  const i=Number(b.dataset.index),r=records.find(x=>x.id===historyRecord),h=r?.history?.[i];if(!h)return;
  if(b.dataset.history==='show'){historyShown.has(i)?historyShown.delete(i):historyShown.add(i);renderHistory();$('historyList').querySelector(`[data-history="show"][data-index="${i}"]`)?.focus();return}
  try{await writeClipboard(h.pass);flashPassword(b.closest('.password'));$('historyFeedback').textContent='Önceki şifre kopyalandı.'}catch{$('historyFeedback').textContent='Kopyalama izni yok. Şifreyi gösterip elle kopyalayabilirsin.'}
});
$('historyClose').addEventListener('click',()=>historyModal.close());
historyModal.addEventListener('close',()=>{historyRecord=null;historyShown.clear();$('historyList').innerHTML='';$('historyFeedback').textContent=''});

/* ---------- Aile üyeleri ---------- */
const peopleModal=$('peopleModal'),peopleForm=$('peopleForm');
function peopleMsg(t,ok=false){const el=$('peopleFeedback');el.textContent=t;el.style.color=ok?'#4d6373':'#a34532'}
function nameError(name,except=-1){
  if(!name)return 'Ad boş olamaz.';
  if(name.toLocaleLowerCase('tr')==='tümü')return '"Tümü" ayrılmış bir ad.';
  if(people.some((p,i)=>i!==except&&p.toLocaleLowerCase('tr')===name.toLocaleLowerCase('tr')))return 'Bu ad zaten listede.';
  return '';
}
function renderPeople(){
  $('peopleList').innerHTML=people.map((p,i)=>{
    const n=records.filter(r=>r.person===p).length,locked=n>0;
    return `<div class="person-row">
      <input value="${esc(p)}" maxlength="20" data-rename="${i}" aria-label="${esc(p)} adını değiştir">
      <span class="count">${n} kayıt</span>
      <button type="button" class="renew" data-remove="${i}" aria-label="${esc(p)} kişisini kaldır">Kaldır</button>
    </div>`}).join('');
}
let pendingMemberRemoval=null;
function openPeople(){pendingMemberRemoval=null;$('removeMemberConfirm').hidden=true;peopleForm.reset();peopleMsg('');renderPeople();peopleModal.showModal();peopleForm.elements.newPerson.focus()}
$('peopleList').addEventListener('change',e=>{
  const i=Number(e.target.dataset.rename);if(Number.isNaN(i))return;
  const old=people[i],name=e.target.value.trim(),err=nameError(name,i);
  if(err){peopleMsg(err);e.target.value=old;return}
  people[i]=name;records.forEach(r=>{if(r.person===old)r.person=name});
  if(person===old)person=name;
  peopleMsg(`"${old}" → "${name}" olarak değişti.`,true);render();
});
$('peopleList').addEventListener('click',e=>{
  const b=e.target.closest('[data-remove]');if(!b)return;
  const name=people[Number(b.dataset.remove)];if(!name)return;
  pendingMemberRemoval=name;
  const count=records.filter(r=>r.person===name).length;
  $('removeMemberText').textContent=`“${name}” kişisini kaldırmak istediğine emin misin?`+(count?` Bu kişiye ait ${count} hesap ve şifre geçmişi de silinecek.`:'')+' Bu işlem geri alınamaz.';
  $('removeMemberConfirm').hidden=false;
  $('removeMemberCancel').focus();
});
$('removeMemberCancel').addEventListener('click',()=>{pendingMemberRemoval=null;$('removeMemberConfirm').hidden=true});
$('removeMemberYes').addEventListener('click',()=>{
  const name=pendingMemberRemoval;if(!name||!people.includes(name))return;
  const removedIds=new Set(records.filter(r=>r.person===name).map(r=>r.id));
  records=records.filter(r=>r.person!==name);
  removedIds.forEach(id=>visible.delete(id));
  if(removedIds.has(selectedRecord))selectedRecord=null;
  people=people.filter(p=>p!==name);
  if(person===name)person='Tümü';
  pendingMemberRemoval=null;$('removeMemberConfirm').hidden=true;
  peopleMsg(`“${name}” kaldırıldı.`,true);renderPeople();render();
});
peopleModal.addEventListener('close',()=>{pendingMemberRemoval=null;$('removeMemberConfirm').hidden=true});
peopleForm.onsubmit=e=>{
  e.preventDefault();
  const name=peopleForm.elements.newPerson.value.trim(),err=nameError(name);
  if(err){peopleMsg(err);return}
  people.push(name);peopleForm.reset();peopleMsg(`"${name}" eklendi.`,true);renderPeople();render();
};
$('peopleDone').addEventListener('click',()=>peopleModal.close());

/* ---------- Local encrypted persistence and access ---------- */
const STORE='aile-kasasi.local.v1';
let vaultEnvelope=null,vaultKey=null,vaultUnlocked=false,vaultBusy=false,vaultMode='unlock',importCandidate=null;
let persistedBlob=null,lastSnapshot=null,saveChain=Promise.resolve(),saveFailure=null,idleTimer=null,stagedVault=null,locking=false;
function nextRecordId(){let id;do{id=crypto.getRandomValues(new Uint32Array(1))[0]}while(records.some(r=>r.id===id));return id}
function stateSnapshot(){return JSON.stringify({people,records})}
function authError(t){$('vaultAuthError').textContent=t}
function saveError(t){$('vaultSaveError').textContent=t;$('vaultSaveError').hidden=!t}
function storeEnvelope(e){const text=JSON.stringify(e);if(localStorage.getItem(STORE)!==persistedBlob)throw Error('Kasa başka bir sekmede değişti. Bu sekmede kaydetme durduruldu.');localStorage.setItem(STORE,text);persistedBlob=text;vaultEnvelope=e}
function queueVaultSave(){
 if(!vaultUnlocked||!vaultKey)return saveChain;
 const snapshot=stateSnapshot();if(snapshot===lastSnapshot)return saveChain;
 lastSnapshot=snapshot;const key=vaultKey;
 saveChain=saveChain.then(async()=>{
  const next=await VaultCore.update(vaultEnvelope,key,JSON.parse(snapshot));storeEnvelope(next);saveFailure=null;saveError('');
 }).catch(e=>{saveFailure=e;lastSnapshot=null;saveError('Telefona kaydedilemedi. Uygulamayı kapatma; Kasa / Yedek bölümünden şifreli yedek al. '+e.message)});
 return saveChain;
}
function resetIdle(){clearTimeout(idleTimer);if(vaultUnlocked)idleTimer=setTimeout(()=>lockVault(),120000)}
function setMode(mode){
 vaultMode=mode;$('vaultSetupFields').hidden=mode!=='setup';$('vaultRecoveryFields').hidden=mode!=='recover';
 $('vaultPassword').closest('label').hidden=mode==='recover';$('vaultPassword').required=mode!=='recover';
 $('vaultHeading').textContent={setup:'Yeni kasa oluştur',unlock:'Kasayı aç',recover:'Kurtarma anahtarıyla aç'}[mode];
 $('vaultSubmit').textContent={setup:'Kasayı oluştur',unlock:'Kasayı aç',recover:'Parolayı yenile'}[mode];
 $('vaultRecoverToggle').hidden=mode==='setup';$('vaultRecoverToggle').textContent=mode==='recover'?'Ana parolayla aç':'Parolamı unuttum';
 authError('');
}
function clearSensitiveDOM(){
 document.querySelectorAll('dialog[open]').forEach(d=>d.close());
 document.querySelectorAll('input:not([type=file]),textarea').forEach(e=>{if(e.type==='checkbox')e.checked=false;else e.value=''});
 $('cards').innerHTML='';$('historyList').innerHTML='';$('historyFor').textContent='';$('renewFor').textContent='';$('vaultKeysList').innerHTML='';$('peopleList').innerHTML='';$('people').innerHTML='';
 visible.clear();historyShown.clear();selectedRecord=null;person='Tümü';
}
async function lockVault(){
 if(locking||!vaultUnlocked)return;locking=true;document.body.classList.add('vault-locked');
 document.querySelectorAll('dialog[open]').forEach(d=>d.close());
 await queueVaultSave();await saveChain;
 if(saveFailure){document.body.classList.remove('vault-locked');locking=false;return}
 vaultUnlocked=false;clearTimeout(idleTimer);vaultKey=null;people=[];records=[];lastSnapshot=null;clearSensitiveDOM();
 $('vaultGate').hidden=false;setMode('unlock');locking=false;
}
function openSession(key,state){
 VaultCore.checkState(state);people=state.people;records=state.records;vaultKey=key;vaultUnlocked=true;lastSnapshot=stateSnapshot();
 $('vaultGate').hidden=true;document.body.classList.remove('vault-locked');$('vaultAuth').reset();importCandidate=null;$('vaultImportCancel').hidden=true;
 render();resetIdle();navigator.storage?.persist?.().catch(()=>{});
}
function stageKeys(created,state){
 stagedVault={...created,state};$('vaultKeysList').innerHTML='';
 created.codes.forEach((code,i)=>{const c=document.createElement('code');c.textContent=`${i+1}. ${code}`;$('vaultKeysList').appendChild(c)});
 $('vaultKeysSaved').checked=false;$('vaultKeysContinue').disabled=true;$('vaultKeys').showModal();
}
$('vaultKeys').addEventListener('cancel',e=>e.preventDefault());
$('vaultKeysSaved').addEventListener('change',()=>{$('vaultKeysContinue').disabled=!$('vaultKeysSaved').checked});
$('vaultKeysContinue').addEventListener('click',()=>{
 if(!stagedVault||!$('vaultKeysSaved').checked)return;
 try{storeEnvelope(stagedVault.envelope);const {key,state}=stagedVault;stagedVault.codes.fill('');stagedVault=null;$('vaultKeysList').innerHTML='';$('vaultKeys').close();openSession(key,state)}
 catch(e){authError('Kasa kaydedilemedi: '+e.message);$('vaultKeys').close();stagedVault=null;$('vaultKeysList').innerHTML=''}
});
$('vaultAuth').addEventListener('submit',async e=>{
 e.preventDefault();if(vaultBusy)return;vaultBusy=true;$('vaultAuth').setAttribute('aria-busy','true');$('vaultSubmit').disabled=true;authError('');
 try{
  const envelope=importCandidate||vaultEnvelope;
  if(vaultMode==='setup'){
   const pass=$('vaultPassword').value;if(pass!==$('vaultRepeat').value)throw Error('Parolalar aynı değil.');
   const state={people:[],records:[]};stageKeys(await VaultCore.create(pass,state),state);
  }else if(vaultMode==='recover'){
   const pass=$('vaultNewPassword').value;if(pass!==$('vaultNewRepeat').value)throw Error('Yeni parolalar aynı değil.');if(pass.length<12)throw Error('Yeni ana parola en az 12 karakter olmalı.');
   const state=await VaultCore.recover(envelope,$('vaultRecoveryCode').value);
   stageKeys(await VaultCore.create(pass,state),state);
   $('vaultKeyNote').textContent='Önceki üç anahtar bu kasanın yeni sürümünü açamaz. Yeni şifreli yedek al. Eski yedekler eski parola ve anahtarlarıyla açılabilir.';
  }else{
   let session;try{session=await VaultCore.unlock(envelope,$('vaultPassword').value)}catch{throw Error('Ana parola yanlış veya kasa verisi bozulmuş.')}
   if(importCandidate)storeEnvelope(importCandidate);openSession(session.key,session.state);
  }
 }catch(err){authError(err.message)}finally{
  vaultBusy=false;$('vaultAuth').setAttribute('aria-busy','false');$('vaultSubmit').disabled=false;
  $('vaultPassword').value='';$('vaultRepeat').value='';$('vaultNewPassword').value='';$('vaultNewRepeat').value='';$('vaultRecoveryCode').value='';
 }
});
$('vaultRecoverToggle').addEventListener('click',()=>{setMode(vaultMode==='recover'?'unlock':'recover');$('vaultAuth').reset()});
$('vaultLock').addEventListener('click',()=>lockVault());
$('vaultToolsBtn').addEventListener('click',()=>$('vaultTools').showModal());
$('vaultToolsClose').addEventListener('click',()=>$('vaultTools').close());
function downloadEncrypted(e){
 const blob=new Blob([JSON.stringify(e)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='Aile-Kasasi-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
$('vaultExport').addEventListener('click',async()=>{
 if(!vaultUnlocked)return;await queueVaultSave();await saveChain;
 try{const e=await VaultCore.update(vaultEnvelope,vaultKey,{people,records});downloadEncrypted(e)}catch(e){saveError('Yedek hazırlanamadı: '+e.message)}
});
$('vaultImport').addEventListener('change',async e=>{
 const file=e.target.files[0];if(!file)return;
 try{if(file.size>8000000)throw Error('Yedek dosyası çok büyük.');if(persistedBlob&&!$('vaultReplace').checked)throw Error('Önce mevcut kasayı değiştirme kutusunu işaretle.');
  importCandidate=VaultCore.validate(JSON.parse(await file.text()));setMode('unlock');$('vaultSubmit').disabled=false;authError('Yedek seçildi. Yedeğin ana parolasıyla aç veya kurtarma anahtarını kullan.');$('vaultImportCancel').hidden=false;
 }catch(err){authError('Yedek seçilemedi: '+err.message)}finally{e.target.value=''}
});
$('vaultImportCancel').addEventListener('click',()=>{importCandidate=null;$('vaultImportCancel').hidden=true;setMode(vaultEnvelope?'unlock':'setup')});
['pointerdown','keydown'].forEach(event=>document.addEventListener(event,resetIdle,{passive:true}));
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(stagedVault){stagedVault.codes.fill('');stagedVault=null;$('vaultKeysList').innerHTML='';$('vaultKeys').close();authError('Anahtar ekranı gizlendi. İşlemi yeniden başlat.')}lockVault()}});
window.addEventListener('pagehide',()=>{if(vaultUnlocked)lockVault()});
window.addEventListener('storage',e=>{if(e.key===STORE&&e.newValue!==persistedBlob){location.reload()}});
window.addEventListener('beforeunload',e=>{if(saveFailure){e.preventDefault();e.returnValue=''}});
function initVault(){
 try{
  if(!crypto.subtle||!window.isSecureContext)throw Error('Kasa için HTTPS adresini kullan.');
  const test=STORE+'.test';localStorage.setItem(test,'1');localStorage.removeItem(test);
  persistedBlob=localStorage.getItem(STORE);if(persistedBlob)vaultEnvelope=VaultCore.validate(JSON.parse(persistedBlob));
  setMode(vaultEnvelope?'unlock':'setup');
 }catch(e){authError('Kasa açılamadı: '+e.message);$('vaultSubmit').disabled=true}
 if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
}

initVault();
