/* 
 * This file is part of dj-pages released under the MIT license. 
 * See the NOTICE for more information.
 */

(function($) {

    $.pages = $.pages || {};

    function ResourceType() {
        
        this.cache = {};
    }

    $.extend(ResourceType.prototype, {
        request: function(app, req) {
            this.app = app;
            if (req.method === "get") {
                this.new_type(app, req);
            }
        },

        new_type: function(app, req) {
            var self = this;
            var templates = app.ddoc.templates;
            var cnt = Mustache.to_html(templates.type, {});
            $("#content").html(cnt);
            $("#admin").html(Mustache.to_html(templates.type_admin, {})); 
            $("#tabs").tabs();
            $("#new-property").button().click(function() {
                self.new_property();
                return false;
            });

        },

        property_dialog: function(data) {
            var templates = this.app.ddoc.templates,
                dlg = $('<div id="dialog"></div>'),
                data = data || {};

            var cnt =  Mustache.to_html(templates.property_dialog, data);
            dlg
                .html(cnt)
                .appendTo($(document.body))
                .dialog({height: "400px", modal: true});


        },

        new_property: function() {
            return this.property_dialog();
        }

    });

    $.pages.ResourceType = new ResourceType();

})(jQuery);
