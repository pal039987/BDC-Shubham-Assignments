"""Rename dated log files without overwriting existing files."""

import argparse
import os
import re
from datetime import date
from pathlib import Path

TIMESTAMP_PATTERN = re.compile(r"^\s*(\d{4}-\d{2}-\d{2})(?:T|\s)")
LOG_DIR = Path(__file__).resolve().parents[1] / "logs"


def read_log_date(path: Path) -> date | None:
    """Read a valid ISO date from the first line of a log file.

    Args:
        path: Log file to inspect.

    Returns:
        Its first-line date, or None if the line has no valid timestamp.
    """
    with path.open(encoding="utf-8") as log_file:
        first_line = log_file.readline()
    match = TIMESTAMP_PATTERN.match(first_line)
    if match is None:
        return None
    try:
        return date.fromisoformat(match.group(1))
    except ValueError:
        return None


def plan_renames(log_dir: Path) -> tuple[list[tuple[Path, Path]], list[Path]]:
    """Build rename operations, reserving unique, unused destination names.

    Args:
        log_dir: Directory containing the log files.

    Returns:
        Rename pairs and paths skipped because they lack a valid first-line date.
    """
    renames: list[tuple[Path, Path]] = []
    skipped: list[Path] = []
    reserved: set[Path] = set()

    for source in sorted(log_dir.glob("*.log")):
        log_date = read_log_date(source)
        if log_date is None:
            skipped.append(source)
            continue

        base_name = f"app-{log_date.isoformat()}"
        destination = log_dir / f"{base_name}.log"
        if re.fullmatch(rf"{re.escape(base_name)}(?:-\d+)?\.log", source.name):
            reserved.add(source)
            continue

        suffix = 2
        while destination.exists() or destination in reserved:
            destination = log_dir / f"{base_name}-{suffix}.log"
            suffix += 1

        if destination != source:
            renames.append((source, destination))
            reserved.add(destination)

    return renames, skipped


def rename_logs(log_dir: Path, dry_run: bool = False) -> list[tuple[Path, Path]]:
    """Rename dated logs or print the operations without changing files.

    Args:
        log_dir: Directory containing the log files.
        dry_run: If True, report planned operations without renaming.

    Returns:
        The rename operations performed or planned.
    """
    renames, skipped = plan_renames(log_dir)

    for source in skipped:
        print(f"Skipped {source.name}: no valid timestamp on the first line")

    for source, destination in renames:
        if dry_run:
            print(f"Planned rename: {source.name} to {destination.name}")
            continue

        # Hard-link then unlink gives an atomic no-overwrite destination check.
        os.link(source, destination)
        source.unlink()
        print(f"Renamed {source.name} to {destination.name}")

    if not renames:
        print("No files to rename")
    return renames


def main() -> None:
    """Parse CLI arguments and run the log renamer."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="show planned renames without changing any files",
    )
    args = parser.parse_args()
    rename_logs(LOG_DIR, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
