# -*- coding: utf-8 -*-
"""Emit AnswerKey rows as TSV, in the exact column order of the live sheet.

Also enforces the grading rules the platform actually relies on, so a row
that would silently mis-grade fails here instead of in front of a class.
"""
import io
import os
import re
import sys

import week01
import week02

# Live AnswerKey column order (A..J today, K = Grade added by initializeStructure).
HEADERS = ['WeekID', 'QuestionID', 'Type', 'CorrectAnswer', 'Tolerance',
           'Points', 'Hint', 'Solution', 'Title', 'Choices', 'Grade']

GRADE = '10'
WEEKS = [('week-01', week01.Q), ('week-02', week02.Q)]


def alternates(ans):
    """Spellings a student could reasonably use for the same answer.

    Only forms that cannot mean anything else: dropping a leading "y=", and
    dropping the brackets around a coordinate pair.
    """
    alts = [ans]
    m = re.match(r'^y=(.+)$', ans)
    if m:
        alts.append(m.group(1))
    m = re.match(r'^\((.+)\)$', ans)
    if m:
        alts.append(m.group(1))
    return alts


def check(week, q, errors):
    where = '%s %s' % (week, q['QuestionID'])

    for field in ('Title', 'Hint', 'Solution', 'CorrectAnswer', 'Choices'):
        v = str(q[field])
        if '\t' in v or '\n' in v:
            errors.append('%s: %s contains a tab or newline (breaks TSV paste)' % (where, field))
        # KaTeX needs its $ delimiters paired.
        if v.count('$') % 2:
            errors.append('%s: %s has an odd number of $ delimiters' % (where, field))

    if q['Type'] not in ('numeric', 'text', 'mc'):
        errors.append('%s: unknown Type %r' % (where, q['Type']))

    if q['Type'] == 'mc':
        choices = [c.strip() for c in q['Choices'].split('|') if c.strip()]
        if len(choices) < 2:
            errors.append('%s: mc needs at least 2 choices' % where)
        if len(set(choices)) != len(choices):
            errors.append('%s: mc has duplicate choices' % where)
        # The server matches the correct answer against the choice TEXT.
        if q['CorrectAnswer'] not in choices:
            errors.append('%s: CorrectAnswer is not one of the Choices' % where)
    else:
        if q['Choices']:
            errors.append('%s: only mc questions may have Choices' % where)

    if q['Type'] == 'numeric':
        for part in str(q['CorrectAnswer']).split('|'):
            try:
                float(part)
            except ValueError:
                errors.append('%s: numeric answer %r is not a number' % (where, part))
        if str(q['Tolerance']) == '':
            errors.append('%s: numeric question has no Tolerance set' % where)
    else:
        if str(q['Tolerance']) not in ('', '0'):
            errors.append('%s: Tolerance only applies to numeric questions' % where)

    if not str(q['Hint']).strip():
        errors.append('%s: empty Hint' % where)
    if not str(q['Solution']).strip():
        errors.append('%s: empty Solution' % where)


def main(outdir):
    errors = []
    rows = []
    for week, qs in WEEKS:
        ids = [q['QuestionID'] for q in qs]
        if len(set(ids)) != len(ids):
            errors.append('%s: duplicate QuestionIDs' % week)
        for q in qs:
            check(week, q, errors)
            answer = q['CorrectAnswer']
            if q['Type'] == 'text':
                answer = '|'.join(dict.fromkeys(alternates(answer)))
            rows.append((week, [
                week, q['QuestionID'], q['Type'], answer,
                str(q['Tolerance']), str(q['Points']),
                q['Hint'], q['Solution'], q['Title'], q['Choices'], GRADE,
            ]))

    if errors:
        print('VALIDATION FAILED (%d):' % len(errors))
        for e in errors:
            print('  -', e)
        return 1

    os.makedirs(outdir, exist_ok=True)
    written = []
    for week, _ in WEEKS:
        wrows = [r for w, r in rows if w == week]
        path = os.path.join(outdir, 'grade10-%s.tsv' % week)
        with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write('\t'.join(HEADERS) + '\n')
            for r in wrows:
                f.write('\t'.join(r) + '\n')
        written.append((path, len(wrows)))

    combined = os.path.join(outdir, 'grade10-coordinate-geometry.tsv')
    with io.open(combined, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\t'.join(HEADERS) + '\n')
        for _, r in rows:
            f.write('\t'.join(r) + '\n')
    written.append((combined, len(rows)))

    print('VALIDATION PASSED - %d rows' % len(rows))
    for path, n in written:
        print('  %s (%d rows)' % (os.path.basename(path), n))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
