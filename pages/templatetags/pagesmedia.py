# -*- coding: utf-8 -
#
# This file is part of dj-pages released under the MIT license. 
# See the NOTICE for more information.

from django.template import Library
from django.utils.encoding import iri_to_uri

register = Library()


def pages_media_url():
    """
    Returns the string contained in the setting MTCOMPONO_MEDIA_URL.
    """
    try:
        from django.conf import settings
    except ImportError:
        return ''
   
    PAGES_MEDIA_URL = getattr(settings, 'PAGES_MEDIA_URL', 
            '/media/pages')
                                                  
    return iri_to_uri(PAGES_MEDIA_URL)
pages_media_url = register.simple_tag(pages_media_url)
