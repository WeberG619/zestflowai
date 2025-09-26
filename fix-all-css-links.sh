#!/bin/bash

# Fix CSS links in all HTML files
for file in *.html; do
    if [ -f "$file" ]; then
        echo "Checking $file..."
        
        # Check if consistent-styles.css is linked
        if ! grep -q '<link rel="stylesheet" href="/consistent-styles.css">' "$file"; then
            # Find the right place to insert (after favicon links)
            if grep -q '<link rel="shortcut icon" href="/favicon.ico">' "$file"; then
                sed -i '/<link rel="shortcut icon" href="\/favicon.ico">/a\    \n    <link rel="stylesheet" href="/consistent-styles.css">\n    <link rel="stylesheet" href="/navigation-fix.css">\n    <link rel="stylesheet" href="/global-styles.css">' "$file"
                echo "Added CSS links to $file"
            fi
        else
            # Check if navigation-fix.css is missing
            if ! grep -q '<link rel="stylesheet" href="/navigation-fix.css">' "$file"; then
                sed -i '/<link rel="stylesheet" href="\/consistent-styles.css">/a\    <link rel="stylesheet" href="/navigation-fix.css">' "$file"
                echo "Added navigation-fix.css to $file"
            fi
            
            # Check if global-styles.css is missing
            if ! grep -q '<link rel="stylesheet" href="/global-styles.css">' "$file"; then
                sed -i '/<link rel="stylesheet" href="\/navigation-fix.css">/a\    <link rel="stylesheet" href="/global-styles.css">' "$file"
                echo "Added global-styles.css to $file"
            fi
        fi
        
        # Also check for files using relative paths without leading slash
        sed -i 's/<link rel="stylesheet" href="consistent-styles.css">/<link rel="stylesheet" href="\/consistent-styles.css">/' "$file"
        sed -i 's/<link rel="stylesheet" href="navigation-fix.css">/<link rel="stylesheet" href="\/navigation-fix.css">/' "$file"
        sed -i 's/<link rel="stylesheet" href="global-styles.css">/<link rel="stylesheet" href="\/global-styles.css">/' "$file"
    fi
done

echo "CSS link fixes complete!"