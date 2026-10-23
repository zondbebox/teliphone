import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createApp } from '../server.mjs';

const NOW = () => new Date('2026-10-23T08:00:00Z');
const content = {
  title: 'Aksu Canyon Field Notes', region: 'Turkestan Region', city: 'Shymkent', days: 2,
  price: 75000, difficulty: 'moderate', interests: ['nature', 'culture'],
  description: 'A synthetic two day route with a clear account of each stop.',
  highlights: ['Canyon overlook', 'Local history'], itinerary: ['Day one in the canyon.', 'Day two return to Shymkent.'],
  included: ['Transport', 'Guide'], excluded: ['Flights', 'Insurance'],
  meeting: 'Meet at the central station; exact point is operator confirmed.',
  physicalDemands: 'Uneven paths for up to two hours each day.',
  cancellation: 'DEMO: cancel seven days before departure for a full refund.',
  questions: ['Confirm route conditions with the operator.'],
};

async function setup(t, existing) {
  const dir = mkdtempSync(join(tmpdir(), 'qp-operator-'));
  const storePath = join(dir, 'store.json');
  if (existing) writeFileSync(storePath, JSON.stringify(existing));
  const options = { storePath, adminKey: 'operator-test', now: NOW };
  const server = createApp(options);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => { await new Promise(resolve => server.close(resolve)); rmSync(dir, {recursive:true,force:true}); });
  function client() {
    let cookie = '';
    return async (path, {method, body, admin=false}={}) => {
      const response = await fetch(base+path, {method: method || (body ? 'POST' : 'GET'),
        headers: { ...(cookie ? {cookie} : {}), ...(body ? {'content-type':'application/json',origin:base} : {}),
          ...(admin ? {'x-admin-key':'operator-test'} : {}) }, body: body === undefined ? undefined : JSON.stringify(body)});
      if (response.headers.has('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
      return {status:response.status, data:await response.json(), cookie};
    };
  }
  return {client,options,storePath};
}

function booking(tour, departureId=tour.departures[0].id) {
  return {tourId:tour.id,departureId,party:2,name:'Test Traveler',email:'test@example.com',acceptedTerms:true,
    quotedPrice:tour.price,catalogVersion:tour.version,idempotencyKey:crypto.randomUUID()};
}

test('operator creates a complete synthetic tour with server-owned fields and future departures', async t => {
  const {client}=await setup(t); const api=client();
  const payload={...content, id:'forged',version:99,currency:'USD',demo:false,contentStatus:'verified',
    departures:[{date:'2026-12-05',capacity:6},{date:'2026-12-12',capacity:8}]};
  const created=await api('/api/admin/tours',{admin:true,body:payload});
  assert.equal(created.status,201);
  const tour=created.data.tour;
  assert.equal(tour.title,content.title);
  assert.equal(tour.version,1); assert.equal(tour.currency,'KZT'); assert.equal(tour.demo,true);
  assert.notEqual(tour.id,'forged'); assert.equal(tour.departures[0].date,'2026-12-05');
  assert.equal(tour.departures[0].available,6);
  const publicTours=(await api('/api/catalog')).data.tours;
  assert.equal(publicTours.length,5);
  assert.ok(publicTours.some(x=>x.id===tour.id));
  const matched=await api('/api/match',{body:{startDate:'2026-12-05',endDate:'2026-12-06',party:2,budget:80000,
    city:'Shymkent',interest:'culture',difficulty:'moderate'}});
  assert.ok(matched.data.tours.some(x=>x.id===tour.id));
});

test('invalid authoring and edit are atomic; existing departures retain IDs and bookings retain snapshots', async t => {
  const {client}=await setup(t); const api=client();
  const before=(await api('/api/catalog')).data.tours[0];
  for (const invalid of [{...content,days:3},{...content,city:'London'},
    {...content,departures:[{date:'2026-10-22',capacity:4}]},
    {...content,highlights:['x'.repeat(501)]}]) {
    const result=await api('/api/admin/tours',{admin:true,body:{...invalid,departures:invalid.departures||[{date:'2026-12-05',capacity:4}]}});
    assert.equal(result.status,400);
  }
  assert.equal((await api('/api/catalog')).data.tours.length,4);
  const held=(await api('/api/bookings',{body:booking(before)})).data.booking;
  const bad=await api(`/api/admin/tours/${before.id}`,{method:'PATCH',admin:true,body:{title:'Changed',
    departures:[{id:before.departures[0].id,capacity:1},{date:'2026-12-15',capacity:8}]}});
  assert.equal(bad.status,409);
  assert.equal((await api('/api/catalog')).data.tours[0].title,before.title);
  const edited=await api(`/api/admin/tours/${before.id}`,{method:'PATCH',admin:true,body:{
    title:'Charyn Canyon Extended',description:'Revised synthetic journey.',days:2,interests:['nature','culture'],
    itinerary:['First day revised.','Second day revised.'],
    departures:[{id:before.departures[0].id,capacity:8},{date:'2026-12-15',capacity:8}]}});
  assert.equal(edited.status,200);
  assert.equal(edited.data.tour.departures.length,3);
  assert.equal(edited.data.tour.departures[0].id,before.departures[0].id);
  assert.equal(edited.data.tour.departures[0].date,before.departures[0].date);
  assert.equal(edited.data.tour.version,before.version+1);
  assert.equal((await api(`/api/bookings/${held.id}`)).data.booking.tour.title,before.title);
  assert.equal((await api('/api/bookings',{body:{...booking(edited.data.tour),quotedPrice:before.price,catalogVersion:before.version}})).status,409);
});

test('questions belong to one session and operator answers persist without exposing owner', async t => {
  const {client,options}=await setup(t); const a=client(),b=client();
  const tour=(await a('/api/catalog')).data.tours[0];
  const made=await a('/api/questions',{body:{tourId:tour.id,body:'Can I bring a walking aid?'}});
  assert.equal(made.status,201);
  const id=made.data.question.id;
  assert.equal(made.data.question.body,'Can I bring a walking aid?');
  assert.equal(made.data.question.answer,null);
  assert.equal(made.data.question.status,'open');
  assert.equal(JSON.stringify(made.data).includes('owner'),false);
  assert.equal((await a(`/api/questions?tourId=${tour.id}`)).data.questions.length,1);
  assert.deepEqual((await b(`/api/questions?tourId=${tour.id}`)).data.questions,[]);
  assert.equal((await a('/api/admin')).status,401);
  const admin=(await a('/api/admin',{admin:true})).data;
  assert.equal(admin.inquiries[0].tourTitle,tour.title);
  assert.equal(admin.inquiries[0].id,id);
  assert.equal(admin.inquiries[0].status,'open');
  assert.ok(admin.questions.length>0);
  const answered=await a(`/api/admin/questions/${id}`,{method:'PATCH',admin:true,body:{answer:'Please confirm the terrain with our operator.'}});
  assert.equal(answered.status,200);
  assert.equal(answered.data.question.answer,'Please confirm the terrain with our operator.');
  assert.equal(answered.data.question.status,'answered');
  assert.equal(JSON.stringify(answered.data).includes('owner'),false);
  assert.equal((await b(`/api/questions?tourId=${tour.id}`)).data.questions.length,0);
  assert.equal((await a(`/api/questions?tourId=${tour.id}`)).data.questions[0].answer,answered.data.question.answer);
  assert.equal((await a('/api/admin',{admin:true})).data.inquiries[0].status,'answered');
  const restarted=createApp(options); restarted.listen(0,'127.0.0.1'); await once(restarted,'listening');
  t.after(()=>new Promise(resolve=>restarted.close(resolve)));
  const response=await fetch(`http://127.0.0.1:${restarted.address().port}/api/questions?tourId=${tour.id}`,{headers:{cookie:made.cookie}});
  assert.equal((await response.json()).questions[0].answer,answered.data.question.answer);
});

test('schema one data migrates without dropping bookings, sessions, events or tour edits', async t => {
  const {client,storePath}=await setup(t);
  const a=client(); const tour=(await a('/api/catalog')).data.tours[0];
  const bookingResult=await a('/api/bookings',{body:booking(tour)});
  await a(`/api/bookings/${bookingResult.data.booking.id}/payment`,{body:{outcome:'pending',eventId:'migration-event'}});
  await a(`/api/admin/tours/${tour.id}`,{method:'PATCH',admin:true,body:{price:65000}});
  const old=JSON.parse(readFileSync(storePath,'utf8'));
  old.schemaVersion=1;
  delete old.inquiries;
  const migrated=await setup(t,old);
  const raw=JSON.parse(readFileSync(migrated.storePath,'utf8'));
  assert.equal(raw.schemaVersion,2);
  assert.equal(raw.bookings[0].id,old.bookings[0].id);
  assert.equal(raw.sessions[0],old.sessions[0]);
  assert.equal(raw.events[0].id,'migration-event');
  assert.equal(raw.tours[0].price,65000);
  assert.deepEqual(raw.inquiries,[]);
});

test('catalog textarea content accepts paragraphs while title remains single line', async t => {
  const {client}=await setup(t); const api=client();
  const payload={...content,description:'First paragraph about the route.\nSecond paragraph about access.',
    meeting:'Meet at the station.\r\nAsk for the exact pickup point.',
    cancellation:'DEMO refund terms.\nOperator review still required.',
    departures:[{date:'2026-12-05',capacity:6}]};
  const created=await api('/api/admin/tours',{admin:true,body:payload});
  assert.equal(created.status,201);
  assert.equal(created.data.tour.description,payload.description);
  assert.equal(created.data.tour.meeting,payload.meeting);
  const edited=await api(`/api/admin/tours/${created.data.tour.id}`,{method:'PATCH',admin:true,
    body:{physicalDemands:'Uneven ground.\nAllow time for rest.'}});
  assert.equal(edited.status,200);
  assert.equal(edited.data.tour.physicalDemands,'Uneven ground.\nAllow time for rest.');
  const rejected=await api(`/api/admin/tours/${created.data.tour.id}`,{method:'PATCH',admin:true,
    body:{title:'Bad\nTitle',description:'Changed text.'}});
  assert.equal(rejected.status,400);
  assert.equal((await api('/api/catalog')).data.tours.find(x=>x.id===created.data.tour.id).description,payload.description);
});

test('traveler questions and operator answers accept multiple paragraphs without other control characters', async t => {
  const {client}=await setup(t); const api=client();
  const tour=(await api('/api/catalog')).data.tours[0];
  const body='Can I use a walking aid?\nI may need additional rest stops.';
  const created=await api('/api/questions',{body:{tourId:tour.id,body}});
  assert.equal(created.status,201);
  assert.equal(created.data.question.body,body);
  const answer='Please contact the operator.\r\nWe can confirm the route together.';
  const answered=await api(`/api/admin/questions/${created.data.question.id}`,{method:'PATCH',admin:true,body:{answer}});
  assert.equal(answered.status,200);
  assert.equal(answered.data.question.answer,answer);
  assert.equal((await api('/api/questions')).data.questions[0].answer,answer);
  assert.equal((await api('/api/questions',{body:{tourId:tour.id,body:'Bad\tcontrol'}})).status,400);
});

test('adding a departure cannot exceed the total tour limit or partially edit content', async t => {
  const {client}=await setup(t); const api=client();
  const departures=Array.from({length:24},(_,index)=>({date:`2026-12-${String(index+1).padStart(2,'0')}`,capacity:4}));
  const created=await api('/api/admin/tours',{admin:true,body:{...content,departures}});
  assert.equal(created.status,201);
  const tour=created.data.tour;
  const rejected=await api(`/api/admin/tours/${tour.id}`,{method:'PATCH',admin:true,
    body:{title:'Should not persist',departures:[{date:'2027-01-01',capacity:4}]}});
  assert.equal(rejected.status,400);
  const current=(await api('/api/catalog')).data.tours.find(item=>item.id===tour.id);
  assert.equal(current.departures.length,24);
  assert.equal(current.title,content.title);
  assert.equal(current.version,1);
});
