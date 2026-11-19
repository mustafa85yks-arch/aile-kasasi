const {webcrypto}=require('node:crypto');globalThis.crypto=webcrypto;
require('../vault-core.js');const assert=require('node:assert/strict');
(async()=>{
 const state={people:['Test'],records:[{id:1,name:'Yerel hesap',person:'Test',pass:'Ornek!456',last:'2026-11-17',months:6,history:[{pass:'Eski!123',since:'2026-01-01',replacedAt:'2026-11-17T12:00:00Z'}]}]};
 const qa=[{q:'Annenizin kızlık soyadı nedir?',a:'Öztürk'},{q:'İlk evcil hayvanınızın adı nedir?',a:'Pamuk Şeker'}];
 const pass='4821';const v=await VaultCore.create(pass,state,qa);
 assert.equal(v.envelope.version,2);assert.equal(v.codes,undefined);assert.deepEqual(v.envelope.questions.list,qa.map(x=>x.q));
 const json=JSON.stringify(v.envelope);for(const secret of ['Ornek!456','Eski!123','Öztürk','Pamuk',pass])assert(!json.includes(secret));
 assert.deepEqual((await VaultCore.unlock(v.envelope,pass)).state,state);
 await assert.rejects(VaultCore.unlock(v.envelope,'1111'));await assert.rejects(VaultCore.create('12345',state,qa));await assert.rejects(VaultCore.create('12a4',state,qa));
 await assert.rejects(VaultCore.create(pass,state,[qa[0],qa[0]]));await assert.rejects(VaultCore.create(pass,state,[qa[0],{q:qa[1].q,a:' '}]));
 // cevaplar: büyük/küçük harf, boşluk, Türkçe karakter fark etmez
 assert.deepEqual(await VaultCore.recoverWithAnswers(v.envelope,['OZTURK','  pamuk   seker ']),state);
 assert.deepEqual(await VaultCore.recoverWithAnswers(v.envelope,['öztürk','PAMUK ŞEKER']),state);
 await assert.rejects(VaultCore.recoverWithAnswers(v.envelope,['Yılmaz','Pamuk Şeker']),/eşleşmedi/);
 await assert.rejects(VaultCore.recoverWithAnswers(v.envelope,['Öztürk','Karabaş']),/eşleşmedi/);
 const updated=structuredClone(state);updated.records[0].pass='Yeni!789';
 const e=await VaultCore.update(v.envelope,v.key,updated);
 assert.notEqual(e.payload.iv,v.envelope.payload.iv);assert.deepEqual((await VaultCore.unlock(e,pass)).state,updated);
 const broken=structuredClone(e);const bytes=Buffer.from(broken.payload.cipher,'base64');bytes[0]^=1;broken.payload.cipher=bytes.toString('base64');await assert.rejects(VaultCore.unlock(broken,pass));
 // şifre unutuldu: sorularla aç, yeni şifre koy
 const recovered=await VaultCore.recoverWithAnswers(e,['Öztürk','Pamuk Şeker']);const rotated=await VaultCore.create('7305',recovered,qa);
 await assert.rejects(VaultCore.unlock(rotated.envelope,pass));assert.deepEqual((await VaultCore.unlock(rotated.envelope,'7305')).state,updated);
 const imported=JSON.parse(JSON.stringify(rotated.envelope));assert.deepEqual(await VaultCore.recoverWithAnswers(imported,['ozturk','pamuk seker']),updated);
 assert.throws(()=>VaultCore.validate({...imported,iterations:1}));assert.throws(()=>VaultCore.validate({...imported,questions:undefined}));assert.throws(()=>VaultCore.checkState({people:[],records:state.records}));
 console.log('PASS: 4-digit PIN, security questions recover (case/space/Turkish-insensitive), wrong answers rejected, no plaintext answers stored, ciphertext integrity, PIN reset, backup round-trip, schema validation.');
})().catch(e=>{console.error(e);process.exitCode=1});
