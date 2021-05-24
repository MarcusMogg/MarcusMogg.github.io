---
title: 每日一题-3
date: 2021-04-11 21:25:20
tags: [算法,Codeforces]
categories: [每日一题]
mathjax: true
---

肝毕业论文ing……

## 1503C Travelling Salesman Problem

[Codeforces Round #712 (Div. 1)](http://codeforces.com/contest/1503)

[题目链接](https://codeforces.com/problemset/problem/1503/C)

n个点，从i到j，花费为$cost=\max(c_i,a_j - a_i) = c_i + \max(0,a_j-(a_i+c_i))$，求哈密顿回路的最小cost

因为每个点必定仅离开一次，所以$c_i$可以忽略，只关注后半部分$\max(0,a_j-(a_i+c_i))$即可

注意到，如果$a_j <= a_i$ ，从i到j的成本为0。我们可以按照a的大小将数组重新排序，因为是哈密顿回路，每一个点都离开和进入一次，所以重排序不影响答案，这样只需要知道一条$a_1$到$a_n$的最短路径，剩余返回的路径成本都为0。

最短路当然可以用最短路算法求，图的构造见官方题解。

另外一种贪心的思想。按照a值有小到大排序后，对于任意三个点$i<j<k, a_i+c_i < a_j+c_j$ ，从i到j再到k比直接从i到k更优。理由：

如果 $a_j \le a_i + ci$ ,那么i到j的成本为0，j到k的成本为$\max(0,a_k - (a_j + c_j))$ 比i到k更低

如果 $a_j > a_i + ci$ ,那么i到j的成本为$a_j - (a_i + c_i)$，j到k的成本为$a_k - (a_j + c_j)$ (这里是必然大于的) 总成本为$a_k - (a_i+c_i) -c_j$成本更低

所以最优的答案是 $\sum\limits_{i=2}^{n} \max(0,a_i - \max\limits_{j<i} (a_j +c_j))$,即策略为遇到任意一个更大的$a_j+c_j$都从i跳到j去。

::: details 点击展开
```cpp
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int ms = 2e5 + 5;
pair<int, int> a[ms];
int main(int argc, char const *argv[])
{
    ios::sync_with_stdio(false), cin.tie(nullptr);
    int n;
    cin >> n;
    for (size_t i = 0; i < n; i++)
        cin >> a[i].first >> a[i].second;
    sort(a, a + n);
    ll res = a[0].second, cur = a[0].first + a[0].second;
    for (size_t i = 1; i < n; i++)
    {
        res += max(0ll, a[i].first - cur) + a[i].second;
        cur = max(cur, 0ll + a[i].first + a[i].second);
    }
    cout << res;
    return 0;
}

```
:::
## LCP 31. 变换的迷宫

力扣

#### [LCP 31. 变换的迷宫](https://leetcode-cn.com/problems/Db3wC1/)

- 临时消除术：将指定位置在下一个时刻变为空地；
- 永久消除术：将指定位置永久变为空地。

临时消除很好处理，加一维[0/1]去dp就可以

永久消除术要转换思路。假设吧一个点永久消除了，那么如果经过这个点一次，和临时没区别，如果经过多次，其实相当于一直待在这个点。考虑清楚就可以dp了

::: details 点击展开
```cpp
class Solution {
public:
    typedef long long ll;
    int n, m;
    // 依次为 时间 t 
    // 坐标x y
    // 是否使用了临时消除
    // 是否使用了永久消除, 是否呆在永久消除的位置. 注意 这两位 0 1是不存在的
    bool mp[105][55][55][2][2][2];
    const int des[4] = { -1,0,1,0 };
    bool check(const vector<vector<string>>& maze)
    {
        mp[0][0][0][0][0][0] = true;
        for (int t = 1; t < maze.size(); ++t)
        {
            for (int i = 0; i < n; ++i)
            {
                for (int j = 0; j < m && i + j <= t; ++j)
                {
                      const auto get = [&](int k1, int k2, int k3, bool cur = true)->bool
                    {
                        if (cur && mp[t - 1][i][j][k1][k2][k3]) return true;
                        for (int k = 0; k < 4; ++k)
                        {
                            int ci = i + des[k], cj = j + des[3 - k];
                            if (ci < 0 || ci >= n || cj < 0 || cj >= m) continue;
                            if (mp[t - 1][ci][cj][k1][k2][k3]) return true;
                        }
                        return false;
                    };
                    // 状态转移蛮多的，但比较清晰
                    if (maze[t][i][j] == '.')
                    {
                        mp[t][i][j][0][1][1] = mp[t - 1][i][j][0][1][1];
                        mp[t][i][j][1][1][1] = mp[t - 1][i][j][1][1][1];
                        mp[t][i][j][0][1][0] = get(0, 1, 0) || get(0, 1, 1, false);
                        mp[t][i][j][1][1][0] = get(1, 1, 0) || get(1, 1, 1, false);
                        mp[t][i][j][1][0][0] = get(1, 0, 0);
                        mp[t][i][j][0][0][0] = get(0, 0, 0);
                    }
                    else
                    {
                        mp[t][i][j][0][1][1] = mp[t - 1][i][j][0][1][1] || get(0, 0, 0);
                        mp[t][i][j][1][1][1] = mp[t - 1][i][j][1][1][1] || get(1, 0, 0);
                        mp[t][i][j][1][1][0] = get(0, 1, 0) || get(0, 1, 1, false);
                        mp[t][i][j][1][0][0] = get(0, 0, 0);
                    }
                    if (i == n - 1 && j == m - 1 && (
                        mp[t][i][j][0][1][1] ||
                        mp[t][i][j][1][1][1] ||
                        mp[t][i][j][0][1][0] ||
                        mp[t][i][j][1][1][0] ||
                        mp[t][i][j][1][0][0] ||
                        mp[t][i][j][0][0][0]
                        ))
                        return true;
                }
            }
        }
        return false;
    }
    bool escapeMaze(vector<vector<string>>& maze) {
        n = maze[0].size();
        m = maze[0][0].size();
        memset(mp, 0, sizeof(mp));
        return check(maze);
    }
};
```
:::
