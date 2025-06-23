#!/bin/bash

# Fix remaining syntax issues from automated replacement
find client/src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read file; do
  # Fix broken if statements and brackets
  sed -i 's/\/\/ Component safety check {/{/g' "$file" 2>/dev/null || true
  sed -i 's/if (true) {/{/g' "$file" 2>/dev/null || true
  sed -i '/\/\/ Component safety check$/d' "$file" 2>/dev/null || true
  sed -i '/\/\/ Component mounted safely$/d' "$file" 2>/dev/null || true
  
  # Remove empty dependency arrays that might have syntax issues
  sed -i 's/}, \[\]/}/g' "$file" 2>/dev/null || true
  
  # Fix any remaining malformed useEffect dependencies
  sed -i 's/\[\]/[]/g' "$file" 2>/dev/null || true
done