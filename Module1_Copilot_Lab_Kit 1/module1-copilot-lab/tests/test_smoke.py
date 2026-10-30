"""Smoke test only: confirms the starter project runs.

Lab 1.1 adds the real tests in tests/test_expenses.py using Copilot.
"""
from pathlib import Path

from expenses import load_expenses

DATA = Path(__file__).resolve().parent.parent / "data" / "expenses.csv"


def test_sample_data_loads() -> None:
    """Confirm the bundled sample expenses load successfully."""
    assert len(load_expenses(DATA)) == 15
