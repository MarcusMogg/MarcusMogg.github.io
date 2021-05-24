---
title: 每日一题-1
date: 2021-03-29 19:51:48
tags: [算法,Codeforces]
categories:  [每日一题]
mathjax: true
---
每日一题保持手感，主要做codeforces 1600 - 2200的题

难题有的时候一天做不了一道，补知识点

每次记录一周

## 1500A Going Home

Codeforces Round #707 1500A Going Home

tags： 暴力

[题目链接](https://codeforces.com/problemset/problem/1500/A)

这题真的是brain fuck

就是纯暴力，但是乍一看你会觉得暴力$n^2$会超时

然鹅只要一个和值出现超过四次（见官方题解），一定有解，所以上限是$4 * 2.5*10^6$，怎么暴力都能出结果……

::: details 点击展开
```cpp
#include <bits/stdc++.h>

using namespace std;
//c++14 数字分位符
const int ms = 200'000 + 20;

unordered_map<int, set<int>> m;
int a[ms];

int main(int argc, char const *argv[])
{
    int n;
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n;
    for (size_t i = 1; i <= n; i++)
    {
        cin >> a[i];
    }
    for (size_t i = 1; i <= n; i++)
    {
        for (size_t j = i + 1; j <= n; j++)
        {
            int v = a[i] + a[j];
            m[v].insert(i);
            m[v].insert(j);
            if (m[v].size() >= 4)
            {
                bool flag = false;
                for (int x : m[v])
                {
                    for (int y : m[v])
                    {
                        if (x == y)
                            continue;
                        for (int z : m[v])
                        {
                            if (z == x || z == y)
                                continue;
                            for (int w : m[v])
                            {
                                if (w == x || w == y || w == z)
                                    continue;
                                if (a[x] + a[y] == a[w] + a[z])
                                {
                                    cout << "YES\n";
                                    cout << x << " " << y << " "
                                         << z << " " << w << "\n";
                                    return 0;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    cout << "NO\n";

    return 0;
}

```
:::


## 1500B Two chandeliers

Codeforces Round #707 1500B Two chandeliers

tags: 二分，数论，中国剩余定理

[题目链接](https://codeforces.com/problemset/problem/1500/B)

官方题解写的太迷了……

有两个整数序列，序列初始时，每一个值是不同的。然后，将这两个序列将无限循环的重复下去，即$a_i = a_{i-n},b_i = b_{i-m}$。求最小的长度len，使得[1,len]里包含k个点满足$a_i\ne b_i$

不难想到使用二分，对每个mid求有多少个点满足$a_i\ne b_i$

直接求$a_i\ne b_i$不容易求，但是我们可以求有多少个点满足$a_i = b_i$

假设初始序列中，$a_x = b_y$,那么将会在$pos$位置使得$a_{pos} = b_{pos}$

pos 需要满足
$$\begin{cases} pos \equiv x \pmod{n} \\ pos \equiv y \pmod{m}\end{cases}$$
pos可以使用中国剩余定理求得（pos 不一定存在）

因为初始序列中的值是不重复的，所以在$[1,LCM(n,m)]$ 里pos只会出现一次，所以我们可以先处理出所有可能的pos

::: details 点击展开
```cpp
#include <bits/stdc++.h>

using namespace std;

typedef long long ll;
const int ms = 500000 + 5;
ll gcd(ll a, ll b)
{
    if (b == 0)
        return a;
    return gcd(b, a % b);
}
ll exgcd(ll a, ll b, ll &x, ll &y)
{
    if (b == 0)
    {
        x = 1, y = 0;
        return a;
    }
    ll gcd = exgcd(b, a % b, x, y);
    ll tp = x;
    x = y;
    y = tp - a / b * y;
    return gcd;
}
ll excrt(const vector<ll> &ai, const vector<ll> &mi)
{
    ll ans = ai[0], M = mi[0]; //第一个式子的解
    for (int i = 1; i < ai.size(); i++)
    {
        ll a = M, b = mi[i], c = (ai[i] - ans % b + b) % b, x, y;
        ll gcd = exgcd(a, b, x, y);
        if (c % gcd != 0)
        {
            return -1; //无解
        }
        ll bg = b / gcd;
        x = c / gcd * x;
        ans += x * M;
        M = bg * M;
        ans = (ans % M + M) % M;
    }
    return (ans % M + M) % M;
}

ll a[ms * 2], b[ms], cover[ms], cnt;

ll count(ll x)
{
    return upper_bound(cover, cover + cnt, x) - cover;
}

int main(int argc, char const *argv[])
{
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    ll n, m, k;
    cin >> n >> m >> k;
    ll lcm = n * m / gcd(n, m);
    vector<ll> mi = {n, m};
    ll ax;
    for (int i = 0; i < n; i++)
    {
        cin >> ax;
        a[ax] = i + 1;
    }
    for (int i = 0; i < m; i++)
    {
        cin >> b[i];
        if (a[b[i]] > 0)
        {
         	// 预处理出所有可能的pos
            ll tmp = excrt({a[b[i]], i + 1}, mi);
            if (tmp != -1)
            {
                if (tmp == 0)
                    tmp = lcm;
                cover[cnt++] = tmp;
            }
        }
    }
    sort(cover, cover + cnt);
	// 两个序列的对应情况以LCM(n,m)为周期循环
    // 我们可以先算出进行了几个循环，然后处理剩下的
    // 为了方便起见，我们使 1<=k<=n 
    ll base = lcm - count(lcm), res = 0;
    res = (k - 1) / base * lcm;
    k -= (k - 1) / base * base;

    ll l = k, r = lcm + 1, mid, ans = 0;
    while (l < r)
    {
        mid = (l + r) / 2;
        ll rm = mid - count(mid);
        if (rm < k)
        {
            l = mid + 1;
        }
        else
        {
            r = mid;
            ans = mid;
        }
    }
    cout << res + ans;
    return 0;
}

```
:::

## 1499D The Number of Pairs

[Educational Codeforces Round 106 (Rated for Div. 2)](https://codeforces.com/contest/1499)

tags：数论，dp

给定三个正整数$c,d,x$，求有多少对正整数$a,b$满足$c\cdot lcm(a,b) + d\cdot gcd(a,b) = x$

假设$a = A\cdot gcd,a = B\cdot gcd$，那么A,B互质，原式变为$ABc + d = \frac{x}{gcd}$,$AB=\frac{ \frac{x}{gcd} - d}{c}$

由裴蜀定理可得，$gcd | x$，即gcd是x的因数，式子右边的值域是有限的，并且可以在$\sqrt{x}$的时间内得出

那么对于$AB=x_i$可以推出多少个AB？因为AB是互质的，所以对于$x_i$的某个质因数，只能分配到A，B中的某个上，比如$8=2^3$，所有2只能都在A或者都在B上。这个问题我们可以用dp解决。

$minP_x$表示x的最小质因数，$numP_x$表示$AB=x_i$可以推出多少个AB
$$\begin{align} y &= x/minP{x} \\ numP_x &= \begin{cases} numP_{y} ,minP_x = minP_y\\ numP_{y} + 1 ,minP_x \ne minP_y \end{cases} \end{align}$$

::: details 点击展开
```cpp
#include <bits/stdc++.h>

using namespace std;

typedef long long ll;
#ifdef DEBUG
const int ms = 100 + 5;
#else
const int ms = 2e7 + 5;
#endif

int minPrime[ms], numPrime[ms];
// 埃氏筛求最小素数
void eratosthenes()
{
    int i = 2;
    for (; i * i < ms; ++i)
    {
        if (minPrime[i] == 0)
        {
            minPrime[i] = i;
            for (int j = i * i; j < ms; j += i)
            {
                if (minPrime[j] == 0)
                    minPrime[j] = i;
            }
        }
    }
    for (; i < ms; ++i)
        if (minPrime[i] == 0)
            minPrime[i] = i;
}
void dp()
{
    for (int i = 2; i < ms; i++)
    {
        int j = i / minPrime[i];
        numPrime[i] = numPrime[j];
        if (minPrime[i] != minPrime[j])
        {
            numPrime[i]++;
        }
    }
}
int t, c, d, x;
int solve()
{
    ll res = 0;
    for (int i = 1; i * i <= x; ++i)
    {
        if (x % i != 0)
            continue;
        if ((x / i + d) % c == 0)
        {
            res += 1ll << numPrime[(x / i + d) / c];
        }
        if (i * i != x && (i + d) % c == 0)
        {
            res += 1ll << numPrime[(i + d) / c];
        }
    }
    return res;
}

int main(int argc, char const *argv[])
{
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> t;
    eratosthenes();
    dp();
    while (t--)
    {
        cin >> c >> d >> x;
        cout << solve() << "\n";
    }

    return 0;
}

```
:::

## 1497E1 Square-free division (easy version)

[Codeforces Round #708 (Div. 2)](https://codeforces.com/contest/1497)

tags：数论，dp，贪心

给定一个n个正整数的序列，问最少可以划分成几个序列，使得序列中任意两个数的乘积不是某个正整数的平方

一个数a可以表示为质数的乘积$a = x_1^{y_1}x_2^{y_2}\cdots x_n^{y_n}$,一个数是平方数，当且仅当每个指数都为偶数时成立

那么我们将a处理为$ a' = x_1^{y_1 \mod 2}x_2^{y_2 \mod 2}\cdots x_n^{y_n \mod 2}$

这题就变为判断一个序列里是否有数字出现两次

求a‘的思路和上一题类似
$$
\begin{align}
y &= x/minP{x} \\ 
numP_x &= \begin{cases} 
numP_{y} / minP_x,minP_x = minP_y 抵消一个\\ 
numP_{y} * minP_x ,minP_x \ne minP_y 新增一个
\end{cases}
\end{align}
$$


::: details 点击展开
```cpp
#include <bits/stdc++.h>

using namespace std;

typedef long long ll;
#ifdef DEBUG
const int ms = 100 + 5;
#else
const int ms = 1e7 + 5;
#endif

int minPrime[ms], numPrime[ms];
// 埃氏筛求最小素数
void eratosthenes()
{
    int i = 2;
    for (; i * i < ms; ++i)
    {
        if (minPrime[i] == 0)
        {
            minPrime[i] = i;
            for (int j = i * i; j < ms; j += i)
            {
                if (minPrime[j] == 0)
                    minPrime[j] = i;
            }
        }
    }
    for (; i < ms; ++i)
        if (minPrime[i] == 0)
            minPrime[i] = i;
}
void dp()
{
    numPrime[1] = 1;
    for (int i = 2; i < ms; i++)
    {
        int j = i / minPrime[i];
        if (numPrime[j] % minPrime[i] == 0)
            numPrime[i] = numPrime[j] / minPrime[i];
        else
            numPrime[i] = numPrime[j] * minPrime[i];
    }
}
int main(int argc, char const *argv[])
{
    eratosthenes();
    dp();
    int t;
    cin >> t;
    while (t--)
    {
        int n, x, res = 0;
        cin >> n >> x;
        set<int> s;
        while (n--)
        {
            cin >> x;
            if (s.count(numPrime[x]))
            {
                s.clear();
                res++;
            }
            s.insert(numPrime[x]);
        }
        if (!s.empty())
        {
            res++;
        }
        cout << res << "\n";
    }

    return 0;
}

```
:::


