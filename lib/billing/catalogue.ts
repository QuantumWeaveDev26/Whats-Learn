export const billingCatalogue={
 sprint:{name:'Skill Sprint',amount:14900,period:null,cycles:1},
 plus_monthly:{name:'Plus monthly',amount:49900,period:'monthly',cycles:12},
 plus_annual:{name:'Plus annual',amount:499900,period:'yearly',cycles:5},
 pro_monthly:{name:'Pro monthly',amount:99900,period:'monthly',cycles:12},
 pro_annual:{name:'Pro annual',amount:999900,period:'yearly',cycles:5},
 teams_monthly:{name:'Teams per learner monthly',amount:39900,period:'monthly',cycles:12}
} as const;
export type SKU=keyof typeof billingCatalogue;
export function quote(sku:SKU,quantity:number){
 if(!(sku in billingCatalogue)||!Number.isInteger(quantity)||quantity<1||quantity>100||(sku==='teams_monthly'?quantity<5:quantity!==1))throw new Error('Invalid plan or learner count.');
 return {...billingCatalogue[sku],sku,quantity,total:billingCatalogue[sku].amount*quantity};
}
