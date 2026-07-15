export const jsonError=(message:string,status=400)=>Response.json({error:message},{status});
