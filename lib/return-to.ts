/**
 * Where sign-in and sign-out send the learner back to. Only same-site relative paths are accepted, so a link can never send someone to another site,
 * and the sign-in pages themselves are never a return target (that would loop).
 * Sign-in and sign-out links in the app always go through /signin and /signout. Those pages check that the host really provides ChatGPT sign-in
 * before sending the learner on, so no sign-in link can end at a "page not found".
 */
export const HOST_SIGN_IN='/signin-with-chatgpt',HOST_SIGN_OUT='/signout-with-chatgpt';
const reserved=new Set([HOST_SIGN_IN,HOST_SIGN_OUT,'/callback','/signin','/signout','/signup','/forgot-password','/reset-password','/verify-email','/auth/confirm']);
export function safeReturnTo(value:string|null|undefined,fallback='/learn'):string{
 if(!value||!value.startsWith('/')||value.startsWith('//')||value.includes('\\')||/[\u0000-\u001f]/.test(value))return fallback;
 try{const u=new URL(value,'https://app.local');if(u.origin!=='https://app.local'||reserved.has(u.pathname.replace(/\/+$/,'')||'/'))return fallback;return u.pathname+u.search+u.hash}catch{return fallback}
}
export const signInHref=(returnTo:string)=>`/signin?return_to=${encodeURIComponent(safeReturnTo(returnTo))}`;
export const signOutHref=(returnTo='/')=>`/signout?return_to=${encodeURIComponent(safeReturnTo(returnTo,'/'))}`;
export const hostSignInHref=(returnTo:string)=>`${HOST_SIGN_IN}?return_to=${encodeURIComponent(safeReturnTo(returnTo))}`;
export const hostSignOutHref=(returnTo:string)=>`${HOST_SIGN_OUT}?return_to=${encodeURIComponent(safeReturnTo(returnTo,'/'))}`;
/** Pages that must also answer when typed by hand (the usual names people guess). Each goes to the working page, never to a 404. */
export const authAliases:Record<string,string>={'/login':'/signin','/log-in':'/signin','/sign-in':'/signin','/signin-with-email':'/signin','/register':'/signup','/sign-up':'/signup','/logout':'/signout','/log-out':'/signout','/sign-out':'/signout','/account':'/settings'};
