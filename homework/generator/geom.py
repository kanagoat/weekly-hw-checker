"""Shared exact coordinate-geometry helpers used to verify every answer."""
from fractions import Fraction as F
import math

def sub(p, q):   return (p[0]-q[0], p[1]-q[1])
def dist2(p, q): d = sub(p, q); return d[0]*d[0] + d[1]*d[1]
def dist(p, q):
    d2 = dist2(p, q); r = math.isqrt(int(d2)) if float(d2).is_integer() else None
    return r if (r is not None and r*r == d2) else math.sqrt(d2)
def mid(p, q):   return (F(p[0]+q[0], 2), F(p[1]+q[1], 2))
def grad(p, q):
    if q[0] == p[0]: return None
    return F(q[1]-p[1], q[0]-p[0])
def perp(m):
    if m == 0: return None
    return -1/F(m)
def collinear(a, b, c): return (b[0]-a[0])*(c[1]-a[1]) == (c[0]-a[0])*(b[1]-a[1])

def fmt_pt(p):
    def n(v):
        v = F(v)
        return str(v.numerator) if v.denominator == 1 else f"{v.numerator}/{v.denominator}"
    return f"({n(p[0])},{n(p[1])})"

def fmt_frac(v):
    v = F(v)
    return str(v.numerator) if v.denominator == 1 else f"{v.numerator}/{v.denominator}"

def line_mxc(m, pt):
    """y = mx + c through pt with gradient m -> (m, c) exact."""
    m = F(m); return m, F(pt[1]) - m*F(pt[0])

def fmt_mxc(m, c):
    m, c = F(m), F(c)
    mp = "" if m == 1 else ("-" if m == -1 else fmt_frac(m))
    s = f"y={mp}x" if m != 0 else "y="
    if c > 0: s += f"+{fmt_frac(c)}"
    elif c < 0: s += f"-{fmt_frac(-c)}"
    elif m == 0: s += "0"
    return s

def circle_from_general(g2, f2, c):
    """x^2+y^2+g2*x+f2*y+c=0 -> (centre, r2) exact."""
    a = -F(g2, 2); b = -F(f2, 2)
    return (a, b), a*a + b*b - F(c)

def disc(a, b, c): return b*b - 4*a*c
