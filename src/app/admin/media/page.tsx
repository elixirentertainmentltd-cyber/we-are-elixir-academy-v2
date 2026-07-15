import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';
import { mediaKind, removeUpload, saveUpload } from '@/lib/media';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  const user = await requireAdmin();
  async function upload(formData: FormData) {
    'use server';
    const admin = await requireAdmin();
    const file = formData.get('file');
    if (!(file instanceof File)) return;
    const saved = await saveUpload(file);
    const asset = await db.mediaAsset.create({ data: {
      name: String(formData.get('name') || file.name), originalName: file.name, url: saved.url,
      mimeType: file.type, sizeBytes: file.size, kind: mediaKind(file.type),
      folder: String(formData.get('folder') || 'General'), uploadedById: admin.id,
    }});
    await audit(admin.id, 'UPLOAD', 'MediaAsset', asset.id, { name: asset.name });
    revalidatePath('/admin/media');
  }
  async function remove(formData: FormData) {
    'use server';
    const admin = await requireAdmin();
    const id = String(formData.get('id') || '');
    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (!asset) return;
    await removeUpload(asset.url);
    await db.mediaAsset.delete({ where: { id } });
    await audit(admin.id, 'DELETE', 'MediaAsset', id, { name: asset.name });
    revalidatePath('/admin/media');
  }
  const assets = await db.mediaAsset.findMany({ orderBy: { createdAt: 'desc' } });
  return <Shell user={user}>
    <div className="page-title"><p className="eyebrow">ADMIN</p><h1>Media library</h1><p>Upload reusable images, PDFs, videos and documents.</p></div>
    <form action={upload} className="card form-grid"><label>Name<input name="name" /></label><label>Folder<input name="folder" defaultValue="General" /></label><label className="full">File<input name="file" type="file" required /></label><button className="primary">Upload media</button></form>
    <div className="media-grid">{assets.map(asset => <article className="card" key={asset.id}>{asset.kind === 'IMAGE' ? <img src={asset.url} alt="" className="media-preview" /> : <div className="media-file">{asset.kind}</div>}<h3>{asset.name}</h3><p>{asset.folder} · {(asset.sizeBytes/1024/1024).toFixed(2)} MB</p><a href={asset.url} target="_blank">Open</a><form action={remove}><input type="hidden" name="id" value={asset.id}/><button className="ghost danger-text">Delete</button></form></article>)}</div>
  </Shell>;
}
