const { test } = require('node:test');
const assert = require('node:assert/strict');

// validate is not defined yet — all tests will fail
const { validate } = require('./validate');

test('rejects missing body', () => {
  const result = validate(undefined);
  assert.equal(result.ok, false);
  assert.ok(result.error);
});

test('rejects invalid type', () => {
  const result = validate({ type: 'bogus', notes: 'hi' });
  assert.equal(result.ok, false);
  assert.match(result.error, /type/);
});

test('rejects suggestion with no fields filled', () => {
  const result = validate({ type: 'suggestion' });
  assert.equal(result.ok, false);
  assert.match(result.error, /field/i);
});

test('rejects feedback with no fields filled', () => {
  const result = validate({ type: 'feedback' });
  assert.equal(result.ok, false);
});

test('rejects fields that are only whitespace', () => {
  const result = validate({ type: 'feedback', notes: '   ' });
  assert.equal(result.ok, false);
});

test('accepts valid suggestion with camp_name only', () => {
  const result = validate({ type: 'suggestion', camp_name: 'Cool Camp' });
  assert.deepEqual(result, { ok: true });
});

test('accepts valid suggestion with camp_url only', () => {
  const result = validate({ type: 'suggestion', camp_url: 'https://example.com' });
  assert.deepEqual(result, { ok: true });
});

test('accepts valid feedback with notes', () => {
  const result = validate({ type: 'feedback', notes: 'Great site!' });
  assert.deepEqual(result, { ok: true });
});

test('accepts suggestion with all fields', () => {
  const result = validate({
    type: 'suggestion',
    camp_name: 'Cool Camp',
    camp_url: 'https://example.com',
    notes: 'Great for 5-year-olds',
  });
  assert.deepEqual(result, { ok: true });
});
