/** Daily live-AI requests per learner. Mission scores do not depend on payment. */
export function planAllowance(sku:string|null|undefined){
 const dailyAi=sku==='sprint'?5:sku?.startsWith('pro_')?25:sku?.startsWith('plus_')||sku==='teams_monthly'?10:3;
 return {dailyAi,missionPoints:100};
}
export function paidOnboardingUrl(result:{paidAccessActivated?:boolean}|null|undefined){return result?.paidAccessActivated===true?'/learn?personalise=1':null}
