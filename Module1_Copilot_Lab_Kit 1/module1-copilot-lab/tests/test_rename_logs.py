from pathlib import Path

import pytest

from tools.rename_logs import plan_renames, rename_logs


def write_log(path: Path, first_line: str) -> None:
    """Write a small log file for a rename test.

    Args:
        path: Destination path for the test log.
        first_line: First line of the log file.
    """
    path.write_text(f"{first_line}\nlog content\n", encoding="utf-8")


def test_plan_renames_handles_duplicate_dates_and_missing_timestamp(
    tmp_path: Path,
) -> None:
    write_log(tmp_path / "app-1.log", "2026-10-01T09:15:02 INFO started")
    write_log(tmp_path / "app-2.log", "2026-10-02T08:59:10 INFO started")
    write_log(tmp_path / "app-3.log", "2026-10-02T19:00:12 INFO restarted")
    write_log(tmp_path / "notes.log", "notes without a timestamp")

    renames, skipped = plan_renames(tmp_path)

    assert [(source.name, destination.name) for source, destination in renames] == [
        ("app-1.log", "app-2026-10-01.log"),
        ("app-2.log", "app-2026-10-02.log"),
        ("app-3.log", "app-2026-10-02-2.log"),
    ]
    assert [path.name for path in skipped] == ["notes.log"]


def test_dry_run_does_not_change_log_files(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    source = tmp_path / "app-1.log"
    write_log(source, "2026-10-01T09:15:02 INFO started")

    rename_logs(tmp_path, dry_run=True)

    assert source.exists()
    assert not (tmp_path / "app-2026-10-01.log").exists()
    assert "Planned rename: app-1.log to app-2026-10-01.log" in capsys.readouterr().out


def test_rename_does_not_overwrite_existing_destination(tmp_path: Path) -> None:
    source = tmp_path / "app-1.log"
    destination = tmp_path / "app-2026-10-01.log"
    write_log(source, "2026-10-01T09:15:02 INFO started")
    destination.write_text("keep this existing file\n", encoding="utf-8")

    rename_logs(tmp_path)

    assert not source.exists()
    assert destination.read_text(encoding="utf-8") == "keep this existing file\n"
    assert (tmp_path / "app-2026-10-01-2.log").read_text(
        encoding="utf-8"
    ) == "2026-10-01T09:15:02 INFO started\nlog content\n"
    assert plan_renames(tmp_path)[0] == []
