---
title: 每日一题-5
date: 2021-05-10 20:23:20
tags: [算法,Codeforces]
categories: [每日一题]
mathjax: true
---

毕设爬，该整点社畜的活了

## 1517D Explorer Space

[Contest 2050 and Codeforces Round #718 (Div. 1 + Div. 2)](http://codeforces.com/contest/1517)

[题目链接](https://codeforces.com/problemset/problem/1517/D)

非常直观的dp。k为奇数的时候直接排除，不能回到原点。

我们使用$dp[i][j][x]$ 表示从i，j出发，移动x步不返回的最小值。然后对于i,j来说就是个完全背包问题，重量为1~k/2，价值为$dp[i][j][x]$,凑和为k/2的最小值即可

::: details 点击展开
```cpp
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const ll mod = 1e9 + 7;
//just for fun
void travel(int begin, int end, function<void(int)> func)
{
    for (; begin < end; begin++)
        func(begin);
}

int a[505][505];
int b[505][505];
int dp[505][505][22];
int des[] = {1, 0, -1, 0};
int n, m;
inline bool check(int i, int n)
{
    return i >= 0 && i < n;
}
inline int getV(int i, int j, int ci, int cj)
{
    if (i == ci)
    {
        return a[i][min(j, cj)];
    }
    return b[min(i, ci)][j];
}
void solve(int i, int j, int k)
{
    for (size_t ii = 0; ii < 4; ii++)
    {
        int ci = i + des[ii], cj = j + des[3 - ii];
        if (check(ci, n) && check(cj, m))
        {
            dp[i][j][k] = min(dp[i][j][k], dp[ci][cj][k - 1] + getV(i, j, ci, cj));
        }
    }
}

int k;
int p[22];

int pack(int ii, int jj)
{
    for (size_t i = 1; i <= k; i++)
        p[i] = mod;
    // 因为是从1开始，不用考虑背包必须放满的问题
    for (int i = 1; i <= k; i++)
        for (int j = i; j <= k; j++)
            p[j] = min(p[j], p[j - i] + dp[ii][jj][i]);
    return p[k];
}

int main(int argc, char const *argv[])
{
    ios::sync_with_stdio(false), cin.tie(nullptr);
    cin >> n >> m >> k;
    if (k % 2 != 0)
    {
        travel(0, n, [](int i) {
            travel(0, m, [](int j) {
                cout << "-1 ";
            });
            cout << "\n";
        });
        return 0;
    }
    travel(0, n, [](int i) {
        travel(0, m - 1, [&](int j) {
            cin >> a[i][j];
        });
    });
    travel(0, n - 1, [](int i) {
        travel(0, m, [&](int j) {
            cin >> b[i][j];
        });
    });

    k /= 2;
    travel(1, k + 1, [](int kk) {
        travel(0, n, [&](int i) {
            travel(0, m, [&](int j) {
                dp[i][j][kk] = mod;
            });
        });
    });
    travel(1, k + 1, [](int kk) {
        travel(0, n, [&](int i) {
            travel(0, m, [&](int j) {
                solve(i, j, kk);
            });
        });
    });
    travel(0, n, [](int i) {
        travel(0, m, [&](int j) {
            cout << pack(i, j) * 2 << " ";
        });
        cout << "\n";
    });
    return 0;
}

```
:::
## 1520 G. To Go Or Not To Go?

 [Codeforces Round #719 (Div. 3)](https://codeforces.com/contest/1520)

[题目链接](https://codeforces.com/problemset/problem/1520/G)

艹，别来脑筋急转弯了

首先，一个为0的cell只能通过上下左右走到。

对于一个portal X，只存在两种情况：

1. 直接走到，不使用portal X
2. 只使用一次传送，即两个portal。考虑三个的情况，A到B，B再到X，肯定不如A直接到X。考虑四个的情况，A到B，B再走到C，C传送的X，也不如直接A到X。更多的一样。

所以我们只需要使用bfs计算一下，从起点到各个点的最短距离dis1，和从目标地点到各个地点的最短距离dis2。然后最短距离就是调两个传送门计算 min(dis1(p1) +cost(p1)+ dis2(p2) + cost(p2))。

但这样复杂度不过，用个贪心，对于p2，一定是传送到距离目标地点最近（dis2(p2) + cost(p2) 最小）的p2。

::: details 点击展开
```cpp
#include <bits/stdc++.h>

using namespace std;

typedef long long ll;
#ifdef DEBUG_MOGG
const int ms = 100 + 5;
#else
const int ms = 2e3 + 5;
#endif

const ll mod = 1e9 + 7;
const ll inf = 1e18 + 7;

int n, m, w;
vector<vector<int>> a;
vector<vector<vector<int>>> dis;

inline bool check(int i, int n)
{
    return i >= 0 && i < n;
}
int des[] = {1, 0, -1, 0};
void bfs(int fromx, int fromy, int which)
{
    queue<tuple<int, int>> q;
    q.push({fromx, fromy});
    dis[fromx][fromy][which] = 0;
    while (!q.empty())
    {
        int i = get<0>(q.front());
        int j = get<1>(q.front());
        q.pop();

        for (size_t ii = 0; ii < 4; ii++)
        {
            int ci = i + des[ii], cj = j + des[3 - ii];
            if (check(ci, n) && check(cj, m) && a[ci][cj] >= 0 && dis[ci][cj][which] == mod)
            {
                q.push({ci, cj});
                dis[ci][cj][which] = 1 + dis[i][j][which];
            }
        }
    }
}

int main(int argc, char const *argv[])
{
    ios::sync_with_stdio(false), cin.tie(nullptr);
    cin >> n >> m >> w;
    a = vector<vector<int>>(n, vector<int>(m));
    dis = vector<vector<vector<int>>>(n, vector<vector<int>>(m));
    for (size_t i = 0; i < n; i++)
    {
        for (size_t j = 0; j < m; j++)
        {
            cin >> a[i][j];
            dis[i][j] = {mod, mod};
        }
    }
    bfs(0, 0, 0);
    bfs(n - 1, m - 1, 1);
    ll min1 = inf;
    for (size_t i = 0; i < n; i++)
    {
        for (size_t j = 0; j < m; j++)
        {
            if (a[i][j] > 0 && dis[i][j][1] != mod)
                min1 = min(min1, a[i][j] + 1ll * w * dis[i][j][1]);
        }
    }
    ll res = dis[n - 1][m - 1][0] == mod ? inf : 1ll * w * dis[n - 1][m - 1][0];
    for (size_t i = 0; i < n; i++)
    {
        for (size_t j = 0; j < m; j++)
        {
            if (a[i][j] > 0 && dis[i][j][0] != mod)
                res = min(res, a[i][j] + 1ll * w * dis[i][j][0] + min1);
        }
    }
    if (res == inf)
        res = -1;
    cout << res << "\n";
    return 0;
}
```
:::


