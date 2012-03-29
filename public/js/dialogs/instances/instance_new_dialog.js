chorus.dialogs.InstancesNew = chorus.dialogs.Base.extend({
    className:"instance_new",
    title:t("instances.new_dialog.title"),

    persistent:true,

    events:{
        "change input[type='radio']":"showFieldset",
        "click button.submit": "createInstance",
        "click a.close_errors": "clearServerErrors"
    },

    setup:function () {
        this.bindings.add(this.model, "saved", this.saveSuccess);
        this.bindings.add(this.model, "saveFailed", this.saveFailed);
        this.bindings.add(this.model, "validationFailed", this.saveFailed);
    },

    makeModel:function () {
        this.model = this.model || new chorus.models.Instance();
    },

    additionalContext: function() {
        return {
            auroraInstalled: chorus.models.Instance.aurora().isInstalled()
        }
    },

    showFieldset:function (e) {
        this.$("fieldset").addClass("collapsed");
        $(e.currentTarget).closest("fieldset").removeClass("collapsed");
        this.clearErrors();
        this.$("button.submit").prop("disabled", false)
    },

    createInstance:function (e) {
        e && e.preventDefault();
        this.$("button.submit").startLoading("instances.new_dialog.saving");
        this.model.save(this.fieldValues());
    },

    fieldValues: function() {
        var updates = {};
        var inputSource = this.$("input[name=instance_type]:checked").closest("fieldset");
        _.each(inputSource.find("input[type=text], input[type=hidden], input[type=password], textarea"), function (i) {
            var input = $(i);
            updates[input.attr("name")] = input.val().trim();
        });

        updates.shared = inputSource.find("input[name=shared]").prop("checked") ? "yes" : "no";
        return updates;
    },

    clearServerErrors : function() {
        this.model.serverErrors = {};
    },

    saveSuccess:function () {
        chorus.PageEvents.broadcast("instance:added", this.model.get("id"));
        this.closeModal();
    },

    saveFailed:function () {
        this.$("button.submit").stopLoading();
    }
});

