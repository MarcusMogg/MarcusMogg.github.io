---
title: 'Cmake基础'
date: 2020-11-05 22:07:09
tags: [cpp]
mathjax: true
---

通过这个[项目](https://github.com/ttroy50/cmake-examples)来学习cmake

cmake文档地址 https://cmake.org/documentation

c++没有统一的module太难受了，build system好复杂……


## 概述

### CMakeList.txt

cmake 命令执行时会查找这个文件，然后执行里面的命令（类似于Makefile）

### Minimum CMake version

cmake版本更新的蛮快的，2.x和3.x功能有差异，你可以指定最低版本号来保证cmake功能一定被支持。

```cmake
cmake_minimum_required(VERSION 3.5)
```

### Project name

cmake可以指定项目名，这样在使用多个项目时使引用某些变量更加容易。

```cmake
project (hello_cmake)
```

### 创建一个可执行文件

```cmake
add_executable(hello_cmake main.cpp)
```

`add_executable` 按照指定的源文件编译可执行文件。第一个参数是生成的可执行文件名字，第二个是源文件列表

有时我们可以将可执行文件名设置为project name，可以这样写

```cmake
project (hello_cmake)
add_executable(${PROJECT_NAME} main.cpp)
```

### 执行cmake

cmake在shell中调用的方式是

```
cmake dir
```

其中dir是CMakeList.txt所在的目录。cmake的产物（Makefile之类）会在当前文件夹。

一般在根部目录下建立一个build目录，然后在build目录中编译

## 头文件

使用这个例子

```
.
├── CMakeLists.txt
├── build
├── include
│   └── Hello.h
└── src
    ├── Hello.cpp
    └── main.cpp
```

### 文件目录

cmake提供了一些变量来帮助你使用文件目录（在build里执行cmake）

| Variable                 | Info                                                  |
| ------------------------ | ----------------------------------------------------- |
| CMAKE_SOURCE_DIR         | CMakeLists文件目录(`.`)                               |
| CMAKE_CURRENT_SOURCE_DIR | 当前处理的CMakeLists目录（如果使用子项目和目录）(`.`) |
| PROJECT_SOURCE_DIR       | 当前cmake项目的源目录。(`.`)                          |
| CMAKE_BINARY_DIR         | 运行cmake命令的目录。(`./build`)                      |
| CMAKE_CURRENT_BINARY_DIR | 当前所在的构建目录。(`./build`)                       |
| PROJECT_BINARY_DIR       | 当前项目所在的构建目录。(`./build`)                   |




### 创建一个变量

创建一个包含所有源文件的变量可以很方便的在许多命令中调用，比如

```cmake
set(SOURCES
    src/Hello.cpp
    src/main.cpp
)

add_executable(${PROJECT_NAME} ${SOURCES})
```

modern cmake不推荐使用变量来指定源文件，而推荐使用add_xx指令（见static_library)

### 添加目录

在上面的例子中，你要使用的头文件目录和源文件目录不是一个，这时候需要使用`target_include_directories`指令。相当于gcc的`-I`参数

```cmake
target_include_directories(target
    PRIVATE
        ${PROJECT_SOURCE_DIR}/include
)
```

### 详细输出

cmake玩，直接make会显示编译过程。如果为了debug，想要看更详细的输出，可以使用`make VERBOSE=1`

## static library

使用这个例子

```
.
├── CMakeLists.txt
├── build
├── include
│   └── static
│       └── Hello.h
└── src
    ├── Hello.cpp
    └── main.cpp
```

### 添加静态库

```cmake
add_library(hello_library STATIC # 表示静态库 还可以是SHARE等
    src/Hello.cpp
)
```

这个指令会将指定的源文件编译为静态库文件。上面的例子中，最终编译产物是`libhello_library.a`

### 填充 Including Directories（头文件目录）

```cmake
target_include_directories(hello_library
    PUBLIC
        ${PROJECT_SOURCE_DIR}/include
)
```

熟悉的指令，但是使用了不同的作用域（scope）。target_** 指令都有这些作用域

included directory 会在编译library和连接这个library的时候使用 

scope可以为:

- PRIVATE ：只添加到当前target的included directory，也就是不对外暴露接口，只有当前的库使用
- INTERFACE：添加到所有连接到这个库的target中，对外暴露
- PUBLIC：相当于private+interface

对于public的头文件最好使用namespace（c++）

target_include_directories里面的目录是included directory的根目录，比如在这个例子里是include

然后在main里引用的方式是

```cpp
#include "static/Hello.h"
```

这样可以减少头文件命名冲突

### 链接 library

```cmake
add_executable(hello_binary
    src/main.cpp
)

target_link_libraries( hello_binary
    PRIVATE
        hello_library
)
```

编译器会将hello_library生成的静态库链接到hello_binary里，生成最终的执行文件

相当于

```shell
/usr/bin/c++ xx/src/main.cpp.o -o hello_binary -rdynamic libhello_library.a
```

## 动态库

```cmake
add_library(hello_library SHARED 
    src/Hello.cpp
)
add_library(hello::library ALIAS hello_library)

target_include_directories(hello_library
    PUBLIC 
        ${PROJECT_SOURCE_DIR}/include
)

add_executable(hello_binary
    src/main.cpp
)

target_link_libraries( hello_binary
    PRIVATE 
        hello::library
)
```

和静态库的区别是add_library的时候是share

其中

```
add_library(hello::library ALIAS hello_library)
```

的意思是使用别名，在下面就可以使用这个别名

## 安装

生成`make install`目标，可以把文件、库安装到指定目录

`CMAKE_INSTALL_PREFIX`变量指定了安装的位置，默认为`/usr/local`，可以通过`cmake .. -DCMAKE_INSTALL_PREFIX=/install/location`指定

### install指令

```cmake
# 将二进制目标（可执行文件） 安装到 ${CMAKE_INSTALL_PREFIX}/bin
install (TARGETS cmake_examples_inst_bin
    DESTINATION bin)
# 将动态链接库安装到 ${CMAKE_INSTALL_PREFIX}/lib
install (TARGETS cmake_examples_inst
    LIBRARY DESTINATION lib)
# 将头文件目录到 ${CMAKE_INSTALL_PREFIX}/include
install(DIRECTORY ${PROJECT_SOURCE_DIR}/include/
    DESTINATION include)
# 将文件安装到 ${CMAKE_INSTALL_PREFIX}/include
install(FILES cmake-examples.conf
    DESTINATION include)
```



### 修改CMAKE_INSTALL_PREFIX

一是`cmake .. -DCMAKE_INSTALL_PREFIX=/install/location`指定

二是通过下面的

```cmake
if( CMAKE_INSTALL_PREFIX_INITIALIZED_TO_DEFAULT )# 检测是否为默认是
  message(STATUS "Setting default CMAKE_INSTALL_PREFIX path to ${CMAKE_BINARY_DIR}/install")
  set(CMAKE_INSTALL_PREFIX "${CMAKE_BINARY_DIR}/install" CACHE STRING "The path to use for make install" FORCE) ## CMAKE_INSTALL_PREFIX是一个cache变量
endif()
```

关于cache变量可以看这篇博客 https://www.cnblogs.com/ncuneugcj/p/9756324.html

简单来说，cache变量会保存在cmakelistcache文件里，每次cmake时，如果文件里没有，用默认值；如果在文件里，用文件里的值

### make  install到指定目录

```shell
make install DESTDIR=xxx
```

会把文件安装到 `xxx/$CMAKE_INSTALL_PREFIX/` 里

### uninstall

cmake不会自动生成uninstall

make install后会生成install_manifest.txt，所以可以这样删除

```shell
sudo xargs rm < install_manifest.txt
```

## Build Type

可以指定：

- `release` : 相当于指定`-O3 -DNDEBUG`
- `Debug ` : 相当于指定`-g`
- `MinSizeRel ` : 相当于指定`-Os -DNDEBUG`
- `RelWithDebInfo` : 相当于指定`-O2 -g -DNDEBUG`

通过`CMAKE_BUILD_TYPE` 指定，修改方式和CMAKE_INSTALL_PREFIX一样

## 编译选项

相当于gcc -Dxxx（设置宏）

在代码中是

```cpp
#ifdef EX2
  std::cout << "Hello Compile Flag EX2!" << std::endl;
#endif

#ifdef EX3
  std::cout << "Hello Compile Flag EX3!" << std::endl;
#endif
```



支持两种方式来设置编译选项

###  per-target flags 

```cmake
target_compile_definitions(cmake_examples_compile_flags 
    PRIVATE EX3
)
```

modern cmake推荐这种方式

### 修改变量

` CMAKE_C_FLAGS` 和` CMAKE_CXX_FLAGS ` 一个c一个c++

```cmake
set (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -DEX2" CACHE STRING "Set C++ Compiler Flags" FORCE)
```

这个变量也可以在命令行使用

```
cmake .. -DCMAKE_CXX_FLAGS="-DEX3"
```

## 引用第三方库

### 查找第三方库

```cmake
find_package(Boost 1.46.1 REQUIRED COMPONENTS filesystem system)
```

find_package指令

这个指令不是随随便便一个第三库都能用……cmake官方为我们预定义了许多寻找依赖包的Module，存储在`path_to_your_cmake/share/cmake-<version>/Modules`（默认是 `/usr/share/cmake-version/Modules/`）目录下。

`Modules/Find<LibaryName>.cmake`命名的文件都可以帮我们找到一个包，可以直接使用find_package函数进行引用。

[官方文档：Find Modules](https://link.zhihu.com/?target=https%3A//cmake.org/cmake/help/latest/manual/cmake-modules.7.html)。

以boost为例，需要安装boost `sudo apt-get install libboost-all-dev`

参数为：

- Boost ：需要找的第三方库名字。会通过FindBoost.cmake寻找库
- 1.46.1 ： 需要的最低版本
- REQUIRED ： 这个库是必须的，找不到会报错终止
- COMPONENTS ： 需要的库列表

### 检查库是否找到

```cmake
if(Boost_FOUND)
    message ("boost found")
    include_directories(${Boost_INCLUDE_DIRS})
else()
    message (FATAL_ERROR "Cannot find Boost")
endif()
```

### 自定义`Find<LibraryName>.cmake`模块

参考这边[博客](https://zhuanlan.zhihu.com/p/97369704)

## 使用clang

修改变量CMAKE_C_COMPILER 和CMAKE_CXX_COMPILER 

方式和之前一样两种

```
cmake .. -DCMAKE_C_COMPILER=clang-3.6 -DCMAKE_CXX_COMPILER=clang++-3.6
```

## 生成方式

cmake支持多种Generator

命令行：

- Borland Makefiles
- MSYS Makefiles
- MinGW Makefiles
- NMake Makefiles
- NMake Makefiles JOM
- Ninja
- Unix Makefiles
- Watcom WMake

IDE：

- Visual Studio 6
- Visual Studio 7
- Visual Studio 7 .NET 2003
- Visual Studio 8 2005
- Visual Studio 9 2008
- Visual Studio 10 2010
- Visual Studio 11 2012
- Visual Studio 12 2013
- Xcode

调用方式，以ninja为例子

```
cmake .. -G Ninja
```



## C++ 标准

不只是c++ standard，应该是所有编译器参数

### 检查是否支持

cmake 支持检查是否支持编译器参数

```cmake
include(CheckCXXCompilerFlag)  # include CHECK_CXX_COMPILER_FLAG这个函数
CHECK_CXX_COMPILER_FLAG("-std=c++11" COMPILER_SUPPORTS_CXX11)
```

这个例子检查是否支持`-std=c++11` ,将结果存在 `COMPILER_SUPPORTS_CXX11`变量里

### 添加flag

```cmake
if(COMPILER_SUPPORTS_CXX11)#
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")
elseif(COMPILER_SUPPORTS_CXX0X)#
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++0x")
else()
    message(STATUS "The compiler ${CMAKE_CXX_COMPILER} has no C++11 support. Please use a different C++ compiler.")
endif()
```

### CMAKE_CXX_STANDARD

cmake 3.1 之后支持使用CMAKE_CXX_STANDARD变量

```cmake
# set the C++ standard to C++ 11
set(CMAKE_CXX_STANDARD 11)
```

## 子项目

例子目录结构

```
$ tree
.
├── CMakeLists.txt
├── subbinary # 可执行文件
│   ├── CMakeLists.txt
│   └── main.cpp
├── sublibrary1 # 静态库
│   ├── CMakeLists.txt
│   ├── include
│   │   └── sublib1
│   │       └── sublib1.h
│   └── src
│       └── sublib1.cpp
└── sublibrary2 # 只有头文件的库
    ├── CMakeLists.txt
    └── include
        └── sublib2
            └── sublib2.h
```

### 添加子目录

一个CMakeLists.txt文件里可以引用包含CMakeLists.txt（另一个文件）的子目录

```cmake
# ./CMakeLists.txt
add_subdirectory(sublibrary1)
add_subdirectory(sublibrary2)
add_subdirectory(subbinary)
```

### 引用子目录

当一个项目使用了`project()`命令后，cmake会自动产生一些变量来帮助引用项目

| Variable           | Info                                                         |
| ------------------ | ------------------------------------------------------------ |
| PROJECT_NAME       | 当前项目名                                                   |
| CMAKE_PROJECT_NAME | 顶级项目名                                                   |
| PROJECT_SOURCE_DIR | 当前项目的源目录                                             |
| PROJECT_BINARY_DIR | 当前项目的构建目录                                           |
| name_SOURCE_DIR    | “name” 项目所在的目录，比如在上面例子中，可以在其他子目录里调用`${sublibrary1_SOURCE_DIR}` |
| name_BINARY_DIR    | “name” 项目build所在的目录                                   |

###  Header only Libraries

如果你的库是 Header only Libraries（就是全写在头文件里），cmake支持创建一个`interface` 目标但是没有构建输出

```cmake
# ./sublibrary2/CMakeLists.txt
add_library(${PROJECT_NAME} INTERFACE)
add_library(sub::lib2 ALIAS ${PROJECT_NAME})

target_include_directories(${PROJECT_NAME}
    INTERFACE
        ${PROJECT_SOURCE_DIR}/include
)
```

### 引用库

就正常引用呗

```cmake
# ./subbinary/CMakeLists.txt
target_link_libraries(${PROJECT_NAME}
    sub::lib1 # 这里用来别名
    sub::lib2 
)
```

