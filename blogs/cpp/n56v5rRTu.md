---
title: 'Makefile'
date: 2020-10-30 19:05:31
tags: [cpp]
mathjax: true
---

## 编译和链接

源文件首先会生成中间目标文件（编译），再由中间目标文件生成执行文件  （链接）

在编译时，编译器只检测程序语法和函数、变量是否被声明。如果函数未被声明，编译器会给出一个警告，但可以生成 Object File（Linux是.o文件 windows下是obj 文件） 

在链接时，链接器会在所有的 Object File 中找寻函数的实现，如果找不到，那到就会报链接错误码（Linker Error），在 VC 下，这种错误一般是： Link 2001 错误，意思说是说，链接器未能找到函数的实现，你需要指定函数的 Object File  

makefile  的目的就是告诉 make 命令如何编译和链接程序

##  Makefile的基本规则

###  基本格式

```sh
target ... : prerequisites ; command
	command #xxxx
	...
	... 
```

上面表示一组命令

target  表示这组命令的目标，可以是一个 object file（目标文件），也可以是一个执行文件，还可以是一个标签（label）

prerequisites 生成该 target 所依赖的文件和/或 target。如果其中的某个文件要比目标文件要新，那么，目标就被认为是“过时的”，被认为是需要重生成的。

command 该 target 要执行的命令（任意的 shell 命令）  如果其不与“target:prerequisites”在一行，那么，必须以 Tab 键开头，如果和 prerequisites 在一行，那么可以用分号做为分隔。  

\# 注释

### 使用变量

```sh
edit : main.o kbd.o command.o display.o \
        insert.o search.o files.o utils.o
    cc -o edit main.o kbd.o command.o display.o \
		insert.o search.o files.o utils.o
```

有重复部分，可以使用变量简化

```sh
objects = main.o kbd.o command.o display.o \
	insert.o search.o files.o utils.o
edit : $(objects)
    cc -o edit $(objects)
```

###  清空目标文件

一般做法（一般放在文件末尾）

```sh
.PHONY : clean
clean :
	-rm edit $(objects)
```

.PHONY 表示clean是一个伪目标(不代表一个真正的文件名)

rm 命令前面加了一个减号的意思是，如果某些文件出现问题，不要管，继续做后面的事。  

shell里调用`make clean`可以执行

### 引用其它的 Makefile  

```sh
include <filename>
```

filename 可以是当前操作系统 Shell 的文件模式（可以包含路径和通配符)

如果文件都没有指定绝对路径或是相对路径的话， make 会在当前目录下首先寻找，如果当前目录下没有找到，那么， make 还会在下面的几个目录下找：

1. 如果 make 执行时，有 -I 或 --include-dir 参数，那么 make 就会在这个参数所指定的目录下去寻找。
2. 如果目录 `prefix/include` （一般是： /usr/local/bin 或 /usr/include ）存在的话， make 也会去找。  

###  make工作方式

1.  读入所有的 Makefile。
2.  读入被 include 的其它 Makefile。
3.  初始化文件中的变量。
4.  推导隐晦规则，并分析所有规则。
5.  为所有的目标文件创建依赖关系链。
6.  根据依赖关系，决定哪些目标要重新生成。
7.  执行生成命令。

###  示例

```sh
objects = main.o kbd.o command.o display.o \
	insert.o search.o files.o utils.o
edit : $(objects)
    cc -o edit $(objects)

main.o : main.c defs.h
	cc -c main.c
kbd.o : kbd.c defs.h command.h
	cc -c kbd.c
command.o : command.c defs.h command.h
	cc -c command.c
display.o : display.c defs.h buffer.h
	cc -c display.c
insert.o : insert.c defs.h buffer.h
	cc -c insert.c
search.o : search.c defs.h buffer.h
	cc -c search.c
files.o : files.c defs.h buffer.h command.h
	cc -c files.c
utils.o : utils.c defs.h
	cc -c utils.c
	
.PHONY : clean
clean :
	-rm edit $(objects)
```



1. make 会在当前目录下找名字叫“Makefile”或“makefile”的文件
2. 如果找到，它会找文件中的第一个目标文件（target），在上面的例子中，他会找到“edit”这个文件，并把这个文件作为最终的目标文件
3. 如果 edit 文件不存在，或是 edit 所依赖的后面的 .o 文件的文件修改时间要比 edit 这个文件新，那么，他就会执行后面所定义的命令来生成 edit 这个文件
4. 如果 edit 所依赖的 .o 文件也不存在，那么 make 会在当前文件中找目标为 .o 文件的依赖性，如果找到则再根据那一个规则生成 .o 文件
5. 当然，你的 C 文件和 H 文件是存在的啦，于是 make 会生成 .o 文件，然后再用 .o 文件生成 make的终极任务，也就是执行文件 edit 了

如果被依赖的文件找不到 ，或者前面没有`-`的命令执行出错，make会直接退出并报错

##  命令

###  显示命令

make 会把其要执行的命令行在命令执行前输出到屏幕上。当我们用 @ 字符在命令行前，那么，这个命令将不被 make 显示出来  

例子：

```
@echo 正在编译 XXX 模块......
```

输出

```
正在编译 XXX 模块......
```



而

```
echo 正在编译 XXX 模块......
```

输出

```
echo 正在编译 XXX 模块......
正在编译 XXX 模块......
```

make 参数 -n 或 --just-print ，那么其只是显示命令，但不会执行命令，这个功能有利于我们调试我们的 Makefile，看看我们书写的命令是执行起来是什么样子的或是什么顺序的  

### 命令包

类似于函数,以 define 开始，以 endef 结束，如：

```sh
define run-yacc
yacc $(firstword $^)
mv y.tab.c $@
endef


foo.c : foo.y
	$(run-yacc)
```

##  变量

在 Makefile 中的定义的变量，就像是 C/C++ 语言中的宏一样，代表一个文本字串，在 Makefile中执行的时候其会自动原模原样地展开在所使用的地方。其与 C/C++ 所不同的是，你可以在 Makefile中改变其值  

### 基础

变量在声明时需要给予初值  

变量会在使用它的地方原样展开，就像 C/C++ 中的宏一样，例如：  

```sh
foo = c
prog.o : prog.$(foo)
	$(foo)$(foo) -$(foo) prog.$(foo)
```

展开后得到

```sh
prog.o : prog.c
	cc -c prog.c
```

`:=` 是覆盖之前的值

变量的声明可以嵌套

`例子`，空格的定义

```sh
nullstring :=
space := $(nullstring) # end of the line
```

nullstring表示空值，而space表示空格。如果变量声明后面跟着注释的话，会截取到\#前面

比如下面这个dir 这个变量的值是“/foo/bar”，后面还跟了 4 个空格  

```sh
dir := /foo/bar # directory to put the frobs in
```

`?= 例子`

```sh
FOO ?= bar
```

含义是，如果 FOO 没有被定义过，那么变量 FOO 的值就是“bar”，如果 FOO 先前被定义过，那么这条语将什么也不做  

#### 追加变量值

`+=` 符号

```sh
objects = main.o foo.o bar.o utils.o
objects += another.o
```



###  高级用法

#### 变量值的替换

`$(var:a=b) 或 ${var:a=b}  ` ， 把变量var中所有以a作为结尾（后面跟着空格或者结束）的a替换为b

#### 把变量的值再当成变量  

```
x = y
y = z
a := $($(x))
```

`$(x)` 的值是“y”，所以 `$($(x))` 就是 `$(y)`，于是 `$(a) `的值就是“z”  

#### override 指示符  

如果有变量是通常 make 的命令行参数设置的，那么 Makefile 中对这个变量的赋值会被忽略。如果想在 Makefile 中设置这类参数的值，那么可以使用“override”指示符。  

```sh
override CFLAGS += -g
```

#### 多行变量

使用 define 关键字设置变量的值可以有换行，这有利于定义一系列的命令（前面我们讲过“命令包”的技术就是利用这个关键字）。
define 指示符后面跟的是变量的名字，而重起一行定义变量的值，定义是以 endef 关键字结束。其工作方式和“=”操作符一样。变量的值可以包含函数、命令、文字，或是其它变量。因为命令需要以 [Tab]键开头，所以如果你用 define 定义的命令变量中没有以 Tab 键开头，那么 make 就不会把其认为是命令。  

#### 目标变量（局部变量）

作用范围只在对应的目标范围以及连带的目标范围中  

```sh
prog : CFLAGS = -g # 只在下面的语句里起效
prog : prog.o foo.o bar.o
	$(CC) $(CFLAGS) prog.o foo.o bar.o
prog.o : prog.c
	$(CC) $(CFLAGS) prog.c
foo.o : foo.c
	$(CC) $(CFLAGS) foo.c
bar.o : bar.c
	$(CC) $(CFLAGS) bar.c
```

##  条件判断

语法

```
<conditional-directive>
<text>
else
<text>
endif
```

`conditional-directive` 可以是

```
ifeq (<arg1>, <arg2>)
ifeq '<arg1>' '<arg2>'
ifeq "<arg1>" "<arg2>"
ifeq "<arg1>" '<arg2>'
ifeq '<arg1>' "<arg2>"
```

比较arg1和arg2是否相同

`ifneq`比较的是不同

`ifdef` 当变量不为空的时候为真

```
ifdef <variable-name>
```

`ifndef`相反



make 是在读取 Makefile 时就计算条件表达式的值，并根据条件表达式的值来选择语句，所以，最好不要把自动化变量（如 \$@ 等）放入条件表达式中，因为自动化变量是在运行时才有的  

##  函数

函数调用和变量类似，语法为

```
$(<function> <arguments>)
```

或者

```
${<function> <arguments>}
```

###  字符串处理函数

#### subst

```sh
$(subst <from>,<to>,<string>)
```

- 功能：把字串 `string` 中的 `from` 字符串替换成 `to`。

- 返回：函数返回被替换过后的字符串。

- 示例：

  ```sh
   $(subst ee,EE,feet on the stree t)
  ```


  把 feet on the str eet 中的 ee 替换成 EE ，返回结果是 fEEt on the strEEt   

#### patsubst  

```sh
$(patsubst <pattern>,<replacement>,<string>)
```

- 功能：把 `string`中的符合 `pattern`的 字符串替换成 `replacement`。

- 返回：函数返回被替换过后的字符串。

- 示例：

  ```sh
   $(patsubst %.c,%.o,x.c.c bar.c)
  ```


  字串 x.c.c bar.c 符合模式 %.c 的单词替换成 %.o ，返回结果是 x.c.o bar.o  

#### strip  

```sh
$(strip <string>)
```

- 功能：删除字符串 `string` 首尾的空格。

- 返回：函数返回被替换过后的字符串。

- 示例：

  ```sh
   $(strip a b c )
  ```


  把a b c首尾的空格删除 ，返回`a b c` 

#### findstring  

```sh
$(findstring <find>,<string>)
```

- 功能：在字符串 `string` 中查找 `find` 字串  。

- 返回：如果找到，那么返回 `find` ，否则返回空字符串  。

- 示例：

  ```sh
  $(findstring a,a b c)
  $(findstring a,b c)
  
  ```


  第一个函数返回 a 字符串，第二个返回空字符串

#### filter  

```sh
$(filter <pattern...>,<string>)
```

- 功能：以 `pattern` 模式过滤 `string` 字符串中的单词，保留符合模式 `pattern` 的单词。可以
  有多个模式。  

- 返回：返回符合模式 `pattern` 的字串    。

- 示例：

  ```sh
  sources := foo.c bar.c baz.s ugh.h
  foo: $(sources)
  	cc $(filter %.c %.s,$(sources)) -o foo
  ```

  `$(filter %.c %.s,$(sources)) `返回的值是 `foo.c bar.c baz.s` 。  

#### filter-out 

```sh
$(filter-out  <pattern...>,<string>)
```

- 功能：和fillter相反

- 返回：返回不符合模式 `pattern` 的字串    。

- 示例：

  ```sh
  objects=main1.o foo.o main2.o bar.o
  mains=main1.o main2.o
  ```

  `$(filter-out $(mains),$(objects)) `返回的值是 `foo.o bar.o ` 。  

#### sort   

```sh
$(sort  <list...>)
```

- 功能：将`list`中的字符串排序

- 返回：返回排序好的字符串    。

- 示例：

  `$(sort foo bar lose)   `返回的值是 `bar foo lose` 。  

  sort 函数会去掉 `list` 中相同的单词  

#### word

```sh
$(word <n>, <list...>)
```

- 返回：返回`list`中的第n个字符串    。

#### wordlist

```sh
$(wordlist <begin>,<end>,<list...>)
```

- 返回：返回`list`中的`[begin,end]`中的字符串  (从1 开始计)。

#### words

```sh
$(words  <list...>)
```

- 返回：返回`list`中的字符串个数 。

#### firstword

```sh
$(firstword  <list...>)
```

- 返回：返回`list`中的第一个字符串。

### 6.2 文件名操作函数  

#### dir  

```sh
$(dir  <list...>)
```

- 从`list`中取出目录部分。目录部分是指最后一个反斜杠（/ ）之前的部分。如果没有反斜杠，那么返回 ./ 。  
- 示例： `$(dir src/foo.c hacks)` 返回值是 `src/ ./` 。  

#### notdir  

```sh
$(notdir  <list...>)
```

- 从`list`中取出非目录部分（即文件名）。
- 示例： `$(notdir src/foo.c hacks)` 返回值是 `foo.c hacks` 。  

#### suffix  

```sh
$(suffix  <list...>)
```

- 从`list`中取出文件后缀名，没有的话返回空字符串

#### basename  

```sh
$(basename  <list...>)
```

- 从`list`中取出文件名，不包含后缀

#### addsuffix  

```sh
$(addsuffix  <suffix>,<list...>)
```

- 将`list`中的每一个字符串添加后缀

#### addprefix  

```sh
$(addsuffix  <prefix>,<list...>)
```

- 将`list`中的每一个字符串添加前缀

#### join

```sh
$(join  <list1...>,<list2...>)
```

- 将`list1`和`list2`中的字符串依次拼接。
- 示例： `$(join aaa bbb , 111 222 333)` 返回值是 `aaa111 bbb222 333` 。

###  foreach 函数

```
$(foreach <var>,<list>,<text>)
```

把参数 `list` 中的单词逐一取出放到参数 `var` 所指定的变量中，然后再执行 `text` 所包含的表达式。每一次`text` 会返回一个字符串，循环过程中， `text` 的所返回的每个字符串会以空格分隔，最后当整个循环结束时， `text` 所返回的每个字符串所组成的整个字符串（以空格分隔）将会是 foreach 函数的返回值。  

实例

```sh
names := a b c d
files := $(foreach n,$(names), $(n).o) # files值为  a.o b.o c.o d.o
```

var的作用域仅在foreach中

###  if函数

```
$(if <condition>,<then-part>,<else-part>)
```

和c的三目运算符？ 效果一样

###  call函数

```
$(call <expression>,<parm1>,<parm2>,...,<parmn>)
```

当 make 执行这个函数时， `expression` 参数中的变量，如 \$(1) 、 \$(2) 等，会被参数 `parm1` 、
`parm2`依次取代。而 `expression` 的返回值就是 call 函数的返回值。例如  

```sh
reverse = $(2) $(1)
foo = $(call reverse,a,b) # foo的值为 b a
```

###  shell函数

shell 函数把执行操作系统命令后的输出作为函数返回  

```sh
contents := $(shell cat foo)
files := $(shell echo *.c)
```

这个函数会新生成一个 Shell 程序来执行命令，所以要注意其运行性能  



##  make

### 指定Makefile

 GNU make 找寻默认的 Makefile 的规则是在当前目录下依次找三个文件——“GNUmakefile”、“makefile”和“Makefile”  

使用-f 或是 --file 参数  可以自己指定makefile文件

```
make –f xx.mk
```

