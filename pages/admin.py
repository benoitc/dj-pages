# -*- coding: utf-8 -
#
# This file is part of dj-pages released under the MIT license. 
# See the NOTICE for more information.
import os

from couchdbkit.ext.django import loading
from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.template import RequestContext, loader, Context
from django.views import static
from revproxy import proxy_request

class PagesAdmin(object):

    def __init__(self, name=None, app_name="pages"):
        self.name = name or 'pages'
        self.app_name = app_name
        self._db = None

    def get_db(self):
        from django.conf import settings
        if self._db is None:
            DB_PAGES = getattr(settings, "DB_PAGES")
            if not DB_PAGES:
                raise AttributeError("DB_PAGES isn't set.")
            self._db = loading.get_db(DB_PAGES)

        return self._db

    def index(self, request, *args, **kwargs):
        return render_to_response("pages/index.html", 
                context_instance=RequestContext(request))

    def get_urls(self):
        from django.conf import settings
        from django.conf.urls.defaults import patterns, url, include
        db = self.get_db()
        urlpatterns = patterns('',
            url(r"^$", self.index, name="padm_index"),
            url(r"^db(?P<path>.*)", proxy_request, {
                "destination": db.uri
            }, name="padm_db_proxy"),
        )

        if settings.DEBUG:
            media_path = os.path.abspath(os.path.join(__file__, "..",
                "media"))
            urlpatterns += patterns('',
                url(r'^(?P<path>.*)', static.serve, {
                    'document_root': media_path,
                    'show_indexes': True
                }),
            )

        return urlpatterns

    def urls(self):
        return self.get_urls(), self.app_name, self.name
    urls = property(urls)

pages_admin = PagesAdmin()
