const PDFDocument = require('pdfkit');

const drawCenteredText = (doc, text, y, options = {}) => {
  const { size = 24, color = '#111827', font = 'Times-Roman' } = options;
  doc
    .fillColor(color)
    .font(font)
    .fontSize(size);
  const pageWidth = doc.page.width;
  const textWidth = doc.widthOfString(text);
  const x = (pageWidth - textWidth) / 2;
  doc.text(text, x, y, { lineBreak: false });
};

// Generates a simple certificate PDF Buffer
async function generateCertificatePDF({
  fullName,
  mentorName,
  programName,
  certificateType = 'completion',
  dateIssued = new Date(),
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (d) => chunks.push(d));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Border
      const { width, height } = doc.page;
      doc.rect(20, 20, width - 40, height - 40).stroke('#4F46E5');
      doc.rect(30, 30, width - 60, height - 60).stroke('#C7D2FE');

      drawCenteredText(doc, 'Certificate of ' + (certificateType === 'participation' ? 'Participation' : 'Completion'), 120, {
        size: 34,
        color: '#111827',
      });

      drawCenteredText(doc, 'This certifies that', 180, { size: 14, color: '#6B7280' });
      drawCenteredText(doc, fullName, 210, { size: 28, color: '#111827' });

      drawCenteredText(doc, 'has successfully completed', 260, { size: 14, color: '#6B7280' });
      drawCenteredText(doc, programName, 290, { size: 22, color: '#111827' });

      drawCenteredText(doc, `Mentor: ${mentorName}`, 340, { size: 14, color: '#374151' });
      drawCenteredText(doc, `Date: ${new Date(dateIssued).toLocaleDateString()}`, 365, { size: 12, color: '#374151' });

      // Signature line
      doc.moveTo(140, 440).lineTo(width - 140, 440).stroke('#9CA3AF');
      drawCenteredText(doc, 'Authorized Signature', 450, { size: 12, color: '#6B7280' });

      // Footer
      drawCenteredText(doc, 'Mentoring System', height - 80, { size: 10, color: '#6B7280' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateCertificatePDF };
