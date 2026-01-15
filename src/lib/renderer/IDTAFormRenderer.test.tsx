// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { IDTAFormRenderer, useField, useFormSubmit, type FormActions, type FormState } from './IDTAFormRenderer';
import type { Submodel } from '@/types/aas';

const submodelWithRequiredAndList: Submodel = {
  modelType: 'Submodel',
  id: 'https://example.org/submodel/test',
  idShort: 'TestSubmodel',
  kind: 'Template',
  submodelElements: [
    {
      modelType: 'Property',
      idShort: 'RequiredField',
      valueType: 'xs:string',
      qualifiers: [
        {
          type: 'SMT/Cardinality',
          valueType: 'xs:string',
          value: 'One',
        },
      ],
    },
    {
      modelType: 'SubmodelElementList',
      idShort: 'Items',
      typeValueListElement: 'Property',
      valueTypeListElement: 'xs:string',
      qualifiers: [
        {
          type: 'SMT/Cardinality',
          valueType: 'xs:string',
          value: 'OneToMany',
        },
      ],
      value: [
        {
          modelType: 'Property',
          idShort: 'Item',
          valueType: 'xs:string',
        },
      ],
    },
  ],
};

function HookProbe() {
  const field = useField(['RequiredField']);
  const submit = useFormSubmit();

  return (
    <div>
      <button onClick={() => field.setValue('ok')}>set</button>
      <button onClick={() => field.setTouched()}>touch</button>
      <button onClick={() => submit.submit()}>submit</button>
      <button onClick={() => submit.reset()}>reset</button>
      <div data-testid="dirty">{String(submit.isDirty)}</div>
      <div data-testid="valid">{String(submit.isValid)}</div>
      <div data-testid="value">{String(field.value ?? '')}</div>
      <div data-testid="touched">{String(!!field.touched)}</div>
    </div>
  );
}

describe('IDTAFormRenderer', () => {
  it('exposes actions and validates required fields', async () => {
    let actions: FormActions | null = null;
    let latestState: FormState | null = null;

    render(
      <IDTAFormRenderer
        submodel={submodelWithRequiredAndList}
        onActionsReady={(next) => {
          actions = next;
        }}
        renderWrapper={({ children, state }) => {
          latestState = state;
          return <div>{children}</div>;
        }}
      />
    );

    await waitFor(() => expect(actions).not.toBeNull());

    act(() => {
      actions!.validate();
    });

    await waitFor(() => {
      expect(latestState?.errors.RequiredField).toBe('This field is required');
    });

    act(() => {
      actions!.setValue(['RequiredField'], 'value');
    });

    await waitFor(() => {
      expect(latestState?.values.RequiredField).toBe('value');
      expect(latestState?.errors.RequiredField).toBeUndefined();
    });

    act(() => {
      actions!.addArrayItem(['Items']);
      actions!.addArrayItem(['Items']);
      actions!.reorderArrayItem(['Items'], 0, 1);
      actions!.removeArrayItem(['Items'], 0);
    });

    await waitFor(() => {
      expect(latestState?.arrayItems.Items?.length).toBe(2);
    });

    act(() => {
      actions!.setError(['RequiredField'], 'Custom error');
      actions!.setTouched(['RequiredField']);
    });

    await waitFor(() => {
      expect(latestState?.errors.RequiredField).toBe('Custom error');
      expect(latestState?.touched.RequiredField).toBe(true);
    });
  });

  it('supports form hooks and submit/reset flows', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const { getByText, getByTestId } = render(
      <IDTAFormRenderer
        submodel={submodelWithRequiredAndList}
        onSubmit={onSubmit}
        renderWrapper={({ children }) => (
          <div>
            {children}
            <HookProbe />
          </div>
        )}
      />
    );

    fireEvent.click(getByText('set'));
    fireEvent.click(getByText('touch'));

    await waitFor(() => {
      expect(getByTestId('value').textContent).toBe('ok');
      expect(getByTestId('touched').textContent).toBe('true');
    });

    fireEvent.click(getByText('submit'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    fireEvent.click(getByText('reset'));

    await waitFor(() => {
      expect(getByTestId('value').textContent).toBe('');
    });
  });
});
