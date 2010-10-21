from django.conf.urls.defaults import *
from pages.admin import pages_admin

from django.contrib import admin
admin.autodiscover()



urlpatterns = patterns('',
    # Example:
    # (r'^testpages/', include('testpages.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    (r'^accounts/login/$', 'django.contrib.auth.views.login'),

     (r'^admin/', include(admin.site.urls)),
    (r"_pages/", include(pages_admin.urls))
)
