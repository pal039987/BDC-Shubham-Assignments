.PHONY: all install lint test eval run docker-build docker-up docker-down clean

PYTHON ?= python3

all: test eval

install:
	$(PYTHON) -m pip install -r requirements.txt

lint:
	$(PYTHON) -m flake8 src tests run.py server.py eval.py --max-line-length=130 --ignore=E501,W503,E402,E302,E305,W293,E226,E741

test:
	$(PYTHON) -m pytest tests/ -v

eval:
	@rm -f eval.db
	$(PYTHON) run.py --tickets shopsphere_data/tickets.json --out eval_results.json --replay recorded_responses/responses.json --db-path eval.db
	$(PYTHON) eval.py --results eval_results.json --labels labels.json --db-path eval.db --threshold 90.0

run:
	$(PYTHON) run.py --tickets shopsphere_data/tickets.json --out eval_results.json

docker-build:
	docker build -t shopsphere-agent:v1 .

docker-up:
	docker compose up -d

docker-down:
	docker compose down

clean:
	rm -f eval.db eval_report.json *.pyc
	find . -type d -name "__pycache__" -exec rm -rf {} +
