import {missions} from './missions';
import {languagePacks} from './translations';
import {courseMini} from './course-missions';
import {checkWriting} from './writing-check';
import {answerText} from './submission';
import {courseProgress,titleFor,type ScoreLite} from './course-titles';
import {reviewCount,type PracticeRecord} from './learning-engine';

export type PlayEvent={event_id:string;mission_id:string;kind:'discover'|'revision'|'practice';created_at:string};
export function practiceDay(date:string){return new Date(date).toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});}
export function validPlayEvent(e:PlayEvent){return !!e&&missions.some(m=>m.id===e.mission_id)&&Number.isFinite(Date.parse(e.created_at))&&(['discover','revision'].includes(e.kind)?e.event_id===`${e.kind}:${e.mission_id}`:e.kind==='practice'&&e.event_id===`practice:${practiceDay(e.created_at)}`);}
export type SavedPractice=PracticeRecord&{body:string;updated_at:string};
type Mini={q:string;options:[string,string];why:string;answer:number};
const mini:Record<string,Mini>={
 ...courseMini,
 m1:{q:'Who gives this lunch offer a clearer starting point?',options:['Everyone who likes food','Office-goers who need weekday lunch'],answer:1,why:'A specific customer gives you a problem and a useful next action to work with.'},
 m2:{q:'Which detail belongs in a trustworthy AI campaign brief?',options:['The actual menu and delivery area','An invented five-star review'],answer:0,why:'Give AI evidence it can use. Check claims before anything is published.'},
 m3:{q:'Which follow-up is easier for a customer to answer?',options:['A long pitch about every feature','Vegetarian menu or mixed menu?'],answer:1,why:'One useful choice makes the next step easier. Send it only with permission.'},
 d1:{q:'What should you define before asking AI to build?',options:['One action the parent can complete','Every feature the tutor might ever want'],answer:0,why:'A small complete action is easier to specify, test and improve.'},
 d2:{q:'What deserves attention in a booking-code review?',options:['Only the button colour','A request that edits another user’s booking'],answer:1,why:'Test protected actions with the wrong user as well as the happy path.'},
 f1:{q:'Which detail makes a silent scene worth following?',options:['A choice that costs the rider something','A list of expensive camera equipment'],answer:0,why:'A meaningful choice gives the performance an emotional purpose.'},
 f2:{q:'What should you carry from one shot into the next?',options:['A new jacket in every shot','Consistent props, wardrobe and screen direction'],answer:1,why:'Continuity helps the viewer follow the same person and story.'},
 f3:{q:'Which is a useful starting point for a hybrid plan?',options:['Choose live or AI for a clear production reason','Generate every shot before deciding the story'],answer:0,why:'Story, control, consent and budget should shape the method.'},
 v1:{q:'What gives the last frame a useful job?',options:['One clear invitation that follows the story','Several unrelated messages'],answer:0,why:'A three-frame story works better when each frame advances one message.'},
 v2:{q:'What helps three still images feel like one story?',options:['Change every visual detail','Carry one deliberate visual detail across them'],answer:1,why:'A consistent detail connects the sequence while each image does a different job.'}
};
const translated:Record<string,Record<string,[string,string,string,string]>>={
 kn:{m1:['ಊಟದ ಕೊಡುಗೆಗೆ ಯಾವ ಗ್ರಾಹಕರಿಂದ ಆರಂಭಿಸುವುದು ಸುಲಭ?','ಊಟ ಇಷ್ಟಪಡುವ ಎಲ್ಲರೂ','ವಾರದ ದಿನಗಳಲ್ಲಿ ಊಟ ಬೇಕಾದ ಕಚೇರಿ ಉದ್ಯೋಗಿಗಳು','ನಿರ್ದಿಷ್ಟ ಗ್ರಾಹಕರ ಸಮಸ್ಯೆಯಿಂದ ಉಪಯುಕ್ತ ಕೊಡುಗೆ ರೂಪಿಸಿ.'],m2:['ನಂಬಬಹುದಾದ AI ಪ್ರಚಾರ ಸೂಚನೆಯಲ್ಲಿ ಏನಿರಬೇಕು?','ನಿಜವಾದ ಮೆನು ಮತ್ತು ವಿತರಣಾ ಪ್ರದೇಶ','ಕಲ್ಪಿಸಿದ ಪಂಚತಾರಾ ವಿಮರ್ಶೆ','AIಗೆ ಪರಿಶೀಲಿಸಿದ ಸಾಕ್ಷ್ಯ ನೀಡಿ. ಪ್ರಕಟಿಸುವ ಮೊದಲು ಹೇಳಿಕೆ ಪರಿಶೀಲಿಸಿ.'],m3:['ಗ್ರಾಹಕರಿಗೆ ಯಾವ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸುವುದು ಸುಲಭ?','ಎಲ್ಲ ವೈಶಿಷ್ಟ್ಯಗಳ ಉದ್ದವಾದ ವಿವರಣೆ','ಸಸ್ಯಾಹಾರಿ ಮೆನು ಬೇಕೇ ಅಥವಾ ಮಿಶ್ರ ಮೆನು ಬೇಕೇ?','ಅನುಮತಿಯೊಂದಿಗೆ ಒಂದೇ ಸರಳ ಆಯ್ಕೆ ಕೇಳಿ.'],d1:['AI ಮೂಲಕ ನಿರ್ಮಿಸುವ ಮೊದಲು ಏನು ನಿರ್ಧರಿಸಬೇಕು?','ಪೋಷಕರು ಪೂರ್ಣಗೊಳಿಸಬಹುದಾದ ಒಂದೇ ಕ್ರಿಯೆ','ಭವಿಷ್ಯದಲ್ಲಿ ಬೇಕಾಗಬಹುದಾದ ಎಲ್ಲ ವೈಶಿಷ್ಟ್ಯಗಳು','ಚಿಕ್ಕ ಸಂಪೂರ್ಣ ಕ್ರಿಯೆಯನ್ನು ವಿವರಿಸಿ, ಪರೀಕ್ಷಿಸಿ, ಸುಧಾರಿಸಿ.'],d2:['ಬುಕಿಂಗ್ ಕೋಡ್ ಪರಿಶೀಲನೆಯಲ್ಲಿ ಯಾವುದು ಮುಖ್ಯ?','ಬಟನ್ ಬಣ್ಣ ಮಾತ್ರ','ಬೇರೊಬ್ಬರ ಬುಕಿಂಗ್ ಬದಲಿಸುವ ವಿನಂತಿ','ತಪ್ಪು ಬಳಕೆದಾರರ ವಿನಂತಿಯನ್ನೂ ಪರೀಕ್ಷಿಸಿ.'],f1:['ಮೂಕ ದೃಶ್ಯದಲ್ಲಿ ಯಾವುದು ಆಸಕ್ತಿ ಮೂಡಿಸುತ್ತದೆ?','ರೈಡರ್‌ಗೆ ಬೆಲೆ ತೆರಬೇಕಾದ ಆಯ್ಕೆ','ದುಬಾರಿ ಕ್ಯಾಮೆರಾಗಳ ಪಟ್ಟಿ','ಅರ್ಥಪೂರ್ಣ ಆಯ್ಕೆ ಭಾವನೆಗೆ ಕಾರಣ ನೀಡುತ್ತದೆ.'],f2:['ಮುಂದಿನ ಶಾಟ್‌ನಲ್ಲಿ ಏನು ಮುಂದುವರಿಯಬೇಕು?','ಪ್ರತಿ ಶಾಟ್‌ನಲ್ಲಿ ಹೊಸ ಜಾಕೆಟ್','ಒಂದೇ ವಸ್ತುಗಳು, ಉಡುಪು ಮತ್ತು ಪರದೆ ದಿಕ್ಕು','ನಿರಂತರತೆ ಕಥೆಯನ್ನು ಅನುಸರಿಸಲು ನೆರವಾಗುತ್ತದೆ.'],f3:['ಹೈಬ್ರಿಡ್ ಯೋಜನೆಗೆ ಉಪಯುಕ್ತ ಆರಂಭ ಯಾವುದು?','ಸ್ಪಷ್ಟ ಕಾರಣದಿಂದ ಲೈವ್ ಅಥವಾ AI ಆಯ್ಕೆ','ಕಥೆ ನಿರ್ಧರಿಸುವ ಮೊದಲು ಎಲ್ಲ ಶಾಟ್‌ಗಳನ್ನು ಸೃಷ್ಟಿಸುವುದು','ಕಥೆ, ನಿಯಂತ್ರಣ, ಅನುಮತಿ ಮತ್ತು ಬಜೆಟ್ ವಿಧಾನವನ್ನು ನಿರ್ಧರಿಸಲಿ.'],v1:['ಕೊನೆಯ ಫ್ರೇಮ್‌ನ ಕೆಲಸವೇನು?','ಕಥೆಗೆ ಹೊಂದುವ ಒಂದೇ ಆಹ್ವಾನ','ಹಲವು ಸಂಬಂಧವಿಲ್ಲದ ಸಂದೇಶಗಳು','ಪ್ರತಿ ಫ್ರೇಮ್ ಒಂದೇ ಸಂದೇಶವನ್ನು ಮುಂದಕ್ಕೆ ಕೊಂಡೊಯ್ಯಲಿ.'],v2:['ಮೂರು ಚಿತ್ರಗಳನ್ನು ಒಂದೇ ಕಥೆಯಾಗಿ ಯಾವುದು ಜೋಡಿಸುತ್ತದೆ?','ಎಲ್ಲ ದೃಶ್ಯ ವಿವರಗಳನ್ನು ಬದಲಿಸುವುದು','ಒಂದು ದೃಶ್ಯ ವಿವರವನ್ನು ಮೂರರಲ್ಲೂ ಉಳಿಸುವುದು','ಒಂದೇ ವಿವರ ಚಿತ್ರಗಳ ಸರಣಿಯನ್ನು ಜೋಡಿಸುತ್ತದೆ.']},
 hi:{m1:['लंच ऑफ़र किस ग्राहक से शुरू करना आसान होगा?','खाना पसंद करने वाला हर व्यक्ति','दफ़्तर के लोग जिन्हें सप्ताह में लंच चाहिए','एक खास ग्राहक की समस्या से उपयोगी ऑफ़र बनाएँ।'],m2:['विश्वसनीय AI अभियान ब्रीफ़ में क्या होना चाहिए?','असली मेन्यू और डिलीवरी क्षेत्र','मनगढ़ंत पाँच-सितारा समीक्षा','AI को सत्यापित प्रमाण दें। प्रकाशित करने से पहले दावे जाँचें।'],m3:['ग्राहक किस सवाल का आसानी से जवाब दे सकता है?','हर सुविधा की लंबी पिच','शाकाहारी मेन्यू या मिश्रित मेन्यू?','अनुमति के साथ एक आसान विकल्प पूछें।'],d1:['AI से बनाने से पहले क्या तय करें?','एक काम जो अभिभावक पूरा कर सकें','भविष्य की हर संभव सुविधा','एक छोटा पूरा काम तय करें, जाँचें और सुधारें।'],d2:['बुकिंग कोड की समीक्षा में क्या महत्वपूर्ण है?','सिर्फ बटन का रंग','दूसरे उपयोगकर्ता की बुकिंग बदलने वाला अनुरोध','गलत उपयोगकर्ता के अनुरोध को भी जाँचें।'],f1:['बिना संवाद के दृश्य को क्या दिलचस्प बनाता है?','एक चुनाव जिसकी कीमत राइडर को चुकानी पड़े','महँगे कैमरों की सूची','अर्थपूर्ण चुनाव अभिनय को भावनात्मक उद्देश्य देता है।'],f2:['अगले शॉट में क्या बनाए रखें?','हर शॉट में नई जैकेट','समान वस्तुएँ, कपड़े और स्क्रीन दिशा','निरंतरता दर्शक को कहानी समझने में मदद करती है।'],f3:['हाइब्रिड योजना की उपयोगी शुरुआत क्या है?','स्पष्ट कारण से लाइव या AI चुनना','कहानी तय करने से पहले हर शॉट बनाना','कहानी, नियंत्रण, सहमति और बजट से तरीका तय करें।'],v1:['आखिरी फ़्रेम का उपयोगी काम क्या है?','कहानी से जुड़ा एक स्पष्ट आमंत्रण','कई असंबंधित संदेश','हर फ़्रेम एक संदेश को आगे बढ़ाए।'],v2:['तीन स्थिर चित्रों को एक कहानी क्या बनाता है?','हर दृश्य विवरण बदलना','एक चुना हुआ दृश्य विवरण तीनों में रखना','एक समान विवरण चित्रों की श्रृंखला को जोड़ता है।']}
};
export function miniChallenge(id:string,language='en'):Mini{
 const item=mini[id];if(!item)throw new Error('Unknown challenge');const t=translated[language]?.[id]||languagePacks[language]?.mini[id];
 return t?{...item,q:t[0],options:[t[1],t[2]],why:t[3]}:item;
}
export const stretchPrompts:Record<string,string>={marketing:'Try a different customer or offer. Explain one change that makes your message more useful.',development:'Add one realistic failure case. Explain how the user would recover without losing their input.',filmmaking:'Change one production constraint. Explain how you would preserve the story, continuity and consent.',storytelling:'Change the audience or intended feeling. Explain which frame or visual detail you would revise.'};
/** Consecutive practice days (India-time calendar days). The current streak is still alive if the learner practised today or yesterday; a missed day only resets this run. Practice-day totals, points and work are never reduced. */
export function streakDays(days:string[],today=practiceDay(new Date().toISOString())){
 const set=new Set(days);const step=(d:string,n:number)=>new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
 let best=0;for(const d of set){if(set.has(step(d,-1)))continue;let n=1;while(set.has(step(d,n)))n++;best=Math.max(best,n)}
 const last=set.has(today)?today:set.has(step(today,-1))?step(today,-1):'';let current=0;if(last)while(set.has(step(last,-current)))current++;
 return {current,best};
}
export function practiceRewards(work:SavedPractice[],events:PlayEvent[],track:string,scores:ScoreLite[]=[]){
 const unique=[...new Map(work.filter(w=>missions.some(m=>m.id===w.mission_id&&m.answer===Number(w.quiz))).map(w=>[w.mission_id,w])).values()];
 const allowed=new Set(unique.map(w=>w.mission_id));const valid=[...new Map(events.filter(e=>validPlayEvent(e)&&(e.kind!=='revision'||allowed.has(e.mission_id))).map(e=>[e.event_id,e])).values()];
 const revisions=new Set(valid.filter(e=>e.kind==='revision').map(e=>e.mission_id));
 const discoveries=valid.filter(e=>e.kind==='discover').length;
 const reviewed=unique.filter(w=>reviewCount(w.checks)>=4).length;
 const coins=unique.length*10+discoveries+revisions.size*5;
 // Stars read the saved writing: 1 for a saved creation, 2 when the basic writing check rates it good, 3 when it is strong or improved in a revision.
 const stars=(id:string)=>{if(!allowed.has(id))return 0;const w=unique.find(x=>x.mission_id===id);const mission=missions.find(m=>m.id===id);const score=w&&mission?checkWriting(id,answerText(mission,w.body)).score:0;return 1+(score>=60?1:0)+(score>=80||revisions.has(id)?1:0)};
 const days=[...new Set([...unique.map(w=>w.updated_at),...valid.map(e=>e.created_at)].filter(d=>Number.isFinite(Date.parse(d))).map(practiceDay))];
 const pool=missions.filter(m=>m.track===track);const completed=pool.filter(m=>allowed.has(m.id)).length;
 const trackCount=new Set(unique.map(w=>missions.find(m=>m.id===w.mission_id)!.track)).size;
 const badges=[{id:'first',name:'First Maker',detail:'Save your first creation',earned:unique.length>=1},{id:'reviewer',name:'Thoughtful Reviewer',detail:'Self-review at least four parts of a creation',earned:reviewed>=1},{id:'revision',name:'Better Each Time',detail:'Save a changed creation with a reflection',earned:revisions.size>=1},{id:'sprint',name:'Sprint Builder',detail:'Save every foundation mission in this programme',earned:completed===pool.length&&pool.length>0},{id:'explorer',name:'Curious Explorer',detail:'Save creations in two programmes',earned:trackCount>=2},{id:'return',name:'Back for More',detail:'Practise on three different days',earned:days.length>=3}];
 const streak=streakDays(days);
 const course=courseProgress(track,allowed,scores);const names=titleFor(track);
 if(names)badges.push({id:'title-streak',name:names.streak,detail:`All 10 missions, no clue, one new mission a day for 10 days in a row in this course · best run ${course.bestStreak} day${course.bestStreak===1?'':'s'}`,earned:course.title==='streak'},{id:'title-top',name:names.top,detail:`Finish all ${course.total} missions with no clue used · ${course.done} of ${course.total} done${course.cluesUsed?` · ${course.cluesUsed} clue${course.cluesUsed===1?'':'s'} used`:''}`,earned:course.title==='top'||course.title==='streak'},{id:'title-mastery',name:names.mastery,detail:'Finish all 10 missions, with clues allowed',earned:course.title==='mastery'});
 return {course,coins,stars,badges,days:days.length,streak:streak.current,bestStreak:streak.best,xp:unique.length*50,creations:unique.length,level:unique.length>=6?'Creator':unique.length>=3?'Builder':unique.length>=1?'Maker':'Explorer',completed,total:pool.length,discoveries,revisions:revisions.size};
}
