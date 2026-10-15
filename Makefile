.PHONY: all install lint test eval run docker-build docker-up docker-down clean

PYTHON ?= python3

all: test eval

install:
	$(MAKE) -C shopsphere-agent install PYTHON="$(PYTHON)"

lint:
	$(MAKE) -C shopsphere-agent lint PYTHON="$(PYTHON)"

test:
	$(MAKE) -C shopsphere-agent test PYTHON="$(PYTHON)"

eval:
	$(MAKE) -C shopsphere-agent eval PYTHON="$(PYTHON)"

run:
	$(MAKE) -C shopsphere-agent run PYTHON="$(PYTHON)"

docker-build:
	$(MAKE) -C shopsphere-agent docker-build

docker-up:
	$(MAKE) -C shopsphere-agent docker-up

docker-down:
	$(MAKE) -C shopsphere-agent docker-down

clean:
	$(MAKE) -C shopsphere-agent clean
