---
title: 每日一题-6
date: 2021-05-17 19:54:20
tags: [算法,Codeforces]
categories: [每日一题]
mathjax: true
---

## 1520F2. Guess the K-th Zero 

[Codeforces Round #719 (Div. 3)](http://codeforces.com/contest/1520)

[题目链接](http://codeforces.com/problemset/problem/1520/F2)

交互题，还真没怎么写过

找第k个元素，二分还是挺好想的。要么在 [l,mid] 要么在[mid,r]。

问题的关键在于$10^5$的数据$10^4$次查询，怎么保证总操作数在$6*10^4$

看了一下Tutorial，解法非常简单，加上缓存之前查的[l,r]即可

证明也非常简洁，二分对应一个二叉树，每个节点对应一次查询操作，最高18层，在第14层可以覆盖$10^4$个数据，也就是说最多只需要进行 $2^{14} -1 + 10^4 * 4 < 6*10^4$次操作。证明还蛮精妙的

::: details 点击展开
```cpp
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

map<pair<int, int>, int> m;
void find(int k, int l, int r)
{
    if (l == r && k == 1)
    {
        cout << "! " << l << "\n";
        return;
    }
    int mid = (l + r) / 2;
    if (m.count({l, mid}) == 0)
    {
        cout << "? " << l << " " << mid << "\n";
        cin >> m[{l, mid}];
        m[{l, mid}] = mid - l + 1 - m[{l, mid}];
    }
    if (m[{l, mid}] < k)
    {
        find(k - m[{l, mid}], mid + 1, r);
    }
    else
    {
        find(k, l, mid);
        m[{l, mid}]--;
    }
}
 
int main(int argc, char const *argv[])
{
    // 交互题需要io同步
    //ios::sync_with_stdio(false), cin.tie(nullptr);
    int n, t, k;
    cin >> n >> t;
    while (t--)
    {
        cin >> k;
        find(k, 1, n);
    }
    return 0;
}

```
:::

## 1521C. Nastia and a Hidden Permutation

 [Codeforces Round #720 (Div. 2)](http://codeforces.com/contest/1521)

[题目链接](http://codeforces.com/problemset/problem/1521/C)

可以根据最多 $\lfloor \frac {3 \cdot n} { 2} \rfloor + 30$ 次操作猜测，任意两个数字，能否通过三次以内的操作猜出来。

首先，p是个排列，所以任意两个数字一定不重复。

然后，我们尝试带入边界值 1 到操作2里，$\min{(\max{(1, p_i)}, \max{(2, p_j)})}$ 根据得到的结果分类讨论

1. 1 这种情况可以直接确定$p_i$是1，然后使用操作1，代入n-1，$\max{(\min{(n-1, p_i = 1)}, \min{(n, p_j)})}$ 的值就是$p_j$的值

2. 2 这种情况下，二元组可能是$(2,any)$or $(> 2,1|2)$，先交换一下ij，使用操作2，看结果是否是1，如果结果是1，操作和步骤1相同；否则可以得到最小值为2，操作和步骤3相同。

3. 大于2，假设得到的值是a，那么$a = \min(p_i,p_j)$（a必然小于n）,然后我们使用操作1，代入a，得到两个值 $\max{(\min{(a, p_i)}, \min{(a+1, p_j)})}$ 如果$p_i == a$那么得到 a+1,如果$p_j == a$那么得到a。知道谁是a之后，我们使用操作1，代入n-1, $\max{(\min{(n-1, a)}, \min{(n, p_x)})}$ 的值就是另一个元素的值

   


::: details 点击展开
```cpp
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int ms = 2e4 + 5;

int p[ms], n;

int t(int op, int i, int j, int x)
{
    cout << "? " << op << " " << i + 1 << " " << j + 1 << " " << x << "\n";
    int res;
    cin >> res;
    return res;
}

// pi = 1;
void step1(int i, int j)
{
    p[i] = 1;
    p[j] = t(1, i, j, n - 1);
}
void step3(int i, int j, int a)
{
    if (t(1, i, j, a) == a)
    {
        p[j] = a;
        p[i] = t(1, j, i, n - 1);
    }
    else
    {
        p[i] = a;
        p[j] = t(1, i, j, n - 1);
    }
}

void solve(int i, int j)
{
    int tmp = t(2, i, j, 1);
    if (tmp == 1)
    {
        step1(i, j);
    }
    else if (tmp == 2)
    {
        tmp = t(2, j, i, 1);
        if (tmp == 1)
            step1(j, i);
        else
            step3(i, j, 2);
    }
    else
    {
        step3(i, j, tmp);
    }
}

int main(int argc, char const *argv[])
{
    //ios::sync_with_stdio(false), cin.tie(nullptr);
    int t;
    cin >> t;
    while (t--)
    {
        cin >> n;
        for (size_t i = 0; i < n - 1; i += 2)
            solve(i, i + 1);
        if (n % 2 == 1)
            solve(n - 1, n - 2);
        cout << "!";
        for (size_t i = 0; i < n; i++)
            cout << " " << p[i];
        cout << "\n";
    }
    return 0;
}
```
:::

## 1516D. Cut

[Codeforces Round #717 (Div. 2)](http://codeforces.com/contest/1516)

[题目链接](http://codeforces.com/problemset/problem/1516/D)

这题没做出来是自己菜了，没想到倍增。

首先，连续几个数的乘积是它们的LCM可以推出来这几个数互质，这点没啥说的，基础数论。所以根据这个，我们对a[i]进行质因数分解 得到a[i]的质因数集合 p[i]时间复杂度 $O(n\sqrt n)$。

然后，我们可以推出从i开始往后能够覆盖的最大位置，$r_i = \min(r_{i+1},\min( upper\_bound(pos[p[i][j]],i)  ))$其中 `upper_bound(pos[p[i] [j] ],i)`表示拥有质因数p[i] [j] 的所有下标里，大于i的最小值，这个点是不能放到集合里的。

根据贪心的思想，我们从l出发，l替换为$r_l$直到l大于r，重复次数就是答案。

但这样复杂度是$n^2$，可以使用倍增的思想，dp[i] [j] 表示从i出发，进行$2^j$次替换之后得到位置，$dp[i][j] = dp[ dp[i][j-1] ][j-1]$，初始时$dp[i][0] = r_i$。这样我们可以在$\log(n)$的时间内得到一次查询结果。


::: details 点击展开
```cpp
#include <bits/stdc++.h>

using namespace std;

typedef long long ll;
#ifdef DEBUG_MOGG
const int ms = 100 + 5;
#else
const int ms = 1e5 + 5;
#endif

const ll mod = 1e9 + 7;
const ll inf = 1e18 + 7;

vector<int> a[ms];
map<int, set<int>> m;

void decompose(int x, const int index, vector<int> &factors)
{
    for (int i = 2; i * i <= x; ++i)
    {
        if (x % i == 0)
        {
            factors.emplace_back(i);
            m[i].insert(index);
        }
        while (x % i == 0)
        {
            x /= i;
        }
    }
    if (x > 1)
    {
        factors.emplace_back(x);
        m[x].insert(index);
    }
}

int num[ms];
int dp[ms][32];
int n, q, ln;

int lessb(int x)
{
    int res = 0;
    while ((1 << res) <= x)
    {
        res++;
    }
    return res - 1;
}

int upper(int index)
{
    int res = n;
    for (const int i : a[index])
    {
        res = min(res, *m[i].upper_bound(index));
    }
    return res;
}
int find(int l, int r)
{
    int cur = l, res = 0;
    while (cur <= r)
    {
        if (dp[cur][0] > r)
        {
            res += 1;
            break;
        }
        for (int i = 1; i <= ln; i++)
        {
            if (dp[cur][i] > r)
            {
                res += 1 << (i - 1);
                cur = dp[cur][i - 1];
                break;
            }
        }
    }
    return res;
}
int main(int argc, char const *argv[])
{
    ios::sync_with_stdio(false), cin.tie(nullptr);
    cin >> n >> q;
    for (size_t i = 0; i < n; i++)
    {
        cin >> num[i];
        decompose(num[i], i, a[i]);
    }
    for (auto &i : m)
    {
        i.second.insert(n);
    }
    dp[n - 1][0] = n;
    for (int i = n - 2; i >= 0; i--)
    {
        dp[i][0] = min(dp[i + 1][0], upper(i));
    }
    ln = lessb(n) + 1;
    for (int j = 1; j <= ln; j++)
    {
        for (int i = 0; i < n; i++)
        {
            int r = dp[i][j - 1];
            if (r >= n)
                r = n - 1;
            dp[i][j] = dp[r][j - 1];
        }
    }
    int l, r;
    for (size_t i = 0; i < q; i++)
    {
        cin >> l >> r;
        cout << find(l - 1, r - 1) << "\n";
    }
    return 0;
}
```
:::
