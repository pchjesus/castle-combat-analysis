# Character image registry — isolated draft v0.1

Status: **DRAFT / not connected to the public interface / no images included**.

This is a separate, optional registry keyed by the existing Character IDs. It does **not** modify the 109-character roster or presume the unavailable v2.1 Evidence contract. No original image is uploaded, scraped, linked, or approved by creating this registry.

## Record fields

| Field | Meaning |
| --- | --- |
| `id` | Unique image metadata ID (`image-...`) |
| `characterId` | Existing `data/roster.v0.1.json` Character ID |
| `sourceKind` | `original-webtoon`, `official-publication`, `user-created`, `other` |
| `sourceReference` | Identifiable origin, reference or creator (required even when not published) |
| `workPart`, `episode` | Original part (1/2) and episode; `null` when unknown or inapplicable |
| `canonReview` | `not-checked`, `indirect`, or `direct`: verification of descriptive provenance, not rights |
| `rightsStatus`, `rightsEvidence` | `unreviewed`, `permission-confirmed`, `not-permitted`; supporting record for confirmed permission |
| `publish` | Boolean. `false` means do not render or distribute the image publicly |
| `assetPath` | Optional local `assets/characters/` image path; never a hotlink or traversal path |
| `alt`, `credit` | Accessible description and visible attribution; required if `publish=true` |

## Publication gate

The checker blocks public records without `permission-confirmed`, nonempty `rightsEvidence`, an existing safe local file, alt text, and credit. **This is a metadata preflight, not a legal verification of the permission itself.** A user must review rights and publication separately. A nonprofit fan disclaimer is not a publication license.

Only one image per character may be designated for the future public primary portrait. Multiple **unpublished** metadata candidates may coexist. Absence of an image must continue to show the current character initial placeholder. The same approved asset may later be reused on the roster, detail, and stat views; public UI integration is **not** part of this draft.

## Verification and boundaries

Run `node scripts/check-character-images.mjs` from the repository root, alongside the existing `node scripts/check-mvp.mjs`. This checker includes negative cases for unknown Character ID, unauthorized publishing, and unsafe paths. Before merge, the public renderer and deployment workflow must be reviewed separately. No character images or new score/evidence data are provided in this draft.
