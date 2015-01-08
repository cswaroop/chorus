chorus.views.NotificationRecipient = chorus.views.Base.extend({
    constructorName: "NotificationRecipientView",
    templateName: "notification_recipient",
    useLoadingSection: true,

    events: {
        "change select"    : "onUserSelected",
        "click a.remove" : "onRemoveUserClicked"
    },

    makeModel: function() {
        this.collection = new chorus.collections.UserSet();
        this.collection.sortAsc("firstName");
        this.collection.fetchAll();

        this.selectedUsers = new chorus.collections.UserSet();
    },

    preRender: function() {
        this.collection.remove(chorus.session.user());
    },

    postRender: function() {
        this.updateAvailableUserList();
        this.updateSelectedUserList();
    },

    onUserSelected: function() {
        var id = this.$("select").val();
        if (id) {
            var user = this.collection.get(id);

            this.selectedUsers.add(user);
            this.updateSelectedUserList();
            this.collection.remove(user);
            this.updateAvailableUserList();
        }
    },

    onRemoveUserClicked : function(e) {
        e && e.preventDefault();

        var $li = $(e.target).parent();
        var user = this.selectedUsers.get($li.data("id"));

        this.collection.add(user);
        this.updateAvailableUserList();
        this.selectedUsers.remove(user);
        this.updateSelectedUserList();
    },

    updateAvailableUserList: function() {
        this.$("select").empty();
        var $tipOption = $("<option class='name'></option>").text(t('notification_recipient.members.option'));
        this.$("select").append($tipOption);

        this.collection && this.collection.models.sort(function(a, b) {
            return naturalSort(a.get("firstName").toLowerCase(), b.get("firstName").toLowerCase());
        });

        _.each(this.collection.models, function(user) {
            var $option = $("<option class='name'></option>").text(user.displayName());
            $option.attr("value", user.get("id").toString());
            this.$("select").append($option);
        }, this);

        chorus.styleSelect(this.$("select"));

        var $availableUser = this.$(".ui-selectmenu-button");
        this.collection.length === 0 ? $availableUser.addClass("hidden") : $availableUser.removeClass("hidden");
    },

    updateSelectedUserList: function() {
        this.$(".picked_users").empty();

        _.each(this.selectedUsers.models, function(user) {
            var id = user.get("id");
            var $span = $("<span class='name'></span>").text(user.displayName());
            var $remove = $('<a href="#" class="remove"/>').append('<span class="fa fa-times-circle" title="{{t "actions.remove"}}"></span>');

            var $li = $("<li></li>").append($span).append($remove).attr("data-id", id.toString());

            this.$(".picked_users").append($li);
        }, this);
    },

    getPickedUsers : function() {
        return _.map(this.selectedUsers.models, function(user) {
            return user.get("id");
        });
    }
});

