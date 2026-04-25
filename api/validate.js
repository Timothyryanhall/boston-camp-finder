const VALID_TYPES = ['suggestion', 'feedback'];

function validate(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body is required' };
  }

  const { type, camp_name, camp_url, notes } = body;

  if (!VALID_TYPES.includes(type)) {
    return { ok: false, error: 'type must be "suggestion" or "feedback"' };
  }

  const hasContent = [camp_name, camp_url, notes].some(
    v => typeof v === 'string' && v.trim().length > 0
  );
  if (!hasContent) {
    return { ok: false, error: 'At least one text field is required' };
  }

  return { ok: true };
}

module.exports = { validate };
