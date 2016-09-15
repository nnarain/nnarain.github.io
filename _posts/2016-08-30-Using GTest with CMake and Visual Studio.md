---
layout: post
title: Using GTest with CMake and Visual Studio
description: Setting GTest for use with Visual Usual Studio 2015
tag: visual-studio cmake gtest
thumbnail:
repo_url:
---

Recently had a bit of trouble setting up GTest with Visual Studio using CMake. Simple fix but just wanted to write it down!

**Installation**

You will need to get a copy of googletest:

{% highlight bash %}
git clone https://github.com/google/googletest.git
{% endhighlight %}

**Build**

Do an out of source build.

{% highlight bash %}
mkdir build && cd build
cmake .. -DBUILD_SHARED_LIBS=ON -DCMAKE_INSTALL_PREFIX=<Installation Directory>t
{% endhighlight %}

Ok notice the `BUILD_SHARED_LIBS` option? The was the source of the issue when I initially tried this.

It depends on your unit test project configuration. Whether you are using static or dynamic runtime. The googletest project is set by default to build static libraries. When you generate a Visual Studio project it defaults to dynamic runtime. This mismatch caused link errors.

To fix this googletest must build dynamic libraries (or set Visual Studio runtime to static, I chose the first option).

Open the generated Visual Studio solution and build the libraries.

If everything works out fine you can build the INSTALL project in the solution to install the libraries to the specified path.

Of course the `.dll` files need to either be in the application path or on the system path so they can be loaded. If not an exception will be thrown and cause the error `MS3073`.

**Including GTest in CMake**

Ok so the hard part is over. Now to include GTest in the CMake project.

Follow the instructions [here](https://cmake.org/cmake/help/v3.0/module/FindGTest.html).

{% highlight cmake %}
cmake_minimum_required(VERSION 2.8)

project(gtest-test)

enable_testing()
find_package(GTest REQUIRED)
find_package(Threads REQUIRED)

include_directories(
    ${GTEST_INCLUDE_DIRS}
)

add_executable(${PROJECT_NAME}
    main.cpp
)

target_link_libraries(${PROJECT_NAME}
    ${GTEST_BOTH_LIBRARIES}
    ${CMAKE_THREAD_LIBS_INIT}
)

add_test(MyTests ${PROJECT_NAME})

{% endhighlight %}

Note: Threading library needed to be added.

**Unit Test**

```c++

#include <gtest/gtest.h>

TEST(Addition, CanAddTwoNumbers)
{
    EXPECT_EQ(4, 2 + 2);
}

int main(int argc, char *argv[])
{
    testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}

```


And there you go!
