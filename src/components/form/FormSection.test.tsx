import { renderToStaticMarkup } from 'react-dom/server';
import { FormSection } from './FormSection';
import { expect, test } from 'vitest';

test('FormSection renders title, subtitle, and children', () => {
  const html = renderToStaticMarkup(
    <FormSection title="Root Section" subtitle="Subtitle" collapsible={false}>
      <div>Child Content</div>
    </FormSection>
  );

  expect(html).toContain('Root Section');
  expect(html).toContain('Subtitle');
  expect(html).toContain('Child Content');
});
