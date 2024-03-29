---
layout: post
title: Standalone ASIO with Visual Studio 2015
description: Notes for working with ASIO without Boost C++ using VS 2015
tag: ["asio", "c++", "boost", "visualstudio"]
thumbnail:
---

ASIO is a C++ networking library included in Boost C++.

In its standard configuration ASIO relies heavily on Boost, however what if you don't want to have Boost as a dependency?

ASIO can be defined as standalone in your project settings.

[This](https://think-async.com/Asio/AsioStandalone) page says (for MSVC 2012) to define ASIO_STANDALONE, it was not as simple as this for me, below is what I did to use standalone ASIO in VS 2015.

Apparently ASIO will not automatically detect C++11 features available, these need to be specified manually.

In C/C++ Preprocessor Settings, I defined:

	ASIO_STANDALONE
	ASIO_HAS_STD_ADDRESSOF
	ASIO_HAS_STD_ARRAY
	ASIO_HAS_CSTDINT
	ASIO_HAS_STD_SHARED_PTR
	ASIO_HAS_STD_TYPE_TRAITS

	ASIO_HAS_VARIADIC_TEMPLATES
	ASIO_HAS_STD_FUNCTION
	ASIO_HAS_STD_CHRONO

	BOOST_ALL_NO_LIB
	_WIN32_WINNT=0x0501
	_WINSOCK_DEPRECATED_NO_WARNINGS

Some searching lead me to [this stackoverflow page](http://stackoverflow.com/questions/24877233/header-only-asio-standalone) which is where the first five **ASIO_HAS_*** come from.

The remaining three I tracked down manually, by opening the .hpp files that were using boost headers and determining the missing define.

For example, in basic_socket_iostream.hpp **ASIO_HAS_VARIADIC_TEMPLATES** was undefined and therefore attempting to include boost headers.

![Image not found!](/assets/2015/11/03/missing_define_variadic.PNG)

/detail/function.hpp

![Image not found!](/assets/2015/11/03/missing_define_function.PNG)

steady_timer.hpp

![Image not found!](/assets/2015/11/03/missing_define_timer.PNG)

Specifing that these features exist prevents boost from being included.

**Now for source errors**

In the file random_access_handle_service.hpp there is a single line that always includes boost/config.hpp this needs to be changed when in standalone mode.

My fix:

![Image not found!](/assets/2015/11/03/boost_config_standalone.PNG)

Lastly there were errors generated by win_iocp_io_service.ipp caused by a missing include for using std::min

My fix:

![Image not found!](/assets/2015/11/03/include_algorithm.PNG)

For the last few defines:

	BOOST_ALL_NO_LIB
	_WIN32_WINNT=0x0501
	_WINSOCK_DEPRECATED_NO_WARNINGS

**BOOST_ALL_NO_LIB** prevents automatic linking to Boost libraries

**_WIN32_WINNT=0x0501** asio generated a warning telling me to defined this, so I did :p

**_WINSOCK_DEPRECATED_NO_WARNINGS** last step for a successful build


Just for fun here is an example program:

![Image not found!](/assets/2015/11/03/example.PNG)

Everything should work swimmingly :D
