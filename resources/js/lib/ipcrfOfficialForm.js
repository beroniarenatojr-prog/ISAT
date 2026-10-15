import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Palette from the official RPMS / IPCRF Part 1 form
const GREEN = [198, 224, 180];       // header + label fill
const GREEN_DARK = [169, 208, 142];  // title bar
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

// ISAT logo painted faintly behind every page
const WATERMARK_SRC = '/pictures/isat.tmp';
const WATERMARK_OPACITY = 0.08;

// Load an image without ever rejecting - a missing logo must not break the PDF
const loadImage = (src, timeout = 4000) =>
    new Promise((resolve) => {
        if (typeof Image === 'undefined') {
            resolve(null);
            return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const timer = setTimeout(() => resolve(null), timeout);
        img.onload = () => {
            clearTimeout(timer);
            resolve(img);
        };
        img.onerror = () => {
            clearTimeout(timer);
            resolve(null);
        };
        img.src = src;
    });

// Draw the logo centred and faint on the current page, behind whatever is drawn next
const drawWatermark = (doc, img) => {
    if (!img) return;
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const size = Math.min(pw, ph) * 0.6;
    const x = (pw - size) / 2;
    const y = (ph - size) / 2;
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: WATERMARK_OPACITY }));
    // Reuse a single embedded copy across every page via the fixed alias
    doc.addImage(img, 'PNG', x, y, size, size, 'isat-watermark', 'NONE');
    doc.restoreGraphicsState();
};

const adjectival = (rating) => {
    const r = Number(rating) || 0;
    if (r >= 4.5) return 'Outstanding';
    if (r >= 3.5) return 'Very Satisfactory';
    if (r >= 2.5) return 'Satisfactory';
    if (r >= 1.5) return 'Unsatisfactory';
    if (r > 0) return 'Poor';
    return '';
};

// The standard boilerplate that fills every Performance Indicator cell
const indicatorText = (level) =>
    `Demonstrated Level ${level} in the PPST Indicator as shown in the COT rating sheet / interobserver agreement form`;

const blackCell = (content = '') => ({
    content,
    styles: { fillColor: BLACK, textColor: BLACK, lineColor: BLACK },
});

const label = (content) => ({
    content,
    styles: { fontStyle: 'bold', fillColor: GREEN },
});

const value = (content, extra = {}) => ({
    content: content ?? '',
    styles: { fillColor: WHITE, ...extra },
});

/**
 * Generate the official "PART 1: INDIVIDUAL PERFORMANCE COMMITMENT AND REVIEW FORM"
 * as a PDF and trigger a download.
 *
 * @param {Object}   opts
 * @param {Object}   opts.employee   { name, position, division }
 * @param {Object}   opts.rater      { name, position }
 * @param {string}   opts.ratingPeriod   e.g. "2025-2026"
 * @param {string|Date} opts.dateOfReview
 * @param {Array}    opts.kraGroups  [{ domain, weightPerKra, objectives: [{ description, weight, rating }] }]
 * @param {number}   opts.numericalRating  overall final rating (optional)
 * @param {string}   opts.fileName
 */
export async function generateIpcrfOfficialForm({
    employee = {},
    rater = {},
    ratingPeriod = '',
    dateOfReview = new Date(),
    kraGroups = [],
    numericalRating = null,
    fileName = 'IPCRF_Part1.pdf',
}) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'legal' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 8;
    const reviewDate = dateOfReview instanceof Date
        ? dateOfReview.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : String(dateOfReview || '');

    // Fetch the watermark up front so every page can reuse the same bitmap.
    // Track which pages already have it so multi-table pages are stamped once.
    const watermark = await loadImage(WATERMARK_SRC);
    const stampedPages = new Set();
    const stampWatermark = (pageNumber) => {
        if (!watermark || stampedPages.has(pageNumber)) return;
        drawWatermark(doc, watermark);
        stampedPages.add(pageNumber);
    };
    // Page 1 is stamped before any content so the logo sits behind the title bar
    stampWatermark(1);

    // ---- Title bar ----
    doc.setFillColor(...GREEN_DARK);
    doc.rect(margin, 10, pageWidth - margin * 2, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('PART 1: INDIVIDUAL PERFORMANCE COMMITMENT AND REVIEW FORM', pageWidth / 2, 15.5, { align: 'center' });

    // ---- Employee / rater information block ----
    autoTable(doc, {
        startY: 20,
        margin: { left: margin, right: margin },
        theme: 'grid',
        willDrawPage: (data) => stampWatermark(data.pageNumber),
        styles: { fontSize: 8, cellPadding: 1.6, lineColor: BLACK, lineWidth: 0.1, valign: 'middle' },
        body: [
            [label('Name of Employee:'), value(employee.name, { fontStyle: 'bold' }),
             label('Name of Rater:'), value(rater.name, { fontStyle: 'bold' })],
            [label('Position:'), value(employee.position || ''),
             label('Position:'), value(rater.position || '')],
            [label('Bureau/Center/Service/Division:'), value(employee.division || ''),
             label('Date of Review:'), value(reviewDate)],
            [label('Rating Period:'), { content: `SY ${ratingPeriod}`, colSpan: 3, styles: { fillColor: WHITE, fontStyle: 'bold' } }],
        ],
        columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: (pageWidth - margin * 2) / 2 - 55 },
            2: { cellWidth: 45 },
            3: { cellWidth: (pageWidth - margin * 2) / 2 - 45 },
        },
    });

    // ---- Main evaluation table ----
    const head = [
        [
            { content: 'Domains', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: GREEN } },
            { content: 'Objectives', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: GREEN } },
            { content: 'Timeline', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: GREEN } },
            { content: 'Weight\nper KRA', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: GREEN } },
            { content: 'QET', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: GREEN } },
            { content: 'Performance Indicators', colSpan: 5, styles: { halign: 'center', fillColor: GREEN } },
            { content: 'Actual Results', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: GREEN } },
            { content: 'Rating', colSpan: 4, styles: { halign: 'center', fillColor: GREEN } },
        ],
        [
            { content: 'Outstanding\n5', styles: { halign: 'center', fillColor: GREEN } },
            { content: 'Very\nSatisfactory\n4', styles: { halign: 'center', fillColor: GREEN } },
            { content: 'Satisfactory\n3', styles: { halign: 'center', fillColor: GREEN } },
            { content: 'Unsatisfactory\n2', styles: { halign: 'center', fillColor: GREEN } },
            { content: 'Poor\n1', styles: { halign: 'center', fillColor: GREEN } },
            { content: 'Q', styles: { halign: 'center', fillColor: GREEN } },
            { content: 'E', styles: { halign: 'center', fillColor: GREEN } },
            { content: 'T', styles: { halign: 'center', fillColor: GREEN } },
            { content: 'Ave', styles: { halign: 'center', fillColor: GREEN } },
        ],
    ];

    const body = [];
    let objectiveNo = 0;

    kraGroups.forEach((group) => {
        const objectives = group.objectives || [];
        if (objectives.length === 0) return;
        const kraRowSpan = objectives.length * 3;

        objectives.forEach((obj, objIndex) => {
            objectiveNo += 1;
            const rating = Number(obj.rating) || 0;
            const weight = obj.weight != null && obj.weight !== ''
                ? `${Number(obj.weight).toFixed(3)}%`
                : (group.weightPerKra || '6.786%');

            // ---- Row 1: Quality ----
            const qualityRow = [];
            if (objIndex === 0) {
                qualityRow.push({
                    content: group.domain || '',
                    rowSpan: kraRowSpan,
                    styles: { valign: 'middle', fillColor: WHITE, fontStyle: 'bold' },
                });
            }
            qualityRow.push({
                content: `${objectiveNo}. ${obj.description || ''}`,
                rowSpan: 3,
                styles: { valign: 'top', fillColor: WHITE },
            });
            qualityRow.push({
                content: `SY ${ratingPeriod}`,
                rowSpan: 3,
                styles: { valign: 'middle', halign: 'center', fillColor: WHITE },
            });
            if (objIndex === 0) {
                qualityRow.push({
                    content: weight,
                    rowSpan: kraRowSpan,
                    styles: { valign: 'middle', halign: 'center', fillColor: WHITE },
                });
            }
            qualityRow.push({ content: 'Quality', styles: { fillColor: WHITE, fontStyle: 'bold' } });
            qualityRow.push(value(indicatorText(6)));
            qualityRow.push(value(indicatorText(5)));
            qualityRow.push(value(indicatorText(4)));
            qualityRow.push(value(indicatorText(3)));
            qualityRow.push(value(indicatorText(2)));
            qualityRow.push({
                content: rating ? indicatorText(Math.min(rating + 1, 6)) : '',
                rowSpan: 3,
                styles: { valign: 'top', fillColor: WHITE },
            });
            qualityRow.push({ content: rating ? String(rating) : '', styles: { halign: 'center', fillColor: WHITE } });
            qualityRow.push({ ...blackCell(), rowSpan: 3 }); // E
            qualityRow.push({ ...blackCell(), rowSpan: 3 }); // T
            qualityRow.push({
                content: rating ? rating.toFixed(3) : '',
                rowSpan: 3,
                styles: { halign: 'center', valign: 'middle', fillColor: WHITE, fontStyle: 'bold' },
            });
            body.push(qualityRow);

            // ---- Row 2: Efficiency ----
            body.push([
                { content: 'Efficiency', styles: { fillColor: WHITE, fontStyle: 'bold' } },
                blackCell(), blackCell(), blackCell(), blackCell(), blackCell(),
                blackCell(), // Q
            ]);

            // ---- Row 3: Timeliness ----
            body.push([
                { content: 'Timeliness', styles: { fillColor: WHITE, fontStyle: 'bold' } },
                blackCell(), blackCell(), blackCell(), blackCell(), blackCell(),
                blackCell(), // Q
            ]);
        });
    });

    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 2,
        margin: { left: margin, right: margin },
        head,
        body,
        theme: 'grid',
        willDrawPage: (data) => stampWatermark(data.pageNumber),
        styles: { fontSize: 6, cellPadding: 1, lineColor: BLACK, lineWidth: 0.1, overflow: 'linebreak' },
        headStyles: { fillColor: GREEN, textColor: BLACK, fontStyle: 'bold', lineColor: BLACK, halign: 'center' },
        columnStyles: {
            0: { cellWidth: 24 },   // Domains
            1: { cellWidth: 40 },   // Objectives
            2: { cellWidth: 15 },   // Timeline
            3: { cellWidth: 14 },   // Weight per KRA
            4: { cellWidth: 16 },   // QET
            5: { cellWidth: 31 },   // Outstanding
            6: { cellWidth: 31 },   // Very Satisfactory
            7: { cellWidth: 31 },   // Satisfactory
            8: { cellWidth: 31 },   // Unsatisfactory
            9: { cellWidth: 28 },   // Poor
            10: { cellWidth: 33 },  // Actual Results
            11: { cellWidth: 7 },   // Q
            12: { cellWidth: 7 },   // E
            13: { cellWidth: 7 },   // T
            14: { cellWidth: 10 },  // Ave
        },
    });

    // ---- Final rating summary ----
    const finalRating = numericalRating != null
        ? Number(numericalRating)
        : (() => {
            const all = kraGroups.flatMap((g) => g.objectives || []).map((o) => Number(o.rating) || 0).filter(Boolean);
            return all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0;
        })();

    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 3,
        margin: { left: margin, right: margin },
        theme: 'grid',
        willDrawPage: (data) => stampWatermark(data.pageNumber),
        styles: { fontSize: 8, cellPadding: 1.8, lineColor: BLACK, lineWidth: 0.1 },
        body: [
            [label('Final Numerical Rating'), value(finalRating ? finalRating.toFixed(3) : '', { halign: 'center', fontStyle: 'bold' }),
             label('Adjectival Rating'), value(adjectival(finalRating), { fontStyle: 'bold' })],
        ],
        columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 40 }, 2: { cellWidth: 45 } },
    });

    // ---- Signatures ----
    let y = doc.lastAutoTable.finalY + 16;
    const colW = (pageWidth - margin * 2) / 2;
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, y, margin + colW - 12, y);
    doc.line(margin + colW, y, margin + colW * 2 - 12, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text((rater.name || 'Rater').toUpperCase(), margin, y + 4);
    doc.text('APPROVING AUTHORITY', margin + colW, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Rater', margin, y + 8);
    doc.text('Signature over printed name', margin + colW, y + 8);

    doc.save(fileName);
}
