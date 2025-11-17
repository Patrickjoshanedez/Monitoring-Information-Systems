const PDFDocument = require('pdfkit');

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
};

const applyBranding = (doc, primary) => {
  const gradient = doc.linearGradient(0, 0, doc.page.width, 0);
  gradient.stop(0, primary || '#4338ca', 0.08);
  gradient.stop(1, '#0f172a', 0.08);
  doc.rect(0, 0, doc.page.width, doc.page.height).fillOpacity(0.05).fill(gradient);
  doc.fillOpacity(1);
};

const safeImage = (doc, base64, x, y, opts = {}) => {
  if (!base64) {
    return;
  }
  try {
    const commaIdx = base64.indexOf(',');
    const raw = commaIdx >= 0 ? base64.slice(commaIdx + 1) : base64;
    const buffer = Buffer.from(raw, 'base64');
    doc.image(buffer, x, y, opts);
  } catch (error) {
    console.error('certificatePdf safeImage error:', error.message);
  }
};

const drawStats = (doc, stats, options = {}) => {
  const { startY = 360, primary = '#4338ca' } = options;
  const entries = stats.filter((item) => Number.isFinite(item.value));
  if (!entries.length) {
    return;
  }
  const boxWidth = (doc.page.width - 120) / entries.length;
  entries.forEach((entry, idx) => {
    const x = 60 + idx * boxWidth;
    doc
      .roundedRect(x, startY, boxWidth - 20, 70, 8)
      .lineWidth(1)
      .strokeColor('#e2e8f0')
      .stroke();
    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor(primary)
      .text(entry.value, x + 12, startY + 12, { width: boxWidth - 44, align: 'left' });
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#475569')
      .text(entry.label, x + 12, startY + 38, { width: boxWidth - 44 });
  });
};

async function generateCertificatePDF({
  certificate,
  mentee,
  mentor,
  metrics = {},
  qrDataUri,
  brand = {},
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (d) => chunks.push(d));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const primary = brand.primary || '#4338ca';
      const accent = brand.accent || '#0ea5e9';
      applyBranding(doc, primary);

      const { width, height } = doc.page;
      doc
        .lineWidth(4)
        .strokeColor(primary)
        .rect(30, 30, width - 60, height - 60)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(32)
        .fillColor('#0f172a')
        .text(`Certificate of ${certificate.certificateType === 'participation' ? 'Participation' : 'Completion'}`, 50, 80, {
          width: width - 100,
          align: 'center',
        });

      doc
        .font('Helvetica')
        .fontSize(12)
        .fillColor('#475569')
        .text('This certifies that', 50, 145, { width: width - 100, align: 'center' });

      doc
        .font('Helvetica-Bold')
        .fontSize(30)
        .fillColor('#020617')
        .text(mentee.fullName, 50, 170, { width: width - 100, align: 'center' });

      doc
        .font('Helvetica')
        .fontSize(14)
        .fillColor('#334155')
        .text('for completing the', 50, 220, { width: width - 100, align: 'center' });

      doc
        .font('Helvetica-Bold')
        .fontSize(22)
        .fillColor(primary)
        .text(certificate.programName, 50, 245, { width: width - 100, align: 'center' });

      if (certificate.statement) {
        doc
          .font('Helvetica')
          .fontSize(12)
          .fillColor('#475569')
          .text(certificate.statement, 80, 285, {
            width: width - 160,
            align: 'center',
          });
      }

      drawStats(
        doc,
        [
          { label: 'Sessions Completed', value: metrics.completedSessions },
          { label: 'Learning Hours', value: metrics.totalHours },
          { label: 'Goals Achieved', value: metrics.goalsCompleted },
        ],
        { primary }
      );

      const signatureY = 460;
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#0f172a')
        .text(mentor.fullName, 80, signatureY, { width: width / 2 - 130, align: 'left' });
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#475569')
        .text(mentor.title || 'Mentor', 80, signatureY + 18);

      const signer = certificate.metadata?.signedBy || 'Program Director';
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#0f172a')
        .text(signer, width / 2 + 10, signatureY, { width: width / 2 - 130, align: 'right' });
      if (certificate.metadata?.signerTitle) {
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#475569')
          .text(certificate.metadata.signerTitle, width / 2 + 10, signatureY + 18, {
            width: width / 2 - 130,
            align: 'right',
          });
      }

      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#0f172a')
        .text(`Issued ${formatDate(certificate.issuedAt)}`, 80, signatureY + 60);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#334155')
        .text(`Serial: ${certificate.serialNumber}`, 80, signatureY + 78);

      if (qrDataUri) {
        safeImage(doc, qrDataUri, width - 160, signatureY - 10, { fit: [80, 80] });
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#475569')
          .text('Scan to verify', width - 170, signatureY + 72, { width: 100, align: 'center' });
      }

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#94a3b8')
        .text('Mentoring System • mentoring.example.com', 50, height - 70, {
          width: width - 100,
          align: 'center',
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateCertificatePDF };
