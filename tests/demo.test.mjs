import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { resetPresentation, startPresentation } from '../scripts/demo.mjs';
import { createApp } from '../server.mjs';

test('presentation reset backs up only its store and refuses an occupied port', async t => {
  const dir=mkdtempSync(join(tmpdir(),'qp-presentation-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const path=join(dir,'presentation.json');
  const ordinary=join(dir,'qazaqpass.json');
  writeFileSync(path,'{"marker":"presentation"}');
  writeFileSync(ordinary,'{"marker":"ordinary"}');
  const occupied=createServer(); occupied.listen(0,'127.0.0.1'); await once(occupied,'listening');
  const port=occupied.address().port;
  try {
    await assert.rejects(resetPresentation({path,port}),/occupied|in use/i);
    assert.equal(readFileSync(path,'utf8'),'{"marker":"presentation"}');
    assert.equal(readdirSync(dir).length,2);
  } finally { await new Promise(resolve=>occupied.close(resolve)); }
  const result=await resetPresentation({path,port});
  assert.equal(existsSync(path),false);
  assert.equal(readFileSync(result.backupPath,'utf8'),'{"marker":"presentation"}');
  assert.equal(readFileSync(ordinary,'utf8'),'{"marker":"ordinary"}');
});

test('presentation launcher seeds departures after its clock and serves isolated catalog', async t => {
  const dir=mkdtempSync(join(tmpdir(),'qp-presentation-'));
  const path=join(dir,'presentation.json');
  const ordinary=join(dir,'qazaqpass.json');
  writeFileSync(ordinary,'{"marker":"ordinary"}');
  const server=await startPresentation({path,port:0,now:()=>new Date('2027-02-01T08:00:00Z')});
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));rmSync(dir,{recursive:true,force:true});});
  const result=await fetch(`http://127.0.0.1:${server.address().port}/api/catalog`);
  const tours=(await result.json()).tours;
  assert.equal(tours.length,4);
  assert.deepEqual(tours.map(x=>x.id),['charyn','kolsai','turkestan','burabay']);
  assert.ok(tours.every(x=>x.departures.every(d=>d.date>'2027-02-01')));
  assert.equal(readFileSync(ordinary,'utf8'),'{"marker":"ordinary"}');
});

test('presentation APIs refuse the ordinary store path without changing its bytes', async t => {
  const dir=mkdtempSync(join(tmpdir(),'qp-presentation-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const ordinary=join(dir,'qazaqpass.json');
  const original=Buffer.from('{"marker":"ordinary"}');
  writeFileSync(ordinary,original);
  await assert.rejects(resetPresentation({path:ordinary,port:0}),/presentation\.json/i);
  assert.deepEqual(readFileSync(ordinary),original);
  assert.deepEqual(readdirSync(dir),['qazaqpass.json']);
  await assert.rejects(startPresentation({path:ordinary,port:0}),/presentation\.json/i);
  assert.deepEqual(readFileSync(ordinary),original);
  assert.deepEqual(readdirSync(dir),['qazaqpass.json']);
});

test('ordinary and presentation servers keep separate session cookies on the same host', async t => {
  const dir=mkdtempSync(join(tmpdir(),'qp-dual-session-'));
  const now=()=>new Date('2026-10-23T08:00:00Z');
  const ordinary=createApp({storePath:join(dir,'qazaqpass.json'),now});
  const presentation=createApp({storePath:join(dir,'presentation.json'),now,presentation:true});
  ordinary.listen(0,'127.0.0.1'); presentation.listen(0,'127.0.0.1');
  await Promise.all([once(ordinary,'listening'),once(presentation,'listening')]);
  t.after(async()=>{
    await Promise.all([new Promise(resolve=>ordinary.close(resolve)),new Promise(resolve=>presentation.close(resolve))]);
    rmSync(dir,{recursive:true,force:true});
  });
  const jar=new Map();
  async function request(server,path,body) {
    const base=`http://127.0.0.1:${server.address().port}`;
    const response=await fetch(base+path,{method:body?'POST':'GET',headers:{
      ...(jar.size?{cookie:[...jar].map(([key,value])=>`${key}=${value}`).join('; ')}:{}),
      ...(body?{'content-type':'application/json',origin:base}:{})},
      body:body?JSON.stringify(body):undefined});
    const setCookie=response.headers.get('set-cookie');
    if (setCookie) {
      const [name,value]=setCookie.split(';')[0].split('=');
      jar.set(name,value);
    }
    return {status:response.status,data:await response.json()};
  }
  async function book(server) {
    const tour=(await request(server,'/api/catalog')).data.tours[0];
    const result=await request(server,'/api/bookings',{tourId:tour.id,departureId:tour.departures[0].id,
      party:1,name:'Demo Traveler',email:'demo@example.com',acceptedTerms:true,
      quotedPrice:tour.price,catalogVersion:tour.version,idempotencyKey:crypto.randomUUID()});
    assert.equal(result.status,201);
    return result.data.booking.id;
  }
  const ordinaryBooking=await book(ordinary);
  const presentationBooking=await book(presentation);
  assert.deepEqual([...jar.keys()].sort(),['qazaqpass_presentation_session','qazaqpass_session']);
  assert.deepEqual((await request(ordinary,'/api/bookings')).data.bookings.map(b=>b.id),[ordinaryBooking]);
  assert.deepEqual((await request(presentation,'/api/bookings')).data.bookings.map(b=>b.id),[presentationBooking]);
});
