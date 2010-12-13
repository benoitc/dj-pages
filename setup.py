#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# This file is part of dj-pages released under the Apache 2 license. 
# See the NOTICE for more information.

from distutils.command.install_data import install_data
import os
import sys

if not hasattr(sys, 'version_info') or sys.version_info < (2, 5, 0, 'final'):
    raise SystemExit("Compono requires Python 2.5 or later.")

from setuptools import setup, find_packages
from pages import __version__

data_files = []
for root in ('pages/_design', 'pages/media', 'pages/templates'):
    for dir, dirs, files in os.walk(root):
        dirs[:] = [x for x in dirs if not x.startswith('.')]
        files = [x for x in files if not x.startswith('.')]
        data_files.append((os.path.join('pages', dir),
                          [os.path.join(dir, file_) for file_ in files]))
                          
class install_package_data(install_data):
    def finalize_options(self):
        self.set_undefined_options('install',
                                   ('install_lib', 'install_dir'))
        install_data.finalize_options(self)
cmdclass = {'install_data': install_package_data }

setup(
    name = 'dj-pages',
    version = __version__,
    description = 'Minimal Content Renderer.',
    long_description = file(
        os.path.join(
            os.path.dirname(__file__),
            'README.rst'
        )
    ).read(),
    author = 'Benoit Chesneau',
    author_email = 'benoitc@e-engura.org',
    license = 'BSD',
    url = 'http://github.com/benoitc/dj-pages',
    classifiers = [
        'License :: OSI Approved :: MIT',
        'Intended Audience :: Developers',
        'Intended Audience :: System Administrators',
        'Development Status :: 4 - Beta',
        'Programming Language :: Python',
        'Operating System :: OS Independent',
        'Topic :: Internet :: WWW/HTTP :: Dynamic Content',
        'Topic :: Software Development',
        'Topic :: Software Development :: Libraries :: Application Frameworks',

    ],
    
    zip_safe = False,
    packages = find_packages(),
    include_package_data = True,
    data_files = data_files,
    cmdclass=cmdclass,
    
    install_requires = [
        'setuptools',
        'django',
        'couchdbkit>=0.5',
        'dj_revproxy>=0.2.2'
    ],
    
    test_suite = 'nose.collector',

)
