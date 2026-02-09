
import zipfile
import xml.etree.ElementTree as ET
import os

def read_xlsx_content(file_path):
    print(f"\n\n=== Extracting: {os.path.basename(file_path)} ===")
    try:
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            return
            
        with zipfile.ZipFile(file_path, 'r') as zip_ref:
            shared_strings = []
            if 'xl/sharedStrings.xml' in zip_ref.namelist():
                with zip_ref.open('xl/sharedStrings.xml') as f:
                    tree = ET.parse(f)
                    root = tree.getroot()
                    for t in root.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
                        shared_strings.append(t.text or '')
            
            if 'xl/worksheets/sheet1.xml' in zip_ref.namelist():
                with zip_ref.open('xl/worksheets/sheet1.xml') as f:
                    tree = ET.parse(f)
                    root = tree.getroot()
                    
                    rows = []
                    for row_elem in root.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                        row_data = []
                        # We need to handle cell skipping (sparse rows)
                        # The 'r' attribute gives the cell reference (A1, B1, etc.)
                        cells = row_elem.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c')
                        current_col = 0
                        for c in cells:
                            # Parse col index from 'r' (e.g., 'C5' -> 2)
                            r = c.get('r')
                            col_str = "".join([char for char in r if char.isalpha()])
                            col_idx = 0
                            for char in col_str:
                                col_idx = col_idx * 26 + (ord(char) - ord('A') + 1)
                            col_idx -= 1 # 0-indexed
                            
                            while current_col < col_idx:
                                row_data.append('')
                                current_col += 1
                                
                            v_elem = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                            if v_elem is not None:
                                value = v_elem.text
                                t = c.get('t')
                                if t == 's': # Shared string
                                    value = shared_strings[int(value)] if int(value) < len(shared_strings) else value
                                row_data.append(value)
                            else:
                                row_data.append('')
                            current_col += 1
                        rows.append(row_data)
                    
                    # Log first 50 rows for quotation formats to find headers and bank details
                    for i, row in enumerate(rows[:60]):
                        if any(row):
                            print(f"Row {i}: {row}")
                        
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

docs_dir = 'documents'
files = [
    'EXPORT QUOTATION FORMAT-1.xlsx',
    'PIPES QUOTATION FORMAT (2).xlsx'
]

for file in files:
    read_xlsx_content(os.path.join(docs_dir, file))
