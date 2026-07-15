import { revalidatePath } from 'next/cache';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';
import { slugify } from '@/lib/slug';

export const dynamic='force-dynamic';
export default async function ProfilePage(){
 const user=await requireActiveUser();
 async function save(formData:FormData){'use server';const me=await requireActiveUser();const requested=String(formData.get('profileSlug')||slugify(me.name));await db.user.update({where:{id:me.id},data:{avatarUrl:String(formData.get('avatarUrl')||'')||null,coverUrl:String(formData.get('coverUrl')||'')||null,bio:String(formData.get('bio')||'')||null,skills:String(formData.get('skills')||'')||null,profileSlug:requested,publicProfile:formData.get('publicProfile')==='on',socialLinks:{tiktok:String(formData.get('tiktok')||''),instagram:String(formData.get('instagram')||''),youtube:String(formData.get('youtube')||'')}}});revalidatePath('/profile');}
 const full=await db.user.findUniqueOrThrow({where:{id:user.id},include:{certificates:{include:{course:true}},badges:{include:{badge:true}},submissions:{where:{status:'APPROVED'},include:{assignment:true}}}});
 const links=(full.socialLinks||{}) as Record<string,string>;
 return <Shell user={user}><div className="profile-hero" style={full.coverUrl?{backgroundImage:`linear-gradient(90deg,#102d57cc,#246bfdcc),url(${full.coverUrl})`}:undefined}><div className="profile-avatar">{full.avatarUrl?<img src={full.avatarUrl} alt=""/>:full.name[0]}</div><div><p className="eyebrow">LEARNER PROFILE</p><h1>{full.name}</h1><p>{full.bio||'Tell the community a little about yourself.'}</p></div></div>
 <form action={save} className="card form-grid"><label>Avatar URL<input name="avatarUrl" defaultValue={full.avatarUrl||''}/></label><label>Cover image URL<input name="coverUrl" defaultValue={full.coverUrl||''}/></label><label>Public profile slug<input name="profileSlug" defaultValue={full.profileSlug||slugify(full.name)}/></label><label className="full">Bio<textarea name="bio" rows={4} defaultValue={full.bio||''}/></label><label className="full">Skills<input name="skills" defaultValue={full.skills||''} placeholder="Streaming, editing, branding"/></label><label>TikTok<input name="tiktok" defaultValue={links.tiktok||''}/></label><label>Instagram<input name="instagram" defaultValue={links.instagram||''}/></label><label>YouTube<input name="youtube" defaultValue={links.youtube||''}/></label><label className="builder-checkbox"><input type="checkbox" name="publicProfile" defaultChecked={full.publicProfile}/> Make profile public</label><button className="primary">Save profile</button></form>
 <div className="stats-grid"><article><strong>{full.certificates.length}</strong><span>Certificates</span></article><article><strong>{full.badges.length}</strong><span>Badges</span></article><article><strong>{full.submissions.length}</strong><span>Approved assignments</span></article></div></Shell>;
}
