---
title: 'Shell script'
date: 2020-10-25 22:10:45
tags: [Linux使用]
mathjax: true
---
shell脚本的一些笔记


## 数值计算
`$((计算式)) `

例子
```shell
read -p "first number: " firstnu
read -p "second number: " secnu
total=$((${firstnu}*${secnu}))
echo -e "\nThe result of ${firstnu} x ${secnu} is ==> ${total}"
```
## 默认变量

脚本里可以使用`$0``$1`等变量，第一个是脚本路径（调用的时候输入的内容，如果只输入文件名的话就只有文件名），后面是输入的参数
```shell
/path/to/scriptname opt1 opt2 opt3 opt4
$0                                $1    $2     $3    $4
```

`$#`:表示参数个数。上面例子是4
`$@`:表示参数列表。
`$*`:表示所有参数合成的字符串。

## ifelse

基本语法
```shell
if [条件判断式]; then
    do something
elif [条件判断式]; then
    do something
else
    do something
fi
```

## case
基本语法

```shell
case $变量名 in
    "xxxxx" )
        do something
        ;;
    "xxxxx" )
        do something
        ;;
    *) # 最后用*表示剩下的所有值
        do something
        ;;
esac
```

## function

基本语法

```shell
function xxx(){
    do something
}
```
函数的参数可以用`$1`、`$2`这样调用，注意函数内外是不一样的

因为 shell script 的执行方式是由上而下，由左而右， 因此在 shell script 当中的 function 一定要在程序的最前面

## while

基本语法

```shell
while [ condition ] 
do # 是关键词
    程序段
done 
```

例子：计算1+2+....+100
```shell
s=0
i=0
while [ "${i}" != "100" ]
do
    i=$(($i+1))
    s=$(($s+$i)) 
done
echo"The result of '1+2+3+...+100' is ==> $s
```
## for

### 用法1
```shell
for var in con1 con2 con3 ... # 可以是手写变量，可以是列表
do
    程序段
done
```

例子
```shell
s=0
for i in $(seq 1 100) # seq命令用于产生从某个数到另外一个数之间的所有整数。
# 也可以使用bash自带的{1..100} 中间两个小数点表示连续出现
do
    s=$(($s+$i)) 
done
echo"The result of '1+2+3+...+100' is ==> $s
```

### 用法2

```shell
for (( 初始值; 限制值; 执行步阶 ))
do
    程序段
done
```
例子
```shell
s=0
for (( i=1; i<=${nu}; i=i+1 ))
do
    s=$((${s}+${i}))
done
echo "The result of '1+2+3+...+${nu}' is ==> ${s}
```

## 执行shell脚本

```
sh [-nvx] scripts.sh
选项与参数：
-n ：不要执行 script，仅查询语法的问题；
-v ：执行 sccript 前，先将 scripts 的内容输出到屏幕上；
-x ：将执行的 script 内容一步一步显示到屏幕上
```
