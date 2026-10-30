# Module 1 lab project: Expense Tracker

Completed project for the Module 1 labs (GitHub Copilot and Certification).
It includes the implementations and tests for the exercises in
`Module1_Lab_Manual.docx`. Every lab works on GitHub Copilot Free.

## What is here

| Path | Used in | Purpose |
| --- | --- | --- |
| `expenses.py` | Lab 1.1 | Expense parsing, category totals, largest expense, and monthly summary using Decimal |
| `data/expenses.csv` | Lab 1.1 | 15 sample expenses across Aug to Oct 2026 |
| `.github/copilot-instructions.md` | Labs 1.1 and 1.2 | Project rules for Copilot, including the secrets-folder instruction |
| `tests/` | Lab 1.1 | Smoke test and unit tests for parsing, totals, and monthly summaries |
| `logs/` | Lab 1.2 | Sample log files for the Copilot CLI rename task |
| `tools/rename_logs.py` | Lab 1.2 | Standard-library log renamer with duplicate-date handling and dry run |
| `secrets/config.env` | Lab 1.2 | Fake values used to show how to keep secrets away from Copilot |

## Quick start

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python expenses.py
pytest -q
```

Expected: the script prints totals for 4 categories and all tests pass.

## Monthly summary

`monthly_summary(load_expenses("data/expenses.csv"))` returns category totals
grouped by `YYYY-MM`. Each value is a `Decimal`, and empty input returns `{}`.

## Rename the sample logs

Preview the operations before changing any files:

```bash
python tools/rename_logs.py --dry-run
```

The preview skips `notes.log` and assigns `app-2026-10-02-2.log` to the
second log with that date. Once the planned names look right, run
`python tools/rename_logs.py` to perform the renames. The script will not
overwrite an existing destination.

The instructions file is guidance for Copilot, not a security boundary.
Keep real secrets out of the repository and never use the sample fake values
as credentials.
