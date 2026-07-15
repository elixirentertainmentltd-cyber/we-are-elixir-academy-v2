import bcrypt from 'bcryptjs';
import { UserStatus, Role } from '@prisma/client';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { jsonError } from '@/lib/http';
const schema=z.object({status:z.nativeEnum(UserStatus).optional(),role:z.nativeEnum(Role).optional(),password:z.string().min(12).optional(),forcePasswordChange:z.boolean().optional()}).refine(v=>Object.keys(v).length>0);
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){const admin=await requireAdmin();try{const data=schema.parse(await req.json());const{id}=await params;if(id===admin.id&&data.role==='LEARNER')return jsonError('You cannot remove your own admin role.',400);const user=await db.user.update({where:{id},data:{status:data.status,role:data.role,forcePasswordChange:data.forcePasswordChange,...(data.password?{passwordHash:await bcrypt.hash(data.password,12)}:{})}});if(data.password)await db.session.deleteMany({where:{userId:id}});return Response.json({user});}catch(e){console.error(e);return jsonError('Unable to update user.',400)}}
