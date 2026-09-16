import Dexie, { type Table } from 'dexie';

export interface BubbleROI {
  id: string;
  cx: number;
  cy: number;
  r: number;
  value: string;
  isBox?: boolean;
}

export interface TemplateBlock {
  id: number | string;
  x: number;
  y: number;
  type: string;
  title: string;
  direction?: string;
  cols?: number;
  rows?: number;
  options?: string[];
  prefillValue?: string | string[];
  startNum?: number;
  bubbles?: BubbleROI[];
}

export interface OmrTemplate {
  id: string;
  name: string;
  updatedAt: number;
  blocks: TemplateBlock[];
  autoLayout?: boolean;
}

export interface ScanResult {
  npsn: string;
  id_mapel: string;
  kode_tes: string;
  nisn: string;
  answers: any[];
  scannedAt: number;
}

export interface ScoreResult {
  npsn: string;
  id_mapel: string;
  kode_tes: string;
  nisn: string;
  nilai: number;
  itemScores: { [key: number]: number };
  scoredAt: number;
  isKey?: boolean;
}

export class OMREnterpriseDB extends Dexie {
  templates!: Table<OmrTemplate, string>;
  scanResults!: Table<ScanResult, [string, string, string, string]>;
  scoreResults!: Table<ScoreResult, [string, string, string, string]>;

  constructor() {
    super('OMREnterpriseDB');
    this.version(3).stores({
      templates: 'id, name, updatedAt',
      scanResults: '[npsn+id_mapel+kode_tes+nisn], scannedAt',
      scoreResults: '[npsn+id_mapel+kode_tes+nisn], scoredAt'
    });
  }
}

export const db = new OMREnterpriseDB();
