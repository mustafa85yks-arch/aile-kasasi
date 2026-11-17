const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const nodes={},events={},store=new Map();function el(){return {value:'',checked:false,hidden:false,style:{},listeners:{},textContent:'',innerHTML:'',classList:{toggle(){},remove(){},add(){}},setAttribute(){},addEventListener(k,f){this.listeners[k]=f},querySelector:()=>el(),closest:()=>el(),elements:new Proxy({},{get:(o,k)=>o[k]??=el()}),focus(){},appendChild(){},showModal(){this.open=true},close(){this.open=false},reset(){}}}
const doc={getElementById:id=>nodes[id]??=el(),querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>el(),body:el(),addEventListener:(k,f)=>events[k]=f};
const ctx={document:doc,crypto:webcrypto,TextEncoder,TextDecoder,btoa,atob,Uint8Array,Uint32Array,console,setTimeout:()=>1,clearTimeout(){},navigator:{storage:{persist:async()=>true}},location:{protocol:'https:',reload(){}},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},window:{isSecureContext:true,addEventListener(){}}};vm.createContext(ctx);let run=s=>vm.runInContext(s,ctx);
run(fs.readFileSync(require('node:path').join(__dirname,'../vault-core.js'),'utf8'));run(fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8'));
(async()=>{
 assert.equal(run('vaultMode'),'setup');doc.getElementById('vaultPassword').value=doc.getElementById('vaultRepeat').value='Test Ana Parola 2026!';await nodes.vaultAuth.listeners.submit({preventDefault(){}});
 assert(nodes.vaultKeys.open);assert.equal(run('stagedVault.codes.length'),3);assert.equal(store.get('aile-kasasi.local.v1'),undefined);
 doc.getElementById('vaultKeysSaved').checked=true;nodes.vaultKeysContinue.listeners.click();assert(run('vaultUnlocked'));assert(store.has('aile-kasasi.local.v1'));assert.equal(run('records.length'),0);
 run("people=['Test'];records=[{id:1,name:'Test hesap',person:'Test',pass:'Secret123!',last:'2026-11-17',months:6}];render()");await run('saveChain');
 assert(!store.get('aile-kasasi.local.v1').includes('Secret123!'));
 await run('lockVault()');assert(!run('vaultUnlocked'));assert.equal(run('records.length'),0);assert.equal(run('vaultKey'),null);
 nodes.vaultPassword.value='Test Ana Parola 2026!';await nodes.vaultAuth.listeners.submit({preventDefault(){}});assert.equal(run('records[0].pass'),'Secret123!');
 run("records[0].pass='Next456!';render()");await run('saveChain');
 const oldStored=store.get('aile-kasasi.local.v1');store.set('aile-kasasi.local.v1','external');run("records[0].pass='Other';render()");await run('saveChain');assert(run('saveFailure!==null'));assert.equal(store.get('aile-kasasi.local.v1'),'external');store.set('aile-kasasi.local.v1',oldStored);
 console.log('PASS: setup + key acknowledgment, encrypted persistence, locking wipes state, password unlock restores data, saves remain encrypted, stale-tab write protection.');
})().catch(e=>{console.error(e);process.exitCode=1});
