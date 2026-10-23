import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

export function validateCharacterImages(registry, roster, assetExists = existsSync) {
  const errors = [];
  if (registry?.schemaVersion !== '0.1') errors.push('unsupported image registry version');
  if (!Array.isArray(registry?.images)) return [...errors, 'images must be an array'];
  const known = new Set(roster.characters.map(c => c.id));
  const usedIds = new Set();
  const publishedCharacters = new Set();
  const allowedSourceKinds = ['original-webtoon', 'official-publication', 'user-created', 'other'];
  const allowedReview = ['not-checked', 'indirect', 'direct'];
  const allowedRights = ['unreviewed', 'permission-confirmed', 'not-permitted'];
  for (const [index, image] of registry.images.entries()) {
    const id = `images[${index}]`;
    if (!image || typeof image !== 'object' || Array.isArray(image)) { errors.push(`${id} must be an object`); continue; }
    if (!/^image-[a-z0-9-]+$/.test(image.id ?? '')) errors.push(`${id}.id invalid`);
    if (usedIds.has(image.id)) errors.push(`${id}.id duplicated`);
    usedIds.add(image.id);
    if (!known.has(image.characterId)) errors.push(`${id}.characterId not in roster`);
    if (!allowedSourceKinds.includes(image.sourceKind)) errors.push(`${id}.sourceKind invalid`);
    if (typeof image.sourceReference !== 'string' || !image.sourceReference.trim()) errors.push(`${id}.sourceReference required`);
    if (!(image.workPart === null || [1, 2].includes(image.workPart))) errors.push(`${id}.workPart must be null, 1 or 2`);
    if (!(image.episode === null || (typeof image.episode === 'string' && image.episode.trim()))) errors.push(`${id}.episode must be null or a nonempty string`);
    if (!allowedReview.includes(image.canonReview)) errors.push(`${id}.canonReview invalid`);
    if (!allowedRights.includes(image.rightsStatus)) errors.push(`${id}.rightsStatus invalid`);
    if (typeof image.publish !== 'boolean') errors.push(`${id}.publish must be boolean`);
    if (image.assetPath !== null && !/^assets\/characters\/[A-Za-z0-9/_-]+\.(?:png|jpe?g|webp)$/i.test(image.assetPath ?? '')) errors.push(`${id}.assetPath must be a safe local image path or null`);
    if (image.publish) {
      if (publishedCharacters.has(image.characterId)) errors.push(`${id}: multiple public images for character`);
      publishedCharacters.add(image.characterId);
      if (image.rightsStatus !== 'permission-confirmed') errors.push(`${id}: publication needs confirmed permission`);
      if (typeof image.rightsEvidence !== 'string' || !image.rightsEvidence.trim()) errors.push(`${id}: publication needs rights evidence`);
      if (!image.assetPath || !assetExists(image.assetPath)) errors.push(`${id}: published asset missing`);
      if (typeof image.alt !== 'string' || !image.alt.trim()) errors.push(`${id}: published image needs alt text`);
      if (typeof image.credit !== 'string' || !image.credit.trim()) errors.push(`${id}: published image needs credit`);
    }
  }
  return errors;
}

const roster = JSON.parse(readFileSync('data/roster.v0.1.json', 'utf8'));
const registry = JSON.parse(readFileSync('data/character-images.v0.1.json', 'utf8'));
assert.deepEqual(validateCharacterImages(registry, roster), [], 'image registry invalid');
const testRecord = {
  id: 'image-test', characterId: 'char-033', sourceKind: 'user-created',
  sourceReference: 'test-only', workPart: null, episode: null, canonReview: 'not-checked',
  rightsStatus: 'unreviewed', rightsEvidence: null, publish: false,
  assetPath: null, alt: '', credit: ''
};
const sample = { ...registry, images: [testRecord] };
assert.deepEqual(validateCharacterImages(sample, roster), [], 'unpublished image metadata rejected');
assert.ok(validateCharacterImages({ ...registry, images: [{ ...testRecord, characterId: 'char-999' }] }, roster).some(e => e.includes('characterId')), 'missing character must be rejected');
assert.ok(validateCharacterImages({ ...registry, images: [{ ...testRecord, publish: true }] }, roster).some(e => e.includes('permission')), 'unapproved publishing must be rejected');
assert.ok(validateCharacterImages({ ...registry, images: [{ ...testRecord, assetPath: '../secret.jpg' }] }, roster).some(e => e.includes('assetPath')), 'unsafe paths must be rejected');
console.log('PASS: empty registry, unpublished draft, invalid ID, publication rights gate, safe paths');
