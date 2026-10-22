export type QuestionText={steps:string[];fields:{id:string;prompt:string;hint:string}[];levels:Record<string,{question:string;options:string[];explanation:string;levelTask:string}>};
export type QuestionPack={version:string;missions:Record<string,QuestionText>};
