"""Compare local TS audit hashes to a separately supplied Python ALIS decoder.
No original images/listings are written. The reference is not bundled or downloaded.
Usage: python compare-alis-reference.py REFERENCE_DIRECTORY AUDIT_DIRECTORY I1 I2
"""
import hashlib, importlib.util, json, sys
from pathlib import Path
reference, audit, i1, i2 = map(Path, sys.argv[1:])
path = reference / 'alis_unpack.py'
spec = importlib.util.spec_from_file_location('local_alis_reference', path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
results = []
for game, root in [('ishar1', i1), ('ishar2', i2)]:
    report = json.loads((audit / (game + '-alis-modules.json')).read_text(encoding='utf-8'))
    expected = {row['name']: row for row in report['modules']}
    names = sorted(p.name for p in root.glob('*.IO'))
    assert set(names) == set(expected), 'Corpus file set differs from audited set'
    for name in names:
        source = (root / name).read_bytes()
        row = expected[name]
        assert hashlib.sha256(source).hexdigest() == row['sourceSha256'], name + ': source changed'
        image, info = module.load_script(source)
        assert hashlib.sha256(image).hexdigest() == row['imageSha256'], name + ': decoded image mismatch'
        assert len(image) == row['imageBytes'], name + ': image size mismatch'
    results.append({'game': game, 'matchingImages': len(names)})
print(json.dumps({'claim': 'Two decoder implementations agree; not an original-execution proof', 'referenceSha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'results': results}))
