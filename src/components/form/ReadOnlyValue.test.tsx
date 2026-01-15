import { renderToStaticMarkup } from 'react-dom/server';
import { ReadOnlyValue } from './ReadOnlyValue';
import { expect, test } from 'vitest';

test('ReadOnlyValue renders label and default text', () => {
  const html = renderToStaticMarkup(
    <ReadOnlyValue idShort="Op1" path={['Op1']} />
  );

  expect(html).toContain('Op1');
  expect(html).toContain('Read-only');
});
