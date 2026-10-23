# CASTLE v2.1 DRAFT — Local Contract Check

This package tests a proposed, non-authoritative data fixture without changing any GitHub repository.

- `CASTLE_DATA_CONTRACT_READINESS_v2.1_DRAFT.md`: design review / gate summary (Korean).
- `castle_contract_fixture_v2.1_DRAFT.json`: example records drawn from local prior drafts.
- `castle_fixture_schema_v2.1_DRAFT.json`: **fixture-only** JSON Schema (not the future app schema).
- `view_models_preview_v2.1_DRAFT.json`: non-interactive UI read models.
- `verify_contract.py`: local static validation and deliberate-invalid-input checks.
- `local_validation_result_v2.1.json`: exact result of the last local run.
- `build_fixture.py`, `write_schema.py`, `build_view_preview.py`: reproducible generation from prior files.

## Quick check

Python 3 and `jsonschema` required.

```bash
python verify_contract.py
```

The earlier local DRAFT JSON inputs are included in `source_drafts/`. Regenerate with `python build_fixture.py`, then `python write_schema.py`, `python build_view_preview.py`, and `python verify_contract.py`. These are prior AI draft records, **not canon-verified original scenes**.

## Limitations

No original-scene review, production migration, browser implementation, site deployment, or remote repository mutation was performed. The 109 legacy character IDs are a checked index of current GitHub `main`, not a full copy of the roster. No numeric Evaluation scores or ranked records were created.
