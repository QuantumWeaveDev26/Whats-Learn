/** A checked teaching reference for a factual error observed in a live definition reply.
 * This repairs that explanation only; it never assesses learner work or changes account state.
 */
export function checkedDefinitionAnswer(question:string,answer:string,language:string){
 if(language!=='English'||!(/\bcustomers?\b/i.test(question)&&/\baudienc(?:e|es)\b/i.test(question)))return answer;
 if(!/\baudienc(?:e|es)\b/i.test(answer)||!/\bcustomers?\b/i.test(answer))return answer;
 // Existing buyers must not be excluded from the audience by definition.
 const excludesBuyers=/\baudienc(?:e|es)\b[^.!?\n]*\b(?:haven['’]t|have not|hasn['’]t|has not|never|not yet|don['’]t|do not|non[- ]buyers)[^.!?\n]*\b(?:bought|buy|paid|pay|customers?)\b/iu.test(answer)
  ||/\baudienc(?:e|es)\b[^.!?\n]*\b(?:only|exclusively)\b[^.!?\n]*\b(?:potential|prospective|future)\s+(?:buyers?|customers?)\b/iu.test(answer);
 const includesBuyers=/\b(?:includ\w*|both|also|overlap)\b[^.!?\n]*\b(?:existing|current|regular)\s+(?:buyers?|customers?)\b/iu.test(answer);
 if(!excludesBuyers||includesBuyers)return answer;
 const base='A customer buys. An audience is the group a message is intended to reach, which can include existing customers. These groups can overlap.';
 if(/example/i.test(question))return base+(/lunch|meal|food/i.test(question)?' For a lunch service, office workers—including regular buyers—can be its audience.':" For example, a shop’s regular buyer can also see its next offer.");
 return base;
}
