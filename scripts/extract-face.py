"""Extract original PDF vector curves without rasterization or tracing.
Usage: python extract-face.py input.pdf output.svg (requires PyMuPDF).
"""
import hashlib
import sys
from pathlib import Path
import pymupdf

source, output = map(Path, sys.argv[1:3])
doc = pymupdf.open(source)
drawings = [d for d in doc[0].get_drawings() if len(d['items']) > 100]
if len(drawings) != 1:
    raise ValueError('Expected one detailed face vector drawing')
drawing = drawings[0]
bounds = drawing['rect'] + (-1.5, -1.5, 1.5, 1.5)
commands = []
previous = None

def point(p):
    return f'{p.x-bounds.x0:.5f} {p.y-bounds.y0:.5f}'

for item in drawing['items']:
    kind, start = item[:2]
    if previous is None or start != previous:
        commands.append('M' + point(start))
    if kind == 'c':
        commands.append('C' + ' '.join(map(point, item[2:])))
    elif kind == 'l':
        commands.append('L' + point(item[2]))
    else:
        raise ValueError(f'Unexpected vector operator {kind}')
    previous = item[-1]
sha = hashlib.sha256(source.read_bytes()).hexdigest()
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {bounds.width:.5f} {bounds.height:.5f}">
<desc>Original PDF vector curves; no raster image or manual trace. Source SHA-256: {sha}. PDF segments: {len(drawing['items'])}.</desc>
<path fill="#000000" fill-rule="nonzero" d="{''.join(commands)}"/>
</svg>
'''
output.write_text(svg)
print(f'Extracted {len(drawing["items"])} original segments into {output}; viewBox {bounds.width:.5f} × {bounds.height:.5f}')
