import sys
import json
from sqlglot import parse_one, errors

DIALECTS = ["mysql", "postgres"]

def extract_table_names(sql: str, dialect: str):
    expression = parse_one(sql, read=dialect)
    return list({table.name for table in expression.find_all(exp_type="Table")})

def main():
    try:
        input_data = sys.stdin.read()
        payload = json.loads(input_data)

        sql = payload.get("query", "")
        if not sql:
            raise ValueError("Query not provided")

        last_error = None
        for dialect in DIALECTS:
            try:
                tables = extract_table_names(sql, dialect)
                print(json.dumps({"tables": tables, "dialect": dialect}))
                return
            except errors.ParseError as e:
                last_error = e

        # If none succeed
        raise RuntimeError(f"Could not parse SQL with any supported dialect: {last_error}")

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
