
import zipfile
import xml.etree.ElementTree as ET
import os

def read_xlsx_content(file_path):
    print(f"\n\n=== Extracting: {os.path.basename(file_path)} ===")
    try:
        with zipfile.ZipFile(file_path, 'r') as zip_ref:
            # 1. Read shared strings
            shared_strings = []
            if 'xl/sharedStrings.xml' in zip_ref.namelist():
                with zip_ref.open('xl/sharedStrings.xml') as f:
                    tree = ET.parse(f)
                    root = tree.getroot()
                    for t in root.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
                        shared_strings.append(t.text)
            
            # 2. Read first sheet
            if 'xl/worksheets/sheet1.xml' in zip_ref.namelist():
                with zip_ref.open('xl/worksheets/sheet1.xml') as f:
                    tree = ET.parse(f)
                    root = tree.getroot()
                    
                    rows = []
                    for row_elem in root.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                        row_data = []
                        for c in row_elem.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                            v_elem = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                            if v_elem is not None:
                                value = v_elem.text
                                t = c.get('t')
                                if t == 's': # Shared string
                                    value = shared_strings[int(value)] if int(value) < len(shared_strings) else value
                                row_data.append(value)
                            else:
                                row_data.append('')
                        rows.append(row_data)
                    
                    # Log first 20 rows
                    for i, row in enumerate(rows[:20]):
                        print(f"Row {i}: {row}")
                        
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

docs_dir = 'documents'
files = [
    'EXPORT QUOTATION FORMAT-1.xlsx',
    'PIPES QUOTATION FORMAT (2).xlsx',
    'INVENTORY MASTER - LATEST.xlsx',
    'PIPES SIZE MASTER CS & AS PIPES.xlsx',
    'PIPES SIZE MASTER SS & DS PIPES.xlsx',
    'PRODUCT SPEC MASTER - 1.xlsx',
    'TESTING MASTER FOR LAB LETTER.xlsx'
]

for file in files:
    read_xlsx_content(os.path.join(docs_dir, file))
