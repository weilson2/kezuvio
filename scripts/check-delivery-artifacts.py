"""Verify exported PDF structure and retained layout checks; requires pypdf."""
from pathlib import Path
import json
from pypdf import PdfReader

root = Path.cwd()
results = {}
for filename, expected in [('kezuvio-brand-presentation.pdf', 12), ('kezuvio-delivery-report.pdf', 6)]:
    reader = PdfReader(root / 'output/pdf' / filename)
    assert len(reader.pages) == expected, filename
    counts = [len(page.extract_text()) for page in reader.pages]
    assert min(counts) > 150, filename
    fonts = {}
    for page in reader.pages:
        for ref in page['/Resources'].get('/Font', {}).values():
            font = ref.get_object()
            child = font.get('/DescendantFonts', [font])[0].get_object()
            descriptor = child.get('/FontDescriptor')
            if descriptor:
                descriptor = descriptor.get_object()
                embedded = any(k in descriptor for k in ['/FontFile', '/FontFile2', '/FontFile3'])
                assert embedded, str(font.get('/BaseFont'))
                fonts[str(font.get('/BaseFont'))] = embedded
    results[filename] = {'pages': expected, 'selectableCharactersPerPage': counts, 'embeddedFonts': fonts}

marketing = json.loads((root / 'assets/marketing/previews/layout-check.json').read_text())
assert len(marketing) == 18
assert all(not row['overflow'] and not row['overlaps'] and row['images'] and row['chineseFont'] for row in marketing)
deck = json.loads((root / 'documents/brand-presentation/qa/layout-check.json').read_text())
assert len(deck['layout']) == 12 and all(not row['overflow'] for row in deck['layout'])
results['marketingLayoutsPassed'] = len(marketing)
results['presentationLayoutsPassed'] = len(deck['layout'])
for filename in ['pos-receipt.pdf', 'sample-invoice.pdf']:
    source = root / 'tmp/qa' / filename
    if source.exists():
        reader = PdfReader(source)
        assert len(reader.pages) == 1 and 'NOT A TAX INVOICE' in reader.pages[0].extract_text()
        results[filename] = {'pages': 1, 'sampleDisclaimer': True}
(root / 'docs/artifact-verification.json').write_text(json.dumps(results, indent=2))
print('PASS: 12-page presentation, 6-page report, selectable text/font embeddings and 18 marketing layouts.')
