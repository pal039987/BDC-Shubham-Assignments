from datetime import date
from decimal import Decimal
from pathlib import Path

import pytest

from expenses import (
    Expense,
    largest_expense,
    load_expenses,
    monthly_summary,
    parse_amount,
    total_by_category,
)

DATA = Path(__file__).resolve().parent.parent / "data" / "expenses.csv"


def make_expense(
    expense_date: date, category: str, amount: str, note: str = ""
) -> Expense:
    """Build an expense record for tests.

    Args:
        expense_date: Date on which the expense occurred.
        category: Expense category.
        amount: Amount text to parse as a Decimal.
        note: Optional description of the expense.

    Returns:
        A fully populated expense record.
    """
    return {
        "date": expense_date,
        "category": category,
        "amount": parse_amount(amount),
        "note": note,
    }


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("₹1,200.50", Decimal("1200.50")),
        ("Rs. 640.00", Decimal("640.00")),
        ("25", Decimal("25.00")),
    ],
)
def test_parse_amount_accepts_supported_formats(text: str, expected: Decimal) -> None:
    assert parse_amount(text) == expected


@pytest.mark.parametrize("text", ["", "   "])
def test_parse_amount_rejects_empty_text(text: str) -> None:
    with pytest.raises(ValueError, match="empty"):
        parse_amount(text)


@pytest.mark.parametrize("text", ["-1.00", "not a number", "NaN", "Infinity"])
def test_parse_amount_rejects_invalid_values(text: str) -> None:
    with pytest.raises(ValueError):
        parse_amount(text)


def test_load_expenses_reads_sample_data() -> None:
    expenses = load_expenses(DATA)

    assert len(expenses) == 15
    assert all(isinstance(expense["amount"], Decimal) for expense in expenses)


def test_total_by_category_uses_decimal_totals() -> None:
    expenses = [
        make_expense(date(2026, 8, 2), "food", "450.00"),
        make_expense(date(2026, 8, 19), "food", "₹320.50"),
        make_expense(date(2026, 8, 11), "software", "999.00"),
    ]

    assert total_by_category(expenses) == {
        "food": Decimal("770.50"),
        "software": Decimal("999.00"),
    }


def test_largest_expense_returns_none_for_empty_input() -> None:
    assert largest_expense([]) is None


def test_largest_expense_returns_highest_amount() -> None:
    expenses = [
        make_expense(date(2026, 8, 2), "food", "450.00"),
        make_expense(date(2026, 8, 5), "travel", "1200.00"),
    ]

    assert largest_expense(expenses) == expenses[1]


def test_monthly_summary_returns_empty_mapping_for_empty_input() -> None:
    assert monthly_summary([]) == {}


def test_monthly_summary_totals_multiple_categories_and_months() -> None:
    expenses = [
        make_expense(date(2026, 8, 2), "food", "450.00"),
        make_expense(date(2026, 8, 5), "travel", "1200.00"),
        make_expense(date(2026, 8, 19), "food", "320.50"),
        make_expense(date(2026, 9, 3), "food", "560.00"),
    ]

    assert monthly_summary(expenses) == {
        "2026-08": {
            "food": Decimal("770.50"),
            "travel": Decimal("1200.00"),
        },
        "2026-09": {"food": Decimal("560.00")},
    }


def test_monthly_summary_matches_sample_data() -> None:
    assert monthly_summary(load_expenses(DATA)) == {
        "2026-08": {
            "food": Decimal("770.50"),
            "software": Decimal("999.00"),
            "travel": Decimal("1980.00"),
        },
        "2026-09": {
            "food": Decimal("770.00"),
            "office": Decimal("640.00"),
            "software": Decimal("2499.00"),
            "travel": Decimal("3450.00"),
        },
        "2026-10": {
            "food": Decimal("990.25"),
            "office": Decimal("1150.00"),
            "software": Decimal("499.00"),
            "travel": Decimal("950.00"),
        },
    }
