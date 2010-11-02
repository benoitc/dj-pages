# -*- coding: utf-8 -
#
# This file is part of dj-pages released under the MIT license. 
# See the NOTICE for more information.
import os

from couchdbkit.ext.django import loading
from django import http, template
from django.contrib.admin.sites import LOGIN_FORM_KEY, ERROR_MESSAGE
from django.contrib.auth import authenticate, login
from django.shortcuts import render_to_response
from django.views import static
from django.utils.functional import update_wrapper
from django.utils.http import urlquote
from django.utils.translation import ugettext_lazy, ugettext as _
from django.views.decorators.cache import never_cache


from revproxy import proxy_request

class PagesAdmin(object):

    login_template = None
    logout_template = None

    def __init__(self, name=None, app_name="pages"):
        self.name = name or 'pages'
        self.app_name = app_name
        self._db = None
        self.root_path = None

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

    def index(self, request, extra_context=None):
        context = {
            'title': _('Pages administration'),
            'root_path': self.root_path,
        }
        context.update(extra_context or {})
        context_instance = template.RequestContext(request, current_app=self.name)
        return render_to_response("pages/index.html", context_instance=context_instance)

    def logout(self, request):
        """
        Logs out the user for the given HttpRequest.

        This should *not* assume the user is already logged in.
        """
        from django.contrib.auth.views import logout
        defaults = {}
        if self.logout_template is not None:
            defaults['template_name'] = self.logout_template
        return logout(request, **defaults)
    logout = never_cache(logout)

    def login(self, request):
        """
        Displays the login form for the given HttpRequest.
        """
        from django.contrib.auth.models import User

        # If this isn't already the login page, display it.
        if not request.POST.has_key(LOGIN_FORM_KEY):
            if request.POST:
                message = _("Please log in again, because your session has expired.")
            else:
                message = ""
            return self.display_login_form(request, message)

        # Check that the user accepts cookies.
        if not request.session.test_cookie_worked():
            message = _("Looks like your browser isn't configured to accept cookies. Please enable cookies, reload this page, and try again.")
            return self.display_login_form(request, message)
        else:
            request.session.delete_test_cookie()

        # Check the password.
        username = request.POST.get('username', None)
        password = request.POST.get('password', None)
        user = authenticate(username=username, password=password)
        if user is None:
            message = ERROR_MESSAGE
            if username is not None and u'@' in username:
                # Mistakenly entered e-mail address instead of username? Look it up.
                try:
                    user = User.objects.get(email=username)
                except (User.DoesNotExist, User.MultipleObjectsReturned):
                    message = _("Usernames cannot contain the '@' character.")
                else:
                    if user.check_password(password):
                        message = _("Your e-mail address is not your username."
                                    " Try '%s' instead.") % user.username
                    else:
                        message = _("Usernames cannot contain the '@' character.")
            return self.display_login_form(request, message)

        # The user data is correct; log in the user in and continue.
        else:
            if user.is_active and user.is_staff:
                login(request, user)
                return http.HttpResponseRedirect(request.get_full_path())
            else:
                return self.display_login_form(request, ERROR_MESSAGE)
    login = never_cache(login)
    
    def display_login_form(self, request, error_message='', extra_context=None):
        request.session.set_test_cookie()
        context = {
            'title': _('Log in'),
            'app_path': request.get_full_path(),
            'error_message': error_message,
            'root_path': self.root_path,
        }
        context.update(extra_context or {})
        context_instance = template.RequestContext(request, current_app=self.name)
        return render_to_response(self.login_template or 'pages/login.html', context,
            context_instance=context_instance
        )


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
            url(r'^logout/$',
                wrap(self.logout),
                name='logout'),
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
