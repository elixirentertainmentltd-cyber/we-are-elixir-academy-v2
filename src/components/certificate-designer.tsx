'use client';

import { ChangeEvent, PointerEvent, useMemo, useRef, useState } from 'react';
import { Save, Upload, RotateCcw } from 'lucide-react';
import type {
  CertificateDesign,
  CertificateField,
  CertificateFieldKey,
} from '@/lib/certificate-design';
import { CertificateView } from '@/components/certificate-view';

const labels: Record<CertificateFieldKey, string> = {
  learnerName: 'Learner name',
  courseTitle: 'Course title',
  date: 'Completion date',
  signature: 'Ryan Evans signature',
  certificateNumber: 'Certificate number',
  verificationUrl: 'Verification URL',
};

const previewData = {
  learnerName: 'Academy Admin',
  courseTitle: 'Welcome to We Are Elixir',
  date: '15 July 2026',
  signature: 'Ryan Evans',
  certificateNumber: 'CERTIFICATE NO. WAE-2026-000001',
  verificationUrl: 'academy.weareelixir.co.uk/verify/WAE-2026-000001',
};

async function fileToDataUrl(file: File) {
  if (file.size > 8 * 1024 * 1024) throw new Error('Images must be 8 MB or smaller.');
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Unable to read image.'));
    reader.readAsDataURL(file);
  });
}

export function CertificateDesigner({ initialDesign }: { initialDesign: CertificateDesign }) {
  const [design, setDesign] = useState(initialDesign);
  const [selected, setSelected] = useState<CertificateFieldKey>('learnerName');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const selectedField = design.layout[selected];
  const fieldKeys = useMemo(() => Object.keys(labels) as CertificateFieldKey[], []);

  function updateField(patch: Partial<CertificateField>) {
    setDesign((current) => ({
      ...current,
      layout: {
        ...current.layout,
        [selected]: { ...current.layout[selected], ...patch },
      },
    }));
  }

  function pointerDown(event: PointerEvent<HTMLButtonElement>, key: CertificateFieldKey) {
    setSelected(key);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const field = design.layout[key];
    dragOffset.current = {
      x: event.clientX - (rect.left + (field.x / 100) * rect.width),
      y: event.clientY - (rect.top + (field.y / 100) * rect.height),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent<HTMLButtonElement>, key: CertificateFieldKey) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((event.clientX - dragOffset.current.x - rect.left) / rect.width) * 100;
    const y = ((event.clientY - dragOffset.current.y - rect.top) / rect.height) * 100;
    setDesign((current) => ({
      ...current,
      layout: {
        ...current.layout,
        [key]: {
          ...current.layout[key],
          x: Math.max(0, Math.min(100, Number(x.toFixed(2)))),
          y: Math.max(0, Math.min(100, Number(y.toFixed(2)))),
        },
      },
    }));
  }

  async function upload(event: ChangeEvent<HTMLInputElement>, target: 'backgroundData' | 'signatureData') {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const value = await fileToDataUrl(file);
      setDesign((current) => ({ ...current, [target]: value }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload image.');
    }
    event.target.value = '';
  }

  async function save() {
    setSaving(true);
    setError('');
    setNotice('');
    const response = await fetch('/api/admin/certificate-design', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(design),
    });
    const body = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(body.error || 'Unable to save certificate design.');
      return;
    }
    setNotice('Certificate design saved. Website certificates and PDFs will use this layout.');
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 330px', gap: 20, alignItems: 'start' }}>
      <section className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <label className="primary" style={{ cursor: 'pointer' }}>
            <Upload size={18} /> Upload background
            <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => upload(event, 'backgroundData')} />
          </label>
          <label className="ghost" style={{ cursor: 'pointer' }}>
            <Upload size={18} /> Upload Ryan signature
            <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => upload(event, 'signatureData')} />
          </label>
          <button className="ghost" onClick={() => setDesign(initialDesign)}><RotateCcw size={18} /> Reset unsaved changes</button>
        </div>

        <div ref={canvasRef} style={{ position: 'relative', border: '1px solid #dce6f2', borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 50px rgba(16,45,87,.12)' }}>
          <CertificateView design={design} data={previewData} />
          {fieldKeys.map((key) => {
            const field = design.layout[key];
            return (
              <button
                key={key}
                type="button"
                onPointerDown={(event) => pointerDown(event, key)}
                onPointerMove={(event) => pointerMove(event, key)}
                onClick={() => setSelected(key)}
                title={`Drag ${labels[key]}`}
                style={{
                  position: 'absolute',
                  left: `${field.x}%`,
                  top: `${field.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${Math.max(8, field.width)}%`,
                  height: 34,
                  border: selected === key ? '2px solid #246bfd' : '1px dashed rgba(36,107,253,.8)',
                  background: selected === key ? 'rgba(36,107,253,.12)' : 'rgba(255,255,255,.03)',
                  borderRadius: 7,
                  cursor: 'grab',
                  touchAction: 'none',
                }}
              />
            );
          })}
        </div>
        <p className="muted">Drag the outlined fields directly on the certificate. Select a field to fine-tune it in the panel.</p>
      </section>

      <aside className="card" style={{ padding: 18, position: 'sticky', top: 96 }}>
        <h2 style={{ marginTop: 0 }}>Field settings</h2>
        <label>Field<select value={selected} onChange={(event) => setSelected(event.target.value as CertificateFieldKey)}>{fieldKeys.map((key) => <option key={key} value={key}>{labels[key]}</option>)}</select></label>
        <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
          <label>Horizontal position<input type="number" min="0" max="100" step="0.1" value={selectedField.x} onChange={(event) => updateField({ x: Number(event.target.value) })} /></label>
          <label>Vertical position<input type="number" min="0" max="100" step="0.1" value={selectedField.y} onChange={(event) => updateField({ y: Number(event.target.value) })} /></label>
          <label>Field width<input type="number" min="5" max="100" step="1" value={selectedField.width} onChange={(event) => updateField({ width: Number(event.target.value) })} /></label>
          <label>Font size<input type="number" min="6" max="100" step="1" value={selectedField.fontSize} onChange={(event) => updateField({ fontSize: Number(event.target.value) })} /></label>
          <label>Text colour<input type="color" value={selectedField.colour} onChange={(event) => updateField({ colour: event.target.value })} /></label>
          <label>Font<select value={selectedField.font} onChange={(event) => updateField({ font: event.target.value as CertificateField['font'] })}><option value="sans">Clean sans</option><option value="serif">Classic serif</option><option value="script">Signature script</option></select></label>
          <label>Alignment<select value={selectedField.align} onChange={(event) => updateField({ align: event.target.value as CertificateField['align'] })}><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select></label>
        </div>
        {error && <p className="error">{error}</p>}
        {notice && <p style={{ background: '#dcfae8', color: '#087443', padding: 12, borderRadius: 10 }}>{notice}</p>}
        <button className="primary" style={{ width: '100%', marginTop: 16 }} disabled={saving} onClick={save}><Save size={18} /> {saving ? 'Saving…' : 'Save certificate design'}</button>
      </aside>
    </div>
  );
}
