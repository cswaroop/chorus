describe("chorus.models.Workfile", function() {
    beforeEach(function() {
        fixtures.model = "Workfile"
        this.model = fixtures.modelFor("fetch");
    });

    describe("#modifier", function() {
        it("returns a partially constructed user, based on the workfile's modifier attribute", function() {
            var modifier = this.model.modifier();
            expect(modifier.get("userName")).toBe(this.model.get("modifiedBy"));
            expect(modifier.get("firstName")).toBe(this.model.get("modifiedByFirstName"));
            expect(modifier.get("lastName")).toBe(this.model.get("modifiedByLastName"));
            expect(modifier.get("id")).toBe(this.model.get("modifiedById"))
        });
    })

    describe("#lastComment", function() {
        beforeEach(function() {
            this.comment = this.model.lastComment();
        });

        it("has the right body", function() {
            expect(this.comment.get("body")).toBe("I am loving commenting");
        });

        it("has the right creator", function() {
            var creator = this.comment.author()
            expect(creator.get("id")).toBe("InitialUser");
            expect(creator.get("firstName")).toBe("EDC");
            expect(creator.get("lastName")).toBe("Admin");
        });

        context("when the workfile doesn't have any comments", function() {
            it("returns null", function() {
                expect(new chorus.models.Workfile().lastComment()).toBeFalsy();
            });
        });
    });

    describe("validation", function() {
        beforeEach(function() {
            spyOn(this.model, "require").andCallThrough();
        });

        it("should return a truthy value for a valid workspace", function() {
            expect(this.model.performValidation()).toBeTruthy();
        });

        it("requires fileName", function() {
            this.model.performValidation();
            expect(this.model.require).toHaveBeenCalledWith("fileName", undefined);
        });
    });

    describe("#urls", function() {
        beforeEach(function() {
            this.model = new chorus.models.Workfile({id: 5, workspaceId: 10})
            this.model.set({versionFileId: "12345"});
        });

        it("has the right backend URL", function() {
            expect(this.model.url()).toBe("/edc/workspace/10/workfile/5");
        });

        it("has the right frontend show URL", function() {
            expect(this.model.showUrl()).toBe("#/workspaces/10/workfiles/5");
        });

        it("has the right download URL", function() {
            expect(this.model.downloadUrl()).toBe("/edc/workspace/10/workfile/5/file/12345?download=true");
        });
    });

    describe("isImage", function() {
        context("when the workfile is an image", function() {
            beforeEach(function() {
                this.model.set({ mimeType : "image/jpeg" });
            });

            it("returns true", function() {
                expect(this.model.isImage()).toBeTruthy();
            });
        });

        context("when the workfile is NOT an image", function() {
            beforeEach(function() {
                this.model.set({ mimeType : "text/plain" });
            });

            it("returns false", function() {
                expect(this.model.isImage()).toBeFalsy();
            });
        });
    });

    describe("isSql", function() {
        it("returns true when the workfile is a sql file", function() {
            this.model.set({ fileType: 'SQL'});
            expect(this.model.isSql()).toBeTruthy();
        })

        it("returns false when the workfile is NOT a sql file", function() {
            this.model.set({ fileType: 'CSV'});
            expect(this.model.isSql()).toBeFalsy();
        })
    });

    describe("createDraft", function() {
        beforeEach(function() {
            this.workfile = new chorus.models.Workfile({id: "123", workspaceId: "456", content: "asdf"});
        });
        it("sets the required attributes", function() {
            var draft = this.workfile.createDraft();
            expect(draft.get("workfileId")).toBe("123");
            expect(draft.get("workspaceId")).toBe("456");
            expect(draft.get("content")).toBe("asdf");
        });

        context("when the workfile has a draft", function() {
            beforeEach(function() {
                this.workfile.set({ hasDraft: true });
            });

            it("is not considered 'new'", function() {
                expect(this.workfile.createDraft().isNew()).toBeFalsy();
            });
        });

        describe("when the draft is saved", function() {
            beforeEach(function() {
                var draft = this.workfile.createDraft();
                draft.trigger("saved");
            });

            it("sets the workfile's 'hasDraft' field to true", function() {
                expect(this.workfile.get("hasDraft")).toBeTruthy();
            });
        });
    });

    describe("#allVersions", function() {
        it("sets the required attributes", function() {
            var workfileVersionSet = this.model.allVersions();
            expect(workfileVersionSet).toBeA(chorus.models.WorkfileVersionSet);
            expect(workfileVersionSet.attributes.workspaceId).toBe(this.model.get("workspaceId"));
            expect(workfileVersionSet.attributes.workfileId).toBe(this.model.get("id"));
        });
    });

    describe("canEdit", function() {
        it("returns false when its version is not the current version", function() {
            this.model.set({latestVersionNum: "6", versionNum: "3"});
            expect(this.model.canEdit()).toBeFalsy();
        });

        it("returns true when its version is the current version", function() {
            this.model.set({latestVersionNum: "6", versionNum: "6"});
            expect(this.model.canEdit()).toBeTruthy();
        });
    });

    describe("isText", function() {
        context("when the workfile is a plain textfile", function() {
            beforeEach(function() {
                this.model.set({ mimeType : "text/plain" });
            });

            it("returns true", function() {
                expect(this.model.isText()).toBeTruthy();
            });
        });

        context("when the workfile is an html file", function() {
            beforeEach(function() {
                this.model.set({ mimeType : "text/html" });
            });

            it("returns true", function() {
                expect(this.model.isText()).toBeTruthy();
            });
        });

        context("when the workfile is an sql file", function() {
            beforeEach(function() {
                this.model.set({ mimeType : "text/x-sql" });
            });

            it("returns true", function() {
                expect(this.model.isText()).toBeTruthy();
            });
        });

        context("when the workfile is NOT text", function() {
            beforeEach(function() {
                this.model.set({ mimeType : "image/jpeg" });
            });

            it("returns false", function() {
                expect(this.model.isText()).toBeFalsy();
            });
        });
    });

    describe("initializing from a WorkfileVersionSet", function() {
        beforeEach(function() {
            this.collection = new chorus.models.WorkfileVersionSet([], {workspaceId: 1, workfileId: 2});
        });

        it("sets the workspaceId attribute on the model", function() {
            this.collection.add({versionNum: 5});

            expect(this.collection.models[0]).toBeA(chorus.models.Workfile);
            expect(this.collection.models[0].get("workspaceId")).toBe(this.collection.attributes.workspaceId);
        });
    });
});
