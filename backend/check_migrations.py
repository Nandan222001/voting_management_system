#!/usr/bin/env python3
"""
Check Alembic migration status
"""

import subprocess
import sys

def main():
    print("\n" + "=" * 80)
    print("CHECKING MIGRATION STATUS")
    print("=" * 80)
    
    try:
        result = subprocess.run(
            ["alembic", "current"],
            capture_output=True,
            text=True,
            cwd="."
        )
        
        print("\nCurrent migration revision:")
        print(result.stdout)
        
        if result.returncode != 0:
            print("Error output:")
            print(result.stderr)
        
        print("\nAvailable migrations:")
        result = subprocess.run(
            ["alembic", "history"],
            capture_output=True,
            text=True,
            cwd="."
        )
        print(result.stdout)
        
        print("\nTo apply pending migrations, run:")
        print("  alembic upgrade head")
        
    except FileNotFoundError:
        print("✗ Alembic not found - ensure it's installed:")
        print("  pip install alembic")
        sys.exit(1)

if __name__ == "__main__":
    main()
