import { env } from 'cloudflare:workers';
export function database(){if(!env.DB)throw new Error('Storage unavailable');return env.DB;}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !!origin&&origin===new URL(request.url).origin;}
