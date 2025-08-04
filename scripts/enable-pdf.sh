#!/bin/bash

echo "Enabling PDF generation..."

# Check if pdf-generator.ts.example exists
if [ -f "utils/pdf-generator.ts.example" ]; then
    # Install required packages
    echo "Installing jsPDF packages..."
    npm install jspdf jspdf-autotable @types/jspdf --save
    
    # Replace stub with real implementation
    echo "Activating PDF generator..."
    mv utils/pdf-generator.ts utils/pdf-generator-stub.ts
    mv utils/pdf-generator.ts.example utils/pdf-generator.ts
    
    echo "✅ PDF generation enabled!"
    echo "Note: You may need to restart your development server."
else
    echo "❌ Error: utils/pdf-generator.ts.example not found"
    echo "PDF generation may already be enabled or files are missing."
fi