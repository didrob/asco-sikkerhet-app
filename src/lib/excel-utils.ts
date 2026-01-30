import * as XLSX from 'xlsx';

export interface ImportUser {
  email: string;
  fullName: string;
  department?: string;
  jobTitle?: string;
  isValid: boolean;
  error?: string;
}

/**
 * Validates an email address
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Parses an Excel file and extracts user data
 * @param file - The uploaded Excel file
 * @returns Array of parsed users with validation status
 */
export async function parseExcelFile(file: File): Promise<ImportUser[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, {
          header: ['email', 'fullName', 'department', 'jobTitle'],
          range: 1, // Skip header row
        });
        
        // Parse and validate each row
        const users: ImportUser[] = jsonData
          .filter((row) => row.email || row.fullName) // Skip completely empty rows
          .map((row, index) => {
            const email = (row.email || '').trim().toLowerCase();
            const fullName = (row.fullName || '').trim();
            const department = (row.department || '').trim();
            const jobTitle = (row.jobTitle || '').trim();
            
            // Validation
            let isValid = true;
            let error: string | undefined;
            
            if (!email) {
              isValid = false;
              error = 'E-post mangler';
            } else if (!isValidEmail(email)) {
              isValid = false;
              error = 'Ugyldig e-postformat';
            } else if (!fullName) {
              isValid = false;
              error = 'Navn mangler';
            }
            
            return {
              email,
              fullName,
              department: department || undefined,
              jobTitle: jobTitle || undefined,
              isValid,
              error,
            };
          });
        
        resolve(users);
      } catch (error) {
        reject(new Error('Kunne ikke lese Excel-filen. Sjekk at formatet er riktig.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Kunne ikke lese filen'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generates an Excel template for bulk user import
 * @returns Blob containing the Excel file
 */
export function generateExcelTemplate(): Blob {
  // Create sample data
  const templateData = [
    { 'E-post': 'ola.nordmann@firma.no', 'Fullt navn': 'Ola Nordmann', 'Avdeling': 'HMS', 'Stillingstittel': 'Sikkerhetsleder' },
    { 'E-post': 'kari.hansen@firma.no', 'Fullt navn': 'Kari Hansen', 'Avdeling': 'Drift', 'Stillingstittel': 'Driftstekniker' },
  ];
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 30 }, // E-post
    { wch: 25 }, // Fullt navn
    { wch: 20 }, // Avdeling
    { wch: 25 }, // Stillingstittel
  ];
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Brukere');
  
  // Generate buffer
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Downloads the Excel template
 */
export function downloadExcelTemplate(): void {
  const blob = generateExcelTemplate();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'brukerimport_mal.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
