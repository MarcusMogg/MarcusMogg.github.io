---
title: 每日一题-7
date: 2021-05-24 15:39:20
tags: [算法,Codeforces]
categories: [每日一题]
---
## 1516C. Baby Ehab Partitions Again


[Codeforces Round #717 (Div. 2)](http://codeforces.com/contest/1516)

[题目链接](http://codeforces.com/problemset/problem/1516/C)

缝合怪？

首先判断能否分成两份比较典了，用一个背包可解。

然后如果可以均分，考虑怎么删。要求最小数量可以想到只删一个奇数，这样和就是奇数了，一定不可以均分。但是不一定有奇数，比如 2 4 6 8。这时候可以先把数据全部除以gcd，剩余的数一定是可以均分的，而且一定有奇数（因为没有公因数2），然后随便找一个奇数删掉即可。

::: details 点击展开
```cpp
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int ms = 2000 + 5;
const ll mod = 1e9 + 7;
const ll inf = 1e18 + 7;
int gcd(int a, int b)
{
    if (a == 0)
        return b;
    return gcd(b % a, a);
}

int nums[ms];
int n;
int dp[ms * 100];

bool check()
{
    int sum = 0;
    for (size_t i = 0; i < n; i++)
        sum += nums[i];
    if (sum % 2 != 0)
        return true;
    sum /= 2;
    dp[0] = 1;
    for (size_t i = 0; i < n; i++)
        for (int j = sum; j >= nums[i]; --j)
            dp[j] += dp[j - nums[i]];
    return dp[sum] == 0;
}

int main(int argc, char const *argv[])
{
    ios::sync_with_stdio(false), cin.tie(nullptr);
    cin >> n;
    int g = 0;
    for (size_t i = 0; i < n; i++)
    {
        cin >> nums[i];
        g = gcd(g, nums[i]);
    }
    for (size_t i = 0; i < n; i++)
        nums[i] /= g;
    if (check())
        cout << "0";
    else
    {
        cout << "1\n";
        for (size_t i = 0; i < n; i++)
        {
            if (nums[i] % 2 != 0)
            {
                cout << i + 1;
                return 0;
            }
        }
    }
    return 0;
}

```
:::

## 1515E. Phoenix and Computers

[Codeforces Global Round 14](http://codeforces.com/contest/1515)

[题目链接](http://codeforces.com/problemset/problem/1515/E)

挺好dp+组合题吧。

对一个序列，首先首尾两端第一个是不能auto的，只能手动开，然后auto不能相邻。

然后选一个方向，我选择从后往前。第二个可以是auto/manual。

如果是auto，那么前面的就相当于是一个长度为n-2的序列。假设这个n-2序列里有x个manual，总的组合数为 $\frac{(dp[n-2][x] +  1)!}{dp[n-2][x]!  1!} \times dp[n-2][x] \times dp[1][1]$,第一部分表示两边的操作顺序是完全独立的，比如llrr的排列次数，第二部分分别表示左右有多少种操作顺序。

如果是manual，那么再往前选一个auto/manual，知道最左边的第一个（即全部是manual）

那么递推式不难推出，dp[n] [x] 表示一个长度为n的序列里有x个数是manual的，i表示上文中选到第i个是auto，右边全是manual。j表示前i-1个中有j个是manual的。lr分别表示左边和右边的操作数。这里的递推式表示双重循环。

这里j的取值范围应该需要限制一下，但是没必要，j相对于l小的时候会是0。
$$
\begin{align}
l &= i -1 \\
r &= n - i \\
\sum\limits_{i = 2}^{n-1} \sum\limits_{j = 0}^{l} dp[n][j+r] +&= \frac{(j+r)!}{j!r!} \times dp[l][j] * dp[r][r]
\end{align}
$$

dp[x] [x] （即全部manual需要特殊处理）i表示第一步选择哪个位置，之后只能顺着往两边递增

$$
dp[n][n] =  \sum\limits_{i = 1}^{n} \frac{n}{(i-1)!(n-i)!}
$$
需要注意一下除法逆元，不过M是质数，没什么需要注意的，板子。

总的时间复杂度是$O(n^3)$

::: details 点击展开
```cpp
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int ms = 400 + 5;
ll mod = 1e9 + 7;
ll a[ms], inva[ms];

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

void init(ll n)
{
    a[1] = inva[1] = 1;
    a[0] = inva[0] = 1;
    for (ll i = 2; i <= n; i++)
    {
        a[i] = (a[i - 1] * i) % mod;
        inva[i] = (inva[i - 1] * qp(i, mod - 2)) % mod;
    }
}

ll ans[ms][ms];

void solve(int n)
{
    // no auto
    for (int i = 0; i < n; i++)
    {
        int l = i, r = n - i - 1;
        ans[n][n] = (ans[n][n] +
                     (a[n - 1] * inva[l]) % mod * inva[r]) %
                    mod;
    }
    // right i is auto, and after i all manu
    for (int i = 2; i < n; i++)
    {
        int l = i - 1, r = n - i;
        for (int j = 0; j <= l; j++)
        {
            ll tmp = (a[j + r] * inva[j]) % mod * inva[r] % mod;
            ans[n][j + r] = (ans[n][j + r] +
                             tmp * ((ans[l][j] * ans[r][r]) % mod)) %
                            mod;
        }
    }
}

int main(int argc, char const *argv[])
{
    ios::sync_with_stdio(false), cin.tie(nullptr);
    int n;
    cin >> n >> mod;
    init(n);

    ans[2][2] = 2;
    ans[1][1] = 1;
    for (ll i = 3; i <= n; i++)
        solve(i);
    cout << accumulate(ans[n], ans[n] + n + 1, 0ll) % mod;
    return 0;
}
```
:::

## 1527B.Palindrome Game

[Codeforces Round #721 (Div. 2)](https://codeforces.com/contest/1527)

[题目链接](https://codeforces.com/problemset/problem/1527/B2)

有一说一，我最讨厌玩游戏题了，感觉智商被鄙视……

首先是回文串的情况，如果字符串长度为偶数，那么Alice必输2个，Alice只能用操作1，将i变成1，然后Bob把n-i-1变成1，这样Alice还是只能用操作1 ，直到最后1个，Bob用操作2，Alice只能用1。如果字符串长度为奇数，如果中间本来就是1，那么和上面的情况一样；如果中间是0，那么相当于先后手互换，Alice赢1个。

然后是非回文串的情况。Alice只需要一直用操作2，直到变成回文串的前一个，如果Alice在这个回文串上先手能赢那么继续操作2，否则用操作1将其变成回文串，让Bob先，所以必赢。只有一种例外，长度为奇数，一共只有两个0，且有一个在中间，比如100，这样是平局。


::: details 点击展开
```cpp
#include <bits/stdc++.h>
using namespace std;

int pal(int l, int mid)
{
    if (mid == 0)
    {
        if (l == 0)
            return 0;
        return -2;
    }
    if (l == 0)
        return -1;
    return 1;
}

int npal(int l, int r, int mid)
{
    if (r == 0)
        return pal(l, mid);
    return !(l + r == 1 && mid == 1);
}

int main(int argc, char const *argv[])
{
    ios::sync_with_stdio(false), cin.tie(nullptr);
    int t;
    cin >> t;
    while (t--)
    {
        int n;
        string s;
        cin >> n >> s;
        int l = 0, r = 0, mid = 0;
        int i = 0;
        for (i = 0; i * 2 < n; i++)
        {
            if (s[i] != s[n - i - 1])
                r++;
            else if (s[i] == '0')
                l++;
        }
        if (n % 2 == 1 && s[n / 2] == '0')
        {
            mid++, l--;
        }
        l = npal(l, r, mid);
        if (l > 0)
            cout << "ALICE\n";
        else if (l == 0)
            cout << "DRAW\n";
        else
            cout << "BOB\n";
    }
    return 0;
}
```
:::
