import { 
  Document, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  Packer,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { ASCO_TEAL_HEX } from './logo-base64';

interface ContentBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
}

interface ProcedureData {
  title: string;
  description?: string;
  category?: string;
  version?: string;
  documentNumber?: string;
  reviewDate?: string;
  approvedBy?: string;
  approvedAt?: string;
  tags?: string[];
  contentBlocks: ContentBlock[];
  attachments?: { file_name: string }[];
}

export async function exportToWord(procedure: ProcedureData): Promise<void> {
  const children: (Paragraph | Table)[] = [];

  // Header with ASCO branding
  children.push(
    new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: '●  ASCO Prosedyrehub',
                      size: 28,
                      bold: true,
                      color: 'FFFFFF',
                    }),
                  ],
                }),
              ],
              shading: { type: ShadingType.SOLID, color: ASCO_TEAL_HEX },
              width: { size: 70, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: procedure.category?.toUpperCase() || 'PROSEDYRE',
                      size: 20,
                      bold: true,
                      color: 'FFFFFF',
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                }),
              ],
              shading: { type: ShadingType.SOLID, color: ASCO_TEAL_HEX },
              width: { size: 30, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            }),
          ],
        }),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  );
  
  children.push(new Paragraph({ spacing: { after: 200 } }));

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: procedure.title,
          size: 48,
          bold: true,
        }),
      ],
      heading: HeadingLevel.TITLE,
      spacing: { after: 100 },
    })
  );

  // Metadata line
  const metaParts = [
    procedure.version && `Versjon ${procedure.version}`,
    procedure.documentNumber && `Dok.nr: ${procedure.documentNumber}`,
  ].filter(Boolean);

  if (metaParts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: metaParts.join(' | '),
            size: 20,
            color: '6B7280',
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // Approval info box
  if (procedure.approvedBy || procedure.approvedAt || procedure.reviewDate) {
    const infoRows: TableRow[] = [];
    
    if (procedure.approvedBy) {
      infoRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Godkjent av:', bold: true, size: 18 })] })],
              width: { size: 25, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: 'F5F5F5' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: procedure.approvedBy, size: 18 })] })],
              width: { size: 75, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: 'F5F5F5' },
            }),
          ],
        })
      );
    }
    
    if (procedure.approvedAt) {
      const formattedDate = format(new Date(procedure.approvedAt), 'd. MMMM yyyy', { locale: nb });
      infoRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Godkjent dato:', bold: true, size: 18 })] })],
              shading: { type: ShadingType.SOLID, color: 'F5F5F5' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: formattedDate, size: 18 })] })],
              shading: { type: ShadingType.SOLID, color: 'F5F5F5' },
            }),
          ],
        })
      );
    }
    
    if (procedure.reviewDate) {
      const formattedReview = format(new Date(procedure.reviewDate), 'd. MMMM yyyy', { locale: nb });
      infoRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Neste revisjon:', bold: true, size: 18 })] })],
              shading: { type: ShadingType.SOLID, color: 'F5F5F5' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: formattedReview, size: 18 })] })],
              shading: { type: ShadingType.SOLID, color: 'F5F5F5' },
            }),
          ],
        })
      );
    }

    if (infoRows.length > 0) {
      children.push(
        new Table({
          rows: infoRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
            left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
            right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
          },
        })
      );
      children.push(new Paragraph({ spacing: { after: 200 } }));
    }
  }

  // Description
  if (procedure.description) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: procedure.description,
            italics: true,
            color: '6B7280',
          }),
        ],
        spacing: { after: 300 },
      })
    );
  }

  // Content blocks
  let headingCounter = 0;

  for (const block of procedure.contentBlocks) {
    switch (block.type) {
      case 'heading': {
        headingCounter++;
        const headingText = (block.content as { text?: string }).text || '';
        const level = (block.content as { level?: number }).level || 2;
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${headingCounter}. ${headingText}`,
                bold: true,
                size: level === 1 ? 32 : level === 2 ? 28 : 24,
              }),
            ],
            heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
            spacing: { before: 300, after: 100 },
          })
        );
        break;
      }

      case 'text': {
        const textContent = (block.content as { text?: string }).text || '';
        if (textContent) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: textContent, size: 22 })],
              spacing: { after: 150 },
            })
          );
        }
        break;
      }

      case 'warning': {
        const warningText = (block.content as { text?: string }).text || '';
        if (warningText) {
          children.push(
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: '⚠ VIKTIG', bold: true, color: 'B45309' }),
                          ],
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({ text: warningText, color: '92400E' }),
                          ],
                        }),
                      ],
                      shading: { type: ShadingType.SOLID, color: 'FEF3C7' },
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 8, color: 'F59E0B' },
                        bottom: { style: BorderStyle.SINGLE, size: 8, color: 'F59E0B' },
                        left: { style: BorderStyle.SINGLE, size: 8, color: 'F59E0B' },
                        right: { style: BorderStyle.SINGLE, size: 8, color: 'F59E0B' },
                      },
                    }),
                  ],
                }),
              ],
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
          );
          children.push(new Paragraph({ spacing: { after: 150 } }));
        }
        break;
      }

      case 'list': {
        const items = (block.content as { items?: string[] }).items || [];
        items.forEach((item) => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: item, size: 22 })],
              bullet: { level: 0 },
              spacing: { after: 50 },
            })
          );
        });
        children.push(new Paragraph({ spacing: { after: 100 } }));
        break;
      }

      case 'image': {
        const imageAlt = (block.content as { alt?: string }).alt;
        if (imageAlt) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `[Bilde: ${imageAlt}]`,
                  italics: true,
                  color: '9CA3AF',
                }),
              ],
              spacing: { after: 100 },
            })
          );
        }
        break;
      }

      case 'video': {
        const videoTitle = (block.content as { title?: string }).title;
        if (videoTitle) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `[Video: ${videoTitle}]`,
                  italics: true,
                  color: '9CA3AF',
                }),
              ],
              spacing: { after: 100 },
            })
          );
        }
        break;
      }
    }
  }

  // Attachments section
  if (procedure.attachments && procedure.attachments.length > 0) {
    children.push(new Paragraph({ spacing: { before: 400 } }));
    
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'VEDLEGG',
            bold: true,
            size: 28,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 100 },
      })
    );

    procedure.attachments.forEach((att) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: att.file_name, size: 22 })],
          bullet: { level: 0 },
          spacing: { after: 50 },
        })
      );
    });
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: procedure.title,
                    size: 16,
                    color: '9CA3AF',
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'ASCO Prosedyrehub',
                    size: 16,
                    color: ASCO_TEAL_HEX,
                    bold: true,
                  }),
                  new TextRun({
                    text: '    |    ',
                    size: 16,
                    color: '9CA3AF',
                  }),
                  new TextRun({
                    text: format(new Date(), 'd. MMMM yyyy', { locale: nb }),
                    size: 16,
                    color: '9CA3AF',
                  }),
                  new TextRun({
                    text: '    |    Side ',
                    size: 16,
                    color: '9CA3AF',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: '9CA3AF',
                  }),
                  new TextRun({
                    text: ' av ',
                    size: 16,
                    color: '9CA3AF',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: '9CA3AF',
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children,
      },
    ],
    numbering: {
      config: [
        {
          reference: 'my-bullet-points',
          levels: [
            {
              level: 0,
              format: NumberFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  const filename = `${procedure.documentNumber || procedure.title.replace(/\s+/g, '_')}_v${procedure.version || '1.0'}.docx`;
  saveAs(blob, filename);
}
