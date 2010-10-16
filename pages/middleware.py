#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# This file is part of pages released under the Apache 2 license. 
# See the NOTICE for more information.

from pages.views import page_handler
from django.http import Http404
from django.conf import settings

class PagesFallbackMiddleware(object):
    def process_response(self, request, response):
        if response.status_code != 404:
            return response # No need to check for a page for non-404 responses.
        try:
            return page_handler(request, request.path_info)
        # Return the original response if any errors happened. Because this
        # is a middleware, we can't assume the errors will be caught elsewhere.
        except Http404:
            return response
        except:
            if settings.DEBUG:
                raise
            return response
