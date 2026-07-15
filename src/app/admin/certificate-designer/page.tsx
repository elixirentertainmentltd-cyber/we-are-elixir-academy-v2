import { requireAdmin } from '@/lib/auth';
import { getCertificateDesign } from '@/lib/certificate-design';
import { Shell } from '@/components/shell';
import { CertificateDesigner } from '@/components/certificate-designer';

export default async function CertificateDesignerPage() {
  const user = await requireAdmin();
  const design = await getCertificateDesign();
  return (
    <Shell user={user}>
      <div className="page-title">
        <p className="eyebrow">ADMIN</p>
        <h1>Certificate Designer</h1>
        <p>Upload the official artwork, drag each field into place, and save one layout for both the website and PDF.</p>
      </div>
      <CertificateDesigner initialDesign={design} />
    </Shell>
  );
}
