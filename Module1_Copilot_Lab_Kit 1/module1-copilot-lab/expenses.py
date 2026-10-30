import csv
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Iterable, TypedDict


class Expense(TypedDict):
    date: date
    category: str
    amount: Decimal
    note: str


def parse_amount(text: str) -> Decimal:
    """Parse a rupee amount and return it rounded to two decimal places.

    Args:
        text: Amount text, optionally containing a rupee or Rs. prefix and commas.

    Returns:
        The parsed amount as a Decimal with two decimal places.

    Raises:
        ValueError: If the amount is empty, invalid, non-finite, or negative.
    """
    cleaned = text.strip().replace("₹", "").replace("Rs.", "").replace(",", "").strip()
    if not cleaned:
        raise ValueError("amount is empty")
    try:
        value = Decimal(cleaned)
        if not value.is_finite():
            raise ValueError(f"not a finite number: {text!r}")
        if value < 0:
            raise ValueError("amount cannot be negative")
        return value.quantize(Decimal("0.01"))
    except InvalidOperation as error:
        raise ValueError(f"not a valid amount: {text!r}") from error


def load_expenses(path: str | Path) -> list[Expense]:
    """Load expense records from a CSV file.

    Args:
        path: Path to a CSV containing date, category, amount, and optional note.

    Returns:
        Expense records with parsed dates and Decimal amounts.
    """
    expenses = []
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            expenses.append({
                "date": datetime.strptime(row["date"], "%Y-%m-%d").date(),
                "category": row["category"].strip().lower(),
                "amount": parse_amount(row["amount"]),
                "note": row.get("note", "").strip(),
            })
    return expenses


def total_by_category(expenses: Iterable[Expense]) -> dict[str, Decimal]:
    """Return the total amount spent in each category.

    Args:
        expenses: Expense records to total.

    Returns:
        Category totals sorted by category name.
    """
    totals = {}
    for e in expenses:
        totals[e["category"]] = totals.get(e["category"], Decimal("0.00")) + e["amount"]
    return dict(sorted(totals.items()))


def largest_expense(expenses: Iterable[Expense]) -> Expense | None:
    """Return the most expensive record, or None when there are no expenses.

    Args:
        expenses: Expense records to search.

    Returns:
        The record with the greatest amount, or None for empty input.
    """
    expense_list = list(expenses)
    if not expense_list:
        return None
    return max(expense_list, key=lambda e: e["amount"])


def monthly_summary(
    expenses: Iterable[Expense],
) -> dict[str, dict[str, Decimal]]:
    """Return per-category expense totals grouped by calendar month.

    Args:
        expenses: Expense records to summarize.

    Returns:
        A mapping from YYYY-MM month strings to sorted category totals.
    """
    summary: dict[str, dict[str, Decimal]] = {}
    for expense in expenses:
        month = expense["date"].strftime("%Y-%m")
        categories = summary.setdefault(month, {})
        category = expense["category"]
        categories[category] = (
            categories.get(category, Decimal("0.00")) + expense["amount"]
        )

    return {
        month: dict(sorted(categories.items()))
        for month, categories in sorted(summary.items())
    }


if __name__ == "__main__":
    data = load_expenses(Path(__file__).resolve().parent / "data" / "expenses.csv")
    print(f"Loaded {len(data)} expenses")
    for category, total in total_by_category(data).items():
        print(f"{category:<12} {total:>10}")
