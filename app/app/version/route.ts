import { APP_RELEASE } from '@/components/whatslearn-app/version';

export function GET() {
  return Response.json({ version: APP_RELEASE }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
