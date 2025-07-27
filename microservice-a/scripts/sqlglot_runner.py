# sqlglot_runner.py
import sys
import json
from sqlglot import transpile, errors

# Priority order for dialects, adjust if you expect more of one
DIALECTS = ['mysql', 'postgres']

def to_trino_compatible(sql: str) -> str:
    """
    Attempts to auto-detect the SQL dialect and convert to Trino-compatible SQL.
    """
    for dialect in DIALECTS:
        try:
            result = transpile(sql, read=dialect, write='trino')
            return result[0]  # Return the first converted result
        except errors.ParseError:
            continue
    raise ValueError("Could not parse SQL with any known dialect")

def main():
    try:
        input_data = sys.stdin.read()
        payload = json.loads(input_data)

        sql = payload.get("query", "")

        result = to_trino_compatible(sql)

        print(json.dumps({ "result": result }))
    except Exception as e:
        print(json.dumps({ "error": str(e) }))

if __name__ == "__main__":
    main()