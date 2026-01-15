import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { BaSyxClient } from './basyx-client';
import type { Submodel } from '@/types/aas';

const runIntegration = process.env.BASYX_INTEGRATION === '1';

describe.runIf(runIntegration)('BaSyx round-trip', () => {
  const client = new BaSyxClient({
    environmentUrl: process.env.BASYX_ENVIRONMENT_URL || 'http://localhost:4001',
    registryUrl: process.env.BASYX_REGISTRY_URL || 'http://localhost:4000',
  });

  const submodelId = `urn:aas:integration:${Date.now()}`;
  const initialSubmodel: Submodel = {
    modelType: 'Submodel',
    id: submodelId,
    idShort: 'IntegrationTest',
    kind: 'Instance',
    submodelElements: [
      {
        modelType: 'Property',
        idShort: 'SerialNumber',
        valueType: 'xs:string',
        value: 'SN-100',
      },
    ],
  };

  beforeAll(() => {
    const originalFetch = (globalThis as { ___originalFetch?: typeof fetch }).___originalFetch;
    if (!originalFetch) {
      throw new Error('Original fetch not available for integration test');
    }
    global.fetch = originalFetch;
  });

  afterAll(() => {
    global.fetch = vi.fn();
  });

  it('creates, fetches, updates, and deletes a submodel', async () => {
    const created = await client.createSubmodel(initialSubmodel);
    expect(created.id).toBe(submodelId);

    const fetched = await client.getSubmodel(submodelId);
    expect(fetched.idShort).toBe('IntegrationTest');

    const updatedSubmodel = {
      ...fetched,
      submodelElements: [
        {
          modelType: 'Property',
          idShort: 'SerialNumber',
          valueType: 'xs:string',
          value: 'SN-200',
        },
      ],
    } as Submodel;

    const updated = await client.updateSubmodel(updatedSubmodel);
    expect(updated.submodelElements?.[0]).toBeDefined();

    const fetchedAgain = await client.getSubmodel(submodelId);
    const serial = fetchedAgain.submodelElements?.[0] as { value?: string };
    expect(serial.value).toBe('SN-200');

    await client.deleteSubmodel(submodelId);
  });
});
