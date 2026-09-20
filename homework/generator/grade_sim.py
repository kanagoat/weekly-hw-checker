# -*- coding: utf-8 -*-
"""Simulate Code.gs checkAnswer() against the generated key.

This is a port of the real server function, so it catches the failure mode
the other checks cannot: a key that is mathematically right but that the
grader would still mark wrong.
"""
import io
import re
import sys

HEADERS = None


def parse_float(s):
    """JavaScript parseFloat: leading numeric prefix, else NaN."""
    m = re.match(r'\s*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?', s)
    return float(m.group(0)) if m else None


def normalize(s):
    return re.sub(r'\s+', '', s).lower()


def check_answer(student, key):
    """Mirror of checkAnswer() in Code.gs."""
    if key['type'] == 'numeric':
        sn = parse_float(student.replace(',', '.', 1))
        cn = parse_float(key['correct'][0].replace(',', '.', 1))
        if sn is None or cn is None:
            return False
        return abs(sn - cn) <= (key['tolerance'] or 0)
    na = normalize(student)
    return any(normalize(a) == na for a in key['correct'])


def load(path):
    rows = [l.rstrip('\n').split('\t') for l in io.open(path, encoding='utf-8')]
    h = rows[0]
    return [dict(zip(h, r)) for r in rows[1:]]


def key_of(row):
    return {
        'type': row['Type'],
        'correct': [c.strip() for c in row['CorrectAnswer'].split('|')],
        'tolerance': float(row['Tolerance']) if row['Tolerance'] else 0,
    }


def main(paths):
    failures = []
    total = 0
    for path in paths:
        for row in load(path):
            total += 1
            where = '%s %s' % (row['WeekID'], row['QuestionID'])
            k = key_of(row)
            canonical = k['correct'][0]

            # 1. The canonical answer must grade as correct.
            if not check_answer(canonical, k):
                failures.append('%s: canonical answer %r grades WRONG' % (where, canonical))

            # 2. Every listed alternate must also grade as correct.
            for alt in k['correct']:
                if not check_answer(alt, k):
                    failures.append('%s: alternate %r grades WRONG' % (where, alt))

            # 3. Realistic reformattings a student might type.
            variants = []
            if row['Type'] == 'text':
                variants = [canonical.upper(), ' ' + canonical + ' ',
                            canonical.replace(',', ', ')]
            elif row['Type'] == 'numeric':
                variants = [' ' + canonical + ' ']
            for v in variants:
                if not check_answer(v, k):
                    failures.append('%s: student form %r grades WRONG' % (where, v))

            # 4. A clearly wrong answer must NOT be accepted.
            wrong = '999999' if row['Type'] == 'numeric' else 'definitely-not-the-answer'
            if check_answer(wrong, k):
                failures.append('%s: wrong answer %r graded CORRECT' % (where, wrong))

            # 5. MC: the correct choice must be reachable, and no two choices
            #    may collide once normalised (that would make grading ambiguous).
            if row['Type'] == 'mc':
                choices = [c.strip() for c in row['Choices'].split('|') if c.strip()]
                norms = [normalize(c) for c in choices]
                if len(set(norms)) != len(norms):
                    failures.append('%s: two choices are identical after normalisation' % where)
                hits = [c for c in choices if check_answer(c, k)]
                if len(hits) != 1:
                    failures.append('%s: %d of %d choices grade as correct (expected exactly 1)'
                                    % (where, len(hits), len(choices)))

    print('Simulated grading on %d questions' % total)
    if failures:
        print('FAILURES (%d):' % len(failures))
        for f in failures:
            print('  -', f)
        return 1
    print('ALL PASS - every key grades its own answer correctly, rejects a wrong one,')
    print('and every multiple-choice question has exactly one correct option.')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
