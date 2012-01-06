describe("MemberSet", function() {
    beforeEach(function() {
        this.workspace = new chorus.models.Workspace({id: 17})
        this.memberSet = new chorus.models.MemberSet([], {workspaceId: 17})
    });

    describe("#url", function() {
        it("has the workspace id in the url", function() {
            expect(this.memberSet.url()).toContain("/edc/workspace/17/member")
        })
    })

    describe("#save", function() {
        beforeEach(function() {
            this.savedSpy = jasmine.createSpy("saved");
            this.saveFailedSpy = jasmine.createSpy("saveFailed");
            spyOnEvent(this.memberSet, 'saved');
            spyOnEvent(this.memberSet, 'saveFailed');
            this.user1 = new chorus.models.User({ userName: "niels", id: "1" });
            this.user2 = new chorus.models.User({ userName: "ludwig", id: "2" });
            this.user3 = new chorus.models.User({ userName: "isaac", id: "4" });
            this.memberSet.add([this.user1, this.user2, this.user3]);
            this.memberSet.save();
        });

        it("does a PUT", function() {
            expect(this.server.requests[0].method).toBe("PUT");
        });

        it("hits the url for the members api", function() {
            expect(this.server.requests[0].url).toBe(this.memberSet.url());
        });

        it("passes a list of user names as data", function() {
            expect(this.server.requests[0].requestBody).toBe("members=1&members=2&members=4");
        });

        context("when the request succeeds", function() {
            beforeEach(function() {
                this.response = { status: "ok", resource : [
                    { foo : "hi" }
                ] };

                this.server.respondWith(
                    'PUT',
                    this.memberSet.url(),
                    this.prepareResponse(this.response));


                this.server.respond();
            });

            it("triggers the 'saved' event on the member set", function() {
                expect("saved").toHaveBeenTriggeredOn(this.memberSet);
            })
        })

        context("when the request fails", function() {
            beforeEach(function() {
                this.response = { status: "fail", resource : [
                    { foo : "hi" }
                ] };

                this.server.respondWith(
                    'PUT',
                    this.memberSet.url(),
                    this.prepareResponse(this.response));


                this.server.respond();
            });

            it("triggers the 'saveFailed' event on the member set", function() {
                expect("saveFailed").toHaveBeenTriggeredOn(this.memberSet);
            })
        })
    });
});
