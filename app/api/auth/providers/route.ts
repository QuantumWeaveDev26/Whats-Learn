import {emailAuthConfigured} from '@/lib/auth/config';
import {googleEnabled} from '@/lib/auth/gotrue';
export const dynamic='force-dynamic';
export async function GET(){const r=emailAuthConfigured()?await googleEnabled():null;return Response.json({google:r?.ok===true&&r.data===true},{status:r&&!r.ok?503:200,headers:{'Cache-Control':'private, no-store'}});}
