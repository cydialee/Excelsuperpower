// ===== API Client for Excelsuperpower =====
// Communicates with the Python backend at http://127.0.0.1:4173

const API_BASE = '/api';

// ===== Types =====

export interface SheetInfo {
  name: string;
  range: string;
  autoRange: string;
  printRange: string;
  rangeSource: 'excel' | 'auto' | 'manual';
  hasNativePrintArea: boolean;
  nativePrintArea: string;
  rows: number;
  columns: number;
  preview: string[][];
  grid?: GridData;
  issues: Issue[];
  recommendedOrientation: 'landscape' | 'portrait';
  hidden: boolean;
  mergedRegions: MergedRegion[];
}

export interface GridData {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  cells: CellData[][];
  mergedRegions: MergedRegion[];
  formulaWarnings: FormulaWarning[];
  truncated: boolean;
}

export interface CellData {
  row: number;
  col: number;
  ref: string;
  display: string;
  formula: string;
  missingCachedValue: boolean;
  isMerged: boolean;
  isMergeAnchor: boolean;
  rowSpan: number;
  colSpan: number;
  hiddenByMerge: boolean;
}

export interface MergedRegion {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  label: string;
}

export interface FormulaWarning {
  cell: string;
  message: string;
}

export interface Issue {
  id: string;
  label: string;
}

export interface PlanConfig {
  id: string;
  name: string;
  description: string;
  orientation: 'landscape' | 'portrait';
  fitMode: 'fitColumns' | 'singlePage' | 'fitRows';
  fitToWidth: number;
  fitToHeight: number;
  repeatHeader: boolean;
  freezeTopRow: boolean;
  margin: 'normal' | 'compact';
  beautify: boolean;
  showGridLines: boolean;
  wrapLongText: boolean;
  wrapTextColumns: string;
}

export interface UploadResponse {
  workbookId: string;
  filename: string;
  sheetCount: number;
  sheets: SheetInfo[];
  plans: PlanConfig[];
}

export interface PrintTarget {
  sheet: string;
  range?: string;
  rangeSource?: 'excel' | 'auto' | 'manual';
  plan?: Partial<PlanConfig>;
}

export interface PageData {
  number: number;
  rowRange: string;
  columnRange: string;
  rows: string[][];
  hasRepeatedHeader: boolean;
}

export interface PreviewSheetData {
  name: string;
  range: string;
  plan: PlanConfig;
  rows: number;
  columns: number;
  header: string[];
  pages: PageData[];
  optimizedPageCount: number;
  originalPageCount: number;
  rangeAdjustedByMerges: string[];
  formulaWarnings: FormulaWarning[];
}

export interface PreviewResponse {
  workbookId: string;
  preview: {
    plan: PlanConfig;
    hasMixedPlans: boolean;
    selectedSheetCount: number;
    originalPageCount: number;
    optimizedPageCount: number;
    sheets: PreviewSheetData[];
  };
}

export interface DownloadItem {
  type: 'xlsx' | 'xlsm' | 'pdf';
  label: string;
  url: string;
}

export interface OptimizeResponse {
  workbookId: string;
  plan: PlanConfig;
  preview: {
    plan: PlanConfig;
    selectedSheetCount: number;
    originalPageCount: number;
    optimizedPageCount: number;
    sheets: PreviewSheetData[];
  };
  workbook: {
    filename: string;
    sheetCount: number;
    sheets: SheetInfo[];
  };
  downloads: DownloadItem[];
  warnings: string[];
}

export interface ApiError {
  error: string;
}

// ===== API Functions =====

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

/** Upload an Excel file - uses multipart form data */
export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error || `Upload failed with status ${res.status}`);
  }

  return data as UploadResponse;
}

/** Get a print preview for selected sheets */
export async function getPreview(
  workbookId: string,
  targets: PrintTarget[],
  plan?: string
): Promise<PreviewResponse> {
  return apiFetch<PreviewResponse>('/preview-plan', {
    method: 'POST',
    body: JSON.stringify({
      workbookId,
      printTargets: targets,
      plan: plan || 'fit-columns',
    }),
  });
}

/** Generate optimized Excel and PDF */
export async function submitOptimize(
  workbookId: string,
  targets: PrintTarget[],
  plan: string,
  outputs: string[] = ['pdf', 'xlsx']
): Promise<OptimizeResponse> {
  return apiFetch<OptimizeResponse>('/optimize', {
    method: 'POST',
    body: JSON.stringify({
      workbookId,
      printTargets: targets,
      plan,
      outputs,
    }),
  });
}

/** Get download URL for a generated file */
export function getDownloadUrl(relativeUrl: string): string {
  return relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
}

/** Check if backend is available */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}
