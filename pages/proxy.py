# -*- coding: utf-8 -
#
# This file is part of pages released under the MIT license. 
# See the NOTICE for more information.

from couchdbkit.ext.django.loading import get_db
from restkit import request


def proxy_api(request, path, headers=None):
    headers = headers or {}
    for key, value in request.META.iteritems():
        if key.startswith('HTTP_'):
            key = header_name(key)

        elif key in ('CONTENT_TYPE', 'CONTENT_LENGTH'):
            key = key.replace('_', '-')
            if not value: continue
            else:
                continue

        # rewrite location
        if key.lower() == "host":
            continue
        if is_hop_by_hop(key):
            continue
        else:
            headers[key] = value

    headers["X-Forwarded-For"] = request.META.get("REMOTE_ADDR")





