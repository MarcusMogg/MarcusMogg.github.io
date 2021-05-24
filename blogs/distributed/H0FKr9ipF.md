---
title: ' MapReduce 部分翻译'
date: 2020-08-21 15:51:36
tags: [分布式]
mathjax: true
---
学习MIT6.824，先看三篇经典paper

英语太烂了，不得不先翻译一遍……


## 摘要

`MapReduce`是一种用于处理、生成大数据集的编程模型和相关实现。 用户指定一个`Map`函数将一个键值对生成为一组中间键值对集合，一个`Reduce`函数合并所有具有相同中间key的中间值。如paper中所示，这个模型可以表示显示世界中的许多任务。

以这种方式编写的程序自然地支持并行和在大规模的商用集群上运行。运行时系统负责划分输入数据、在集群上的调度、处理机器故障、管理集群内部的通信。这使得没有任何并发处理和分布式经验的程序员可以轻松的利用大规模分布式系统的资源。

我们MapReduce的实现运行在一个大规模的商用服务器集群上，而且可以灵活的伸缩。一个典型的MapReduce计算处理几千台机器上许多TB的数据。程序员可以发现系统使用非常简单。在谷歌的集群上，每天都有几百个MapReduce程序、一千多个个MapReduce任务执行。

## 1 简介

在过去的五年里，作者和谷歌的许多员工已经实现了成百上千个特殊目的程序，用于将大量的原始数据（比如抓取的文挡、网络请求log）处理为各种衍生数据（比如倒排索引，网络文档的图结构的各种表示，每台主机爬取到的页数摘要，某一天里最频繁的请求等）。许多计算从概念上讲是很简单的。但是，输入数据是非常庞大的，计算需要分布到成百上千台机器上，这样才能在一个合理的时间内获取到结果。如何并行化计算，划分数据，处理异常这些问题通常需要大量复杂的代码去解决，使得原本简单的计算变的复杂。

为了解决复杂性，我们设计了一个抽象模型，使得我们可以表示需要的简单的计算，并且将并行、容错、数据划分、复杂均衡这些细节隐藏到一个库里。我们的抽象模型灵感来源于Lisp等函数式编程语言的`map、reduce`表示。我们认识到，许多计算过程都在输入中的逻辑记录上使用了map操作以处理为中间键值对，然后在所有具有相同key的value上使用reduce操作以合适地合并导出数据。函数模型的使用,再结合用户指定的map和reduce操作,让我们可以非常容易的实现大规模并行化计算,和使用再次执行作为初级机制来实现容错。

这份工作的主要贡献是一个简单、有效的接口可以自动并行化和分配大规模计算，结合这个接口的实现来在大量普通的PC机上实现高性能计算。

第二节描述了基本的编程模型并给出了一些例子。第三节介绍了我们基于集群环境的 Mapreduce 接口实现。第四节介绍了编程模型的一些技巧。第五节对我们执行各种任务的性能进行了度量。第六节介绍了MapReduce在谷歌内部的使用，包括我们以此为基础重写产品索引系统的经验。第七节是一些相关讨论和未来的工作。

## 2 编程模型

计算利用一个输入键值对集合，产出一个输出键值对结合。MapReduce库的用户将计算表示为两个函数 `Map`和`Reduce`。

`Map`，由用户编写，将一个键值对生成为一组中间键值对集合。MapReduce库将所有具有相同关键词`I`的中间value进行分组，然后传递给Reduce函数。

`Reduce`函数，同样由用户编写，接受一个中间key `I`和该key相关 的一组value。它将这些值合并到一起，形成一个可能更小的value集合。通常一个Reduce调用只产生一个或者零个输出。通过一个迭代器把中间value提供给用户自定义的reduce函数。这使得我们可以处理太大以至于内存放不下的value列表。

### 2.1 Example

考虑这样一个问题，计算一个大规模文档集合中每个单词的数目。用户将编写和下面伪代码类似的程序

```
map(String key, String value):
	// key: document name
	// value: document contents
	for each word w in value:
		EmitIntermediate(w, "1");

reduce(String key, Iterator value):
	// key: a word
	// value: a list of counts
	int result = 0;
	for each v in value:
		result += ParseInt(v)
	Emit(AsString(result));
```



`map`函数会发出每个单词以及相关的出现次数。`reduce`函数对一个特定单词发出的次数进行求和。

除此之外，用户需要编码用输入输出文件的名字和可选的调节参数来填充一个mapreduce规范（`mapreduce
specification   `）对象。用户之后调用MapReduce函数，传递给它规范对象。用户的代码需要和MapReduce库（C++实现）链接。附录A包含这个例子的完整代码。

### 2.2 Types

尽管之前的伪代码使用的是字符串输入和输出，但是从概念上讲，用户提供的map和reduce函数具有相关的类型

```
map      (k1,v1)       ->list(k2,v2)
reduce   (k2,list(v2)) ->list(v2)
```

输入的键值对和输出的键值对来自不同的域。但是中间键值对和输出键值对来自相同的域。

我们的C++实现在用户实现的函数之间传递字符串，并且用户可以自行编写代码将字符串转换为适当的类型。

### 2.3 More Examples

下面有一些有趣的程序，可以很轻松的使用MapReduce计算表示。

- 分布式Grep：map函数发送满足特定模式的行。reduce函数仅将中间数据输出。
- 统计URL访问频率：map函数处理web页面请求的日志信息，发送`<URL,1>`。reduce函数将同一个URL的次数加到一起，并发送`<URL,total cnt>`
- 反转网络链接图：map函数对`source`页面中的所有`target`连接输出`<target,source>`。reduce函数将指定URL相关的tsource URL放到一个列表里，返回`<URL,list(source)>`
- 分布式排序：map函数从record中提取key，然后发送`<key ,record>`。reduce函数不改变键值对。这个计算依赖于4.1中介绍的划分设备(partitioning facilities  )和4.2中介绍的排序(ordering  )属性

## 3 实现

可能会有很多种不同的MapReduce实现。正确的选择取决于环境。例如，一种实现适合于小共享内存的机器，另一种实现适合于大NUMA 多处理器，还有一种适合更大的网络机器集群。

这一节介绍一种实现适合于谷歌内部广泛应用的环境，使用交换机连接的大规模商用计算机集群。在我们的环境里：

- (1) 机器通常是x86双处理器，运行Linux，内存2-4GB
- (2) 商用网络硬件，通常100mb/s 或者 1gb/s,但是平均小于全部带宽的一半。
- (3) 一个集群通常有成百上千台机器，所以机器故障是很常见的。
- (4) 通过直接连接到单个计算机的廉价IDE磁盘提供存储。 内部开发的分布式文件系统用于管理存储在这些磁盘上的数据。 文件系统使用复制在不可靠的硬件上提供可用性和可靠性。
- (5) 用户将作业提交到调度系统。 每个作业包含一组任务，并由调度程序映射到集群中的一组可用计算机

### 3.1 Execution Overview  

通过自动划分输入数据到M个split的集合，Map调用可以分布到多态机器上。输入split可以在不同的机器上并行处理。reduce调用实现分布式是通过一个分割函数将中间key分割为R份（例如$hash(key)\mod R$）。分割的总数和分割函数由用户指定。

图一展示了我们的MapReduce实现的整体流程。当用户程序调用MapReduce函数时，会发生下面一系列操作(图1上的数字标签和下面的对应)

![图一](https://s1.ax1x.com/2020/08/18/duyRFf.png)



1. 用户程序中的MapReduce库首先会将输入数据划分为M份，通常每份是16M到64M，用户可以通过参数来设置。然后在集群里启动程序的复制。
2. 有一个程序的复制是特殊的——`master`。余下节点的工作是由这个节点分配的。一共M个map任务和R个reduce任务需要分配。maste挑选空闲的worker，然后分配给它一共map任务或者一个reduce任务。
3. 一个被分配了map任务的worker会读取相应划分的输入数据。它会将输入数据解析为键值对，然后传递给用户定义的map函数。map函数生成中间键值对，并缓存到内存里。
4. 内存里的键值对会周期性的写入本地磁盘，并有分割函数划分为R个区域。本地磁盘上写入的键值对位置会被传回给master，然后master传递给reduce worker。
5. 当一个reduce worker被master通知键值对位置，它会使用远程调用去读取远程磁盘上的由map生成的数据。当一个reduce worker读取了所有的中间数据，它会将所有的中间数据按照key进行排序，这样具有相同key的数据可以分组到一起。排序是必要的，因为通常会有许多不同的key映射到一个reduce任务上。如果中间数据的数量太大，需要使用外排序。
6. reduce worker遍历排好序的中间数据，然后对于每一个key，会将对应的key和value集合传递给用户的reduce函数。reduce函数的输出会添加到当前reduce划分的最终输出文件
7. 当所有的map和reduce任务完成，master会唤醒用户程序。这时，用户程序里的`Mapreduce`调用会返回需要的结果。

当成功完成后，MapReduce的输出会放在R个输出文件里。通常用户并不需要将这个R个文件合并为一个文件，他们可以将这些文件作为另一个MapReduce调用的输入，或者是使用其他可以处理多文件输入的分布式应用。

### 3.2 Master Data Structures  

master保持一些数据结构。对每一个map任务和reduce任务，它存储state（idle、in-processing,completed）,和工作机器标识。

master是map任务和reduce任务之间传递的中间文件的导管。因此，对每一个完成的map任务，master存储map产生的R个中间文件的位置和大小。当map任务完成时需要更新这些信息。这些信息会逐步推送到 in-process状态的reduce任务的worker上。

### 3.3 Fault Tolerance

MapReduce库的目的是在成千上万台机器上处理大量数据，因此必须优雅的处理机器错误。

#### worker Failure

master会周期性的ping每一个worker。如果在指定时间内没有收到worker的回复，master会将这个worker标记为failed 。每一个worker完成的map任务都会被重设为初始的idle状态，因此它可以被安排给其他worker。同样的，如果一个map或者reduce任务失败，它也会被设置为idle状态，然后被重新调度。

在一个失败机器上完成的map任务需要重新执行，因为它的输出存储在失败机器的本地硬盘上，是无法访问的。在一个失败机器上完成的reduce任务需要重新执行，因为它的输出存储在全局文件系统。

当一个map任务首先在worker A上执行然后在workerB上执行（因为A失败了），所有的的reduce worker会被通知重新执行。每个还没在worker A上读取数据的reduce任务会到worker B上读取。

MapReduce对大规模的worker失败是有弹性的。比如，执行一个MapReduce操作时，一个集群的网络维护会导致80台机器在一段时间内无法访问。MapReduce master只需要简单地重新执行一下由那些失败worker执行的任务，然后继续处理，知道完成MapReduce操作。

#### Master Failure

很容易做到周期性地将上述master的数据结构存储到检查点。如果master任务失败，一份拷贝会从最近的检查点重新开始。然而，考虑到只有一个master节点，失败是不太可能的。因此我们最近的实现，在master失败的时候会终止MapReduce程序。客户端可以检查这个条件，或者重新尝试MapReduce操作。

#### Semantics in the Presence of Failures  

当用户提供的map和reduce函数有着确定的输出时，我们的分布式执行结果会和整个程序无错误执行的输出相同。

我们这个属性的实现依赖于map和reduce任务输出的原子性提交。每一个执行中的任务会将其输出写入到私有存储文件中。一个reduce任务产生一个文件，一个map任务产生m个文件。当一个map任务完成时，worker会发送一个消息到master，这个消息里包含R个临时文件的name。如果master接收到一个一个已经完成的map任务的信息，将忽略这条信息。相反的，master将记录着R个文件的name。

当一个reduce任务完成时，reduce worker将原子地将临时文件重命名为最终输出文件。如果同一个reduce任务在许多机器上运行，重命名调用将调用多次。我们依赖于基础文件系统提供的原子重命名操作来保证最终文件系统状态仅包含一个reduce任务产生的数据。

我们的大部分map和reduce操作是确定性的，事实上我们的语义等价于一系列串行化操作，来使得程序员可以轻松地思考程序的表现。当map和reduce操作是不确定的，我们提供了较弱但是仍然合理的语义。在不确定操作的情况下，某一特定reduce任务$R_1$的输出等价于不确定程序的某个串行化操作的输出。然鹅，另一个reduce任务$R_2$的输出可能由于不确定任务执行顺序的不同而不同。

考虑map任务M和reduce任务$R_1,R_2$的情况。我们设定$e(R_i)$为已经提交的$R_i$的执行(有且仅有一个这样的执行)。这个比较弱的语义出现,因为$e(R_1)$也许已经读取了由M的执行产生的输出,而$e(R_2)$也许已经读取了由M的不同执行产生的输出.

### 3.4 Locality

在我们的计算环境中，网络带宽是比较珍贵的资源。我们采用将输入数据（GFS管理）保存到组成集群的机器的本地磁盘上来节省带宽。GFS将每个文件分割为64MB大小的块，然后每个块存储多个拷贝（通常3个）在不同的机器上。MapReduce master将输入文件的位置位置信息考虑在内，并尝试在包含输入数据的副本的机器上进行map任务。如果失败，它将尝试在该任务输入数据的副本附近安排map任务（例如，在与包含数据的计算机位于同一网络交换机的工作计算机上）。 在集群中相当大部分的工作线程上运行大型MapReduce操作时，大多数输入数据都在本地读取，并且不占用网络带宽。

### 3.5 Task Granularity  

如上所述，我们将map阶段细分为M份，将reduce阶段细分为R份。理想情况下，MR应该比worker机器的数量大的多。每个worker执行许多不同的任务可以改善动态负载平衡，还可以使得失败快速恢复：这个机器上的许多已经完成的map任务可以被分配到所有其他的worker机器上。

在我们的实现中，MR的大小是有范围的，因为master必须做$O(M+R)$次调度，并存储$O(M\times R)$个状态在内存中。（内存使用的常数因子是很小的，但是$O(M\times R)$ 块状态由大约每个 map 任务/reduce 任务对一个字节组成。

此外，R通常由用户指定，因为每个reduce任务最终会输出多个文件。在实践中，我们倾向于选择M使得每一个任务只需要处理16到64MB的输入数据（这样上述的本地化优化最有效）。R是我们希望使用的机器数量的一个小的倍数。通常对于一个MapReduce任务，我们使用2000台机器，M = 200000，R = 5000

### 3.6 Backup Tasks  

一个常见的导致MapReduce操作总时长过长的原因是"straggler"（落后者）：一台机器完成少量的Map或者Reduce任务但是花费了不正常的很长时间。落后者的出现可能有很多原因。比如，一个磁盘辣鸡的机器经常会遇到correctable errors  ，导致读写性能从30MB/s降到1MB/s。集群调度可能会在这台机器上安排其他任务，这就会导致CPU、磁盘、内存、带宽竞争，使得执行MapReduce代码非常缓慢。我们最近遇到的一个问题是，机器初始化代码中的一个bug导致处理器缓存被禁用，受影响的机器上计算速度下降了一百倍。

我们有一个通用的机制来减轻落后者带来的问题。当一个MapReduce操作接近完成时，master会调度其余正在运行中的任务的备份执行。无论是主任务还是备份任务完成，这个任务都会被标记为完成。我们已经对这个机制进行了调整，通常，计算资源的增加不超过百分之几。我们发现这对减小大型MapReduce操纵的时间是很有意义的。例如，5.3中的排序任务在禁用备份机制的时候，花费的时间会增长44%。

## 4 技巧

尽管对大部分需求来说，编写map和reduce函数提供的基础功能已经是足够的，但我们有一些有用的拓展。这一节将说明。

### 4.1 Partitioning  Function  

用户指定reduce任务的数量R。分割函数基于中间key将数据分割到这些任务上。一个默认的分割函数是使用hash（例如$hash(key)\mod R$） 。这倾向于一个非常公平的划分。然鹅在某些情况下，使用某些其他的函数划分数据是非常有用的。例如，有时输出key是URL，我们希望某个主机的所有相关记录都在一个输出文件上。为了支持这种情况，用户可以提供一个特殊的划分函数，比如使用$hash(Hostname(urlkey))\mod R$作为划分函数，这样可以使得同一个主机的所有URL都在同一个输出文件中。

### 4.2 Ordering Guarantees  

我们保证对于一个给定的划分，中间键值对会按照key递增的顺序进行处理。这样的顺序保证可以使得很容易生成一个排好序的输出文件，这对输出文件支持按照key随机访问时很有效的，或者是输出文件是排序好的对用户很方便。

###  4.3 Combiner Function  

在某些情况下，每个map任务产生的中间key会有大量重复，用户指定的reduce函数是可交换的和关联的。一个很好的例子是2.1节中的单词计数例子。单词频率一般遵循齐夫(Zipf)分布，每一个map任务会产生大量的`<the,1>`记录。所有的这些记录会通过网络发送到一个reduce函数中，然后由reduce函数加到一起产生一个数字。我们允许用户指定一个Combiner函数，在网络发送前对数据进行分区合并。

Combiner函数会在每个运行map任务的机器上执行。通常，combiner和reduce函数的实现代码是相同的。reduce函数和combiner函数的唯一区别是，MapReduce库是如何处理函数输出的。combiner函数的输出会被写入到一个中间文件中，然后被发送给一个reduce任务。

分区合并对特定MapReduce操作的加速是很明显的。附录A包含一个使用combiner的例子。

### 4.4 Input and Output Types  

MapReduce库支持读取多种格式的输入数据。例如，text格式的输入会将每一行作为一个键值对，key是文件中的偏移值，value是每一行的内容。另一个比较常见支持的格式是按照key排序好的键值对序列。每一个输入类型的实现知道如何划分输入为有意义的range，以便map任务进行处理。用户可以通过提供一个简单的reader接口的实现来添加对一个新的输入类型的支持。

一个reader不一定从文件中读取内容。例如，定义一个从数据库读取记录或者从内存中读取数据结构映射是非常简单的。

同样的方式，我们支持一系列输出类型。添加新的输出类型是很简单的。

### 4.5 Side-effects  

在某些情况下，MapReduce的用户会发现将它们的map或者reduce操作生成辅助文件作为额外输出很方便。我们依赖于应用的writer来保证这些side-effect的原子性和幂等性。通常，应用会先写入到一个临时文件中，然后等它全部完成再原子性的重命名文件。

对于一个任务产生的多个输出文件，我们没有提供原子性的两阶段提交。因此，输出多个文件的任务的跨文件一致性需要是确定性的。这种限制在实践中从来不是问题

### 4.6 Skipping Bad Records  

有些时候因为用户代码里的bug导致map或者reduce函数在某个记录上崩溃。这样的bug会阻止MapReduce任务完成。通常的做法是修复这个bug，但是有时无法修复，这个bug可能在第三方库你无法更改源代码。另外，有时你需要忽略某些记录，例如在在某个大数据集上进行静态分析。我们提供了一个可选的运行方式，让MapReduce库发现哪些记录会导致崩溃，然后跳过这些记录，继续进行。

每一个worker进行会有一个信号handle来捕获段错误和总线错误。在调用一个用户的Map和reduce操作之前，MapReduce库将参数的序列号存储到全局变量里。如果用户代码产生一个信号，信号handler发送一个“last gasp” UDP  包，包含序列号，到MapReducemaster上当master发现在某一个记录上有多次失败，这表明在下一次重新执行时应该跳过这条记录。

### 4.7 Local Execution  

map、reduce函数的debug问题很棘手。因为实际的计算是在一个分布式系统上，通常会有几千台机器，有master动态地分配任务。为了方便debug和小规模测试，我们专门做了一个实现，可以在本地机器上执行MapReduce操作。用户提供控制，这样计算可以限制到某一特定的map任务上。用户通过一个特殊的标志位调用他们的程序，然后简单地使用任何他们使用的debug或者测试工具。

### 4.8 Status Information  

master运行一个内部HTTP服务器，并导出一组状态页供人类使用。状态页显示计算进度,像多少个任务已经完成,多少个还在运行,输入的字节数,中间数据字节数,输出字节数,处理百分比,等等.这个页也包含到标准错误的链接,和由每个任务产生的标准输出的链接.用户可以根据这些数据预测计算需要花费的时间,和是否需要更多的资源.当计算比预期的要慢很多的时候,这些页面也可以被用来判断是不是这样.

此外,最上面的状态页显示已经有多少个worker失败了,和当它们失败的时候,那个map和reduce任务正在运行.当试图诊断在用户代码里的bug时,这个信息也是有用的.

### 4.9 Counters  

MapReduce库提供一个计数器来计算各种时间的发生次数。例如，用户想要统计所有单词处理的次数或者德语文档被索引的次数。

为了使用这个功能，用户需要创建一个命名计数器对象，然后在map或者reduce函数里适当的增加技术，例如：

```
Counter* uppercase;
uppercase = GetCounter("uppercase");

map(String name, String contents):
	for each word w in contents:
		if (IsCapitalized(w)):
			uppercase->Increment();
		EmitIntermediate(w, "1")
```

每台worker机器上的计数值都会周期性地发送到master上（依附在ping回应上）。master从成功的map和reduce任务里统计计数值，然后当MapReduce任务完成时返回给用户代码。当前计数值也会在master的状态页上展示，这样人类可以观察计算过程。当统计计数值的时候，master会同一个map/reduce任务多次执行的影响，避免重复计数。

部分计数值会被MapReduce库自动维护，比如输入输出的键值对数

用户会发现，对MapReduce操作的合理性检查(sanity checking)是很有用的。例如，在某些MapReduce操作中，用户代码可能想要保证输出的键值对数等于输入的键值对数，或者是处理的德语文档在一个合理 的比例之内。

## 5 性能

两个实例的benchmark，略

## 6 经验

吹了一点MapReduce的用途和性能，略

## 7 相关工作

略

## A 单词频率统计

本节包含了一个完整的程序,用于统计在一组命令行指定的输入文件中,每一个不同的单词出现频率.

```cpp
#include "mapreduce/mapreduce.h"
// User’s map function
class WordCounter : public Mapper {
public:
	virtual void Map(const MapInput& input) {
		const string& text = input.value();
		const int n = text.size();
		for (int i = 0; i < n; ) {
			// 跳过开始时的空白
			while ((i < n) && isspace(text[i]))
				i++;
			// 查找单词结尾
			int start = i;
			while ((i < n) && !isspace(text[i]))
				i++;
			if (start < i)
				Emit(text.substr(start,i-start),"1");
		}
	}
};
REGISTER_MAPPER(WordCounter);

// User’s reduce function
class Adder : public Reducer {
	virtual void Reduce(ReduceInput* input) {
		// 遍历所有相同key的条目，然后把值加到一起
		int64 value = 0;
		while (!input->done()) {
			value += StringToInt(input->value());
			input->NextValue();
		}
		// Emit sum for input->key()
		Emit(IntToString(value));
	}
};
REGISTER_REDUCER(Adder);

int main(int argc, char** argv) {
	ParseCommandLineFlags(argc, argv);
	MapReduceSpecification spec;
	// 将输入文件列表存储到 "spec"
	for (int i = 1; i < argc; i++) {
		MapReduceInput* input = spec.add_input();
		input->set_format("text");
		input->set_filepattern(argv[i]);
		input->set_mapper_class("WordCounter");
	}
	// 指定输出文件:
	// /gfs/test/freq-00000-of-00100
	// /gfs/test/freq-00001-of-00100
	// ...
	MapReduceOutput* out = spec.output();
	out->set_filebase("/gfs/test/freq");
	out->set_num_tasks(100);
	out->set_format("text");
	out->set_reducer_class("Adder");
	// 可选项：局部求和节省带宽
	out->set_combiner_class("Adder");
	// Tuning parameters: use at most 2000
	// machines and 100 MB of memory per task
	spec.set_machines(2000);
	spec.set_map_megabytes(100);
	spec.set_reduce_megabytes(100);
	// Now run it
	MapReduceResult result;
	if (!MapReduce(spec, &result)) abort();
	// Done: ’result’ structure contains info
	// about counters, time taken, number of
	// machines used, etc.
	return 0;
}
```





