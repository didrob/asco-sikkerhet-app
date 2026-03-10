/**
 * Document Parser Utilities
 * Extracts metadata from filenames and handles document processing
 */

export interface ParsedDocumentMetadata {
  title: string;
  documentNumber?: string;
  category?: string;
  version?: string;
  suggestedTags: string[];
}

/**
 * Common patterns found in industrial/safety document filenames:
 * - "HMS-001 - Brannrutiner v1.0.pdf"
 * - "SOP_Kran_Operasjoner_2024.docx"
 * - "PRO-HMS-003_Sikkerhetsregler.pdf"
 * - "Prosedyre - Løfteoperasjoner v2.1.pdf"
 */
export function parseDocumentFilename(filename: string): ParsedDocumentMetadata {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.(pdf|docx?|xlsx?)$/i, '');
  
  // Common category prefixes
  const categoryPatterns: Record<string, string> = {
    'HMS': 'HMS',
    'SOP': 'SOP',
    'PRO': 'Prosedyre',
    'BRANN': 'Brann',
    'LØFT': 'Løfting',
    'KRAN': 'Kran',
    'SIKKERHET': 'Sikkerhet',
    'VEDLIKEHOLD': 'Vedlikehold',
    'KVALITET': 'Kvalitet',
    'MILJØ': 'Miljø',
  };

  let title = nameWithoutExt;
  let documentNumber: string | undefined;
  let category: string | undefined;
  let version: string | undefined;
  const suggestedTags: string[] = [];

  // Extract document number (e.g., "HMS-001", "PRO-HMS-003", "SOP_001")
  const docNumberMatch = nameWithoutExt.match(/^([A-Z]{2,5}[-_]?(?:[A-Z]{2,5}[-_])?(?:\d{2,4}))/i);
  if (docNumberMatch) {
    documentNumber = docNumberMatch[1].replace(/_/g, '-').toUpperCase();
    title = title.replace(docNumberMatch[0], '').trim();
  }

  // Extract version (e.g., "v1.0", "v2.1", "versjon 3")
  const versionMatch = nameWithoutExt.match(/v(?:ersjon)?[\s_-]?(\d+(?:\.\d+)?)/i);
  if (versionMatch) {
    version = versionMatch[1];
    title = title.replace(versionMatch[0], '').trim();
  }

  // Find category from prefixes
  for (const [prefix, cat] of Object.entries(categoryPatterns)) {
    if (nameWithoutExt.toUpperCase().includes(prefix)) {
      category = cat;
      suggestedTags.push(cat.toLowerCase());
      break;
    }
  }

  // Clean up title
  title = title
    .replace(/^[-_\s]+|[-_\s]+$/g, '') // Trim separators
    .replace(/[-_]+/g, ' ')             // Replace separators with spaces
    .replace(/\s+/g, ' ')               // Normalize spaces
    .trim();

  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  // Extract additional tags from keywords in filename
  const keywords = ['sikkerhet', 'brann', 'løft', 'kran', 'vedlikehold', 'nødstopp', 'evakuering'];
  keywords.forEach(keyword => {
    if (nameWithoutExt.toLowerCase().includes(keyword) && !suggestedTags.includes(keyword)) {
      suggestedTags.push(keyword);
    }
  });

  return {
    title: title || 'Uten tittel',
    documentNumber,
    category,
    version: version || '1.0',
    suggestedTags,
  };
}

/**
 * Get file type from extension
 */
export function getFileType(filename: string): 'pdf' | 'word' | 'excel' | 'unknown' {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (ext === 'pdf') return 'pdf';
  if (ext === 'doc' || ext === 'docx') return 'word';
  if (ext === 'xls' || ext === 'xlsx') return 'excel';
  
  return 'unknown';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Validate if file is an accepted document type
 */
export function isValidDocumentType(file: File): boolean {
  const acceptedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  
  return acceptedTypes.includes(file.type);
}

/**
 * Get file icon name based on type
 */
export function getFileIconName(filename: string): string {
  const type = getFileType(filename);
  
  switch (type) {
    case 'pdf': return 'FileText';
    case 'word': return 'FileText';
    case 'excel': return 'Sheet';
    default: return 'File';
  }
}
