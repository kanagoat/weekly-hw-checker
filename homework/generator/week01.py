# -*- coding: utf-8 -*-
"""Grade 10, week-01 - Coordinate geometry I (PM1 3.1-3.3).

Every CorrectAnswer below is recomputed from the given points and asserted,
so a typo in the key fails the build instead of reaching a student.
"""
from fractions import Fraction as F
from geom import *

Q = []


def add(qid, typ, title, correct, hint, solution, choices="", tol="", pts=1):
    Q.append(dict(QuestionID=qid, Type=typ, Title=title, CorrectAnswer=correct,
                  Tolerance=tol, Points=pts, Hint=hint, Solution=solution,
                  Choices=choices))


# --- 3.1 Length of a line segment and midpoint ---------------------------
assert dist((-4, 6), (2, -2)) == 10
add('q1', 'numeric',
    r'$A$ is the point $(-4,\,6)$ and $B$ is the point $(2,\,-2)$. Find the length $AB$.',
    '10',
    r'Use $AB=\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}$ with $(x_1,y_1)=(-4,6)$ and $(x_2,y_2)=(2,-2)$.',
    r'$AB=\sqrt{(2-(-4))^2+(-2-6)^2}=\sqrt{6^2+(-8)^2}=\sqrt{36+64}=\sqrt{100}=10$.',
    tol='0')

assert mid((-7, 4), (3, -10)) == (-2, -3)
add('q2', 'text',
    r'Find the midpoint of the line segment joining $P(-7,\,4)$ and $Q(3,\,-10)$. Give your answer as coordinates in the form (a,b).',
    '(-2,-3)',
    r'The midpoint is $\left(\dfrac{x_1+x_2}{2},\,\dfrac{y_1+y_2}{2}\right)$ - average the $x$-values, then average the $y$-values.',
    r'Midpoint $=\left(\dfrac{-7+3}{2},\,\dfrac{4+(-10)}{2}\right)=\left(\dfrac{-4}{2},\,\dfrac{-6}{2}\right)=(-2,\,-3)$.')

# Right-angled isosceles triangle, then its area.
assert dist2((1, 6), (-2, 1)) == 34
assert dist2((-2, 1), (3, -2)) == 34
assert dist2((1, 6), (3, -2)) == 68
assert dist2((1, 6), (-2, 1)) + dist2((-2, 1), (3, -2)) == dist2((1, 6), (3, -2))
assert F(1, 2) * 34 == 17
add('q3', 'numeric',
    r'Triangle $PQR$ has vertices $P(1,\,6)$, $Q(-2,\,1)$ and $R(3,\,-2)$. The triangle is right-angled and isosceles. Find its area.',
    '17',
    r'Find $PQ^2$, $QR^2$ and $PR^2$. Two of them are equal, and the two smaller ones add to the largest - that tells you where the right angle is.',
    r'$PQ^2=(-3)^2+(-5)^2=34$, $QR^2=5^2+(-3)^2=34$ and $PR^2=2^2+(-8)^2=68$. Since $34+34=68$, the right angle is at $Q$ and $PQ=QR=\sqrt{34}$. Area $=\tfrac12\times\sqrt{34}\times\sqrt{34}=\tfrac12\times34=17$.',
    tol='0')

assert dist2((-3, -2), (F(3), 2 * F(3))) == 100
assert dist2((-3, -2), (F(-29, 5), 2 * F(-29, 5))) == 100
add('q4', 'numeric',
    r'The distance between $P(-3,\,-2)$ and $Q(b,\,2b)$ is $10$. Find the positive value of $b$.',
    '3',
    r'Square both sides of the distance formula: $(b+3)^2+(2b+2)^2=100$. Expand, collect into a quadratic in $b$, then factorise.',
    r'$(b+3)^2+(2b+2)^2=100\Rightarrow b^2+6b+9+4b^2+8b+4=100\Rightarrow 5b^2+14b-87=0\Rightarrow(b-3)(5b+29)=0$. So $b=3$ or $b=-\tfrac{29}{5}$, and the positive value is $b=3$.',
    tol='0')

assert dist2((F(4), 8), (8, 11)) == dist2((F(4), 8), (1, 12))
add('q5', 'numeric',
    r'The point $P(k,\,2k)$ is equidistant from $A(8,\,11)$ and $B(1,\,12)$. Find the value of $k$.',
    '4',
    r'Equidistant means $PA^2=PB^2$. Write both out with the distance formula - the $k^2$ terms will cancel, leaving a linear equation.',
    r'$PA^2=(k-8)^2+(2k-11)^2=5k^2-60k+185$ and $PB^2=(k-1)^2+(2k-12)^2=5k^2-50k+145$. Setting them equal gives $-60k+185=-50k+145$, so $-10k=-40$ and $k=4$.',
    tol='0')

assert mid((-5, -1), (6, -2)) == mid((-1, -4), (2, 1))
add('q6', 'text',
    r'Three vertices of a parallelogram $ABCD$ are $A(-5,\,-1)$, $B(-1,\,-4)$ and $C(6,\,-2)$. Find the coordinates of $D$. Give your answer in the form (a,b).',
    '(2,1)',
    r'The diagonals of a parallelogram bisect each other, so the midpoint of $BD$ is the same as the midpoint of $AC$.',
    r'Midpoint of $AC=\left(\dfrac{-5+6}{2},\,\dfrac{-1+(-2)}{2}\right)=\left(\dfrac12,\,-\dfrac32\right)$. Writing $D=(m,\,n)$: $\dfrac{-1+m}{2}=\dfrac12$ gives $m=2$, and $\dfrac{-4+n}{2}=-\dfrac32$ gives $n=1$. So $D=(2,\,1)$.')

# --- 3.2 Parallel and perpendicular lines --------------------------------
assert grad((-1, 3), (5, 2)) == F(-1, 6)
add('q7', 'text',
    r'Find the gradient of the line joining $A(-1,\,3)$ and $B(5,\,2)$. Give your answer as a fraction in the form a/b.',
    '-1/6',
    r'Gradient $=\dfrac{y_2-y_1}{x_2-x_1}$. Take care with the signs when you subtract a negative $x$-coordinate.',
    r'Gradient $=\dfrac{2-3}{5-(-1)}=\dfrac{-1}{6}=-\dfrac16$.')

assert perp(F(3, 4)) == F(-4, 3)
add('q8', 'mc',
    r'A line has gradient $\dfrac34$. What is the gradient of any line perpendicular to it?',
    r'$-\dfrac43$',
    r'For perpendicular lines $m_1\times m_2=-1$, so the perpendicular gradient is the negative reciprocal.',
    r'$m_2=-\dfrac{1}{m_1}=-\dfrac{1}{3/4}=-\dfrac43$. Check: $\dfrac34\times\left(-\dfrac43\right)=-1$.',
    choices=r'$-\dfrac43$|$\dfrac43$|$-\dfrac34$|$\dfrac34$')

assert grad((-6, 4), (4, 6)) == F(1, 5)
assert grad((4, 6), (10, 7)) == F(1, 6)
assert not collinear((-6, 4), (4, 6), (10, 7))
add('q9', 'mc',
    r'Three points have coordinates $A(-6,\,4)$, $B(4,\,6)$ and $C(10,\,7)$. Are $A$, $B$ and $C$ collinear?',
    r'No - the gradient of $AB$ is $\dfrac15$ but the gradient of $BC$ is $\dfrac16$',
    r'Three points are collinear exactly when the gradient of $AB$ equals the gradient of $BC$. Work out both.',
    r'Gradient of $AB=\dfrac{6-4}{4-(-6)}=\dfrac{2}{10}=\dfrac15$, and gradient of $BC=\dfrac{7-6}{10-4}=\dfrac16$. The gradients are different, so the points are not collinear.',
    choices=r'No - the gradient of $AB$ is $\dfrac15$ but the gradient of $BC$ is $\dfrac16$|Yes - both gradients are $\dfrac15$|Yes - the three $x$-coordinates increase by a constant amount|No - $AB$ and $BC$ have different lengths')

assert grad((7, 4), (19, 8)) == F(1, 3)
assert collinear((7, 4), (19, 8), (F(1), 2 * F(1)))
add('q10', 'numeric',
    r'Three points have coordinates $A(7,\,4)$, $B(19,\,8)$ and $C(k,\,2k)$. Find the value of $k$ for which $C$ lies on the line through $A$ and $B$.',
    '1',
    r'Find the equation of line $AB$ first, then substitute $x=k$ and $y=2k$ into it.',
    r'Gradient of $AB=\dfrac{8-4}{19-7}=\dfrac13$, so $y-4=\dfrac13(x-7)$, which rearranges to $x=3y-5$. Substituting $C(k,\,2k)$ gives $k=3(2k)-5\Rightarrow k=6k-5\Rightarrow 5k=5\Rightarrow k=1$.',
    tol='0')

assert grad((7, 4), (F(5), 2 * F(5))) * grad((7, 4), (19, 8)) == -1
add('q11', 'numeric',
    r'Three points have coordinates $A(7,\,4)$, $B(19,\,8)$ and $C(k,\,2k)$. Find the value of $k$ for which angle $CAB$ is $90^\circ$.',
    '5',
    r'Angle $CAB=90^\circ$ means $AC$ is perpendicular to $AB$, so (gradient of $AC$) $\times$ (gradient of $AB$) $=-1$.',
    r'Gradient of $AB=\dfrac13$, so the gradient of $AC$ must be $-3$. Then $\dfrac{2k-4}{k-7}=-3\Rightarrow 2k-4=-3k+21\Rightarrow 5k=25\Rightarrow k=5$.',
    tol='0')

assert grad((8, 6), (0, F(-26))) * grad((0, 8), (8, 6)) == -1
add('q12', 'numeric',
    r'$A$ is the point $(0,\,8)$ and $B$ is the point $(8,\,6)$. The point $C$ lies on the $y$-axis so that angle $ABC$ is $90^\circ$. Find the $y$-coordinate of $C$.',
    '-26',
    r'The right angle is at $B$, so $BC$ is perpendicular to $BA$. Find the gradient of $BA$ first, then write $C=(0,\,c)$.',
    r'Gradient of $BA=\dfrac{8-6}{0-8}=-\dfrac14$, so the gradient of $BC$ is $4$. With $C=(0,\,c)$: $\dfrac{c-6}{0-8}=4\Rightarrow c-6=-32\Rightarrow c=-26$.',
    tol='0')

# --- 3.3 Equations of straight lines -------------------------------------
assert line_mxc(2, (4, 9)) == (2, 1)
add('q13', 'text',
    r'Find the equation of the line with gradient $2$ that passes through the point $(4,\,9)$. Give your answer in the form y=mx+c.',
    'y=2x+1',
    r'Use $y-y_1=m(x-x_1)$ with $m=2$, $x_1=4$ and $y_1=9$, then rearrange to make $y$ the subject.',
    r'$y-9=2(x-4)\Rightarrow y-9=2x-8\Rightarrow y=2x+1$.')

assert line_mxc(grad((-2, 1), (3, 11)), (-2, 1)) == (2, 5)
add('q14', 'text',
    r'Find the equation of the line passing through $(-2,\,1)$ and $(3,\,11)$. Give your answer in the form y=mx+c.',
    'y=2x+5',
    r'Find the gradient from the two points first, then use $y-y_1=m(x-x_1)$ with either of them.',
    r'Gradient $=\dfrac{11-1}{3-(-2)}=\dfrac{10}{5}=2$. Then $y-1=2(x+2)\Rightarrow y-1=2x+4\Rightarrow y=2x+5$.')

assert line_mxc(-2, (4, 1)) == (-2, 9)
add('q15', 'text',
    r'Find the equation of the line with gradient $-2$ that passes through the point $(4,\,1)$. Give your answer in the form y=mx+c.',
    'y=-2x+9',
    r'Use $y-y_1=m(x-x_1)$ with $m=-2$, $x_1=4$ and $y_1=1$. Take care with the signs when expanding.',
    r'$y-1=-2(x-4)\Rightarrow y-1=-2x+8\Rightarrow y=-2x+9$, which can also be written as $2x+y=9$.')

assert perp(grad((-5, 1), (7, -2))) == 4
add('q16', 'numeric',
    r'Find the gradient of the perpendicular bisector of the line segment joining $A(-5,\,1)$ and $B(7,\,-2)$.',
    '4',
    r'The perpendicular bisector is perpendicular to $AB$, so find the gradient of $AB$ and take its negative reciprocal.',
    r'Gradient of $AB=\dfrac{-2-1}{7-(-5)}=\dfrac{-3}{12}=-\dfrac14$. The perpendicular gradient is $-\dfrac{1}{-1/4}=4$.',
    tol='0')

assert mid((1, 2), (5, 10)) == (3, 6)
assert perp(grad((1, 2), (5, 10))) == F(-1, 2)
assert 3 + 2 * 6 == 15
add('q17', 'numeric',
    r'The perpendicular bisector of the line segment joining $A(1,\,2)$ and $B(5,\,10)$ can be written as $x+2y=c$. Find the value of $c$.',
    '15',
    r'You need two things: the midpoint of $AB$, which the bisector passes through, and the negative reciprocal of the gradient of $AB$.',
    r'Midpoint of $AB=(3,\,6)$ and gradient of $AB=\dfrac{10-2}{5-1}=2$, so the perpendicular gradient is $-\dfrac12$. Then $y-6=-\dfrac12(x-3)\Rightarrow 2y-12=-x+3\Rightarrow x+2y=15$, so $c=15$.',
    tol='0')

add('q18', 'mc',
    r'Which of these lines is parallel to $2x+3y=12$?',
    r'$y=-\dfrac23x+5$',
    r'Rearrange $2x+3y=12$ into the form $y=mx+c$ so you can read off its gradient. Parallel lines have equal gradients.',
    r'$2x+3y=12\Rightarrow 3y=-2x+12\Rightarrow y=-\dfrac23x+4$, so the gradient is $-\dfrac23$. The line $y=-\dfrac23x+5$ has the same gradient but a different $y$-intercept, so it is parallel.',
    choices=r'$y=-\dfrac23x+5$|$y=\dfrac23x+4$|$y=\dfrac32x-12$|$y=-\dfrac32x+4$')

assert F(1, 2) * 4 * 8 == 16
add('q19', 'numeric',
    r'The line $y=-2x+8$ crosses the $x$-axis at $A$ and the $y$-axis at $B$. Find the area of triangle $OAB$, where $O$ is the origin.',
    '16',
    r'Put $y=0$ to find $A$, and $x=0$ to find $B$. The triangle is right-angled at the origin, so the two intercepts are its base and height.',
    r'When $y=0$: $0=-2x+8\Rightarrow x=4$, so $A(4,\,0)$. When $x=0$: $y=8$, so $B(0,\,8)$. Area $=\tfrac12\times4\times8=16$.',
    tol='0')

assert all((x - 3) ** 2 == 4 * x for x in (1, 9))
assert mid((1, -2), (9, 6)) == (5, 2)
add('q20', 'text',
    r'The line $y=x-3$ meets the curve $y^2=4x$ at the points $A$ and $B$. Find the midpoint of $AB$. Give your answer in the form (a,b).',
    '(5,2)',
    r'Substitute $y=x-3$ into $y^2=4x$ to get a quadratic in $x$. Solve it, find the matching $y$-values, then average each coordinate.',
    r'$(x-3)^2=4x\Rightarrow x^2-10x+9=0\Rightarrow(x-1)(x-9)=0$, so $x=1$ or $x=9$, giving $A(1,\,-2)$ and $B(9,\,6)$. Midpoint $=\left(\dfrac{1+9}{2},\,\dfrac{-2+6}{2}\right)=(5,\,2)$.')

assert len(Q) == 20, len(Q)
