import {messageCopy} from '@/lib/question-translations';
import type {Mission} from '@/lib/missions';
import {missionPractice} from '@/lib/mission-practice';
export default function MissionOutcome({mission,compact=false}:{mission:Mission;compact?:boolean}){const p=missionPractice(mission),copy=messageCopy(mission.contentLanguage);return <section className="mission-practice" aria-label="Practical mission outcome"><span className="play-label">{copy.day} {p.day} · {copy.make}</span><h3>{copy.outcome}: {p.outcome}</h3>{!compact&&<><strong>{copy.try}</strong><ol>{p.steps.map((step,i)=><li key={i}>{step}</li>)}</ol><p className="small">{copy.evidence}</p><details><summary>{copy.reviewHelp}</summary><p className="small">{copy.reviewScope}</p></details></>}</section>}
