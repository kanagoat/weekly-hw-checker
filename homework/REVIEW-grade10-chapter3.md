# Grade 10 homework - Cambridge Pure Mathematics 1, Chapter 3

Generated for the HW Checker. Questions follow the IQanat High School of Burabay 10th grade AS-level 2025-26 plan, which allocates 9 hours to Chapter 3 (Coordinate geometry).

Maths is written in `$...$` LaTeX, which the student page renders with KaTeX. All 40 keys were checked against a port of the grader in `Code.gs`.


---

## Grade 10, `week-01` - Coordinate geometry I - points, gradients and straight lines

*Pure Mathematics 1, sections 3.1-3.3*


### 3.1 Length of a line segment and midpoint

**q1** (`numeric`) $A$ is the point $(-4,\,6)$ and $B$ is the point $(2,\,-2)$. Find the length $AB$.

- **Answer:** `10`
- *Hint (unlocks on attempt 3 if below 80%):* Use $AB=\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}$ with $(x_1,y_1)=(-4,6)$ and $(x_2,y_2)=(2,-2)$.
- *Solution (unlocks on passing):* $AB=\sqrt{(2-(-4))^2+(-2-6)^2}=\sqrt{6^2+(-8)^2}=\sqrt{36+64}=\sqrt{100}=10$.

**q2** (`text`) Find the midpoint of the line segment joining $P(-7,\,4)$ and $Q(3,\,-10)$. Give your answer as coordinates in the form (a,b).

- **Answer:** `(-2,-3)`
- *Hint (unlocks on attempt 3 if below 80%):* The midpoint is $\left(\dfrac{x_1+x_2}{2},\,\dfrac{y_1+y_2}{2}\right)$ - average the $x$-values, then average the $y$-values.
- *Solution (unlocks on passing):* Midpoint $=\left(\dfrac{-7+3}{2},\,\dfrac{4+(-10)}{2}\right)=\left(\dfrac{-4}{2},\,\dfrac{-6}{2}\right)=(-2,\,-3)$.

**q3** (`numeric`) Triangle $PQR$ has vertices $P(1,\,6)$, $Q(-2,\,1)$ and $R(3,\,-2)$. The triangle is right-angled and isosceles. Find its area.

- **Answer:** `17`
- *Hint (unlocks on attempt 3 if below 80%):* Find $PQ^2$, $QR^2$ and $PR^2$. Two of them are equal, and the two smaller ones add to the largest - that tells you where the right angle is.
- *Solution (unlocks on passing):* $PQ^2=(-3)^2+(-5)^2=34$, $QR^2=5^2+(-3)^2=34$ and $PR^2=2^2+(-8)^2=68$. Since $34+34=68$, the right angle is at $Q$ and $PQ=QR=\sqrt{34}$. Area $=\tfrac12\times\sqrt{34}\times\sqrt{34}=\tfrac12\times34=17$.

**q4** (`numeric`) The distance between $P(-3,\,-2)$ and $Q(b,\,2b)$ is $10$. Find the positive value of $b$.

- **Answer:** `3`
- *Hint (unlocks on attempt 3 if below 80%):* Square both sides of the distance formula: $(b+3)^2+(2b+2)^2=100$. Expand, collect into a quadratic in $b$, then factorise.
- *Solution (unlocks on passing):* $(b+3)^2+(2b+2)^2=100\Rightarrow b^2+6b+9+4b^2+8b+4=100\Rightarrow 5b^2+14b-87=0\Rightarrow(b-3)(5b+29)=0$. So $b=3$ or $b=-\tfrac{29}{5}$, and the positive value is $b=3$.

**q5** (`numeric`) The point $P(k,\,2k)$ is equidistant from $A(8,\,11)$ and $B(1,\,12)$. Find the value of $k$.

- **Answer:** `4`
- *Hint (unlocks on attempt 3 if below 80%):* Equidistant means $PA^2=PB^2$. Write both out with the distance formula - the $k^2$ terms will cancel, leaving a linear equation.
- *Solution (unlocks on passing):* $PA^2=(k-8)^2+(2k-11)^2=5k^2-60k+185$ and $PB^2=(k-1)^2+(2k-12)^2=5k^2-50k+145$. Setting them equal gives $-60k+185=-50k+145$, so $-10k=-40$ and $k=4$.

**q6** (`text`) Three vertices of a parallelogram $ABCD$ are $A(-5,\,-1)$, $B(-1,\,-4)$ and $C(6,\,-2)$. Find the coordinates of $D$. Give your answer in the form (a,b).

- **Answer:** `(2,1)`
- *Hint (unlocks on attempt 3 if below 80%):* The diagonals of a parallelogram bisect each other, so the midpoint of $BD$ is the same as the midpoint of $AC$.
- *Solution (unlocks on passing):* Midpoint of $AC=\left(\dfrac{-5+6}{2},\,\dfrac{-1+(-2)}{2}\right)=\left(\dfrac12,\,-\dfrac32\right)$. Writing $D=(m,\,n)$: $\dfrac{-1+m}{2}=\dfrac12$ gives $m=2$, and $\dfrac{-4+n}{2}=-\dfrac32$ gives $n=1$. So $D=(2,\,1)$.


### 3.2 Parallel and perpendicular lines

**q7** (`text`) Find the gradient of the line joining $A(-1,\,3)$ and $B(5,\,2)$. Give your answer as a fraction in the form a/b.

- **Answer:** `-1/6`
- *Hint (unlocks on attempt 3 if below 80%):* Gradient $=\dfrac{y_2-y_1}{x_2-x_1}$. Take care with the signs when you subtract a negative $x$-coordinate.
- *Solution (unlocks on passing):* Gradient $=\dfrac{2-3}{5-(-1)}=\dfrac{-1}{6}=-\dfrac16$.

**q8** (`mc`) A line has gradient $\dfrac34$. What is the gradient of any line perpendicular to it?

- [x] $-\dfrac43$
- [ ] $\dfrac43$
- [ ] $-\dfrac34$
- [ ] $\dfrac34$

- *Hint (unlocks on attempt 3 if below 80%):* For perpendicular lines $m_1\times m_2=-1$, so the perpendicular gradient is the negative reciprocal.
- *Solution (unlocks on passing):* $m_2=-\dfrac{1}{m_1}=-\dfrac{1}{3/4}=-\dfrac43$. Check: $\dfrac34\times\left(-\dfrac43\right)=-1$.

**q9** (`mc`) Three points have coordinates $A(-6,\,4)$, $B(4,\,6)$ and $C(10,\,7)$. Are $A$, $B$ and $C$ collinear?

- [x] No - the gradient of $AB$ is $\dfrac15$ but the gradient of $BC$ is $\dfrac16$
- [ ] Yes - both gradients are $\dfrac15$
- [ ] Yes - the three $x$-coordinates increase by a constant amount
- [ ] No - $AB$ and $BC$ have different lengths

- *Hint (unlocks on attempt 3 if below 80%):* Three points are collinear exactly when the gradient of $AB$ equals the gradient of $BC$. Work out both.
- *Solution (unlocks on passing):* Gradient of $AB=\dfrac{6-4}{4-(-6)}=\dfrac{2}{10}=\dfrac15$, and gradient of $BC=\dfrac{7-6}{10-4}=\dfrac16$. The gradients are different, so the points are not collinear.

**q10** (`numeric`) Three points have coordinates $A(7,\,4)$, $B(19,\,8)$ and $C(k,\,2k)$. Find the value of $k$ for which $C$ lies on the line through $A$ and $B$.

- **Answer:** `1`
- *Hint (unlocks on attempt 3 if below 80%):* Find the equation of line $AB$ first, then substitute $x=k$ and $y=2k$ into it.
- *Solution (unlocks on passing):* Gradient of $AB=\dfrac{8-4}{19-7}=\dfrac13$, so $y-4=\dfrac13(x-7)$, which rearranges to $x=3y-5$. Substituting $C(k,\,2k)$ gives $k=3(2k)-5\Rightarrow k=6k-5\Rightarrow 5k=5\Rightarrow k=1$.

**q11** (`numeric`) Three points have coordinates $A(7,\,4)$, $B(19,\,8)$ and $C(k,\,2k)$. Find the value of $k$ for which angle $CAB$ is $90^\circ$.

- **Answer:** `5`
- *Hint (unlocks on attempt 3 if below 80%):* Angle $CAB=90^\circ$ means $AC$ is perpendicular to $AB$, so (gradient of $AC$) $\times$ (gradient of $AB$) $=-1$.
- *Solution (unlocks on passing):* Gradient of $AB=\dfrac13$, so the gradient of $AC$ must be $-3$. Then $\dfrac{2k-4}{k-7}=-3\Rightarrow 2k-4=-3k+21\Rightarrow 5k=25\Rightarrow k=5$.

**q12** (`numeric`) $A$ is the point $(0,\,8)$ and $B$ is the point $(8,\,6)$. The point $C$ lies on the $y$-axis so that angle $ABC$ is $90^\circ$. Find the $y$-coordinate of $C$.

- **Answer:** `-26`
- *Hint (unlocks on attempt 3 if below 80%):* The right angle is at $B$, so $BC$ is perpendicular to $BA$. Find the gradient of $BA$ first, then write $C=(0,\,c)$.
- *Solution (unlocks on passing):* Gradient of $BA=\dfrac{8-6}{0-8}=-\dfrac14$, so the gradient of $BC$ is $4$. With $C=(0,\,c)$: $\dfrac{c-6}{0-8}=4\Rightarrow c-6=-32\Rightarrow c=-26$.


### 3.3 Equations of straight lines

**q13** (`text`) Find the equation of the line with gradient $2$ that passes through the point $(4,\,9)$. Give your answer in the form y=mx+c.

- **Answer:** `y=2x+1`
- *Hint (unlocks on attempt 3 if below 80%):* Use $y-y_1=m(x-x_1)$ with $m=2$, $x_1=4$ and $y_1=9$, then rearrange to make $y$ the subject.
- *Solution (unlocks on passing):* $y-9=2(x-4)\Rightarrow y-9=2x-8\Rightarrow y=2x+1$.

**q14** (`text`) Find the equation of the line passing through $(-2,\,1)$ and $(3,\,11)$. Give your answer in the form y=mx+c.

- **Answer:** `y=2x+5`
- *Hint (unlocks on attempt 3 if below 80%):* Find the gradient from the two points first, then use $y-y_1=m(x-x_1)$ with either of them.
- *Solution (unlocks on passing):* Gradient $=\dfrac{11-1}{3-(-2)}=\dfrac{10}{5}=2$. Then $y-1=2(x+2)\Rightarrow y-1=2x+4\Rightarrow y=2x+5$.

**q15** (`text`) Find the equation of the line with gradient $-2$ that passes through the point $(4,\,1)$. Give your answer in the form y=mx+c.

- **Answer:** `y=-2x+9`
- *Hint (unlocks on attempt 3 if below 80%):* Use $y-y_1=m(x-x_1)$ with $m=-2$, $x_1=4$ and $y_1=1$. Take care with the signs when expanding.
- *Solution (unlocks on passing):* $y-1=-2(x-4)\Rightarrow y-1=-2x+8\Rightarrow y=-2x+9$, which can also be written as $2x+y=9$.

**q16** (`numeric`) Find the gradient of the perpendicular bisector of the line segment joining $A(-5,\,1)$ and $B(7,\,-2)$.

- **Answer:** `4`
- *Hint (unlocks on attempt 3 if below 80%):* The perpendicular bisector is perpendicular to $AB$, so find the gradient of $AB$ and take its negative reciprocal.
- *Solution (unlocks on passing):* Gradient of $AB=\dfrac{-2-1}{7-(-5)}=\dfrac{-3}{12}=-\dfrac14$. The perpendicular gradient is $-\dfrac{1}{-1/4}=4$.

**q17** (`numeric`) The perpendicular bisector of the line segment joining $A(1,\,2)$ and $B(5,\,10)$ can be written as $x+2y=c$. Find the value of $c$.

- **Answer:** `15`
- *Hint (unlocks on attempt 3 if below 80%):* You need two things: the midpoint of $AB$, which the bisector passes through, and the negative reciprocal of the gradient of $AB$.
- *Solution (unlocks on passing):* Midpoint of $AB=(3,\,6)$ and gradient of $AB=\dfrac{10-2}{5-1}=2$, so the perpendicular gradient is $-\dfrac12$. Then $y-6=-\dfrac12(x-3)\Rightarrow 2y-12=-x+3\Rightarrow x+2y=15$, so $c=15$.

**q18** (`mc`) Which of these lines is parallel to $2x+3y=12$?

- [x] $y=-\dfrac23x+5$
- [ ] $y=\dfrac23x+4$
- [ ] $y=\dfrac32x-12$
- [ ] $y=-\dfrac32x+4$

- *Hint (unlocks on attempt 3 if below 80%):* Rearrange $2x+3y=12$ into the form $y=mx+c$ so you can read off its gradient. Parallel lines have equal gradients.
- *Solution (unlocks on passing):* $2x+3y=12\Rightarrow 3y=-2x+12\Rightarrow y=-\dfrac23x+4$, so the gradient is $-\dfrac23$. The line $y=-\dfrac23x+5$ has the same gradient but a different $y$-intercept, so it is parallel.

**q19** (`numeric`) The line $y=-2x+8$ crosses the $x$-axis at $A$ and the $y$-axis at $B$. Find the area of triangle $OAB$, where $O$ is the origin.

- **Answer:** `16`
- *Hint (unlocks on attempt 3 if below 80%):* Put $y=0$ to find $A$, and $x=0$ to find $B$. The triangle is right-angled at the origin, so the two intercepts are its base and height.
- *Solution (unlocks on passing):* When $y=0$: $0=-2x+8\Rightarrow x=4$, so $A(4,\,0)$. When $x=0$: $y=8$, so $B(0,\,8)$. Area $=\tfrac12\times4\times8=16$.

**q20** (`text`) The line $y=x-3$ meets the curve $y^2=4x$ at the points $A$ and $B$. Find the midpoint of $AB$. Give your answer in the form (a,b).

- **Answer:** `(5,2)`
- *Hint (unlocks on attempt 3 if below 80%):* Substitute $y=x-3$ into $y^2=4x$ to get a quadratic in $x$. Solve it, find the matching $y$-values, then average each coordinate.
- *Solution (unlocks on passing):* $(x-3)^2=4x\Rightarrow x^2-10x+9=0\Rightarrow(x-1)(x-9)=0$, so $x=1$ or $x=9$, giving $A(1,\,-2)$ and $B(9,\,6)$. Midpoint $=\left(\dfrac{1+9}{2},\,\dfrac{-2+6}{2}\right)=(5,\,2)$.


---

## Grade 10, `week-02` - Coordinate geometry II - circles, and intersections of lines and circles

*Pure Mathematics 1, sections 3.4-3.5*


### 3.4 The equation of a circle

**q1** (`text`) Write down the coordinates of the centre of the circle $(x-2)^2+(y+5)^2=49$. Give your answer in the form (a,b).

- **Answer:** `(2,-5)`
- *Hint (unlocks on attempt 3 if below 80%):* Compare with $(x-a)^2+(y-b)^2=r^2$, whose centre is $(a,\,b)$. Note that $(y+5)$ means $b=-5$, not $+5$.
- *Solution (unlocks on passing):* $(x-2)^2+(y+5)^2=49$ is $(x-2)^2+(y-(-5))^2=7^2$, so $a=2$ and $b=-5$. The centre is $(2,\,-5)$.

**q2** (`numeric`) Find the radius of the circle $(x-2)^2+(y+5)^2=49$.

- **Answer:** `7`
- *Hint (unlocks on attempt 3 if below 80%):* In $(x-a)^2+(y-b)^2=r^2$ the right-hand side is $r^2$, not $r$ - take the square root.
- *Solution (unlocks on passing):* $r^2=49$, so $r=\sqrt{49}=7$.

**q3** (`mc`) Find the radius of the circle $(x+1)^2+(y-8)^2=12$, giving your answer in exact (surd) form.

- [x] $2\sqrt{3}$
- [ ] $3\sqrt{2}$
- [ ] $6$
- [ ] $12$

- *Hint (unlocks on attempt 3 if below 80%):* The radius is $\sqrt{12}$. Simplify the surd by writing $12$ as a product with the largest possible square factor.
- *Solution (unlocks on passing):* $r=\sqrt{12}=\sqrt{4\times3}=\sqrt{4}\times\sqrt{3}=2\sqrt{3}$.

**q4** (`mc`) Find the equation of the circle with centre $(-4,\,3)$ and radius $6$.

- [x] $(x+4)^2+(y-3)^2=36$
- [ ] $(x-4)^2+(y+3)^2=36$
- [ ] $(x+4)^2+(y-3)^2=6$
- [ ] $(x-4)^2+(y-3)^2=36$

- *Hint (unlocks on attempt 3 if below 80%):* Substitute into $(x-a)^2+(y-b)^2=r^2$. Since $a=-4$, the bracket becomes $(x-(-4))=(x+4)$, and remember to square the radius.
- *Solution (unlocks on passing):* With $a=-4$, $b=3$ and $r=6$: $(x-(-4))^2+(y-3)^2=6^2$, that is $(x+4)^2+(y-3)^2=36$.

**q5** (`text`) $A$ is the point $(3,\,0)$ and $B$ is the point $(7,\,-4)$. A circle has $AB$ as a diameter. Find the coordinates of its centre. Give your answer in the form (a,b).

- **Answer:** `(5,-2)`
- *Hint (unlocks on attempt 3 if below 80%):* The centre of a circle is the midpoint of any diameter.
- *Solution (unlocks on passing):* Centre $=$ midpoint of $AB=\left(\dfrac{3+7}{2},\,\dfrac{0+(-4)}{2}\right)=(5,\,-2)$.

**q6** (`numeric`) $A$ is the point $(3,\,0)$ and $B$ is the point $(7,\,-4)$. A circle has $AB$ as a diameter, and its equation is $(x-5)^2+(y+2)^2=k$. Find the value of $k$.

- **Answer:** `8`
- *Hint (unlocks on attempt 3 if below 80%):* Here $k=r^2$, and the radius is the distance from the centre $(5,-2)$ to either end of the diameter. You do not need the square root - you want $r^2$.
- *Solution (unlocks on passing):* $r^2=(5-3)^2+(-2-0)^2=4+4=8$, so $k=8$. (Equivalently $r=\sqrt{8}=2\sqrt{2}$.)

**q7** (`text`) Find the centre of the circle $x^2+y^2+10x-8y-40=0$. Give your answer in the form (a,b).

- **Answer:** `(-5,4)`
- *Hint (unlocks on attempt 3 if below 80%):* Complete the square in $x$ and in $y$ separately, then compare with $(x-a)^2+(y-b)^2=r^2$.
- *Solution (unlocks on passing):* $x^2+10x+y^2-8y-40=0\Rightarrow(x+5)^2-25+(y-4)^2-16-40=0\Rightarrow(x+5)^2+(y-4)^2=81$. So the centre is $(-5,\,4)$.

**q8** (`numeric`) Find the radius of the circle $x^2+y^2+10x-8y-40=0$.

- **Answer:** `9`
- *Hint (unlocks on attempt 3 if below 80%):* Complete the square to reach the form $(x-a)^2+(y-b)^2=r^2$, then take the square root of the right-hand side.
- *Solution (unlocks on passing):* Completing the square gives $(x+5)^2+(y-4)^2=81$, so $r^2=81$ and $r=9$.

**q9** (`text`) Find the centre of the circle $x^2+y^2-6x+4y-12=0$. Give your answer in the form (a,b).

- **Answer:** `(3,-2)`
- *Hint (unlocks on attempt 3 if below 80%):* Group the $x$ terms and the $y$ terms, complete the square on each, and move the constants to the right-hand side.
- *Solution (unlocks on passing):* $x^2-6x+y^2+4y-12=0\Rightarrow(x-3)^2-9+(y+2)^2-4-12=0\Rightarrow(x-3)^2+(y+2)^2=25$. The centre is $(3,\,-2)$.

**q10** (`numeric`) Find the radius of the circle $x^2+y^2-6x+4y-12=0$.

- **Answer:** `5`
- *Hint (unlocks on attempt 3 if below 80%):* After completing the square the equation becomes $(x-3)^2+(y+2)^2=r^2$. Read off $r^2$ and square root it.
- *Solution (unlocks on passing):* $(x-3)^2+(y+2)^2=9+4+12=25$, so $r^2=25$ and $r=5$.

**q11** (`mc`) Which of these is the equation of the circle with centre the origin and radius $\sqrt{20}$?

- [x] $x^2+y^2=20$
- [ ] $x^2+y^2=\sqrt{20}$
- [ ] $x^2+y^2=400$
- [ ] $(x-20)^2+(y-20)^2=20$

- *Hint (unlocks on attempt 3 if below 80%):* With centre $(0,\,0)$ the equation $(x-a)^2+(y-b)^2=r^2$ simplifies a great deal. Remember the right-hand side is $r^2$.
- *Solution (unlocks on passing):* With $a=b=0$ and $r=\sqrt{20}$: $x^2+y^2=(\sqrt{20})^2=20$.

**q12** (`mc`) $A(0,\,0)$ and $C(6,\,0)$ are the ends of a diameter of a circle. Which fact tells you immediately that angle $ABC=90^\circ$ for any other point $B$ on the circle?

- [x] The angle in a semicircle is a right angle
- [ ] The perpendicular from the centre to a chord bisects the chord
- [ ] A tangent is perpendicular to the radius at the point of contact
- [ ] Opposite angles of a cyclic quadrilateral add to $180^\circ$

- *Hint (unlocks on attempt 3 if below 80%):* Think about the three circle facts in this section: the angle in a semicircle, the perpendicular from the centre to a chord, and the tangent-radius property.
- *Solution (unlocks on passing):* $AC$ is a diameter, so any point $B$ on the circumference gives an angle $ABC$ standing in a semicircle - and the angle in a semicircle is a right angle.

**q13** (`text`) A circle has centre $C(2,\,3)$ and the point $P(5,\,7)$ lies on the circle. Find the gradient of the tangent to the circle at $P$. Give your answer as a fraction in the form a/b.

- **Answer:** `-3/4`
- *Hint (unlocks on attempt 3 if below 80%):* The tangent at $P$ is perpendicular to the radius $CP$. Find the gradient of $CP$ first, then take the negative reciprocal.
- *Solution (unlocks on passing):* Gradient of $CP=\dfrac{7-3}{5-2}=\dfrac43$. The tangent is perpendicular to $CP$, so its gradient is $-\dfrac{1}{4/3}=-\dfrac34$.


### 3.5 Problems involving intersections of lines and circles

**q14** (`numeric`) The line $x=3y+10$ intersects the circle $x^2+y^2=20$ at the points $A$ and $B$. One of them has a positive $x$-coordinate. Find that $x$-coordinate.

- **Answer:** `4`
- *Hint (unlocks on attempt 3 if below 80%):* Substitute $x=3y+10$ into the circle equation to get a quadratic in $y$. Solve it, then work back to the matching $x$-values.
- *Solution (unlocks on passing):* $(3y+10)^2+y^2=20\Rightarrow 10y^2+60y+80=0\Rightarrow y^2+6y+8=0\Rightarrow(y+2)(y+4)=0$, so $y=-2$ or $y=-4$. Then $x=4$ or $x=-2$, giving $A(-2,\,-4)$ and $B(4,\,-2)$. The positive $x$-coordinate is $4$.

**q15** (`text`) The line $x=3y+10$ intersects the circle $x^2+y^2=20$ at $A(-2,\,-4)$ and $B(4,\,-2)$. Find the midpoint of the chord $AB$. Give your answer in the form (a,b).

- **Answer:** `(1,-3)`
- *Hint (unlocks on attempt 3 if below 80%):* This is just the midpoint of the two given points - average the $x$-coordinates and average the $y$-coordinates.
- *Solution (unlocks on passing):* Midpoint $=\left(\dfrac{-2+4}{2},\,\dfrac{-4+(-2)}{2}\right)=(1,\,-3)$.

**q16** (`numeric`) The chord $AB$ of a circle joins $A(-2,\,-4)$ and $B(4,\,-2)$. Find the gradient of the perpendicular bisector of $AB$.

- **Answer:** `-3`
- *Hint (unlocks on attempt 3 if below 80%):* The perpendicular bisector of a chord is perpendicular to it (and passes through the centre of the circle). Find the gradient of $AB$, then take the negative reciprocal.
- *Solution (unlocks on passing):* Gradient of $AB=\dfrac{-2-(-4)}{4-(-2)}=\dfrac{2}{6}=\dfrac13$, so the perpendicular bisector has gradient $-3$.

**q17** (`mc`) How many times does the line $y=x-13$ meet the circle $x^2+y^2-8x+6y+7=0$?

- [x] Once - the line is a tangent to the circle
- [ ] Twice - the line is a chord of the circle
- [ ] Not at all - the line misses the circle
- [ ] Three times

- *Hint (unlocks on attempt 3 if below 80%):* Substitute $y=x-13$ into the circle equation and simplify to a quadratic in $x$. The discriminant $b^2-4ac$ tells you how many intersection points there are.
- *Solution (unlocks on passing):* Substituting gives $x^2+(x-13)^2-8x+6(x-13)+7=0\Rightarrow 2x^2-28x+98=0\Rightarrow x^2-14x+49=0\Rightarrow(x-7)^2=0$. The discriminant is $(-14)^2-4(1)(49)=0$, a repeated root, so the line touches the circle once and is a tangent.

**q18** (`numeric`) The line $y=x+k$ is a tangent to the circle $x^2+y^2=8$. Find the positive value of $k$.

- **Answer:** `4`
- *Hint (unlocks on attempt 3 if below 80%):* Substitute $y=x+k$ into the circle equation to get a quadratic in $x$. A tangent touches the circle exactly once, so set the discriminant equal to zero.
- *Solution (unlocks on passing):* $x^2+(x+k)^2=8\Rightarrow 2x^2+2kx+k^2-8=0$. For a tangent, $b^2-4ac=0$: $(2k)^2-4(2)(k^2-8)=0\Rightarrow 4k^2-8k^2+64=0\Rightarrow k^2=16$, so $k=\pm4$ and the positive value is $k=4$.

**q19** (`numeric`) How many points of intersection does the line $y=x+6$ have with the circle $x^2+y^2=9$? Give your answer as a number.

- **Answer:** `0`
- *Hint (unlocks on attempt 3 if below 80%):* Substitute and reduce to a quadratic in $x$, then evaluate $b^2-4ac$. A negative discriminant means no real solutions.
- *Solution (unlocks on passing):* $x^2+(x+6)^2=9\Rightarrow 2x^2+12x+27=0$. The discriminant is $12^2-4(2)(27)=144-216=-72<0$, so there are no real roots and the line does not meet the circle. The answer is $0$.

**q20** (`numeric`) The line $y=x-3$ meets the circle $(x-3)^2+(y+2)^2=20$ at two points. Find the larger of the two $x$-coordinates.

- **Answer:** `5`
- *Hint (unlocks on attempt 3 if below 80%):* Substitute $y=x-3$ into the circle equation, expand carefully, and reduce to a quadratic in $x$ that factorises.
- *Solution (unlocks on passing):* $(x-3)^2+((x-3)+2)^2=20\Rightarrow(x-3)^2+(x-1)^2=20\Rightarrow 2x^2-8x-10=0\Rightarrow x^2-4x-5=0\Rightarrow(x-5)(x+1)=0$. So $x=5$ or $x=-1$, and the points are $(5,\,2)$ and $(-1,\,-4)$. The larger $x$-coordinate is $5$.
