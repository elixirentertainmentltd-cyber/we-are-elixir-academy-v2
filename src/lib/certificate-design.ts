import { db } from '@/lib/db';

export type CertificateFieldKey =
  | 'learnerName'
  | 'courseTitle'
  | 'date'
  | 'signature'
  | 'certificateNumber'
  | 'verificationUrl';

export type CertificateField = {
  x: number;
  y: number;
  fontSize: number;
  colour: string;
  font: 'serif' | 'sans' | 'script';
  width: number;
  align: 'left' | 'center' | 'right';
};

export type CertificateLayout = Record<CertificateFieldKey, CertificateField>;

export type CertificateDesign = {
  backgroundData: string | null;
  signatureData: string | null;
  layout: CertificateLayout;
};

export const defaultCertificateLayout: CertificateLayout = {
  learnerName: { x: 50, y: 43, fontSize: 48, colour: '#4338ca', font: 'script', width: 58, align: 'center' },
  courseTitle: { x: 50, y: 59, fontSize: 27, colour: '#1d4ed8', font: 'sans', width: 58, align: 'center' },
  date: { x: 24, y: 82, fontSize: 16, colour: '#111827', font: 'sans', width: 20, align: 'center' },
  signature: { x: 75, y: 80, fontSize: 27, colour: '#111827', font: 'script', width: 23, align: 'center' },
  certificateNumber: { x: 50, y: 94.5, fontSize: 10, colour: '#111827', font: 'sans', width: 45, align: 'center' },
  verificationUrl: { x: 50, y: 97.2, fontSize: 8, colour: '#3730a3', font: 'sans', width: 68, align: 'center' },
};

type DesignRow = {
  backgroundData: string | null;
  signatureData: string | null;
  layoutJson: string;
};

export async function ensureCertificateDesignTable() {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS CertificateDesign (
      id VARCHAR(32) NOT NULL PRIMARY KEY,
      backgroundData LONGTEXT NULL,
      signatureData LONGTEXT NULL,
      layoutJson LONGTEXT NOT NULL,
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    )
  `);
}

export async function getCertificateDesign(): Promise<CertificateDesign> {
  await ensureCertificateDesignTable();
  const rows = await db.$queryRawUnsafe<DesignRow[]>(
    'SELECT backgroundData, signatureData, layoutJson FROM CertificateDesign WHERE id = ? LIMIT 1',
    'default',
  );
  const row = rows[0];
  if (!row) {
    return { backgroundData: null, signatureData: null, layout: defaultCertificateLayout };
  }

  try {
    return {
      backgroundData: row.backgroundData,
      signatureData: row.signatureData,
      layout: { ...defaultCertificateLayout, ...JSON.parse(row.layoutJson) },
    };
  } catch {
    return { backgroundData: row.backgroundData, signatureData: row.signatureData, layout: defaultCertificateLayout };
  }
}

export async function saveCertificateDesign(design: CertificateDesign) {
  await ensureCertificateDesignTable();
  await db.$executeRawUnsafe(
    `INSERT INTO CertificateDesign (id, backgroundData, signatureData, layoutJson)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       backgroundData = VALUES(backgroundData),
       signatureData = VALUES(signatureData),
       layoutJson = VALUES(layoutJson),
       updatedAt = CURRENT_TIMESTAMP(3)`,
    'default',
    design.backgroundData,
    design.signatureData,
    JSON.stringify(design.layout),
  );
  return design;
}
