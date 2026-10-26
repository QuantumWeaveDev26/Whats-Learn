import {curriculumFor} from '@/lib/curriculum-context';
export async function GET(request:Request){
 const track=new URL(request.url).searchParams.get('track')||'marketing';
 const curriculum=curriculumFor(track);
 return Response.json(curriculum||{error:'Unknown course.'},{status:curriculum?200:400,headers:{'Cache-Control':'public, max-age=300'}});
}
