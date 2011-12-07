describe("chorus.pages.DashboardPage", function() {
    beforeEach(function() {
        this.loadTemplate("dashboard");
        this.loadTemplate("header");
        this.loadTemplate("breadcrumbs");
        this.loadTemplate("dashboard_sidebar");
        this.loadTemplate("logged_in_layout");
        this.loadTemplate("main_content")
        this.loadTemplate("workspace_list")
        this.loadTemplate("default_content_header")
        this.page = new chorus.pages.DashboardPage();
        chorus.user = new chorus.models.User({
            "firstName" : "Daniel",
            "lastName" : "Burkes",
            "fullName": "Daniel Francis Burkes"
        });
    });

    describe("#render", function() {
        beforeEach(function() {
            this.page.render();
        })

        it("creates a Header view", function() {
            expect(this.page.$("#header.header")).toExist();
        })

        context("the workspace list", function(){
            beforeEach(function(){
                this.workspaceList = this.page.mainContent;
            })

            it("has a title", function() {
                expect(this.workspaceList.$("h1").text()).toBe("My Workspaces");
            });

            it("creates a WorkspaceList view", function() {
                expect(this.page.$(".workspace_list")).toExist();
            });
        });
    });
});
