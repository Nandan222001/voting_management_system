#!/bin/bash
# Create Superadmin User Script for Linux/macOS
# Usage: ./create_superadmin.sh [--email EMAIL] [--password PASSWORD] [--name NAME]

cd "$(dirname "$0")" || exit 1

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "✗ Python 3 is not installed"
    exit 1
fi

# Check if virtual environment is active
if [[ -z "$VIRTUAL_ENV" ]]; then
    echo "⚠ Virtual environment is not active. Attempting to activate..."
    if [[ -f "venv/bin/activate" ]]; then
        source venv/bin/activate
    elif [[ -f ".venv/bin/activate" ]]; then
        source .venv/bin/activate
    else
        echo "✗ Could not find virtual environment"
        exit 1
    fi
fi

# Run the Python script with all arguments
python3 create_superadmin.py "$@"
