# -*- coding: utf-8 -*-
"""Write a human-readable review document for the generated homework."""
import io
import os
import sys

import week01
import week02

TITLES = {
    'week-01': ('Coordinate geometry I - points, gradients and straight lines',
                'Pure Mathematics 1, sections 3.1-3.3'),
    'week-02': ('Coordinate geometry II - circles, and intersections of lines and circles',
                'Pure Mathematics 1, sections 3.4-3.5'),
}

SECTIONS = {
    'week-01': [(1, 6, '3.1 Length of a line segment and midpoint'),
                (7, 12, '3.2 Parallel and perpendicular lines'),
                (13, 20, '3.3 Equations of straight lines')],
    'week-02': [(1, 13, '3.4 The equation of a circle'),
                (14, 20, '3.5 Problems involving intersections of lines and circles')],
}


def main(outpath):
    out = []
    out.append('# Grade 10 homework - Cambridge Pure Mathematics 1, Chapter 3\n')
    out.append('Generated for the HW Checker. Questions follow the IQanat High School of '
               'Burabay 10th grade AS-level 2025-26 plan, which allocates 9 hours to '
               'Chapter 3 (Coordinate geometry).\n')
    out.append('Maths is written in `$...$` LaTeX, which the student page renders with '
               'KaTeX. All 40 keys were checked against a port of the grader in `Code.gs`.\n')

    for week, qs in (('week-01', week01.Q), ('week-02', week02.Q)):
        title, source = TITLES[week]
        out.append('\n---\n')
        out.append('## Grade 10, `%s` - %s\n' % (week, title))
        out.append('*%s*\n' % source)
        for lo, hi, heading in SECTIONS[week]:
            out.append('\n### %s\n' % heading)
            for q in qs:
                n = int(q['QuestionID'][1:])
                if not (lo <= n <= hi):
                    continue
                out.append('**%s** (`%s`) %s\n' % (q['QuestionID'], q['Type'], q['Title']))
                if q['Choices']:
                    for c in q['Choices'].split('|'):
                        mark = 'x' if c == q['CorrectAnswer'] else ' '
                        out.append('- [%s] %s' % (mark, c))
                    out.append('')
                else:
                    out.append('- **Answer:** `%s`' % q['CorrectAnswer'])
                out.append('- *Hint (unlocks on attempt 3 if below 80%%):* %s' % q['Hint'])
                out.append('- *Solution (unlocks on passing):* %s' % q['Solution'])
                out.append('')

    io.open(outpath, 'w', encoding='utf-8', newline='\n').write('\n'.join(out))
    print('wrote', os.path.basename(outpath), '(%d lines)' % len(out))


if __name__ == '__main__':
    main(sys.argv[1])
