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
            $("#tabs").tabs()
           
            $("#new-property").button().click(function() {
                self.property_add();
                return false;
            });

            $(".property").live("mouseover", function(e) {
                // display toolbar to manage up, down acttions
                self.type_toolbar(this); 
            }).live("mouseleave", function() {
                $(".ttool", this).remove();
            });

            $(".property").live("click", function(e) {
                if (typeof(e.originalTarget) != "undefined" && e.originalTarget.nodeName === "BUTTON")
                    return;

                $("td.current").removeClass("current");
                $(this).addClass("current");
                var row = $(this).parent();
                console.log("edit");
                self.property_edit(row);
            });

            $("#property-detail :input")
                .live("change", function(e) {
                    var row = $(".current").parent();
                    if (this.id === "type") {
                        var proptype = $(this).val();
                        self.display_type(proptype);
                    }
                    $("#properties").trigger("update", [row]);
                })
                .live("keyup", function(e) {
                    var row = $(".current").parent();
                    $("#properties").trigger("update", [row]);
                    if (this.id === "name")
                        $(".current").html($(this).val()); 
                });

            $("#properties").bind("update", function(e, row) {
                console.log("update property");
                var prop = {};
                $("#property-detail :input").each(function(el) {
                    prop[$(this).attr("id")] = $(this).val();
                });
                $.data(row[0], "_property", prop); 
            });
        },

        type_toolbar: function(el) {
            var templates = this.app.ddoc.templates,
                tpl = templates.type_toolbar,
                toolbar = $(Mustache.to_html(tpl, {})),
                row = $(el).closest("tr").prevAll("tr").length,
                self=this;
            
            if ($(el).has("div").length > 0) {
                return;
            }

            $(".ttool").remove();

            $("button:first", toolbar).button({
                icons: {
                    primary: "ui-icon-circle-triangle-n"
                },
                text: false
            }).next().button({
                icons: {
                    primary: "ui-icon-circle-triangle-s"
                },
                text: false
            }).next().button({
                icons: {
                    primary: "ui-icon-circle-close"
                },
                text: false
            });
            $("button", toolbar).click(function(e) {
                e.preventDefault();
                var r = $(this).closest("tr"),
                    $r = $(r); 
                if ($(this).hasClass("up")) {
                    if (row === 0) return;
                    $r.insertBefore($r.prev());
                    console.log("up");
                } else if ($(this).hasClass("down")) {
                    if (row === ($("#properties").length-1)) return;
                    $r.insertAfter($(r).next());
                    console.log("down");
                } else {
                    var next = $(el).parent().next();
                    $(el).parent().remove(); 
                    if (next.length > 0) {
                        self.property_edit(next);
                    }
                    console.log("close");
                }
                return false;
            });
            toolbar.appendTo($(el));
        },
        
        property_add: function() {
            var templates = this.app.ddoc.templates,
                properties = $("#properties"), 
                detail = Mustache.to_html(templates.property_row, {
                    rowspan: this.nb_props,
                    name: "New propety"            
                }),
                pdetail = $("#property-detail");
            
            $(".current").removeClass("current");
            var row = $('<tr></tr>');
            $('<td class="property current">New property</td>').appendTo(row); 
            pdetail.html(detail);
            properties.append(row);
            this.display_type("text");

            properties.trigger("update", [row]); 
        },

        property_edit: function(row) {
            var prop = $.data(row[0], "_property");
                templates = this.app.ddoc.templates,
                detail = Mustache.to_html(templates.property_row, prop),
                pdetail = $("#property-detail");

            pdetail.html(detail);
            $("#property-detail select").each(function() {
                if (typeof(prop[this.id]) != "undefined") {
                    $(this).val(prop[this.id]);
                }
            });
            this.display_type(prop.type);
            $(".dtype :input").each(function() {
                var val = prop[this.id]
                if (typeof(val) != "undefined")
                    $(this).val(val);
            });

            $(".current").removeClass("current");
            $("td:first", row).addClass("current");
        },

        display_type: function(type) {
            var templates = this.app.ddoc.templates,
                pdetail = $("#property-detail");
            $(".dtype").remove();
            tplname = "prop_" + type;
            if (typeof(templates[tplname]) != "undefined") {
                var div = $('<div class="dtype"></div>'),
                    tpl = Mustache.to_html(templates[tplname], {});
                div
                    .html(tpl)
                    .appendTo(pdetail);
            }
        }
    });

    $.pages.ResourceType = new ResourceType();

})(jQuery);
