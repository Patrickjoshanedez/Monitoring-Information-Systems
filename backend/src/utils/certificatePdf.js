const PDFDocument = require('pdfkit');

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
};

const drawBorders = (doc, palette) => {
  const { width, height } = doc.page;

  // Outer dark frame
  doc
    .save()
    .lineWidth(12)
    .strokeColor(palette.frame)
    .rect(15, 15, width - 30, height - 30)
    .stroke()
    .restore();

  // Inner gold border
  doc
    .save()
    .lineWidth(3)
    .strokeColor(palette.accent)
    .rect(35, 35, width - 70, height - 70)
    .stroke()
    .restore();

  // Corner ornaments
  const ornament = (x, y, flipX = false, flipY = false) => {
    const offsetX = flipX ? -1 : 1;
    const offsetY = flipY ? -1 : 1;
    doc
      .save()
      .lineWidth(2)
      .strokeColor(palette.accent)
      .moveTo(x, y)
      .lineTo(x + 30 * offsetX, y)
      .moveTo(x, y)
      .lineTo(x, y + 30 * offsetY)
      .moveTo(x + 10 * offsetX, y)
      .lineTo(x + 10 * offsetX, y + 20 * offsetY)
      .moveTo(x, y + 10 * offsetY)
      .lineTo(x + 20 * offsetX, y + 10 * offsetY)
      .stroke()
      .restore();
  };

  ornament(55, 55, false, false);
  ornament(width - 55, 55, true, false);
  ornament(55, height - 55, false, true);
  ornament(width - 55, height - 55, true, true);
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
  const { startY = 420, accent = '#b5852b' } = options;
  const entries = stats.filter((item) => Number.isFinite(item.value));
  if (!entries.length) {
    return;
  }
  const boxWidth = (doc.page.width - 120) / entries.length;
  entries.forEach((entry, idx) => {
    const x = 60 + idx * boxWidth;
    doc
      .roundedRect(x, startY, boxWidth - 30, 80, 10)
      .lineWidth(1)
      .strokeColor('#d5c4a1')
      .stroke();
    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor(accent)
      .text(entry.value, x + 15, startY + 15, { width: boxWidth - 60, align: 'center' });
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#4b3f2f')
      .text(entry.label, x + 15, startY + 45, { width: boxWidth - 60, align: 'center' });
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

      const palette = {
        background: '#fdf7ec',
        frame: '#1f1b24',
        accent: brand.accent || '#b5852b',
        heading: '#2b2113',
      };

      const { width, height } = doc.page;

      doc.rect(0, 0, width, height).fill('#16141a');
      doc.rect(25, 25, width - 50, height - 50).fill(palette.background);

      drawBorders(doc, palette);

      doc
        .font('Times-Bold')
        .fontSize(40)
        .fillColor(palette.heading)
        .text(`Certificate of ${certificate.certificateType === 'participation' ? 'Participation' : 'Completion'}`, 50, 90, {
          width: width - 100,
          align: 'center',
        });

      doc
        .font('Helvetica-Oblique')
        .fontSize(14)
        .fillColor('#6b5c47')
        .text('is proudly presented to', 50, 150, { width: width - 100, align: 'center' });

      doc
        .font('Times-Bold')
        .fontSize(34)
        .fillColor(palette.heading)
        .text(mentee.fullName, 50, 180, { width: width - 100, align: 'center' });

      doc
        .font('Helvetica')
        .fontSize(14)
        .fillColor('#4b3f2f')
        .text('for completing the', 50, 230, { width: width - 100, align: 'center' });

      doc
        .font('Times-Bold')
        .fontSize(24)
        .fillColor(palette.accent)
        .text(certificate.programName, 50, 260, { width: width - 100, align: 'center' });

      if (certificate.statement) {
        doc
          .font('Helvetica')
          .fontSize(12)
          .fillColor('#4b3f2f')
          .text(certificate.statement, 80, 305, {
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
        { accent: palette.accent }
      );

      const signatureY = 520;
      doc
        .moveTo(90, signatureY)
        .lineTo(width / 2 - 20, signatureY)
        .lineWidth(1)
        .strokeColor('#c8b695')
        .stroke();
      doc
        .moveTo(width / 2 + 20, signatureY)
        .lineTo(width - 90, signatureY)
        .lineWidth(1)
        .strokeColor('#c8b695')
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor(palette.heading)
        .text(mentor.fullName, 90, signatureY + 8, { width: width / 2 - 130, align: 'left' });
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#6b5c47')
        .text(mentor.title || 'Mentor', 80, signatureY + 18);

      const signer = certificate.metadata?.signedBy || 'Program Director';
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor(palette.heading)
        .text(signer, width / 2 + 20, signatureY + 8, { width: width / 2 - 130, align: 'right' });
      if (certificate.metadata?.signerTitle) {
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#6b5c47')
          .text(certificate.metadata.signerTitle, width / 2 + 20, signatureY + 18, {
            width: width / 2 - 130,
            align: 'right',
          });
      }

      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor(palette.heading)
        .text(`Issued ${formatDate(certificate.issuedAt)}`, 90, signatureY + 55);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#4b3f2f')
        .text(`Serial: ${certificate.serialNumber}`, 90, signatureY + 72);

      if (qrDataUri) {
        safeImage(doc, qrDataUri, width - 150, signatureY - 10, { fit: [80, 80] });
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#6b5c47')
          .text('Scan to verify', width - 160, signatureY + 72, { width: 100, align: 'center' });
      }

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#a1865a')
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
