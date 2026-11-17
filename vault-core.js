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
 const code=raw=>Array.from(raw,n=>n.toString(16).padStart(2,'0')).join('').toUpperCase().match(/.{8}/g).join('-');
 function parseCode(s){const v=s.replace(/[\s-]/g,'');if(!/^[a-f0-9]{64}$/i.test(v))throw Error('Kurtarma anahtarı 64 harf/rakam içermeli.');return Uint8Array.from(v.match(/../g),x=>parseInt(x,16))}
 function validBox(b){return b&&typeof b.iv==='string'&&un64(b.iv).length===12&&typeof b.cipher==='string'&&un64(b.cipher).length>=16}
 function validate(e){if(!e||e.format!=='aile-kasasi'||e.version!==1||e.iterations!==ITER||un64(e.salt).length!==16||!validBox(e.master)||!Array.isArray(e.recovery)||e.recovery.length!==3||!e.recovery.every(validBox)||!validBox(e.payload))throw Error('Geçerli bir Aile Kasası yedeği değil.');return e}
 function checkState(s){
  if(!s||!Array.isArray(s.people)||s.people.length>200||!s.people.every(x=>typeof x==='string'&&x.length>0&&x.length<=20)||new Set(s.people).size!==s.people.length||!Array.isArray(s.records)||s.records.length>10000)throw Error('Kasa içeriği geçersiz.');
  const ids=new Set();for(const r of s.records){if(!r||!Number.isSafeInteger(r.id)||ids.has(r.id)||typeof r.name!=='string'||!r.name.trim()||r.name.length>50||!s.people.includes(r.person)||typeof r.pass!=='string'||r.pass.length>64||!/^\d{4}-\d{2}-\d{2}$/.test(r.last)||![0,3,6,12].includes(r.months)||r.history&&(!Array.isArray(r.history)||r.history.length>10000||!r.history.every(h=>typeof h.pass==='string'&&h.pass.length<=64&&typeof h.since==='string'&&typeof h.replacedAt==='string')))throw Error('Kayıt içeriği geçersiz.');ids.add(r.id)}return s;
 }
 async function create(pass,state){
  if(typeof pass!=='string'||pass.length<12)throw Error('Ana parola en az 12 karakter olmalı.');checkState(state);
  const raw=random(32),key=await aes(raw),salt=random(16),masterKey=await derive(pass,salt);
  const e={format:'aile-kasasi',version:1,iterations:ITER,salt:b64(salt),master:await seal(masterKey,raw,'master'),recovery:[],payload:await seal(key,enc.encode(JSON.stringify(state)),'payload')};const codes=[];
  for(let i=0;i<3;i++){const r=random(32);codes.push(code(r));e.recovery.push(await seal(await aes(r),raw,'recovery:'+i));r.fill(0)}raw.fill(0);return {envelope:e,key,codes};
 }
 async function unlock(e,pass){validate(e);const raw=await open(await derive(pass,un64(e.salt)),e.master,'master');const key=await aes(raw);raw.fill(0);const state=checkState(JSON.parse(dec.decode(await open(key,e.payload,'payload'))));return {key,state}}
 async function recover(e,recoveryCode){validate(e);const r=parseCode(recoveryCode),k=await aes(r);r.fill(0);for(let i=0;i<3;i++){try{const raw=await open(k,e.recovery[i],'recovery:'+i),key=await aes(raw);raw.fill(0);return checkState(JSON.parse(dec.decode(await open(key,e.payload,'payload'))))}catch{}}throw Error('Kurtarma anahtarı eşleşmedi veya yedek bozuk.')}
 async function update(e,key,state){validate(e);checkState(state);return {...e,payload:await seal(key,enc.encode(JSON.stringify(state)),'payload')}}
 return {create,unlock,recover,update,validate,checkState};
})();
