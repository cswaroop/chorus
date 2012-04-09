describe("chorus.dialogs.SqlPreview", function() {
    describe("#render", function() {
        beforeEach(function() {
            this.launchElement = $("<a></a>");
            var model = fixtures.datasetChorusView({query: "select awesome from sql"});
            this.dialog = new chorus.dialogs.SqlPreview({
                launchElement: this.launchElement,
                model: model
            });
            spyOn(_, 'defer');
            spyOn(CodeMirror, 'fromTextArea').andReturn({ refresh: $.noop });

            stubModals();
            this.dialog.launchModal();

            this.parent = {
                sql: function() { return model.get("query"); }
            }
        });

        it("has a close window button", function() {
            expect(this.dialog.$('.modal_controls button.cancel')).toExist();
            expect(this.dialog.$('.modal_controls button.cancel').text().trim()).toMatchTranslation("actions.close_window");
        });

        it("hides the sql text area until the codemirror editor is ready", function() {
            var textarea = this.dialog.$("textarea");
            expect(textarea).toHaveClass("hidden");
            var deferredFn = _.defer.mostRecentCall.args[0];
            deferredFn();
            expect(CodeMirror.fromTextArea).toHaveBeenCalled();
            expect(CodeMirror.fromTextArea.mostRecentCall.args[0]).toBe(textarea[0]);
        });

        describe("preview bar", function() {
            it("has a link to 'Data Preview'", function() {
                expect(this.dialog.$("button.preview")).toExist();
            });

            describe("opening the Data Preview", function() {
                beforeEach(function() {
                    this.launchElement.data("parent", this.parent);
                    this.dialog.$("button.preview").click();
                });

                it("sends the data preview command", function() {
                    expect(this.server.lastCreateFor(this.dialog.resultsConsole.model)).toBeDefined();
                });

                describe("when the data preview succeeds", function() {
                    beforeEach(function() {
                        this.server.completeSaveFor(this.dialog.resultsConsole.model, fixtures.taskWithResult())
                    });

                    it("shows the result table", function() {
                        expect(this.dialog.$(".result_table")).not.toHaveClass("hidden")
                    });

                    describe("closing the Data Preview", function() {
                        beforeEach(function() {
                            this.dialog.$(".results_console .close").click()
                        });

                        it("does not show the Data Preview any longer", function() {
                            expect(this.dialog.$(".results_console")).toHaveClass("hidden");
                        });

                        describe("clicking on the data preview again", function() {
                            beforeEach(function() {
                                this.dialog.$("button.preview").click();
                            });

                            it("shows the result console", function() {
                                expect(this.dialog.$(".results_console")).not.toHaveClass("hidden");
                            })
                        })
                    });
                });
            })
        });

        describe("generated sql", function() {
            beforeEach(function() {
                this.launchElement.data("parent", this.parent);
            });

            it("constructs the SQL correctly", function() {
                expect(this.dialog.additionalContext().sql).toBe("select awesome from sql");
            });
        });

        describe("clicking the close button", function() {
            beforeEach(function() {
                spyOn(this.dialog.resultsConsole, "cancelExecution");
                this.dialog.$("button.cancel").click();
            });

            it("cancels the task", function() {
                expect(this.dialog.resultsConsole.cancelExecution).toHaveBeenCalled()
            });
        });

        describe("dismissing the dialog any other way", function() {
            beforeEach(function() {
                spyOn(this.dialog.resultsConsole, "cancelExecution");
                spyOn(chorus.PageEvents, "unsubscribe");
                this.dialog.modalClosed();
            });

            it("cancels the task", function() {
                expect(this.dialog.resultsConsole.cancelExecution).toHaveBeenCalled()
            });

            it("unsubscribes from the modal:closed event", function() {
                expect(chorus.PageEvents.unsubscribe).toHaveBeenCalledWith(this.dialog.modalClosedHandle);
            });
        });
    });
});
