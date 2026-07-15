import type { CSSProperties } from 'react';
import type { CertificateDesign, CertificateField } from '@/lib/certificate-design';

export type CertificatePreviewData = {
  learnerName: string;
  courseTitle: string;
  date: string;
  signature: string;
  certificateNumber: string;
  verificationUrl: string;
};

function fieldStyle(field: CertificateField): CSSProperties {
  const translateX = field.align === 'center' ? '-50%' : field.align === 'right' ? '-100%' : '0';
  return {
    position: 'absolute',
    left: `${field.x}%`,
    top: `${field.y}%`,
    width: `${field.width}%`,
    transform: `translate(${translateX}, -50%)`,
    textAlign: field.align,
    fontSize: `clamp(8px, ${field.fontSize / 14}vw, ${field.fontSize}px)`,
    color: field.colour,
    fontFamily: field.font === 'script' ? 'Georgia, Times New Roman, serif' : field.font === 'serif' ? 'Georgia, serif' : 'Arial, Helvetica, sans-serif',
    fontStyle: field.font === 'script' ? 'italic' : 'normal',
    fontWeight: field.font === 'sans' ? 800 : 600,
    lineHeight: 1.05,
    overflowWrap: 'anywhere',
    pointerEvents: 'none',
  };
}

export function CertificateView({ design, data, className = '' }: { design: CertificateDesign; data: CertificatePreviewData; className?: string }) {
  const background = design.backgroundData || '/certificates/elixir-academy-certificate.png';
  return (
    <div className={className} style={{ position: 'relative', width: '100%', aspectRatio: '1.414 / 1', overflow: 'hidden', background: '#fff' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={background} alt="Certificate template" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
      <div style={fieldStyle(design.layout.learnerName)}>{data.learnerName}</div>
      <div style={fieldStyle(design.layout.courseTitle)}>{data.courseTitle}</div>
      <div style={fieldStyle(design.layout.date)}>{data.date}</div>
      <div style={fieldStyle(design.layout.signature)}>
        {design.signatureData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={design.signatureData} alt="Ryan Evans signature" style={{ width: '100%', maxHeight: 70, objectFit: 'contain' }} />
        ) : data.signature}
      </div>
      <div style={fieldStyle(design.layout.certificateNumber)}>{data.certificateNumber}</div>
      <div style={fieldStyle(design.layout.verificationUrl)}>{data.verificationUrl}</div>
    </div>
  );
}
