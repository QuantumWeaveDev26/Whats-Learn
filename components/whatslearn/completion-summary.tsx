import type {ReactNode} from 'react';
/** Completed creations stay primary; secondary rewards require an explicit expansion. */
export default function CompletionSummary({count,total,children}:{count:number;total:number;children:ReactNode}){
 return <><p className="completion-progress" role="status"><strong>{count} of {total} course creations saved</strong></p><details className="completion-rewards"><summary>Optional rewards</summary>{children}</details></>;
}
