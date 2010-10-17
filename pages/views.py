# -*- coding: utf-8 -
#
# This file is part of dj-pages released under the MIT license. 
# See the NOTICE for more information.

from django.conf import settings
from django.contrib.auth.models import Group
from django.http import Http404, HttpResponse, HttpResponseServerError
from django.shortcuts import render_to_response
from django.template import RequestContext, loader, Context

def page_handler(request):
    """ main page handler """

    path = request.path_info
    if path == "/" or not path:
        path = "/"
    elif path.endswith('/'): 
        path = path[:-1]
        
    page = Page.from_path(path)
    if page is None:
        raise Http404

    if page.type == "page":
        return render_page(request, page)
    elif page.type == "content":
        return render_content(request, page)
    else:
        return HttpResponseServerError("Unkown page type. Contact the
                administrator of this site.")


def render_page(request, page):
    content = render_template(page.body,
            context_instance=RequestContext(request))
    return HttpResponse(content)

def render_content(request, page):
    try:
        schema = Schema.get(page.schema)
    except ResourceNotFound:
        raise Http404("template not found")

    template = schema.templates['show']
    content = render_template(template, {
        "doc": doc
    }, context_instance=RequestContext(request))
    return HttpResponse(content)


