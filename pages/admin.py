# -*- coding: utf-8 -
#
# This file is part of dj-pages released under the MIT license. 
# See the NOTICE for more information.
import os

from couchdbkit.ext.django import loading
from django.contrib.auth import REDIRECT_FIELD_NAME
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext, loader, Context
from django.views import static
from django.utils.functional import update_wrapper
from django.utils.http import urlquote
from revproxy import proxy_request

class PagesAdmin(object):

    REDIRECT_FIELD_NAME = REDIRECT_FIELD_NAME

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

    def has_permission(self, request):
        return request.user.is_active and request.user.is_staff
    
    def admin_view(self, view):
        def inner(request, *args, **kwargs):
            if not self.has_permission(request):
                return self.login(request)
            return view(request, *args, **kwargs)
        return update_wrapper(inner, view)

    def index(self, request, *args, **kwargs):
        return render_to_response("pages/index.html", 
                context_instance=RequestContext(request))

    def login(self, request):
        from django.conf import settings
        path = urlquote(request.get_full_path())
        login_url = settings.LOGIN_URL
        redirect_field_name = self.REDIRECT_FIELD_NAME
        tup = login_url, redirect_field_name, path
        return HttpResponseRedirect("%s?%s=%s" % tup)
        
    def type(self, request, id=None):
        return render_to_response("pages/create.html", {
            "relpath": "../"
            }, context_instance=RequestContext(request))

    def get_urls(self):
        from django.conf import settings
        from django.conf.urls.defaults import patterns, url, include

        def wrap(view):
            def wrapper(*args, **kwargs):
                return self.admin_view(view)(*args, **kwargs)
            return update_wrapper(wrapper, view)


        db = self.get_db()
        urlpatterns = patterns('',
            url(r"^$", wrap(self.index), name="padm_index"),
            url(r"^edit/$", wrap(self.type), name="padm_create_type"),
            url(r"^db(?P<path>.*)", wrap(proxy_request), {
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
