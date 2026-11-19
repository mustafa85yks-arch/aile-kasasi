'use strict';
/* Local-only vault envelope v1. No networking or plaintext persistence. */
globalThis.VaultCore=(()=>{
 const enc=new TextEncoder(),dec=new TextDecoder(),ITER=600000;
 const random=n=>crypto.getRandomValues(new Uint8Array(n));
 const b64=b=>{let s='';for(const n of new Uint8Array(b))s+=String.fromCharCode(n);return btoa(s)};
 const un64=s=>{if(typeof s!=='string'||s.length>12000000)throw Error('Invalid encoding');return Uint8Array.from(atob(s),c=>c.charCodeAt(0))};
 const aes=raw=>crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);
 async function derive(pass,salt){const base=await crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:ITER},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
 async function seal(key,raw,tag){const iv=random(12);return {iv:b64(iv),cipher:b64(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode('AK1:'+tag)},key,raw))}}
 async function open(key,box,tag){return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:un64(box.iv),additionalData:enc.encode('AK1:'+tag)},key,un64(box.cipher)))}
 function parseCode(s){const v=s.replace(/[\s-]/g,'');if(!/^[a-f0-9]{64}$/i.test(v))throw Error('Kurtarma anahtarı 64 harf/rakam içermeli.');return Uint8Array.from(v.match(/../g),x=>parseInt(x,16))}
 function validBox(b){return b&&typeof b.iv==='string'&&un64(b.iv).length===12&&typeof b.cipher==='string'&&un64(b.cipher).length>=16}
 function validQuestions(q){return q&&Array.isArray(q.list)&&q.list.length===2&&q.list.every(x=>typeof x==='string'&&x.length>0&&x.length<=120)&&un64(q.salt).length===16&&validBox(q.box)}
 function validate(e){if(!e||e.format!=='aile-kasasi'||![1,2].includes(e.version)||e.iterations!==ITER||un64(e.salt).length!==16||!validBox(e.master)||!validBox(e.payload)||e.version===1&&(!Array.isArray(e.recovery)||e.recovery.length!==3||!e.recovery.every(validBox))||e.version===2&&!validQuestions(e.questions))throw Error('Geçerli bir Aile Kasası yedeği değil.');return e}
 /* Cevap karşılaştırması: büyük/küçük harf, fazla boşluk ve Türkçe karakter fark etmez (Öztürk = ozturk). */
 function norm(a){return String(a).trim().replace(/\s+/g,' ').toLocaleLowerCase('tr').replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
 function answerSecret(answers){if(!Array.isArray(answers)||answers.length!==2)throw Error('İki cevap gerekli.');const a=answers.map(norm);if(a.some(x=>x.length<2))throw Error('Her cevap en az 2 harf olmalı.');return 'AKQ:'+a.join('\u0000')}
 function checkQA(qa){if(!Array.isArray(qa)||qa.length!==2||!qa.every(x=>x&&typeof x.q==='string'&&x.q.trim()&&x.q.length<=120&&typeof x.a==='string'&&x.a.length<=100))throw Error('İki hatırlatma sorusu ve cevabı gerekli.');if(qa[0].q===qa[1].q)throw Error('İki farklı soru seç.');answerSecret(qa.map(x=>x.a))}
 function checkState(s){
  if(!s||!Array.isArray(s.people)||s.people.length>200||!s.people.every(x=>typeof x==='string'&&x.length>0&&x.length<=20)||new Set(s.people).size!==s.people.length||!Array.isArray(s.records)||s.records.length>10000)throw Error('Kasa içeriği geçersiz.');
  const ids=new Set();for(const r of s.records){if(!r||!Number.isSafeInteger(r.id)||ids.has(r.id)||typeof r.name!=='string'||!r.name.trim()||r.name.length>50||!s.people.includes(r.person)||typeof r.pass!=='string'||r.pass.length>64||!/^\d{4}-\d{2}-\d{2}$/.test(r.last)||![0,3,6,12].includes(r.months)||r.history&&(!Array.isArray(r.history)||r.history.length>10000||!r.history.every(h=>typeof h.pass==='string'&&h.pass.length<=64&&typeof h.since==='string'&&typeof h.replacedAt==='string')))throw Error('Kayıt içeriği geçersiz.');ids.add(r.id)}return s;
 }
 async function create(pass,state,qa){
  if(typeof pass!=='string'||!/^\d{4}$/.test(pass))throw Error('Şifre 4 haneli rakam olmalı.');checkState(state);checkQA(qa);
  const raw=random(32),key=await aes(raw),salt=random(16),qsalt=random(16);
  const e={format:'aile-kasasi',version:2,iterations:ITER,salt:b64(salt),master:await seal(await derive(pass,salt),raw,'master'),
   questions:{list:qa.map(x=>x.q),salt:b64(qsalt),box:await seal(await derive(answerSecret(qa.map(x=>x.a)),qsalt),raw,'questions')},
   payload:await seal(key,enc.encode(JSON.stringify(state)),'payload')};
  raw.fill(0);return {envelope:e,key};
 }
 async function unlock(e,pass){validate(e);const raw=await open(await derive(pass,un64(e.salt)),e.master,'master');const key=await aes(raw);raw.fill(0);const state=checkState(JSON.parse(dec.decode(await open(key,e.payload,'payload'))));return {key,state}}
 async function recoverWithAnswers(e,answers){validate(e);if(e.version!==2)throw Error('Bu kasada hatırlatma sorusu yok.');const secret=answerSecret(answers);let raw;try{raw=await open(await derive(secret,un64(e.questions.salt)),e.questions.box,'questions')}catch{throw Error('Cevaplar eşleşmedi.')}const key=await aes(raw);raw.fill(0);return checkState(JSON.parse(dec.decode(await open(key,e.payload,'payload'))))}
 /* Eski (v1) kasalar için: kurtarma anahtarıyla açma. */
 async function recover(e,recoveryCode){validate(e);if(e.version!==1)throw Error('Bu kasada kurtarma anahtarı yok.');const r=parseCode(recoveryCode),k=await aes(r);r.fill(0);for(let i=0;i<3;i++){try{const raw=await open(k,e.recovery[i],'recovery:'+i),key=await aes(raw);raw.fill(0);return checkState(JSON.parse(dec.decode(await open(key,e.payload,'payload'))))}catch{}}throw Error('Kurtarma anahtarı eşleşmedi veya yedek bozuk.')}
 async function update(e,key,state){validate(e);checkState(state);return {...e,payload:await seal(key,enc.encode(JSON.stringify(state)),'payload')}}
 return {create,unlock,recover,recoverWithAnswers,update,validate,checkState,norm};
})();
