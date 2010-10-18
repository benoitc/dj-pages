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


    function resolveModule(path, names, parents, current) {
        parents = parents || [];
        if (names.length === 0) {
            if (typeof current != "string") {
                throw ["error","invalid_require_path",
                    'Must require a JavaScript string, not: '+(typeof current)];
            }
            return [current, parents];
        }
        var n = names.shift();
        if (n == '..') {
            parents.pop();
            var pp = parents.pop();
            if (!pp) {
                throw ["error", "invalid_require_path", path];
            }
            return resolveModule(path, names, parents, pp);
        } else if (n == '.') {
            var p = parents.pop();
            if (!p) {
                throw ["error", "invalid_require_path", path];
            }
            return resolveModule(path, names, parents, p);
        } else {
            parents = [];
        }
        if (!current[n]) {
            throw ["error", "invalid_require_path", path];
        }
        parents.push(current);
        return resolveModule(path, names, parents, current[n]);
    }

    function makeRequire(ddoc) {
        var moduleCache = [];
        function getCachedModule(name, parents) {
            var key, i, len = moduleCache.length;
            for (i=0;i<len;++i) {
                key = moduleCache[i].key;
                if (key[0] === name && key[1] === parents) {
                    return moduleCache[i].module;
                }
            }
            return null;
        }
        function setCachedModule(name, parents, module) {
            moduleCache.push({ key: [name, parents], module: module });
        }
        var require = function (name, parents) {
            var cachedModule = getCachedModule(name, parents);
            if (cachedModule !== null) {
                return cachedModule;
            }
            var exports = {};
            var resolved = resolveModule(name, name.split('/'), parents, ddoc);
            var source = resolved[0]; 
            parents = resolved[1];
            var s = "var func = function (exports, require) { " + source + " };";
            try {
                eval(s);
                func.apply(ddoc, [exports, function(name) {return require(name, parents)}]);
            } catch(e) { 
                throw ["error","compilation_error","Module require('"+name+"') raised error "+e.toSource()]; 
            }
            setCachedModule(name, parents, exports);
            return exports;
        }
        return require;
    };
    $.pages.app = $.pages.app || function(appFun, opts) {
        opts = opts || {};
        var urlPrefix = opts.urlPrefix || "/_pages",
            dbname = opts.db || "db",
            dname = opts.design || "pages";
        $.couch.urlPrefix = urlPrefix;
        console.log(dname);
        var db = $.couch.db(dbname),
            design = new Design(db, dname);

        var appExports = $.extend({
            db : db,
            design : design,
            view : design.view,
            list : design.list,
        }, $.pages.app.app);
        function handleDDoc(ddoc) {        
            if (ddoc) {
                appExports.ddoc = ddoc;
                appExports.require = makeRequire(ddoc);
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
                      $.pages.app.ddoc_handlers[design.doc_id].forEach(function(h) {
                          $(function() {h(doc)});
                      });
                      $.pages.app.ddoc_handlers[design.doc_id] = null;
                    },
                    error : function() {
                        $.pages.app.ddoc_handlers[design.doc_id].forEach(function(h) {
                            $(function() {h()});
                        });
                        $.pages.app.ddoc_handlers[design.doc_id] = null;
                    }
                });
            }
        }
    };
    
    $.pages.app.ddocs = {};
    $.pages.app.ddoc_handlers = {};
})(jQuery);



