#!/bin/bash

# Add global-styles.css to all HTML files
for file in *.html; do
    if [ -f "$file" ]; then
        # Check if global-styles.css is already included
        if ! grep -q "global-styles.css" "$file"; then
            # Add global-styles.css after navigation-fix.css
            sed -i '/<link rel="stylesheet" href="navigation-fix.css">/a\    <link rel="stylesheet" href="global-styles.css">' "$file"
            echo "Added global-styles.css to $file"
        else
            echo "global-styles.css already in $file"
        fi
    fi
done

echo "Global styles CSS added to all HTML files!"