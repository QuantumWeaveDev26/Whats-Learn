import type {Mission} from './missions';

export const learningStyleCodes=['casual','game','story','facts'] as const;
export type LearningStyle=typeof learningStyleCodes[number];
export const learningStyles:Record<LearningStyle,string>={casual:'Casual · talk it through',game:'Game · mini quests',story:'Story · learn through a situation',facts:'Facts · get to the point'};
export const styleDescriptions:Record<LearningStyle,string>={casual:'A friendly explanation, then one small action.',game:'A quest, a decision and a small win.',story:'Step into a real situation and decide what happens next.',facts:'Key ideas first, then a quick check and practice.'};
export const learningStyle=(value:unknown):LearningStyle=>learningStyleCodes.includes(value as LearningStyle)?value as LearningStyle:'casual';
export const lessonFacts=(lesson:string)=>lesson.split(/(?<=[.!?।])\s+/u).filter(Boolean);

const labels={
 en:{casual:'Let’s try this',game:'Your quest',story:'The scene',facts:'Key idea',question:'Question 1',pick:'Your pick?',part:'Your turn',idea:'The idea',task:'Your task',example:'See an example',steps:'Decide → Make → Review',continue:'Continue the challenge'},
 hi:{casual:'आइए इसे आज़माएँ',game:'आपका मिशन',story:'यह है स्थिति',facts:'मुख्य बात',question:'प्रश्न 1',pick:'आपकी पसंद?',part:'अब आपकी बारी',idea:'मुख्य विचार',task:'आपका काम',example:'उदाहरण देखें',steps:'चुनें → बनाएँ → जाँचें',continue:'चुनौती जारी रखें'},
 kn:{casual:'ಇದನ್ನು ಪ್ರಯತ್ನಿಸೋಣ',game:'ನಿಮ್ಮ ಸವಾಲು',story:'ಈ ಸಂದರ್ಭ',facts:'ಮುಖ್ಯ ಅಂಶ',question:'ಪ್ರಶ್ನೆ 1',pick:'ನಿಮ್ಮ ಆಯ್ಕೆ?',part:'ಈಗ ನಿಮ್ಮ ಸರದಿ',idea:'ಮುಖ್ಯ ವಿಚಾರ',task:'ನಿಮ್ಮ ಕೆಲಸ',example:'ಉದಾಹರಣೆ ನೋಡಿ',steps:'ಆಯ್ಕೆ → ರಚನೆ → ಪರಿಶೀಲನೆ',continue:'ಸವಾಲನ್ನು ಮುಂದುವರಿಸಿ'}
};
export const styleLabels=(language:string)=>labels[language as keyof typeof labels]||labels.en;
/** Same approved lesson and assessment; only the order and presentation change. */
export function chatStyleIntro(m:Mission,style:unknown,position:number,language='en'){
 const kind=learningStyle(style),t=styleLabels(language);
 const heading=`*${t[kind]} · ${position}/10*`;
 if(kind==='facts')return `⚡ ${heading}\n${m.title}\n\n${lessonFacts(m.lesson)[0]||m.lesson}`;
 if(kind==='game')return `🎮 ${heading}\n${m.title}\n\n${m.brief}\n\n${t.steps}`;
 if(kind==='story')return `📖 ${heading}\n${m.brief}\n\n*${m.title}*`;
 return `💬 ${heading}\n${m.title}\n\n${m.brief}`;
}
export function chatStyleLesson(m:Mission,style:unknown,language='en'){
 const kind=learningStyle(style),t=styleLabels(language);
 if(kind==='facts')return `⚡ *${t.facts}*\n${lessonFacts(m.lesson).map(x=>'• '+x).join('\n')}\n\n*${t.task}*\n${m.task}`;
 if(kind==='story')return `📖 *${t.story}*\n${m.brief}\n\n*${t.idea}*\n${m.lesson}\n\n*${t.part}*\n${m.task}`;
 if(kind==='game')return `🎮 *${t.game}*\n${m.task}\n\n💡 ${m.lesson}`;
 return `💬 *${t.idea}*\n${m.lesson}\n\n*${t.part}*\n${m.task}`;
}
