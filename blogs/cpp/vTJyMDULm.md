---
title: 'c++类型转换'
date: 2020-11-25 16:13:35
tags: [cpp]
mathjax: true
---
C++目前包含的类型转换有：

- c风格的隐式类型装换
- `static_cast`编译时转换，转型失败的话就不能编译。
- `dynamic_cast`运行时，转型失败的话会返回NULL（转指针时）或引发std::bad_cast异常（转引用时）。
- `reinterpret_cast`意为重新解释，转型时不做任何检查。
- ` const_cast`去掉常量性。

以上不是重点

在看`muduo`代码的时候又看到了两种转换，应该是Google的奇技淫巧

## implicit_cast

```cpp
template<typename To, typename From>
inline To implicit_cast(From const &f)
{
  return f;
}
```

很简单一个隐式类型转换，可以用来替代 static_cast 或者 const_cast

在小转大的时候和普通的类型转换没有区别

```cpp
double d = 3.14;
int i = 3;
std::min(d, implicit_cast<double>(i));
```
大转小的时候implicit_cast编译器会警告，而另外两种不会
```cpp
    const double d = 3.15;
    const int i = 3;
    cout << min(i, implicit_cast<int>(d)); // 警告：可能有数据损失
    cout << min(i, static_cast<int>(d)); // 没有警告
    cout << min(i, (int)d); // 没有警告
```
可能这样更加安全吧

## down_cast

```cpp
template<typename To, typename From>     // use like this: down_cast<T*>(foo);
inline To down_cast(From* f)                     // so we only accept pointers
{
  if (false)
  {
    implicit_cast<From*, To>(0);
  }

#if !defined(NDEBUG) && !defined(GOOGLE_PROTOBUF_NO_RTTI)
  assert(f == NULL || dynamic_cast<To>(f) != NULL);  // RTTI: debug mode only!
#endif
  return static_cast<To>(f);
}

```
down_cast是在继承结构中往下转型，它是用来替代dynamic_cast的，没有运行时检查，直接用static_cast来做转型，从而提高性能。当然，使用场景也就受了限制，只有当你 100% 确定 From 和 To 的关系时，才能使用，否则后果自负。

比较巧妙的是`implicit_cast`的使用，让编译器帮助做了类型检查，而 if (false) 条件保证了最终肯定会被编译器优化掉，所以对性能没有任何影响。