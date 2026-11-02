"""Render the maintained Markdown handover to a selectable-text A4 PDF.

Requires reportlab (the Codex bundled Python includes it). Run from repository root.
The source of truth is docs/final-delivery-report.md; no network access is used.
"""
from pathlib import Path
import re
from html import escape
import reportlab
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak

root = Path.cwd()
font_dir = Path(reportlab.__file__).parent / 'fonts'
pdfmetrics.registerFont(TTFont('ReportSans', str(font_dir / 'Vera.ttf')))
pdfmetrics.registerFont(TTFont('ReportSans-Bold', str(font_dir / 'VeraBd.ttf')))
pdfmetrics.registerFontFamily('ReportSans', normal='ReportSans', bold='ReportSans-Bold')
ink = colors.HexColor('#0B1220')
muted = colors.HexColor('#526077')
indigo = colors.HexColor('#4F46E5')
line = colors.HexColor('#CBD5E1')
styles = {
    'body': ParagraphStyle('body', fontName='ReportSans', fontSize=9.2, leading=14.2, textColor=ink, spaceAfter=10),
    'title': ParagraphStyle('title', fontName='ReportSans-Bold', fontSize=27, leading=32, textColor=ink, spaceAfter=18),
    'heading': ParagraphStyle('heading', fontName='ReportSans-Bold', fontSize=21, leading=27, textColor=indigo, spaceAfter=19),
    'table': ParagraphStyle('table', fontName='ReportSans', fontSize=8.1, leading=12, textColor=ink),
    'tablehead': ParagraphStyle('tablehead', fontName='ReportSans-Bold', fontSize=8.2, leading=12, textColor=colors.white),
    'bullet': ParagraphStyle('bullet', fontName='ReportSans', fontSize=9.2, leading=14.2, textColor=ink, spaceAfter=11, leftIndent=12, firstLineIndent=-12),
}

def inline(value):
    value = escape(value)
    value = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', value)
    value = re.sub(r'`([^`]+)`', r'<font color="#4338CA">\1</font>', value)
    value = re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)', r'<link href="\2" color="#4338CA"><u>\1</u></link>', value)
    return value

def para(value, style='body'):
    return Paragraph(inline(value), styles[style])

def frame(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(indigo)
    canvas.rect(0, height - 8, width, 8, fill=1, stroke=0)
    canvas.drawImage(str(root / 'assets/icons/icon-192.png'), 46, height - 57, 26, 26, mask='auto')
    canvas.setFillColor(ink)
    canvas.setFont('ReportSans-Bold', 10)
    canvas.drawString(81, height - 43, 'kezuvio. labs')
    canvas.setFillColor(muted)
    canvas.setFont('ReportSans', 7)
    canvas.drawRightString(width - 46, height - 43, 'LOCAL DELIVERY / 31 OCTOBER 2026')
    canvas.setStrokeColor(line)
    canvas.line(46, 47, width - 46, 47)
    canvas.setFont('ReportSans', 7)
    canvas.drawString(46, 32, 'Provisional brand | Fictional demonstrations | Not publicly deployed')
    canvas.drawRightString(width - 46, 32, f'{doc.page:02d}')
    canvas.restoreState()

lines = (root / 'docs/final-delivery-report.md').read_text(encoding='utf-8').splitlines()
story = []
i = 0
while i < len(lines):
    current = lines[i]
    if not current.strip():
        i += 1
        continue
    if current.startswith('# '):
        story.append(para(current[2:], 'title'))
    elif current.startswith('## '):
        if current != '## Milestone results':
            story.append(PageBreak())
        else:
            story.append(Spacer(1, 8))
        story.append(para(current[3:], 'heading'))
    elif current.startswith('|'):
        rows = []
        while i < len(lines) and lines[i].startswith('|'):
            cells = [c.strip() for c in lines[i].strip('|').split('|')]
            if not all(re.fullmatch(r'[-: ]+', c) for c in cells):
                rows.append(cells)
            i += 1
        cols = [105, 235, A4[0] - 92 - 340] if len(rows[0]) == 3 else [153, A4[0] - 92 - 153]
        table = Table([[para(c, 'tablehead' if r == 0 else 'table') for c in row] for r, row in enumerate(rows)], colWidths=cols, repeatRows=1, hAlign='LEFT')
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), indigo),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#F1F5F9'), colors.white]),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 9), ('RIGHTPADDING', (0, 0), (-1, -1), 9),
            ('TOPPADDING', (0, 0), (-1, -1), 9), ('BOTTOMPADDING', (0, 0), (-1, -1), 9),
            ('LINEBELOW', (0, -1), (-1, -1), .5, line),
        ]))
        story += [table, Spacer(1, 16)]
        continue
    elif current.startswith('- '):
        story.append(para('- ' + current[2:], 'bullet'))
    elif re.match(r'^\d+\. ', current):
        story.append(para(current, 'bullet'))
    else:
        story.append(para(current))
    i += 1

output = root / 'output/pdf/kezuvio-delivery-report.pdf'
output.parent.mkdir(parents=True, exist_ok=True)
document = SimpleDocTemplate(str(output), pagesize=A4, leftMargin=46, rightMargin=46,
    topMargin=83, bottomMargin=65, title='Kezuvio Labs - final local delivery report',
    author='Kezuvio Labs project handover')
document.build(story, onFirstPage=frame, onLaterPages=frame)
print(output)
