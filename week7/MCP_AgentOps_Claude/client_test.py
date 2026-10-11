#!/usr/bin/env python3

"""
Simple test script for MCP AgentOps Calculator Server.
"""

import json
import os
import subprocess
import sys
import time


def check_environment():
    """Check basic environment setup."""
    print("\n=== Checking environment ===")

    if os.path.exists("main.py"):
        print("SUCCESS: main.py found")
    else:
        print("ERROR: main.py not found")
        return False

    api_key = os.getenv("AGENTOPS_API_KEY")

    if api_key:
        masked = f"{api_key[:8]}...{api_key[-4:]}"
        print(f"SUCCESS: AgentOps API key found: {masked}")
    else:
        print("WARNING: AGENTOPS_API_KEY not set")

    print(f"Python version: {sys.version.split()[0]}")
    print(f"Platform: {sys.platform}")

    return True


def test_direct_functions():
    """Test calculator functions directly."""
    print("\n=== Testing direct function calls ===")

    try:
        import main

        tests = [
            ("add", main.add(5, 3), 8),
            ("subtract", main.subtract(10, 4), 6),
            ("multiply", main.multiply(6, 7), 42),
            ("divide", main.divide(15, 3), 5),
            ("power", main.power(2, 3), 8),
            ("sqrt", main.sqrt(25), 5),
        ]

        for name, result, expected in tests:
            if result == expected:
                print(f"SUCCESS: {name} -> {result}")
            else:
                print(
                    f"ERROR: {name} -> {result}, expected {expected}"
                )
                return False

        print("SUCCESS: All function tests passed")
        return True

    except Exception as e:
        print(f"ERROR: Function test failed: {e}")
        return False


def test_server_startup():
    """Test whether MCP server starts successfully."""
    print("\n=== Testing MCP server startup ===")

    process = None

    try:
        process = subprocess.Popen(
            [sys.executable, "main.py"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
        )

        # Give server time to start
        time.sleep(3)

        if process.poll() is not None:
            stderr = process.stderr.read()

            print("ERROR: Server failed to start")

            if stderr:
                print("Server error:")
                print(stderr)

            return False

        print("SUCCESS: MCP server started")

        # MCP initialize request
        init_message = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {
                    "name": "test-client",
                    "version": "1.0.0",
                },
            },
        }

        message = json.dumps(init_message) + "\n"

        process.stdin.write(message)
        process.stdin.flush()

        print("SUCCESS: Initialization message sent")

        # Wait briefly for server response
        time.sleep(2)

        print("SUCCESS: Server is responding")

        return True

    except Exception as e:
        print(f"ERROR: Server test failed: {e}")
        return False

    finally:
        if process is not None:
            try:
                process.terminate()
                process.wait(timeout=5)
                print("SUCCESS: Server stopped cleanly")
            except Exception:
                try:
                    process.kill()
                except Exception:
                    pass


def main():
    print("===================================")
    print(" MCP AgentOps Calculator Test")
    print("===================================")

    env_ok = check_environment()

    if not env_ok:
        print("\nEnvironment check failed.")
        return

    functions_ok = test_direct_functions()
    server_ok = test_server_startup()

    print("\n===================================")
    print(" Test Summary")
    print("===================================")

    print(
        f"Direct functions: "
        f"{'PASS' if functions_ok else 'FAIL'}"
    )

    print(
        f"MCP server startup: "
        f"{'PASS' if server_ok else 'FAIL'}"
    )

    if functions_ok and server_ok:
        print("\nSUCCESS: All tests passed.")
        print("MCP server should be ready for Claude/Inspector.")
    else:
        print("\nWARNING: Some tests failed.")


if __name__ == "__main__":
    main()