const test=require('node:test'),assert=require('node:assert/strict');const h=require('./helpers/harness.cjs');
const clean=()=>{h.reset();for(const t of ['game_scores','game_squads','game_squad_members'])h.db.exec(`DELETE FROM ${t}`)};
const g=()=>h.load('lib/app-games.ts');
const wed=new Date('2026-10-28T06:00:00Z');

test('weeks run Monday to Sunday in India time and pick one tournament game',()=>{const {weekOf,tournamentGame}=g();
 assert.equal(weekOf(wed).key,'2026-10-26');assert.equal(weekOf(new Date('2026-11-01T18:00:00Z')).key,'2026-10-26','11:30 pm Sunday in India is still this week');assert.equal(weekOf(new Date('2026-11-01T19:00:00Z')).key,'2026-11-02','12:30 am Monday in India starts a new week');
 assert.equal(tournamentGame(wed).id,tournamentGame(new Date('2026-10-31T10:00:00Z')).id);assert.notEqual(tournamentGame(wed).id,tournamentGame(new Date('2026-11-04T10:00:00Z')).id)});

test('only the best score of the week counts, and ranks follow it',async()=>{clean();const {recordScore,weeklyBoard,tournamentGame}=g();const game=tournamentGame(wed).id;
 await recordScore('u1',game,60,wed);assert.equal((await recordScore('u1',game,40,wed)).best,60);await recordScore('u1',game,80,wed);await recordScore('u2',game,90,wed);
 const b=await weeklyBoard('u1',wed);assert.equal(b.game,game);assert.equal(b.players,2);assert.deepEqual(b.top.map(x=>x.score),[90,80]);assert.deepEqual(b.me,{score:80,rank:2});assert.equal(b.top[1].me,true)});

test('squads: create, join by code, five friends at most, team score adds up, leaving hands over or removes',async()=>{clean();const {createSquad,joinSquad,leaveSquad,recordScore,weeklyBoard,tournamentGame,SquadError}=g();const game=tournamentGame(wed).id;
 const {code}=await createSquad('a','  Night Owls  ',wed);assert.match(code,/^[A-Z2-9]{6}$/);
 await assert.rejects(createSquad('a','Again',wed),SquadError);
 for(const u of ['b','c','d','e'])await joinSquad(u,code.toLowerCase(),wed);
 await assert.rejects(joinSquad('f',code,wed),/full/);
 await assert.rejects(joinSquad('f','ZZZZZZ',wed),/No squad/);
 await recordScore('a',game,70,wed);await recordScore('b',game,50,wed);
 let b=await weeklyBoard('b',wed);assert.equal(b.squad.name,'Night Owls');assert.equal(b.squad.total,120);assert.equal(b.squad.members.length,5);assert.equal(b.squads[0].total,120);
 await leaveSquad('a');b=await weeklyBoard('b',wed);assert.equal(b.squad.total,50);assert.equal(b.squad.owner,true,'the longest member takes over');
 for(const u of ['b','c','d','e'])await leaveSquad(u);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM game_squads').get().n,0)});

test('games API: sign-in and same-origin required; guests can read the board',async()=>{clean();const r=h.load('app/api/games/route.ts');
 assert.equal((await h.call(r,'/api/games',{body:{action:'score',game:'bug-hunt',score:80}})).status,401);
 assert.equal((await h.call(r,'/api/games',{origin:'https://other.test',body:{action:'leave'}})).status,403);
 const get=await r.GET();const j=await get.json();assert.equal(get.status,200);assert.equal(j.signedIn,false);assert.equal(j.me,null);assert.ok(Array.isArray(j.top))});
