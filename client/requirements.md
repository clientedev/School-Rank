## Packages
xlsx | Parsing and exporting Excel files for grade batch uploads and ranking exports
jspdf | Core PDF generation library for exporting rankings
jspdf-autotable | Table formatting plugin for jsPDF to render the rankings neatly

## Notes
The backend expects numbers for grades. When parsing Excel, we will convert comma-separated decimals (e.g., '8,5') to standard floats (8.5) before sending to `POST /api/grades/batch`.
Standard Shadcn UI components are assumed to be present, but critical complex UI elements (like the ranking table) will use custom Tailwind for precise control and reliability.
