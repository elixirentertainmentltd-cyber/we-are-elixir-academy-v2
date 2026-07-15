'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
export function CompleteLessonButton({lessonId,completed}:{lessonId:string;completed:boolean}){
  const router=useRouter(); const [loading,setLoading]=useState(false);
  async function toggle(){setLoading(true);await fetch(`/api/progress/${lessonId}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({completed:!completed})});setLoading(false);router.refresh()}
  return <button className={completed?'ghost complete-button':'primary complete-button'} disabled={loading} onClick={toggle}>{loading?'Saving…':completed?'✓ Completed':'Mark lesson complete'}</button>
}
