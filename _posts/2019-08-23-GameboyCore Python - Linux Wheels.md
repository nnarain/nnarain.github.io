---
layout: post
title: GameboyCore Python - Linux Wheels
tag: ['python', 'gameboycore', 'pip']
repo: nnarain/gameboycore-python
---

Unforunately it is not very straight forward to upload pre-compiled wheel files to PyPi. This is due to Linux system often having a large diversity of install system libraries with varying versions.

However [PEP 15](https://www.python.org/dev/peps/pep-0513/) introduced the `manylinux` platform tag for linux wheel files and proposed that pip count them as compatible packages.

And recently I got this working for `GameboyCore Python`.

**Setup**

The setup is pretty simple, just followed the example project here: https://github.com/pypa/python-manylinux-demo

There are basically two parts to this build. Selected a docker container to build either 64 or 32 bits. And a build script that generate wheels for each installed python version.

Here is the build script I'm using:

```
#!/bin/bash
set -e -x

for PYBIN in /opt/python/*/bin; do
    "${PYBIN}/pip" install -r /io/dev-requirements.txt
    "${PYBIN}/pip" install -r /io/requirements.txt

    "${PYBIN}/pip" wheel /io/ -w wheelhouse/
done

# Bundle external shared libraries into the wheels
for whl in wheelhouse/*.whl; do
    auditwheel repair "$whl" --plat $PLAT -w /io/wheelhouse/
done

# Install packages and test
for PYBIN in /opt/python/*/bin/; do
    "${PYBIN}/pip" install gameboycore --no-index -f /io/wheelhouse
    (cd "$HOME"; "${PYBIN}/nosetests" -v --exe -w /io/tests)
done
```

Wheel files are output to the `wheelhouse/` folder.

What the demo doesn't show is uploading the wheels to PyPi.

The trick is to move the wheel files into a `dist/` folder so that when the travis deploy script it uploads the wheels along with the source distribution.

```yaml
after_success:
  - mkdir dist
  - mv wheelhouse/* dist/

deploy:
  provider: pypi
  user: nnarain
  password:
    secure: ...
  on:
    tags: true
  skip_existing: true
  skip_cleanup: true
```

And that's it! Now all platforms just need to do a simple pip install.

```
$ pip install gameboycore
```


