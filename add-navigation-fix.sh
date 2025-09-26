#!/bin/bash

# Add navigation-fix.css to all HTML files
for file in *.html; do
    if [ -f "$file" ]; then
        # Check if navigation-fix.css is already included
        if ! grep -q "navigation-fix.css" "$file"; then
            # Add navigation-fix.css after consistent-styles.css
            sed -i '/<link rel="stylesheet" href="consistent-styles.css">/a\    <link rel="stylesheet" href="navigation-fix.css">' "$file"
            echo "Added navigation-fix.css to $file"
        else
            echo "navigation-fix.css already in $file"
        fi
    fi
done

echo "Navigation fix CSS added to all HTML files!"