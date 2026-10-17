import {questionForStyle} from '@/lib/style-questions';
import {missions} from '@/lib/missions';
import {localizeMission} from '@/lib/personalization';
import {startingLevel,startingLevels} from '@/lib/mission-levels';

export default function LevelQuestionPreview({track,level,language='en',style='casual'}:{track:string;level:string;language?:string;style?:string}){
 const first=missions.find(m=>m.track===track);if(!first)return null;
 const mission=localizeMission(first,language,level);
 return <aside className="level-question-preview" aria-live="polite" aria-label="Your first mission question"><span className="play-label">{startingLevels[startingLevel(level)]} · question preview</span><p lang="en">{questionForStyle(mission,style)}</p></aside>;
}
