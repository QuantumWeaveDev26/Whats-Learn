const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const h=require('./helpers/harness.cjs'),{accountHomeState,homePrimaryAction}=h.load('lib/home-learner.ts'),{missions}=h.load('lib/missions.ts');
require.extensions['.tsx']=require.extensions['.ts'];
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),Explorer=h.load('components/whatslearn/programme-explorer.tsx').default;
const CourseCard=h.load('components/whatslearn/home-course-card.tsx').default;
const account={accountKey:'account-a',profile:{track:'development'},hasStarted:true};

test('a selected course with saved activity gets Continue Learning and only its accepted progress',()=>{
 const d1=missions.find(m=>m.id==='d1'),m1=missions.find(m=>m.id==='m1');
 const learner=accountHomeState(account,{accountKey:'account-a',work:[{mission_id:'d1',quiz:d1.answer},{mission_id:'d1',quiz:d1.answer},{mission_id:'d2',quiz:-1},{mission_id:'m1',quiz:m1.answer}]});
 assert.deepEqual(learner.progress.development,{saved:1,total:10});assert.deepEqual(homePrimaryAction(learner),{label:'Continue Learning',href:'/learn'});
});

test('choosing a course does not falsely claim that a new learner has started it',()=>{
 const learner=accountHomeState({...account,hasStarted:false},{accountKey:'account-a',work:[]});
 assert.equal(homePrimaryAction(learner).label,'Start my first task');assert.equal(learner.hasStarted,false);
 const first=accountHomeState({accountKey:'new',hasStarted:false,profile:null});assert.equal(first.courseId,null);assert.equal(homePrimaryAction(first).label,'Try my first challenge');
});

test('completed courses send learners to their creations instead of restarting onboarding',()=>{
 const work=missions.filter(m=>m.track==='development').map(m=>({mission_id:m.id,quiz:m.answer}));
 const learner=accountHomeState(account,{accountKey:'account-a',work});assert.deepEqual(homePrimaryAction(learner),{label:'View My Creations',href:'/learn?view=portfolio'});
});

test('another account response cannot populate course progress and no identity means no returning view',()=>{
 const learner=accountHomeState(account,{accountKey:'other',work:[{mission_id:'d1',quiz:missions.find(m=>m.id==='d1').answer}]});assert.equal(learner.progress,undefined);
 assert.deepEqual(accountHomeState({profile:{track:'development'},hasStarted:true}),{status:'unavailable'});
});

test('the returning course is listed first with progress but stays collapsed until clicked',()=>{
 const learner=accountHomeState(account,{accountKey:'account-a',work:[]});const html=renderToStaticMarkup(React.createElement(Explorer,{learner}));
 assert.match(html,/YOUR COURSE\. YOUR PROGRESS/);assert.match(html,/Your course.*0\/10 saved/);assert.doesNotMatch(html,/aria-expanded="true"/);assert.doesNotMatch(html,/Choose this course/);
 assert.ok(html.indexOf('AI Full-Stack Development')<html.indexOf('AI Digital Marketing'));assert.doesNotMatch(html,/programme-detail/);
});

test('visitors still get the original course-discovery flow and loading does not ask them to choose a course again',()=>{
 const guest=renderToStaticMarkup(React.createElement(Explorer,{learner:{status:'guest'}}));assert.match(guest,/What do you want/);assert.doesNotMatch(guest,/Your course<|Continue Learning/);
 const loading=renderToStaticMarkup(React.createElement(Explorer));assert.match(loading,/Real possibilities/);assert.doesNotMatch(loading,/Your course is ready/);
});

test('one account loader updates every homepage entry point and clears the shared view on sign-out',()=>{
 const home=fs.readFileSync('app/page.tsx','utf8'),visual=fs.readFileSync('components/whatslearn/visual-start.tsx','utf8');
 assert.match(home,/<VisualStart onLearnerChange=\{setLearner\}/);assert.match(home,/<ProgrammeExplorer learner=\{learner\}/);assert.match(home,/<JourneySteps hasCourse=\{hasCourse\}/);
 assert.match(visual,/onLearnerChange\?\.\(\{status:'guest'\}\)/);assert.match(visual,/accountHomeState\(d,w\)/);assert.equal(fs.readFileSync('components/whatslearn/programme-explorer.tsx','utf8').includes("fetch('/api"),false,'No second account request per course card');
});

test('the returning hero uses a visual course card with actual progress rather than another starter prompt',()=>{
 const learner=accountHomeState(account,{accountKey:'account-a',work:[]});const html=renderToStaticMarkup(React.createElement(CourseCard,{learner}));
 assert.match(html,/YOUR CURRENT COURSE/);assert.match(html,/AI Full-Stack Development/);assert.match(html,/aria-valuenow="0"/);assert.match(html,/Continue Learning/);assert.doesNotMatch(html,/Choose this course|first challenge|STARTER CHALLENGE/);
 const pending=renderToStaticMarkup(React.createElement(CourseCard,{learner:accountHomeState(account)}));assert.match(pending,/Loading your saved progress/);assert.doesNotMatch(pending,/aria-valuenow="0"/);
 const source=fs.readFileSync('components/whatslearn/visual-start.tsx','utf8');assert.match(source,/account\?\.hasCourse&&!extraStarter\?<HomeCourseCard/);assert.match(source,/function start\(\)\{setExtraStarter\(true\)/);
});
