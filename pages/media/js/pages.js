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
    };
    
    
    $.pages.app.ddocs = {};
    $.pages.app.ddoc_handlers = {};

})(jQuery);



