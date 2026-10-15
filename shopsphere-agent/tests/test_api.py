from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

def test_healthz_endpoint():
    res = client.get("/healthz")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "agent_version" in data
    assert "auto_refund_enabled" in data

def test_metrics_endpoint_json():
    res = client.get("/metrics?format=json")
    assert res.status_code == 200
    data = res.json()
    assert "tickets_processed" in data
    assert "action_distribution" in data

def test_metrics_endpoint_prometheus():
    res = client.get("/metrics?format=prometheus")
    assert res.status_code == 200
    assert "shopsphere_tickets_total" in res.text

def test_escalations_endpoint():
    res = client.get("/v1/escalations")
    assert res.status_code == 200
    data = res.json()
    assert "escalations" in data
    assert isinstance(data["escalations"], list)
