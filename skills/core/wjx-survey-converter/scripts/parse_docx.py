#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DOCX Document Parser for Survey Questions.

This utility parses .docx survey documents without requiring external dependencies
(such as python-docx), extracting paragraphs and tables cleanly into structured text
or JSON format.
"""

import argparse
import json
import sys
import xml.etree.ElementTree as ET
import zipfile
from typing import Any, Dict, List


def parse_docx(docx_path: str) -> List[Dict[str, Any]]:
    """Parse a .docx file and extract paragraphs and tables in sequence.

    Args:
        docx_path: Path to the .docx file.

    Returns:
        List of dictionaries containing type ('paragraph' or 'table') and content.
    """
    namespaces = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    }

    try:
        with zipfile.ZipFile(docx_path) as z:
            xml_content = z.read('word/document.xml')
    except Exception as e:
        print(f"Error reading {docx_path}: {e}", file=sys.stderr)
        sys.exit(1)

    root = ET.fromstring(xml_content)
    body = root.find('w:body', namespaces)
    if body is None:
        return []

    elements: List[Dict[str, Any]] = []

    for elem in body:
        tag = elem.tag.split('}')[-1]
        if tag == 'p':
            texts = [
                node.text
                for node in elem.iter(
                    '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'
                )
                if node.text
            ]
            p_text = ''.join(texts).strip()
            if p_text:
                elements.append({'type': 'paragraph', 'text': p_text})
        elif tag == 'tbl':
            rows_data: List[List[str]] = []
            for row in elem.findall('w:tr', namespaces):
                row_cells: List[str] = []
                for cell in row.findall('w:tc', namespaces):
                    cell_texts = [
                        node.text
                        for node in cell.iter(
                            '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'
                        )
                        if node.text
                    ]
                    row_cells.append(''.join(cell_texts).strip())
                if any(row_cells):
                    rows_data.append(row_cells)
            if rows_data:
                elements.append({'type': 'table', 'rows': rows_data})

    return elements


def format_text(elements: List[Dict[str, Any]]) -> str:
    """Format parsed elements into readable markdown text."""
    lines: List[str] = []
    for elem in elements:
        if elem['type'] == 'paragraph':
            lines.append(elem['text'])
            lines.append('')
        elif elem['type'] == 'table':
            rows = elem['rows']
            if not rows:
                continue
            col_count = max(len(r) for r in rows)
            padded_rows = [r + [''] * (col_count - len(r)) for r in rows]

            # Header row
            header = '| ' + ' | '.join(padded_rows[0]) + ' |'
            separator = '| ' + ' | '.join(['---'] * col_count) + ' |'
            lines.append(header)
            lines.append(separator)

            for row in padded_rows[1:]:
                lines.append('| ' + ' | '.join(row) + ' |')
            lines.append('')

    return '\n'.join(lines)


def main() -> None:
    """Main CLI entrypoint."""
    parser = argparse.ArgumentParser(
        description='Extract text and tables from Word .docx survey file.'
    )
    parser.add_argument('docx_path', help='Path to target .docx file')
    parser.add_argument(
        '--json', action='store_true', help='Output in JSON format'
    )
    parser.add_argument(
        '-o', '--output', help='Save output to specified file path'
    )

    args = parser.parse_args()
    elements = parse_docx(args.docx_path)

    if args.json:
        output_str = json.dumps(elements, ensure_ascii=False, indent=2)
    else:
        output_str = format_text(elements)

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(output_str)
        print(f"Parsed output saved to {args.output}")
    else:
        print(output_str)


if __name__ == '__main__':
    main()
