/* 
 * This file is part of dj-pages released under the MIT license. 
 * See the NOTICE for more information.
 */

(function($) {

    $.pages = $.pages || {};

    function Design(db, name) {
        this.doc_id = "_design/"+name;
        this.code_path = this.doc_id;
        this.view = function(view, opts) {
            db.view(name+'/'+view, opts);
        };
        this.list = function(list, view, opts) {
            db.list(name+'/'+list, view, opts);
        };
    }

    $.pages.app = $.pages.app || function(appFun, opts) {
        opts = opts || {};
        var urlPrefix = opts.urlPrefix || "/_pages",
            dbname = opts.db || "db",
            dname = opts.design || "pages",
            resources = [],
            started = false,
            method = "GET";
        $.couch.urlPrefix = urlPrefix;
        var db = $.couch.db(dbname),
            design = new Design(db, dname);

        
        function bind(u, o) {
            resources[u] = [u, o];
        }

       function listen() {
            if (started) return;
            $(window).trigger( "hashchange" );
            started = true;
        }

        var appExports = $.extend({
            db : db,
            bind: bind,
            design : design,
            view : design.view,
            list : design.list,
            listen: listen
        }, $.pages.app.app);


        function handleDDoc(ddoc) {        
            if (ddoc) {
                appExports.ddoc = ddoc;
            }
            appFun.apply(appExports, [appExports]);
        }
        if (opts.ddoc) {
            // allow the ddoc to be embedded in the html
            // to avoid a second http request
            $.pages.app.ddocs[design.doc_id] = opts.ddoc;
        }
        if ($.pages.app.ddocs[design.doc_id]) {
            $(function() {handleDDoc($.pages.app.ddocs[design.doc_id])});
        } else {
            // only open 1 connection for this ddoc 
            if ($.pages.app.ddoc_handlers[design.doc_id]) {
                // we are already fetching, just wait
                $.pages.app.ddoc_handlers[design.doc_id].push(handleDDoc);
            } else {
                $.pages.app.ddoc_handlers[design.doc_id] = [handleDDoc];
                // use getDbProperty to bypass %2F encoding on _show/app
                db.getDbProperty(design.code_path, {
                    success : function(doc) {
                      $.pages.app.ddocs[design.doc_id] = doc;
                      _.each($.pages.app.ddoc_handlers[design.doc_id], function(h) {
                          $(function() {h(doc)});
                      });
                      $.pages.app.ddoc_handlers[design.doc_id] = null;
                    },
                    error : function() {
                        _.each($.pages.app.ddoc_handlers[design.doc_id], function(h) {
                            $(function() {h()});
                        });
                        $.pages.app.ddoc_handlers[design.doc_id] = null;
                    }
                });
            }
        }

        function dispatch(req) {
            // dispatch resources
            if (!resources) 
                return;

            for (r in resources) {
                m = resources[r];
                if (req.path.match(m[0])) {
                    res = m[1];
                    if (_.isFunction(res)) {
                        resFun = res;
                    } else {
                        resFun = res.request;
                    }

                    return resFun.apply(appExports, [appExports, req]);
                }
            }
        }

        function parseParamPair(params, key, value) {
            if (params[key]) {
                if (_.isArray(params[key])) {
                    params[key].push(value);
                } else {
                    params[key] = [params[key], value];
                }
            } else {
                params[key] = value;
            }
            return params;
        }

        function parseForm(form) {
            var params = {},
                form_fields = form.serializeArray();

            for (var i = 0; i < form_fields.length; i++) {
                params = parseParamPair(params, 
                        form_fields[i].name, form_fields[i].value);
            }
            return params;
        }

        function makeRequest(method, url, body) {
            if (typeof(body) === "undefined")
               body = null;

            var query = $.deparam.querystring(url, true);
            var path = url.split("?")[0];

            if (_("/").startsWith) {
               path = path.substr(1);
            } 

            req = {
                method: method,
                href: document.location.href,
                full_path: url, 
                path: path,
                query:query,
                body: body
            };
            return req;
        }

        
        $(window).bind('submit', function(e) {
            // manage submit. eventualy stop the execution if the
            // dispatched resource return false.
            var form = $(e.target).closest('form');
            var method = form.attr('method') || 'POST';
            method = _(method).trim().toLowerCase();
            var path = form.attr("action");
            if (method == "get") {
                window.location = $.param.querystring(path, form.serializeArray());                 
                return false;
            } else {
                params = $.extend({}, parseForm(form));
                window.location = path;
                var url = $.param.fragment(path);
                if (url === "") 
                    url = "/";

                req = makeRequest(method, url, params);     
                ret = dispatch(req);
                if (ret === false) {
                    e.preventDefault();
                    return false;
                }
            }
        }); 

        
        $(window).bind( "hashchange", function(e) {
            // Url changed
            var url = $.param.fragment();
            if (url === "") 
                url = "/";

            var req = makeRequest("get", url);
            dispatch(req);
        });
    };
    
    
    $.pages.app.ddocs = {};
    $.pages.app.ddoc_handlers = {};


})(jQuery);


