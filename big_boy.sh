#!/bin/bash

INPUT="create_tables.sql"

# Athena settings
DATABASE="default"
OUTPUT_LOCATION="s3://pedro-arkham-athena-query/results/"

# Split the SQL file on semicolons
IFS=';'
readarray -t statements < "$INPUT"

for stmt in "${statements[@]}"; do
  clean_stmt=$(echo "$stmt" | xargs) # Trim whitespace
  if [[ -n "$clean_stmt" ]]; then
    echo "Executing statement:"
    echo "$clean_stmt"
    echo "-------------------------"

    aws athena start-query-execution \
      --query-string "$clean_stmt" \
      --query-execution-context Database=$DATABASE \
      --result-configuration "OutputLocation=$OUTPUT_LOCATION" \
      --profile "personal"
    
    # Optional: Wait a second between queries
    sleep 1
  fi
done
