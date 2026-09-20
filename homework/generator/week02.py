# -*- coding: utf-8 -*-
"""Grade 10, week-02 - Coordinate geometry II (PM1 3.4-3.5).

Circles, and intersections of lines and circles. As in week-01, every answer
is recomputed and asserted here rather than typed in by hand.
"""
from fractions import Fraction as F
from geom import *

Q = []


def add(qid, typ, title, correct, hint, solution, choices="", tol="", pts=1):
    Q.append(dict(QuestionID=qid, Type=typ, Title=title, CorrectAnswer=correct,
                  Tolerance=tol, Points=pts, Hint=hint, Solution=solution,
                  Choices=choices))


# --- 3.4 The equation of a circle ----------------------------------------
add('q1', 'text',
    r'Write down the coordinates of the centre of the circle $(x-2)^2+(y+5)^2=49$. Give your answer in the form (a,b).',
    '(2,-5)',
    r'Compare with $(x-a)^2+(y-b)^2=r^2$, whose centre is $(a,\,b)$. Note that $(y+5)$ means $b=-5$, not $+5$.',
    r'$(x-2)^2+(y+5)^2=49$ is $(x-2)^2+(y-(-5))^2=7^2$, so $a=2$ and $b=-5$. The centre is $(2,\,-5)$.')

assert 49 == 7 ** 2
add('q2', 'numeric',
    r'Find the radius of the circle $(x-2)^2+(y+5)^2=49$.',
    '7',
    r'In $(x-a)^2+(y-b)^2=r^2$ the right-hand side is $r^2$, not $r$ - take the square root.',
    r'$r^2=49$, so $r=\sqrt{49}=7$.',
    tol='0')

add('q3', 'mc',
    r'Find the radius of the circle $(x+1)^2+(y-8)^2=12$, giving your answer in exact (surd) form.',
    r'$2\sqrt{3}$',
    r'The radius is $\sqrt{12}$. Simplify the surd by writing $12$ as a product with the largest possible square factor.',
    r'$r=\sqrt{12}=\sqrt{4\times3}=\sqrt{4}\times\sqrt{3}=2\sqrt{3}$.',
    choices=r'$2\sqrt{3}$|$3\sqrt{2}$|$6$|$12$')

add('q4', 'mc',
    r'Find the equation of the circle with centre $(-4,\,3)$ and radius $6$.',
    r'$(x+4)^2+(y-3)^2=36$',
    r'Substitute into $(x-a)^2+(y-b)^2=r^2$. Since $a=-4$, the bracket becomes $(x-(-4))=(x+4)$, and remember to square the radius.',
    r'With $a=-4$, $b=3$ and $r=6$: $(x-(-4))^2+(y-3)^2=6^2$, that is $(x+4)^2+(y-3)^2=36$.',
    choices=r'$(x+4)^2+(y-3)^2=36$|$(x-4)^2+(y+3)^2=36$|$(x+4)^2+(y-3)^2=6$|$(x-4)^2+(y-3)^2=36$')

# Circle on AB as diameter (book Worked example 3.11).
assert mid((3, 0), (7, -4)) == (5, -2)
assert dist2((5, -2), (3, 0)) == 8
add('q5', 'text',
    r'$A$ is the point $(3,\,0)$ and $B$ is the point $(7,\,-4)$. A circle has $AB$ as a diameter. Find the coordinates of its centre. Give your answer in the form (a,b).',
    '(5,-2)',
    r'The centre of a circle is the midpoint of any diameter.',
    r'Centre $=$ midpoint of $AB=\left(\dfrac{3+7}{2},\,\dfrac{0+(-4)}{2}\right)=(5,\,-2)$.')

add('q6', 'numeric',
    r'$A$ is the point $(3,\,0)$ and $B$ is the point $(7,\,-4)$. A circle has $AB$ as a diameter, and its equation is $(x-5)^2+(y+2)^2=k$. Find the value of $k$.',
    '8',
    r'Here $k=r^2$, and the radius is the distance from the centre $(5,-2)$ to either end of the diameter. You do not need the square root - you want $r^2$.',
    r'$r^2=(5-3)^2+(-2-0)^2=4+4=8$, so $k=8$. (Equivalently $r=\sqrt{8}=2\sqrt{2}$.)',
    tol='0')

centre, r2 = circle_from_general(10, -8, -40)
assert centre == (-5, 4) and r2 == 81
add('q7', 'text',
    r'Find the centre of the circle $x^2+y^2+10x-8y-40=0$. Give your answer in the form (a,b).',
    '(-5,4)',
    r'Complete the square in $x$ and in $y$ separately, then compare with $(x-a)^2+(y-b)^2=r^2$.',
    r'$x^2+10x+y^2-8y-40=0\Rightarrow(x+5)^2-25+(y-4)^2-16-40=0\Rightarrow(x+5)^2+(y-4)^2=81$. So the centre is $(-5,\,4)$.')

add('q8', 'numeric',
    r'Find the radius of the circle $x^2+y^2+10x-8y-40=0$.',
    '9',
    r'Complete the square to reach the form $(x-a)^2+(y-b)^2=r^2$, then take the square root of the right-hand side.',
    r'Completing the square gives $(x+5)^2+(y-4)^2=81$, so $r^2=81$ and $r=9$.',
    tol='0')

centre2, r2b = circle_from_general(-6, 4, -12)
assert centre2 == (3, -2) and r2b == 25
add('q9', 'text',
    r'Find the centre of the circle $x^2+y^2-6x+4y-12=0$. Give your answer in the form (a,b).',
    '(3,-2)',
    r'Group the $x$ terms and the $y$ terms, complete the square on each, and move the constants to the right-hand side.',
    r'$x^2-6x+y^2+4y-12=0\Rightarrow(x-3)^2-9+(y+2)^2-4-12=0\Rightarrow(x-3)^2+(y+2)^2=25$. The centre is $(3,\,-2)$.')

add('q10', 'numeric',
    r'Find the radius of the circle $x^2+y^2-6x+4y-12=0$.',
    '5',
    r'After completing the square the equation becomes $(x-3)^2+(y+2)^2=r^2$. Read off $r^2$ and square root it.',
    r'$(x-3)^2+(y+2)^2=9+4+12=25$, so $r^2=25$ and $r=5$.',
    tol='0')

add('q11', 'mc',
    r'Which of these is the equation of the circle with centre the origin and radius $\sqrt{20}$?',
    r'$x^2+y^2=20$',
    r'With centre $(0,\,0)$ the equation $(x-a)^2+(y-b)^2=r^2$ simplifies a great deal. Remember the right-hand side is $r^2$.',
    r'With $a=b=0$ and $r=\sqrt{20}$: $x^2+y^2=(\sqrt{20})^2=20$.',
    choices=r'$x^2+y^2=20$|$x^2+y^2=\sqrt{20}$|$x^2+y^2=400$|$(x-20)^2+(y-20)^2=20$')

# Right angle in a semicircle: is P on the circle with AC as diameter?
assert dist2((0, 0), (6, 0)) == 36
assert dist2((3, 0), (3, 3)) == 9
add('q12', 'mc',
    r'$A(0,\,0)$ and $C(6,\,0)$ are the ends of a diameter of a circle. Which fact tells you immediately that angle $ABC=90^\circ$ for any other point $B$ on the circle?',
    r'The angle in a semicircle is a right angle',
    r'Think about the three circle facts in this section: the angle in a semicircle, the perpendicular from the centre to a chord, and the tangent-radius property.',
    r'$AC$ is a diameter, so any point $B$ on the circumference gives an angle $ABC$ standing in a semicircle - and the angle in a semicircle is a right angle.',
    choices=r'The angle in a semicircle is a right angle|The perpendicular from the centre to a chord bisects the chord|A tangent is perpendicular to the radius at the point of contact|Opposite angles of a cyclic quadrilateral add to $180^\circ$')

# Tangent gradient from radius gradient.
assert dist2((2, 3), (5, 7)) == 25
assert grad((2, 3), (5, 7)) == F(4, 3)
assert perp(F(4, 3)) == F(-3, 4)
add('q13', 'text',
    r'A circle has centre $C(2,\,3)$ and the point $P(5,\,7)$ lies on the circle. Find the gradient of the tangent to the circle at $P$. Give your answer as a fraction in the form a/b.',
    '-3/4',
    r'The tangent at $P$ is perpendicular to the radius $CP$. Find the gradient of $CP$ first, then take the negative reciprocal.',
    r'Gradient of $CP=\dfrac{7-3}{5-2}=\dfrac43$. The tangent is perpendicular to $CP$, so its gradient is $-\dfrac{1}{4/3}=-\dfrac34$.')

# --- 3.5 Intersections of lines and circles ------------------------------
# x = 3y + 10 meets x^2 + y^2 = 20 at (-2,-4) and (4,-2)  (book WE 3.14)
for pt in ((-2, -4), (4, -2)):
    assert pt[0] ** 2 + pt[1] ** 2 == 20
    assert pt[0] == 3 * pt[1] + 10
add('q14', 'numeric',
    r'The line $x=3y+10$ intersects the circle $x^2+y^2=20$ at the points $A$ and $B$. One of them has a positive $x$-coordinate. Find that $x$-coordinate.',
    '4',
    r'Substitute $x=3y+10$ into the circle equation to get a quadratic in $y$. Solve it, then work back to the matching $x$-values.',
    r'$(3y+10)^2+y^2=20\Rightarrow 10y^2+60y+80=0\Rightarrow y^2+6y+8=0\Rightarrow(y+2)(y+4)=0$, so $y=-2$ or $y=-4$. Then $x=4$ or $x=-2$, giving $A(-2,\,-4)$ and $B(4,\,-2)$. The positive $x$-coordinate is $4$.',
    tol='0')

assert mid((-2, -4), (4, -2)) == (1, -3)
add('q15', 'text',
    r'The line $x=3y+10$ intersects the circle $x^2+y^2=20$ at $A(-2,\,-4)$ and $B(4,\,-2)$. Find the midpoint of the chord $AB$. Give your answer in the form (a,b).',
    '(1,-3)',
    r'This is just the midpoint of the two given points - average the $x$-coordinates and average the $y$-coordinates.',
    r'Midpoint $=\left(\dfrac{-2+4}{2},\,\dfrac{-4+(-2)}{2}\right)=(1,\,-3)$.')

assert grad((-2, -4), (4, -2)) == F(1, 3)
assert perp(F(1, 3)) == -3
add('q16', 'numeric',
    r'The chord $AB$ of a circle joins $A(-2,\,-4)$ and $B(4,\,-2)$. Find the gradient of the perpendicular bisector of $AB$.',
    '-3',
    r'The perpendicular bisector of a chord is perpendicular to it (and passes through the centre of the circle). Find the gradient of $AB$, then take the negative reciprocal.',
    r'Gradient of $AB=\dfrac{-2-(-4)}{4-(-2)}=\dfrac{2}{6}=\dfrac13$, so the perpendicular bisector has gradient $-3$.',
    tol='0')

# y = x - 13 is a tangent to x^2+y^2-8x+6y+7=0  (book WE 3.15)
assert disc(1, -14, 49) == 0
add('q17', 'mc',
    r'How many times does the line $y=x-13$ meet the circle $x^2+y^2-8x+6y+7=0$?',
    r'Once - the line is a tangent to the circle',
    r'Substitute $y=x-13$ into the circle equation and simplify to a quadratic in $x$. The discriminant $b^2-4ac$ tells you how many intersection points there are.',
    r'Substituting gives $x^2+(x-13)^2-8x+6(x-13)+7=0\Rightarrow 2x^2-28x+98=0\Rightarrow x^2-14x+49=0\Rightarrow(x-7)^2=0$. The discriminant is $(-14)^2-4(1)(49)=0$, a repeated root, so the line touches the circle once and is a tangent.',
    choices=r'Once - the line is a tangent to the circle|Twice - the line is a chord of the circle|Not at all - the line misses the circle|Three times')

# y = x + k tangent to x^2+y^2=8 -> 2x^2+2kx+k^2-8=0, disc=0 -> k=+-4
assert disc(2, 2 * 4, 4 ** 2 - 8) == 0
assert disc(2, 2 * (-4), (-4) ** 2 - 8) == 0
add('q18', 'numeric',
    r'The line $y=x+k$ is a tangent to the circle $x^2+y^2=8$. Find the positive value of $k$.',
    '4',
    r'Substitute $y=x+k$ into the circle equation to get a quadratic in $x$. A tangent touches the circle exactly once, so set the discriminant equal to zero.',
    r'$x^2+(x+k)^2=8\Rightarrow 2x^2+2kx+k^2-8=0$. For a tangent, $b^2-4ac=0$: $(2k)^2-4(2)(k^2-8)=0\Rightarrow 4k^2-8k^2+64=0\Rightarrow k^2=16$, so $k=\pm4$ and the positive value is $k=4$.',
    tol='0')

assert disc(2, 12, 27) < 0
add('q19', 'numeric',
    r'How many points of intersection does the line $y=x+6$ have with the circle $x^2+y^2=9$? Give your answer as a number.',
    '0',
    r'Substitute and reduce to a quadratic in $x$, then evaluate $b^2-4ac$. A negative discriminant means no real solutions.',
    r'$x^2+(x+6)^2=9\Rightarrow 2x^2+12x+27=0$. The discriminant is $12^2-4(2)(27)=144-216=-72<0$, so there are no real roots and the line does not meet the circle. The answer is $0$.',
    tol='0')

# y = x - 3 meets (x-3)^2+(y+2)^2=20 at (5,2) and (-1,-4)
for pt in ((5, 2), (-1, -4)):
    assert (pt[0] - 3) ** 2 + (pt[1] + 2) ** 2 == 20
    assert pt[1] == pt[0] - 3
assert dist2((5, 2), (-1, -4)) == 72
add('q20', 'numeric',
    r'The line $y=x-3$ meets the circle $(x-3)^2+(y+2)^2=20$ at two points. Find the larger of the two $x$-coordinates.',
    '5',
    r'Substitute $y=x-3$ into the circle equation, expand carefully, and reduce to a quadratic in $x$ that factorises.',
    r'$(x-3)^2+((x-3)+2)^2=20\Rightarrow(x-3)^2+(x-1)^2=20\Rightarrow 2x^2-8x-10=0\Rightarrow x^2-4x-5=0\Rightarrow(x-5)(x+1)=0$. So $x=5$ or $x=-1$, and the points are $(5,\,2)$ and $(-1,\,-4)$. The larger $x$-coordinate is $5$.',
    tol='0')

assert len(Q) == 20, len(Q)
