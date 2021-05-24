---
title: 每日一题-4
date: 2021-04-19 21:26:20
tags: [算法,Codeforces]
categories: [每日一题]
mathjax: true
---

中期好水，但是又提了一堆需求，麻了

## 1513D. GCD and MST

[Divide by Zero 2021 and Codeforces Round #714 (Div. 2)](http://codeforces.com/contest/1513)

[题目链接](http://codeforces.com/problemset/problem/1513/D)

2000的题就这？膨胀.jpg。 不过晚上打cf还是太累了，sigh

给一个长度为n的序列a，和一个值p。为在n个点构建一个图，i和j之间有边当

- i = j+1 ，边长为p
- $\gcd(a_i,a_{i+1}\dots a_j) = \min(a_i,a_{i+1}\dots a_j)$ ,边长为$\min(a_i,a_{i+1}\dots a_j)$

求最小生成树

先看什么情况下有边，情况一不用多说，情况二我们只需要枚举i，然后分别想左向右延伸$a_j = k*a_i$的情况，那么i左边的点会和所有i右边以及i之间有一条长度为$a_i$的边

考虑Kruskal算法，我们枚举最小的边，即从小到大枚举$a_i<p$的点，然后构造最小生成树即可，剩下没覆盖的点，用边长为p的边加入树。 

::: details 点击展开
```cpp
#include <bits/stdc++.h>

using namespace std;
typedef long long ll;
const int ms = 2e5 + 5;
ll a[ms];
int pre[ms];
int find(int x)
{
    if (pre[x] != x)
        pre[x] = find(pre[x]);
    return pre[x];
}
void join(int x, int y)
{
    int fx = find(x), fy = find(y);
    if (fx != fy)
    {
        pre[fx] = fy;
    }
}

int main(int argc, char const *argv[])
{
    ios::sync_with_stdio(false), cin.tie(nullptr);
    int t;
    cin >> t;
    while (t--)
    {
        int n;
        ll p;
        cin >> n >> p;
        priority_queue<pair<ll, int>> q;
        for (size_t i = 0; i < n; i++)
        {
            cin >> a[i];
            if (a[i] < p)
            {
                q.push({-a[i], i});
            }
            pre[i] = i;
        }
        ll res = 0;
        int tot = 1;
        const auto solve = [&](const int begin, const int end, const int step, const ll cur, const int curi) {
            for (int i = begin; i != end; i += step)
            {
                if (a[i] % cur == 0)
                {
                    if (find(curi) != find(i))
                    {
                        res += cur;
                        tot++;
                        join(i, curi);
                    }
                    else
                    {
                        return;
                    }
                }
                else
                {
                    return;
                }
            }
        };

        while (!q.empty() && tot < n)
        {
            ll cur = -q.top().first;
            int curi = q.top().second;
            q.pop();
            solve(curi + 1, n, 1, cur, curi);
            solve(curi - 1, -1, -1, cur, curi);
        }
        res += p * (n - tot);
        cout << res << "\n";
    }
    return 0;
}

```
:::

## 1513E. Cost Equilibrium

[Divide by Zero 2021 and Codeforces Round #714 (Div. 2)](http://codeforces.com/contest/1513)

[题目链接](http://codeforces.com/problemset/problem/1513/E)

2300就这？这场比赛是不是特简单……

给定一个序列a，可以对a进行以下操作：

选择一对$i,j$ 和任意一个数字$x (1\le x\le a_i)$,令$a_i = a_i -x, a_j = a_j+x$,之后i只能增，j只能减。这个操作的花费为$x\cdot |j - i|$

a有很多排列，定义一个排列是美的，当且仅当这个排列可以通过一系列上述操作将此排列中的所有数变为相同，且最小花费和最大花费相同。问a有多少排列是美的。

首先平均值不为整数的直接排除

我们可以将a中的元素分为三个集合，小于平均值的$le$，等于$e$，大于$ge$

$e$的数不能改变，$le$只能增，$re$只能减

分类讨论

- 当$le$为空时，$re$必然为空，即a中只有相同的元素，只有1个排列
- 当$le$或者$re$的大小为1时，任意的排列都可以，花费都是相同的
- 当$le$和$re$的大小都大于2时，我们可以证明$le$ 的所有元素在排列里必须在 $re$ 的同一侧。根据样例2 (0 4 0 4)满足题意的解只有（0 0 4 4） 和（4 4 0 0） 提出的猜想

最下面的猜想可以用数学语言描述为：

假设i是属于re的元素的下标，j是属于le的元素的下标  $\forall j \in le, \forall i \in re, j < i$ 或者$\forall j \in le, \forall i \in re, j > i$

我们先证明满足上述条件的排列都满足题意

假设已知一个最小花费的操作集合 （一个nm的矩阵）$\{ (i_1,j_1,x_{11}),(i_1,j_2,x_{12}),\cdots (i_2,j_1,x_{21}),(i_2,j_2,x_{22}),\cdots (i_n,j_m,x_{nm})\}$

花费为$S$，n是re的大小，m是le的大小

我们可以将这个操作集合通过下面的方法修改为另一个操作集合

选择一个操作$(i_1, j_1, x_1)$修改为$(i_1, j_1 ,x - a), (i_1, j_2, x+a)$, 

那么必然有另外操作$(i_2, j_2, x_2)$修改为$(i_2, j_2, x-a),(i_2, j_1, x+a)$，a需要$a <= x_1,x_2$

新集合的花费为

$$S - a \cdot |i_1- j_1|  - a \cdot |i_2- j_2| + a\cdot |i_1- j_2| +a\cdot |i_2- j_1|$$



显然当 i都在j的一边的时候，可以消掉，花费变化为0

ij穿插的时候，必然有异号，消不掉带来新操作

然后剩下的就是排列组合知识，需要注意一下除法取模

::: details 点击展开
```cpp
#include <bits/stdc++.h>

using namespace std;

typedef long long ll;
const int ms = 2e5 + 5;
const ll mod = 1e9 + 7;

ll p1[ms], p2[ms];
ll a[ms];

ll qp(ll a, ll b)
{
    ll res = 1;
    while (b)
    {
        if (b & 1)
            res = (res * a) % mod;
        a = (a * a) % mod;
        b >>= 1;
    }
    return res;
}

int main(int argc, char const *argv[])
{
    ios::sync_with_stdio(false), cin.tie(nullptr);
    int n;
    ll sum = 0;
    cin >> n;
    for (size_t i = 0; i < n; i++)
    {
        cin >> a[i];
        sum += a[i];
    }
    if (sum % n != 0)
    {
        cout << "0\n";
        return 0;
    }
    sum /= n;
    map<ll, int> le, ge;
    int e = 0, cle = 0, cge = 0;
    for (size_t i = 0; i < n; i++)
    {
        if (a[i] < sum)
            le[a[i]]++, cle++;
        else if (a[i] > sum)
            ge[a[i]]++, cge++;
        else
            e++;
    }
    if (le.size() == 0)
    {
        cout << "1\n";
        return 0;
    }
    p1[1] = p2[1] = 1;
    for (size_t i = 2; i <= n; i++)
    {
        // p1[i] 为i!
        p1[i] = (p1[i - 1] * i) % mod;
        // p2[i] 为1/i!，费马小定理
        p2[i] = (p2[i - 1] * qp(i, mod - 2)) % mod;
    }

    ll res = 0;
    if (cle == 1 || cge == 1)
    {
        res = p1[n];
    }
    else
    {
        // 2* A(cle)* A(cge)
        res = (2 * p1[cle] * p1[cge]) % mod;
        // 等于平均值的数可以任意插入
        //（cle + cge + 1) *（cle + cge + 2) *...*n 
        res = (res * p1[n]) % mod;
        res = (res * p2[cle + cge]) % mod;
    }
    // 排除相同的数
    if (e) 
        res = (res * p2[e]) % mod;
    for (const auto &i : le)
    {
        if (i.second > 1)
        {
            res = (res * p2[i.second]) % mod;
        }
    }
    for (const auto &i : ge)
    {
        if (i.second > 1)
        {
            res = (res * p2[i.second]) % mod;
        }
    }
    cout << res << "\n";
    return 0;
}

```
:::
