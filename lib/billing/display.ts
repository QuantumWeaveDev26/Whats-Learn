import {billingCatalogue,type SKU} from './catalogue';

/** Live plan storage keys have a prefix; both modes share the public catalogue names. */
export function billingPlanName(sku:string){return billingCatalogue[sku.replace(/^live:/,'').replace(/:\d+$/,'') as SKU]?.name||sku;}
