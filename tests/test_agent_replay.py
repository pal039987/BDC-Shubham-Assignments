from pathlib import Path
from eval import evaluate

def test_eval_gate_on_recorded_responses(tmp_path):
    results_file = Path("eval_results.json")
    labels_file = Path("labels.json")
    db_path = tmp_path / "eval.db"
    report_file = tmp_path / "test_report.json"

    assert results_file.exists(), "eval_results.json must exist"
    assert labels_file.exists(), "labels.json must exist"

    passed = evaluate(
        results_file=results_file,
        labels_file=labels_file,
        db_path=db_path,
        threshold=95.0,
        out_file=report_file
    )
    assert passed is True, "Eval quality gate failed on recorded responses!"
