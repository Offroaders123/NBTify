#!/bin/bash

# Ensure correct usage
if [[ $# -ne 2 ]]; then
    echo "Usage: $0 <first_file> <second_file>"
    exit 1
fi

snbtify() {
  echo "$(nbtify $1 --snbt --space=2)"
}

first_file=$1
second_file=$2

first_snbt=$(snbtify $first_file)
second_snbt=$(snbtify $second_file)

# Debugging
# echo "$first_snbt"
# echo "$second_snbt"

git diff --no-index <(echo "$first_snbt") <(echo "$second_snbt")
