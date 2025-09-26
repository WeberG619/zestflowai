#!/bin/bash

# Remove duplicate CSS links from all HTML files
for file in *.html; do
    if [ -f "$file" ]; then
        # Remove consecutive duplicate lines for CSS links
        sed -i '/^    <link rel="stylesheet" href="\/consistent-styles.css">$/N;/\n    <link rel="stylesheet" href="\/consistent-styles.css">$/d' "$file"
        sed -i '/^    <link rel="stylesheet" href="\/navigation-fix.css">$/N;/\n    <link rel="stylesheet" href="\/navigation-fix.css">$/d' "$file"
        sed -i '/^    <link rel="stylesheet" href="\/global-styles.css">$/N;/\n    <link rel="stylesheet" href="\/global-styles.css">$/d' "$file"
        
        # Also remove without leading slashes
        sed -i '/^    <link rel="stylesheet" href="consistent-styles.css">$/N;/\n    <link rel="stylesheet" href="consistent-styles.css">$/d' "$file"
        sed -i '/^    <link rel="stylesheet" href="navigation-fix.css">$/N;/\n    <link rel="stylesheet" href="navigation-fix.css">$/d' "$file"
        sed -i '/^    <link rel="stylesheet" href="global-styles.css">$/N;/\n    <link rel="stylesheet" href="global-styles.css">$/d' "$file"
    fi
done

echo "Duplicate CSS links removed!"