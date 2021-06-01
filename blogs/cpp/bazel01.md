---
title: 'Bazel基础'
date: 2021-06-01 18:46:09
tags: [cpp]
categories: ["CppTools"]
---

## Why Bazel

看到一个回答[腾讯微信事业群后台开发环境](https://www.zhihu.com/question/265829202/answer/1081457634)，社畜自觉学习一下……

## Install

```sh
sudo apt update && sudo apt install bazel
```

不过wsl里妹识别出来，手动装一下

[Release地址](https://github.com/bazelbuild/bazel/releases)

```sh
sudo apt install g++ unzip zip
wget https://github.com/bazelbuild/bazel/releases/download/4.1.0/bazel-4.1.0-installer-linux-x86_64.sh
chmod +x bazel-4.1.0-installer-linux-x86_64.sh
./bazel-4.1.0-installer-linux-x86_64.sh --user
```

`--user` 选项会使得balze安装在`$HOME/bin`

然后将下面的命令写入配置文件

```sh
export PATH="$PATH:$HOME/bin"
```

## Building a C++ Project

参考项目 https://github.com/bazelbuild/examples 

### 设置工作区

一份比较典型的bazel工作目录为

```sh
root
├── main
│   ├── BUILD
│   ├── hello-greet.cc
│   └── hello-greet.h
├── lib
│   ├── BUILD
│   ├── hello-time.cc
│   └── hello-time.h
└── WORKSPACE
```

在构建项目之前，需要先设置工作区（workspace），即你项目源代码的位置。

通常会包括：

- 一个WORKSPACE在项目的根目录
- 多个BUILD文件，告诉bazel怎么编译项目的不同部分。一个包含BUILD文件的目录会被Bazel识别为一个包(package)

### BUILD file

一份BUILD file会包含多种不同类型的指令。其中最重要的就是构建规则（ build rule），告诉bazel如何进行BUILD

每个构建规则的实例被称为一个目标（target），包含一系列特定的源文件和依赖（也可以包含其他target）

一份最简单的BUILD文件，见`cpp-tutorial/stage1/main`

```sh
cc_binary(
    name = "hello-world",
    srcs = ["hello-world.cc"],
)
```

这里包含了bazel内置的一个构建规则[`cc_binary` rule](https://docs.bazel.build/versions/4.1.0/be/c-cpp.html#cc_binary)，告诉bazel如何从源文件构建一个可执行文件。

### Build

在`cpp-tutorial/stage1`文件下执行

```
stage1
├── main
│   ├── BUILD
│   └── hello-world.cc
└── WORKSPACE
```



```sh
bazel build //main:hello-world
```

`//main:`是`BUILD`文件根目录相对于`WORKSPACE`的位置

`hello-world`是我们在BUILD文件里指定的name字段

构建完成之后会在`WORKSPACE`所在的根目录下生成好几个文件夹

我们的可执行文件在`bazel-bin/main/hello-world`

### 构建多个目标

在`cpp-tutorial/stage2`文件下执行

```sh
stage2
├── main
│   ├── BUILD
│   ├── hello-greet.cc
│   ├── hello-greet.h
│   └── hello-world.cc
└── WORKSPACE
```

hello-world.cc 引用了hello-greet.h

build 文件为

```sh
cc_library(
    name = "hello-greet",
    srcs = ["hello-greet.cc"],
    hdrs = ["hello-greet.h"],
)

cc_binary(
    name = "hello-world",
    srcs = ["hello-world.cc"],
    deps = [
        ":hello-greet",
    ],
)
```

`bazel build //main:hello-world`构建时，先构建`hello-greet`library，然后构建`hello-world`binary

如果你只修改了helloworld.cc，bazel只会重新build `hello-world`binary的部分

### 使用多个包

在`cpp-tutorial/stage3`文件下执行

```sh
stage3
|── main
│   ├── BUILD
│   ├── hello-greet.cc
│   └── hello-greet.h
├── lib
│   ├── BUILD
│   ├── hello-time.cc
│   └── hello-time.h
└── WORKSPACE
```

build 文件为

```sh
#lib/BUILD
cc_library(
    name = "hello-time",
    srcs = ["hello-time.cc"],
    hdrs = ["hello-time.h"],
    visibility = ["//main:__pkg__"],
)
#main/BUILD
cc_library(
    name = "hello-greet",
    srcs = ["hello-greet.cc"],
    hdrs = ["hello-greet.h"],
)

cc_binary(
    name = "hello-world",
    srcs = ["hello-world.cc"],
    deps = [
        ":hello-greet",
        "//lib:hello-time",
    ],
)
```

需要注意的是默认情况下，target只对同一个build文件里的有效，所以我们需要显式指出对main下面的build可见，即`visibility`指令

## 常见场景示例

### 一个目标里包含多个文件

```sh
cc_library(
    name = "build-all-the-files",
    srcs = glob(["*.cc"]),
    hdrs = glob(["*.h"]),
)
```

使用[glob函数](https://docs.bazel.build/versions/4.1.0/be/functions.html#glob)

### 添加引用路径

```sh
└── my-project
    ├── legacy
    │   └── some_lib
    │       ├── BUILD
    │       ├── include
    │       │   └── some_lib.h
    │       └── some_lib.cc
    └── WORKSPACE
```

假设你在somelib.cc写的时`#include "somelib.h"` ，但是bazel希望的方式是`legacy/some_lib/include/some_lib.h` ，为了使得路径可见，需要指定include 路径

```sh
cc_library(
    name = "some_lib",
    srcs = ["some_lib.cc"],
    hdrs = ["include/some_lib.h"],
    copts = ["-Ilegacy/some_lib/include"],
)
```



其实就是`-Idir`参数，应用外部文件的时候比较有用

copts 是为C++编译器提供的选项，在编译目标之前，这些选项按顺序添加到COPTS。这些选项仅仅影响当前目标的编译，而不影响其依赖。选项中的任何路径都相对于当前工作空间而非当前包。

### 测试和引用外部库

测试文件目录组织为

```sh
root
├── main
│   ├── BUILD
│   └── hello-world.cc
├── lib
│   ├── BUILD
│   ├── hello-greet.cc
│   └── hello-greet.h
├── test
│   ├── BUILD
│   └── hello-test.cc
├── BUILD       # necessary 为空即可，否则会报错
├── gtest.BUILD 
└── WORKSPACE
```

其中，test文件为

```cpp
// test/hello-test.cc
#include "gtest/gtest.h"
#include "lib/hello-greet.h"

TEST(HelloTest, GetGreet) {
  EXPECT_EQ(get_greet("Bazel"), "Hello Bazel");
}
```

我们使用了gtest，所以需要先引入 gtest

首先在`workspace` 文件下载依赖

```sh
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "gtest",
    url = "https://github.com/google/googletest/archive/release-1.7.0.zip",
    sha256 = "b58cb7547a28b2c718d1e38aee18a3659c9e3ff52440297e965f5edffe34b6d0",
    build_file = "@//:gtest.BUILD", # 如果项目已经包含BUILD文件，就不用自定义
)
```

然后创建`gtest.BUILD`，其实这点比较恶心，还得自己引入，c++好shi啊。

```sh
cc_library(
    name = "main",
    srcs = glob(
        ["googletest-release-1.7.0/src/*.cc"],
        exclude = ["googletest-release-1.7.0/src/gtest-all.cc"]
    ),
    hdrs = glob([
        "googletest-release-1.7.0/include/**/*.h",
        "googletest-release-1.7.0/src/*.h"
    ]),
    copts = [
        "-Iexternal/gtest/googletest-release-1.7.0/include",
        "-Iexternal/gtest/googletest-release-1.7.0"
    ],
    linkopts = ["-pthread"],
    visibility = ["//visibility:public"],
)
```

对应的`./test/BUILD` 文件未

```sh
cc_test(
    name = "hello-test",
    srcs = ["hello-test.cc"],
    copts = ["-Iexternal/gtest/googletest-release-1.7.0/include"],
    deps = [
        "@gtest//:main",
        "//lib:hello-greet",
    ],
)
```

运行`bazel test test:hello-test`

注意到这里有一串的`googletest-release-1.7.0`，其实可以省掉，需要在workspace里添加

```sh
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "gtest",
    url = "https://github.com/google/googletest/archive/release-1.7.0.zip",
    sha256 = "b58cb7547a28b2c718d1e38aee18a3659c9e3ff52440297e965f5edffe34b6d0",
    build_file = "@//:gtest.BUILD",
    strip_prefix = "googletest-release-1.7.0", # key point
)
```

然后其他文件的`googletest-release-1.7.0`都可以删掉。

### 静态库和动态库

使用`cc_import`  https://docs.bazel.build/versions/4.1.0/be/c-cpp.html#cc_import

## 总结

总的来说，bazel总的来说，脉络比cmake清晰很多，也简单很多，Makefile就别提了。

但是开源社区似乎更喜欢Cmake，因为Cmake更全面吗？

C++构建系统为什么这么麻烦啊，能不能爬