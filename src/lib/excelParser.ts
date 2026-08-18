import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DataRow, DynamicFieldDef } from '../types';

export interface ParsedExcelResult {
  fileName: string;
  columns: string[];
  rows: DataRow[];
  totalRows: number;
}

export function smartDetectNameColumn(columns: string[], rows: DataRow[] = []): string {
  if (!columns || columns.length === 0) return 'Name';

  const normalizedCandidates = [
    'name',
    'names',
    'recipient name',
    'recipient_name',
    'recipientname',
    'recipient',
    'participant name',
    'participant_name',
    'participantname',
    'participant',
    'student name',
    'student_name',
    'studentname',
    'student',
    'full name',
    'fullname',
    'full_name',
    'candidate name',
    'candidate_name',
    'candidatename',
    'candidate',
    'member name',
    'member_name',
    'person name',
    'person',
    'first name',
    'firstname',
    'last name',
    'lastname',
    'display name',
    'winner name',
    'holder name',
  ];

  // 1. Exact candidate match (normalized)
  for (const candidate of normalizedCandidates) {
    const found = columns.find(
      (col) => col.toLowerCase().trim().replace(/[^a-z0-9]/g, '') === candidate.replace(/[^a-z0-9]/g, '')
    );
    if (found) return found;
  }

  // 2. Partial word match on column names
  const partialKeywords = ['name', 'recipient', 'participant', 'student', 'candidate', 'person', 'member'];
  for (const kw of partialKeywords) {
    const found = columns.find((col) => col.toLowerCase().includes(kw));
    if (found) return found;
  }

  // 3. Row value content inspection heuristic if header isn't obvious
  if (rows.length > 0) {
    let bestCol = columns[0];
    let maxNameScore = -1;

    for (const col of columns) {
      let nameLikeCount = 0;
      const samples = rows.slice(0, 15);
      for (const row of samples) {
        const val = String(row[col] || '').trim();
        // Skip purely numeric IDs or numbers like 1, 2, 10023 or dates
        if (val && !/^\d+$/.test(val) && !/^\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}$/.test(val)) {
          // Names usually contain alphabets, spaces, dots
          if (/^[A-Za-z\s\.\-']{2,60}$/.test(val)) {
            nameLikeCount++;
          }
        }
      }

      if (nameLikeCount > maxNameScore) {
        maxNameScore = nameLikeCount;
        bestCol = col;
      }
    }

    if (maxNameScore > 0) {
      return bestCol;
    }
  }

  // 4. Default fallback: First non-numeric header
  const nonNumCol = columns.find((col) => !/^(id|sno|s\.no|#|sl|slno|index)$/i.test(col.trim()));
  return nonNumCol || columns[0] || 'Name';
}

export function parseExcelFile(file: File): Promise<ParsedExcelResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse sheet to array of objects
        const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          throw new Error('The uploaded file contains no data rows.');
        }

        // Get unique columns
        const columnsSet = new Set<string>();
        rawJson.forEach((row) => {
          Object.keys(row).forEach((col) => {
            if (!col.startsWith('__EMPTY')) {
              columnsSet.add(col.trim());
            }
          });
        });

        const columns = Array.from(columnsSet);

        // Convert to DataRow format with unique _rowId, filter out completely empty rows
        const validRows: DataRow[] = [];
        rawJson.forEach((row, idx) => {
          const rowObj: DataRow = { _rowId: `row_${Date.now()}_${idx}` };
          let hasValue = false;
          columns.forEach((col) => {
            const val = String(row[col] ?? '').trim();
            rowObj[col] = val;
            if (val) hasValue = true;
          });
          if (hasValue) {
            validRows.push(rowObj);
          }
        });

        if (validRows.length === 0) {
          throw new Error('The uploaded file contains no valid data rows.');
        }

        resolve({
          fileName: file.name,
          columns,
          rows: validRows,
          totalRows: validRows.length,
        });
      } catch (err: any) {
        reject(new Error(err.message || 'Failed to read spreadsheet file. Please ensure it is a valid .xlsx or .csv.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('File reading failed. Please try again.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

// Download a ready-to-use sample Excel template with columns
export function downloadSampleExcelTemplate(
  customColumns: string[] = ['Name', 'Event', 'Category', 'Date', 'Position', 'Department']
): void {
  const sampleData = [
    {
      Name: 'John Doe',
      Event: 'Cyber Security Workshop 2026',
      Category: 'Participant',
      Date: '11 August 2026',
      Position: '1st Place Winner',
      Department: 'Computer Science',
    },
    {
      Name: 'Arun Kumar',
      Event: 'Cyber Security Workshop 2026',
      Category: 'Participant',
      Date: '11 August 2026',
      Position: 'Runner Up',
      Department: 'Information Technology',
    },
    {
      Name: 'Priya',
      Event: 'Cyber Security Workshop 2026',
      Category: 'Participant',
      Date: '11 August 2026',
      Position: 'Special Mention',
      Department: 'Cyber Security',
    },
    {
      Name: 'Karthik',
      Event: 'Cyber Security Workshop 2026',
      Category: 'Volunteer',
      Date: '11 August 2026',
      Position: 'Lead Volunteer',
      Department: 'Event Management',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');

  // Buffer to Blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  saveAs(blob, 'BSROCKS_SeventhSense_Participants_Template.xlsx');
}

// Automatically map dynamic field keys (e.g., 'NAME') to dataset columns (e.g., 'Name', 'Full Name')
export function autoDetectColumnMapping(
  dynamicFields: DynamicFieldDef[],
  columns: string[]
): Record<string, string> {
  const mapping: Record<string, string> = {};

  const cleanColMap = new Map<string, string>();
  columns.forEach((col) => {
    const normalized = col.toLowerCase().replace(/[^a-z0-9]/g, '');
    cleanColMap.set(normalized, col);
  });

  dynamicFields.forEach((field) => {
    const keyNorm = field.key.toLowerCase().replace(/[^a-z0-9]/g, '');
    const labelNorm = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Direct match on key or label
    if (cleanColMap.has(keyNorm)) {
      mapping[field.key] = cleanColMap.get(keyNorm)!;
    } else if (cleanColMap.has(labelNorm)) {
      mapping[field.key] = cleanColMap.get(labelNorm)!;
    } else {
      // 2. Substring fuzzy match
      const matchedCol = columns.find((col) => {
        const cLower = col.toLowerCase();
        return (
          cLower.includes(field.key.toLowerCase()) ||
          field.key.toLowerCase().includes(cLower) ||
          cLower.includes(field.label.toLowerCase())
        );
      });

      if (matchedCol) {
        mapping[field.key] = matchedCol;
      } else {
        mapping[field.key] = ''; // Unmapped
      }
    }
  });

  return mapping;
}
