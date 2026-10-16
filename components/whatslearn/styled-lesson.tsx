import type {Mission} from '@/lib/missions';
import {learningStyle,learningStyles,lessonFacts,styleLabels} from '@/lib/learning-styles';

export default function StyledLesson({mission,style,language}:{mission:Mission;style?:string;language:string}){
 const kind=learningStyle(style),t=styleLabels(language);
 return <section className={'styled-lesson style-'+kind} aria-label={learningStyles[kind]} lang={language}>
  <span className="style-badge">{learningStyles[kind]}</span>
  {kind==='game'?<><h3>🎮 {t.game}</h3><p>{mission.brief}</p><ol className="style-quest-steps"><li>1 · {t.question}</li><li>2 · {t.task}</li><li>3 · {t.continue}</li></ol><details><summary>💡 {t.idea}</summary><p>{mission.lesson}</p></details></>:
   kind==='story'?<><h3>📖 {t.story}</h3><blockquote>{mission.brief}</blockquote><h4>{t.part}</h4><p>{mission.task}</p><details><summary>{t.idea}</summary><p>{mission.lesson}</p></details></>:
   kind==='facts'?<><h3>⚡ {t.facts}</h3><ul>{lessonFacts(mission.lesson).map((fact,i)=><li key={i}>{fact}</li>)}</ul><h4>{t.task}</h4><p>{mission.task}</p></>:
   <><h3>💬 {t.casual}</h3><p className="style-chat-bubble">{mission.brief}</p><p>{mission.lesson}</p><p className="style-chat-turn"><strong>{t.part}:</strong> {mission.task}</p></>}
  <details className="style-example"><summary>{t.example}</summary><p>{mission.example}</p></details>
 </section>;
}
