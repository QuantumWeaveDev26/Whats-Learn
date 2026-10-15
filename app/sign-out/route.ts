// Alias: typed-by-hand address that goes to the working page, never to a 404.
export const dynamic='force-dynamic';
export function GET(request:Request){const q=new URL(request.url).search;return new Response(null,{status:307,headers:{Location:'/signout'+q}})}
