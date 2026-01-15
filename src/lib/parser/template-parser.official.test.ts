/**
 * Official template parsing tests (IDTA)
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseSubmodelTemplate } from './template-parser';
import { extractSubmodel, validateEnvironment } from './template-fetcher';
import type { Environment } from '@/types/aas';

const fixtureDir = path.resolve(__dirname, '../../test/fixtures/templates');

const fixtures = [
  'digital-nameplate-02006-2-0.json',
  'contact-information-02002-1-0.json',
  'technical-data-02003-1-2.json',
  'handover-documentation-02004-1-2.json',
  'carbon-footprint-02023-1-0.json',
];

describe('official IDTA templates', () => {
  for (const filename of fixtures) {
    it(`parses ${filename}`, () => {
      const filePath = path.join(fixtureDir, filename);
      const raw = fs.readFileSync(filePath, 'utf8');
      const env = JSON.parse(raw) as Environment;

      expect(validateEnvironment(env)).toBe(true);

      const submodel = extractSubmodel(env);
      const parsed = parseSubmodelTemplate(submodel);

      expect(parsed.metadata.idShort).toBeTruthy();
      expect(parsed.elements.length).toBeGreaterThan(0);
    });
  }
});
