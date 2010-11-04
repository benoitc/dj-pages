/* 
 * This file is part of dj-pages released under the MIT license. 
 * See the NOTICE for more information.
 */

(function($) {

    $.pages = $.pages || {};

    function ResourceType() {
        this.nb_props = 0;
        this.cache = {};
        this.inc = 0;
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
            $("#tabs").tabs()
           
            $("#new-property").button().click(function() {
                self.property_add();
                return false;
            });

            $(".property").live("mouseover", function() {
                var row = $(this).parent().children().index($(this));
                console.log(row);
            });

        },

        property_add: function() {
            this.nb_props += 1;
            var templates = this.app.ddoc.templates,
                properties = $("#properties"),
                detail = Mustache.to_html(templates.property_row, {
                    rowspan: this.nb_props,
                    name: "New propety"            
                });
            
            var row = $('<tr class="property"></tr>');
            $("<td>New property</td>").appendTo(row);
            if (this.nb_props === 1) {
                pdetail = $('<td id="property-detail"></td>');
                pdetail.appendTo(row);
            } else {
                pdetail= $("#property-detail");
            }
            pdetail.attr("colspan", this.nb_props);
            pdetail.html(detail);
            row.appendTo(properties);

            $("#pname").bind("keyup", function(e) {
                var el = $("td:first", row[0]);
                el.html($(this).val());
            });
        },

        new_property: function() {
            return this.property_dialog();
        }

    });

    $.pages.ResourceType = new ResourceType();

})(jQuery);
