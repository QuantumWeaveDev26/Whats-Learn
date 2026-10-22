'use client';
import FullProjectRunner from './full-project-runner';
import CodeRunner from './code-runner';
import ProjectCheck from './project-check';
export default function DeveloperTools({missionId,accountKey}:{missionId:string;accountKey:string}){return <><FullProjectRunner key={'full:'+accountKey+':'+missionId} missionId={missionId} accountKey={accountKey}/><CodeRunner key={accountKey+':'+missionId} missionId={missionId} accountKey={accountKey}/>{missionId==='d1'&&<ProjectCheck/>}</>}
