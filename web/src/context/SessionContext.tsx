// ===== Global Session Context =====
import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { SheetInfo, PlanConfig, DownloadItem } from '@/api/client';
import { DEFAULT_PRINT_SETTINGS } from '@/lib/plans';

export interface PrintSettings {
  paper: string;
  orientation: 'landscape' | 'portrait';
  fitMode: 'fitColumns' | 'singlePage' | 'fitRows';
  fitToWidth: number;
  fitToHeight: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
  marginPreset: string;
  margin: 'normal' | 'compact';
  repeatHeader: boolean;
  freezeTopRow: boolean;
  beautify: boolean;
  showGridLines: boolean;
  centerHorizontally: boolean;
  centerVertically: boolean;
  wrapLongText: boolean;
  wrapTextColumns: string;
}

export interface SessionState {
  workbookId: string | null;
  filename: string | null;
  mode: 'backend' | 'demo' | null;
  sheets: SheetInfo[];
  selectedSheetIds: string[];
  currentPlanId: string;
  settings: PrintSettings;
  jobResult: {
    downloads: DownloadItem[];
    warnings: string[];
    planName: string;
    sheetCount: number;
  } | null;
  isBackendOnline: boolean;
}

const initialState: SessionState = {
  workbookId: null,
  filename: null,
  mode: null,
  sheets: [],
  selectedSheetIds: [],
  currentPlanId: 'fit-columns',
  settings: { ...DEFAULT_PRINT_SETTINGS },
  jobResult: null,
  isBackendOnline: false,
};

type SessionAction =
  | { type: 'SET_WORKBOOK'; payload: { workbookId: string; filename: string; sheets: SheetInfo[]; mode: 'backend' | 'demo' } }
  | { type: 'TOGGLE_SHEET'; payload: string }
  | { type: 'SET_SHEET_RANGE'; payload: { sheetId: string; range: string } }
  | { type: 'RESET_SHEET_RANGE'; payload: string }
  | { type: 'SET_PLAN'; payload: string }
  | { type: 'APPLY_PLAN_TO_SHEET'; payload: { sheetId: string; planId: string } }
  | { type: 'APPLY_PLAN_TO_ALL'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<PrintSettings> }
  | { type: 'SET_JOB_RESULT'; payload: SessionState['jobResult'] }
  | { type: 'SET_BACKEND_ONLINE'; payload: boolean }
  | { type: 'RESET' };

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_WORKBOOK':
      return {
        ...state,
        ...action.payload,
        sheets: action.payload.sheets,
        selectedSheetIds: action.payload.sheets.map((s) => s.name),
        currentPlanId: 'fit-columns',
        jobResult: null,
      };

    case 'TOGGLE_SHEET': {
      const sid = action.payload;
      const exists = state.selectedSheetIds.includes(sid);
      return {
        ...state,
        selectedSheetIds: exists
          ? state.selectedSheetIds.filter((id) => id !== sid)
          : [...state.selectedSheetIds, sid],
      };
    }

    case 'SET_SHEET_RANGE':
      return {
        ...state,
        sheets: state.sheets.map((s) =>
          s.name === action.payload.sheetId
            ? { ...s, printRange: action.payload.range, rangeSource: 'manual' as const }
            : s
        ),
      };

    case 'RESET_SHEET_RANGE':
      return {
        ...state,
        sheets: state.sheets.map((s) =>
          s.name === action.payload
            ? { ...s, printRange: s.autoRange, rangeSource: 'auto' as const }
            : s
        ),
      };

    case 'SET_PLAN':
      return { ...state, currentPlanId: action.payload };

    case 'APPLY_PLAN_TO_SHEET':
      // Plan application per sheet is handled via the settings page
      return state;

    case 'APPLY_PLAN_TO_ALL':
      return { ...state, currentPlanId: action.payload };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'SET_JOB_RESULT':
      return { ...state, jobResult: action.payload };

    case 'SET_BACKEND_ONLINE':
      return { ...state, isBackendOnline: action.payload };

    case 'RESET':
      return { ...initialState, isBackendOnline: state.isBackendOnline };

    default:
      return state;
  }
}

const SessionContext = createContext<{
  state: SessionState;
  dispatch: Dispatch<SessionAction>;
} | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
