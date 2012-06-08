describe("chorus.dialogs.MemoNewDialog", function() {
    beforeEach(function() {
        this.launchElement = $("<a data-entity-type='workfile' data-allow-workspace-attachments='true' data-entity-id='1' data-workspace-id='22'></a>")
        this.model = new chorus.models.Comment({
            entityType:this.launchElement.data("entity-type"),
            entityId:this.launchElement.data("entity-id"),
            workspaceId: this.launchElement.data("workspace-id")
        });

        this.dialog = new chorus.dialogs.MemoNew({
            launchElement : this.launchElement,
            pageModel : new chorus.models.Workfile(),
            model: this.model
        });
        $('#jasmine_content').append(this.dialog.el);

        spyOn($.fn, 'fileupload');
        spyOn(this.dialog, "launchSubModal");
        spyOn(this.dialog, "makeEditor").andCallThrough();
        this.qtip = stubQtip()
        stubDefer();
        this.dialog.render();
    });

    afterEach(function() {
        //prevent submodal test pollution
        $(document).unbind("close.facebox");
    })

    it("does not re-render when the model changes", function() {
        expect(this.dialog.persistent).toBeTruthy()
    })

    describe("#render", function() {
        it("renders the body", function() {
            this.dialog.model.set({body : "cats"})
            this.dialog.render();
            expect(this.dialog.$("textarea[name=body]").val()).toBe("cats")
        });

        it("has the 'Show options' link", function() {
            expect(this.dialog.$('a.show_options').length).toBe(1);
            expect(this.dialog.$('a.show_options').text()).toMatchTranslation('notes.new_dialog.show_options');
        });

        it("should have a notification recipients subview", function() {
            expect(this.dialog.$(this.dialog.notifications.el)).toExist();
            expect(this.dialog.notifications).toBeA(chorus.views.NotificationRecipient);
        });

        it("has a 'Send Notifications To' link", function() {
            expect(this.dialog.$(".recipients_menu")).not.toHaveClass("hidden");
        });

        it("hides the notification content area by default", function() {
            expect(this.dialog.$(".notification_recipients")).toHaveClass("hidden");
        });

        it("makes a cl editor with toolbar", function() {
            expect(this.dialog.makeEditor).toHaveBeenCalledWith($(this.dialog.el), ".toolbar", "body", { width : 350, controls : 'bold italic | bullets numbering | link unlink' } );
            expect(this.dialog.$('.toolbar')).toExist();
        });

        describe("selecting recipients menu", function() {
            it("has 'Nobody' checked by default", function() {
                this.dialog.$("a.recipients_menu").click();
                expect(this.qtip.find("li:eq(0)")).toHaveClass("selected");
            });
        });

        describe("selecting recipients", function() {
            beforeEach(function() {
                this.dialog.onSelectRecipients("some");
                this.dialog.$("textarea[name=body]").val("blah");
            });

            it("should say 'Selected Recipients' in the link", function() {
                expect(this.dialog.$(".recipients_menu .chosen")).toContainTranslation("notification_recipient.some");
            });

            it("should display the notification content area", function() {
                expect(this.dialog.$(".notification_recipients")).not.toHaveClass("hidden");
            });

            context("with selected recipients", function() {
                beforeEach(function() {
                    spyOn(this.dialog.notifications, "getPickedUsers").andReturn(["1", "2"]);
                    this.dialog.save();
                });

                it("should include the recipients in the save request", function() {
                    expect(this.server.lastCreate().params()["comment[recipients]"]).toBe("1,2");
                });
            });

            describe("selecting 'Nobody'", function() {
                beforeEach(function() {
                    this.dialog.onSelectRecipients("none");
                });

                it("should say 'Nobody' in the link", function() {
                    expect(this.dialog.$(".recipients_menu .chosen")).toContainTranslation("notification_recipient.none");
                });

                it("should hide the notification content area", function() {
                    expect(this.dialog.$(".notification_recipients")).toHaveClass("hidden");
                });

                context("with a selected user", function() {
                    beforeEach(function() {
                        spyOn(this.dialog.notifications, "getPickedUsers").andReturn(["1", "2"]);
                        this.dialog.save();
                    });

                    it("should not include the recipients in the save request", function() {
                        expect(this.server.lastCreate().params().recipients).toBeFalsy();
                    });
                });
            });
        });
    });

    describe("show_options", function() {
        it("shows the options area and hides the options_text when clicked", function() {
            expect(this.dialog.$('.options_area')).toBeHidden();
            expect(this.dialog.$('.options_text')).toBeVisible();
            this.dialog.$("a.show_options").click();
            expect(this.dialog.$('.options_text')).toBeHidden();
            expect(this.dialog.$('.options_area')).toBeVisible();
        });

        it("renders the workfiles attachment link and dataset attachment link when the allowWorkfileAttachments data is truthy", function() {
            expect(this.dialog.$("a.add_workfile")).toExist();
            expect(this.dialog.$("a.add_dataset")).toExist();
        });

        it("doesn't render the workfiles attachment link or the dataset attachment link when the allowWorkfileAttachments data is falsy", function() {
            this.launchElement.data("allowWorkspaceAttachments", false);
            this.dialog.render();
            expect(this.dialog.$("a.add_workfile")).not.toExist();
            expect(this.dialog.$("a.add_dataset")).not.toExist();
        });

        it("prevents default on click", function() {
            var eventSpy = jasmine.createSpyObj("event", ['preventDefault']);
            this.dialog.showOptions(eventSpy);
            expect(eventSpy.preventDefault).toHaveBeenCalled();
        });

        describe("when the 'attach workfile' link is clicked", function() {
            beforeEach(function() {
                this.dialog.$('.show_options').click();
                this.modalSpy = stubModals();
                this.dialog.launchSubModal.andCallThrough();
                this.dialog.$("a.add_workfile").click();
            });

            it("launches the workfile picker dialog", function() {
                expect(this.modalSpy).toHaveModal(chorus.dialogs.WorkfilesAttach);
                expect(this.modalSpy.lastModal().options.workspaceId).toBe(22);
            });

            describe("when workfiles are selected", function() {
                beforeEach(function() {
                    this.workfile1 = rspecFixtures.workfile.sql({ id: 1, fileName: "greed.sql", fileType: "sql" });
                    this.workfile2 = rspecFixtures.workfile.text({ id: 2, fileName: "generosity.cpp", fileType: "cpp" });
                    this.workfile3 = rspecFixtures.workfile.binary({ id: 3, fileName: "sloth", fileType: "N/A" });

                    this.modalSpy.lastModal().trigger("files:selected", [this.workfile1, this.workfile2, this.workfile3]);
                });

                it("displays the names of the workfiles", function() {
                    var fileNames = this.dialog.$(".file_details .name");
                    expect(fileNames.eq(0).text()).toBe("greed.sql");
                    expect(fileNames.eq(1).text()).toBe("generosity.cpp");
                });

                it("displays the appropriate file icons", function() {
                    var fileIcons = this.dialog.$(".file_details:visible img.icon");
                    expect(fileIcons.eq(0).attr("src")).toBe(chorus.urlHelpers.fileIconUrl("sql", "medium"));
                    expect(fileIcons.eq(1).attr("src")).toBe(chorus.urlHelpers.fileIconUrl("cpp", "medium"));
                    expect(fileIcons.eq(2).attr("src")).toBe(chorus.urlHelpers.fileIconUrl("plain", "medium"));
                });

                it("stores the collection", function() {
                    expect(this.dialog.model.workfiles.length).toBe(3);
                    expect(this.dialog.model.workfiles.at(0)).toBe(this.workfile1);
                    expect(this.dialog.model.workfiles.at(1)).toBe(this.workfile2);
                    expect(this.dialog.model.workfiles.at(2)).toBe(this.workfile3);
                });

                context("when the 'attach workfile' link is clicked again", function() {
                    beforeEach(function() {
                        this.dialog.$("a.add_workfile").click();
                    });

                    it("does not pre-select any of the workfiles", function() {
                        expect(this.modalSpy.lastModal().options.defaultSelection).toBeUndefined();
                    });

                    context("when additional workfiles are selected", function() {
                        beforeEach(function() {
                            this.newWorkfile1 = rspecFixtures.workfile.text({id: 4});
                            this.newWorkfile2 = rspecFixtures.workfile.text({id: 1});
                            this.modalSpy.lastModal().trigger("files:selected", [this.newWorkfile1, this.newWorkfile2]);
                        });

                        it("appends the new workfiles to the existing ones", function() {
                            expect(this.dialog.model.workfiles.length).toBe(4);
                            expect(this.dialog.model.workfiles.at(0)).toBe(this.workfile1);
                            expect(this.dialog.model.workfiles.at(1)).toBe(this.workfile2);
                            expect(this.dialog.model.workfiles.at(2)).toBe(this.workfile3);
                            expect(this.dialog.model.workfiles.at(3)).toBe(this.newWorkfile1);
                        });
                    });
                });

                describe("when a workfile remove link is clicked", function() {
                    it("removes only that workfile", function() {
                        var sqlRow = this.dialog.$(".file_details:not('.hidden'):contains('sql')")
                        var cppRow = this.dialog.$(".file_details:contains('cpp')")

                        expect(sqlRow).toExist();
                        expect(cppRow).toExist();

                        sqlRow.find("a.remove").click();

                        sqlRow = this.dialog.$(".file_details:contains('sql')")
                        cppRow = this.dialog.$(".file_details:contains('cpp')")
                        expect(sqlRow).not.toExist();
                        expect(cppRow).toExist();
                    });

                    it("removes only that workfile from the collection", function() {
                        var sqlRow = this.dialog.$(".file_details:contains('sql')")
                        sqlRow.find("a.remove").click();
                        expect(this.dialog.model.workfiles.get("1")).toBeUndefined();
                        expect(this.dialog.model.workfiles.get("2")).not.toBeUndefined();
                    });

                    context("when a desktop file has already been chosen", function() {
                        beforeEach(function() {
                            this.uploadObj = jasmine.createSpyObj("uploadObj", ["submit"]);
                            this.dialog.model.uploadObj = this.uploadObj;
                        });

                        it("does not remove the desktop file", function() {
                            var sqlRow = this.dialog.$(".file_details:contains('sql')")
                            sqlRow.find("a.remove").click();

                            expect(this.dialog.model.uploadObj).toBe(this.uploadObj);
                        });
                    });
                });
            });
        });

        describe("when the 'attach dataset' link is clicked", function() {
            beforeEach(function() {
                this.modalSpy = stubModals();
                this.dialog.$('.show_options').click();
                this.dialog.$("a.add_dataset").click();
            });

            it("launches the dataset picker dialog", function() {
                expect(this.modalSpy).toHaveModal(chorus.dialogs.DatasetsAttach);
                expect(this.modalSpy.lastModal().options.workspaceId).toBe(22);
            });

            describe("when datasets are selected", function() {
                beforeEach(function() {
                    this.datasets = [
                        newFixtures.dataset.sandboxTable({objectName: 'table1', id: '1'}),
                        newFixtures.dataset.sandboxTable({objectName: 'table2', id: '2'})
                    ];
                    this.modalSpy.lastModal().trigger("datasets:selected", this.datasets);
                });

                it("displays the names of the datasets", function() {
                    var datasetNames = this.dialog.$(".dataset_details .name");
                    expect(datasetNames.eq(0).text()).toBe("table1");
                    expect(datasetNames.eq(1).text()).toBe("table2");
                });

                it("displays the appropriate icons", function() {
                    var datasetIcons = this.dialog.$(".dataset_details:visible img.icon");
                    expect(datasetIcons.eq(0).attr("src")).toBe(this.datasets[0].iconUrl({size: 'medium'}));
                    expect(datasetIcons.eq(0).attr("src")).toBe(this.datasets[1].iconUrl({size: 'medium'}));
                });

                it("stores the collection", function() {
                    expect(this.dialog.model.datasets.length).toBe(2);
                    expect(this.dialog.model.datasets.at(0)).toBe(this.datasets[0]);
                    expect(this.dialog.model.datasets.at(1)).toBe(this.datasets[1]);
                });

                context("when the 'attach dataset' link is clicked again", function() {
                    beforeEach(function() {
                        this.dialog.$("a.add_dataset").click();
                    });

                    it("does not pre-select any of the datasets", function() {
                        expect(this.modalSpy.lastModal().options.defaultSelection).toBeUndefined();
                    });

                    context("when additional datasets are selected", function() {
                        beforeEach(function() {
                            this.newDatasets = [
                                newFixtures.dataset.sandboxTable({objectName: 'table1', id: '1'}),
                                newFixtures.dataset.sandboxTable({objectName: 'table4', id: '4'})
                            ];
                            this.modalSpy.lastModal().trigger("datasets:selected", this.newDatasets);
                        });

                        it("appends the new datasets to the existing ones", function() {
                            expect(this.dialog.$(".dataset_details").length).toBe(3);
                            expect(this.dialog.model.datasets.at(0)).toBe(this.datasets[0]);
                            expect(this.dialog.model.datasets.at(1)).toBe(this.datasets[1]);
                            expect(this.dialog.model.datasets.at(2)).toBe(this.newDatasets[1]);
                        });
                    });
                });

                describe("when a dataset remove link is clicked", function() {
                    it("removes only that dataset", function() {
                        var table1Row = this.dialog.$(".dataset_details:contains('table1')")
                        var table2Row = this.dialog.$(".dataset_details:contains('table2')")

                        expect(table1Row).toExist();
                        expect(table2Row).toExist();

                        table2Row.find("a.remove").click();

                        table1Row = this.dialog.$(".dataset_details:contains('table1')")
                        table2Row = this.dialog.$(".dataset_details:contains('table2')")
                        expect(table1Row).toExist();
                        expect(table2Row).not.toExist();
                    });

                    it("removes only that dataset from the collection", function() {
                        var table1Row = this.dialog.$(".dataset_details:contains('table1')")
                        table1Row.find("a.remove").click();
                        expect(this.dialog.model.datasets.get("1")).toBeUndefined();
                        expect(this.dialog.model.datasets.get("2")).not.toBeUndefined();
                    });
                });
            });
        });

        context("when a desktop files have been chosen", function() {
            beforeEach(function() {
                this.dialog.$('.show_options').click();
                this.dialog.$("a.show_options").click();
                this.fileList = [
                    {
                        name: 'foo.bar'
                    },
                    {
                        name: 'baz.sql'
                    }
                ];
                expect($.fn.fileupload).toHaveBeenCalled();
                expect($.fn.fileupload).toHaveBeenCalledOnSelector('input[type=file]');
                spyOn(this.dialog.model, 'addFileUpload').andCallThrough();
                this.fileUploadOptions = $.fn.fileupload.mostRecentCall.args[0];
                this.request = jasmine.createSpyObj('request', ['abort']);
                _.each(this.fileList, _.bind(function(file) {
                    this.fileUploadOptions.add(null, {files: [file], submit: jasmine.createSpy().andReturn(this.request)});
                }, this));
            });

            it("has a dataType of 'json'", function() {
                expect(this.fileUploadOptions.dataType).toBe('json');
            });

            it("uses updateProgressBar as a progress function", function() {
                expect(this.fileUploadOptions.progress).toBe(this.dialog.updateProgressBar);
            });

            it("points the dropzone to the file input to avoid insanity", function() {
                expect(this.fileUploadOptions.dropZone).toBe(this.dialog.$("input[type=file]"))
            })

            it("unhides the file_details area", function() {
                expect(this.dialog.$('.file_details')).toBeVisible();
            });

            it("displays the chosen filenames", function() {
                expect(this.dialog.$(".file_details .name:eq(0)").text()).toBe("foo.bar");
                expect(this.dialog.$(".file_details .name:eq(1)").text()).toBe("baz.sql");
            });

            it("displays the appropriate file icons", function() {
                expect(this.dialog.$(".file_details img.icon:eq(0)").attr("src")).toBe(chorus.urlHelpers.fileIconUrl("bar", "medium"));
                expect(this.dialog.$(".file_details img.icon:eq(1)").attr("src")).toBe(chorus.urlHelpers.fileIconUrl("sql", "medium"));
            });

            it("creates dependent commentFileUpload object for each upload", function() {
                expect(this.dialog.model.addFileUpload.callCount).toBe(this.fileList.length);
            });

            it("attaches the rendered file_details element to the file data element", function() {
                expect(this.dialog.model.files[0].data.fileDetailsElement.get(0)).toEqual(this.dialog.$('.file_details:eq(0)').get(0));
            });

            describe("updateProgressBar", function() {
                beforeEach(function() {
                    var data = {
                        fileDetailsElement: this.dialog.$('.file_details:eq(0)'),
                        total: 100,
                        loaded: 25
                    }
                    this.dialog.initProgressBars();
                    this.dialog.updateProgressBar("", data);
                });

                it("adjusts the visiblity of the progress bar", function() {
                    var loadingBar = this.dialog.$('.file_details:eq(0) .progress_bar span');
                    expect(loadingBar.css('right')).toBe('75px');
                });

                context("when the upload has finished", function() {
                    beforeEach(function() {
                        var data = {
                            fileDetailsElement: this.dialog.$('.file_details:eq(0)'),
                            total: 100,
                            loaded: 100
                        }
                        this.dialog.updateProgressBar("", data);
                    });

                    it("shows upload_finished and hides the progress bar", function() {
                        var fileRow = this.dialog.$('.file_details:eq(0)');
                        expect(fileRow.find('.progress_bar span')).not.toBeVisible();
                        expect(fileRow.find('.upload_finished')).toBeVisible();
                    })
                });
            })

            context("when a selected file is removed", function() {
                beforeEach(function() {
                    spyOn(this.dialog.model, 'removeFileUpload');
                    this.uploadModelToRemove = this.dialog.model.files[1];
                    this.dialog.$(".file_details .remove:eq(1)").click();
                });

                it("removes the file details", function() {
                    expect(this.dialog.$('.file_details').length).toBe(1);
                });

                it("removes the commentFileUpload from the model", function() {
                    expect(this.dialog.model.removeFileUpload).toHaveBeenCalledWith(this.uploadModelToRemove);
                });
            });

            describe("when a workfile is selected later", function() {
                beforeEach(function() {
                    this.workfiles = [
                        new chorus.models.Workfile({ id: 1, fileName: "greed.sql", fileType: "sql" }),
                        new chorus.models.Workfile({ id: 2, fileName: "generosity.cpp", fileType: "cpp" })
                    ];
                    this.dialog.workfileChosen(this.workfiles);
                });

                it("does not remove the desktop files from the view", function() {
                    expect(this.dialog.$(".file_details .name:eq(0)").text()).toBe("foo.bar");
                    expect(this.dialog.$(".file_details .name:eq(1)").text()).toBe("baz.sql");
                });

                describe("initProgressBars", function() {
                    context("with fileProgress support", function() {
                        beforeEach(function() {
                            chorus.features.fileProgress = true;
                            this.dialog.initProgressBars();
                        });
                        it("shows the progress bar for desktopfiles", function() {
                            this.dialog.$(".file_details.desktopfile").each(function() {
                                expect($(this).find('.progress_bar')).toBeVisible();
                                expect($(this).find('.progress_text')).not.toBeVisible();
                                expect($(this).find('.remove')).not.toBeVisible();
                                expect($(this).find('.upload_finished')).not.toBeVisible();
                            })
                        });

                        it("shows the upload_finished for workfiles", function() {
                            this.dialog.$(".file_details.workfile").each(function() {
                                expect($(this).find('.progress_bar')).not.toBeVisible();
                                expect($(this).find('.remove')).not.toBeVisible();
                                expect($(this).find('.upload_finished')).toBeVisible();
                            })
                        });
                    })
                    context("without fileProgress support", function() {
                        beforeEach(function() {
                            chorus.features.fileProgress = false;
                            this.dialog.initProgressBars();
                        });
                        afterEach(function() {
                            chorus.features.fileProgress = true;
                        })
                        it("shows the progress text for desktopfiles", function() {
                            this.dialog.$(".file_details.desktopfile").each(function() {
                                expect($(this).find('.progress_text')).toBeVisible();
                                expect($(this).find('.progress_bar')).not.toBeVisible();
                                expect($(this).find('.remove')).not.toBeVisible();
                                expect($(this).find('.upload_finished')).not.toBeVisible();
                            })
                        });
                    })

                })
            });

            describe("submit", function() {
                beforeEach(function() {
                    spyOn(this.dialog, "closeModal");
                    this.dialog.$("textarea[name=body]").val("The body of a note");
                    spyOnEvent(this.dialog.pageModel, "invalidated");
                    spyOn(this.dialog.model, 'saveFiles');
                    spyOn(this.dialog, 'initProgressBars').andCallThrough();
                    spyOn($.fn, "stopLoading").andCallThrough();
                    this.dialog.saving = true;
                });

                describe("when the model save succeeds", function() {
                    beforeEach(function() {
                        this.dialog.model.trigger("saved");
                    });

                    it("does triggers a file upload", function() {
                        expect(this.dialog.model.saveFiles).toHaveBeenCalled();
                    });

                    it("does trigger the progress bar initialization", function() {
                        expect(this.dialog.initProgressBars).toHaveBeenCalled();
                    })

                    context("when the file upload succeeds", function() {
                        beforeEach(function() {
                            this.dialog.model.trigger("fileUploadSuccess");
                        });

                        it("closes the dialog box", function() {
                            expect(this.dialog.closeModal).toHaveBeenCalled();
                        });

                        it("triggers the 'invalidated' event on the model", function() {
                            expect("invalidated").toHaveBeenTriggeredOn(this.dialog.pageModel);
                        });

                        it("removes the spinner from the button", function() {
                            expect($.fn.stopLoading).toHaveBeenCalledOnSelector("button.submit")
                        });
                    });

                    context("when the file upload fails", function() {
                        beforeEach(function() {
                            this.dialog.model.trigger("fileUploadFailed");
                        });

                        it("does not close the dialog box", function() {
                            expect(this.dialog.closeModal).not.toHaveBeenCalled();
                        })

                        it("does not trigger the 'invalidated' event on the model", function() {
                            expect("invalidated").not.toHaveBeenTriggeredOn(this.dialog.pageModel);
                        });

                        it("removes the spinner from the button", function() {
                            expect($.fn.stopLoading).toHaveBeenCalledOnSelector("button.submit")
                        });

                        it("displays the remove button and hides progress bar", function() {
                            this.dialog.$(".file_details").each(function() {
                                expect($(this).find('.progress_bar')).not.toBeVisible();
                                expect($(this).find('.upload_finished')).not.toBeVisible();
                                expect($(this).find('.remove')).toBeVisible();
                            })
                        });

                        it("enables the attachment_links", function() {
                            expect(this.dialog.$('.attachment_links')).not.toHaveClass('disabled');
                        })

                        it("enables the workfile attachment", function() {
                            this.dialog.$(".add_workfile").click();
                            expect(this.dialog.launchSubModal).toHaveBeenCalled();
                        })
                    });

                    context("when the upload is cancelled by clicking 'cancel upload button'", function() {
                        beforeEach(function() {
                            _.each(this.dialog.model.files, function(fileModel) {
                                spyOn(fileModel, 'cancelUpload');
                            })
                            this.dialog.$('.cancel_upload').click();
                        })

                        it("calls cancelUpload on the file models", function() {
                            _.each(this.dialog.model.files, function(fileModel) {
                                expect(fileModel.cancelUpload).toHaveBeenCalled();
                            })
                        })
                    });

                    context("when the upload is cancelled by pressing escape key", function() {
                        beforeEach(function() {
                            spyOn(this.dialog, 'cancelUpload');
                            this.dialog.escapePressed();
                        })

                        it("calls cancelUpload on the file models", function() {
                            expect(this.dialog.cancelUpload).toHaveBeenCalled();
                        })
                    });
                });
                describe("when the model save fails", function() {
                    beforeEach(function() {
                        this.dialog.model.trigger("saveFailed");
                    })

                    it("does not close the dialog box", function() {
                        expect(this.dialog.closeModal).not.toHaveBeenCalled();
                    })

                    it("does not trigger the 'invalidated' event on the model", function() {
                        expect("invalidated").not.toHaveBeenTriggeredOn(this.dialog.pageModel);
                    });

                    it("removes the spinner from the button", function() {
                        expect($.fn.stopLoading).toHaveBeenCalledOnSelector("button.submit")
                    });

                    it("does not trigger a file upload", function() {
                        expect(this.dialog.model.saveFiles).not.toHaveBeenCalled();
                    });
                });

                describe("when the validation fails", function() {
                    beforeEach(function() {
                        this.dialog.$("textarea[name=body]").val("");
                        this.dialog.$('button.submit').click();
                    })

                    it("removes the spinner from the button", function() {
                        expect(this.dialog.$("button.submit").isLoading()).toBeFalsy();
                    })

                    it("shows the error at the correct position", function() {
                        expect(this.dialog.$(".cleditorMain")).toHaveClass("has_error");
                    })
                });
            });
        });
    });

    describe("submit", function() {
        beforeEach(function() {
            spyOn(this.dialog.model, "save").andCallThrough();
            spyOn(this.dialog, "closeModal");
            this.dialog.$("textarea[name=body]").val("The body of a note");
            this.dialog.notifications.pickedUsers = ['1', '2'];
            this.dialog.$("form").trigger("submit");
        });

        it("saves the data", function() {
            expect(this.dialog.model.get("body")).toBe("The body of a note")
            expect(this.dialog.model.get("workspaceId")).toBe(22);
            expect(this.dialog.model.save).toHaveBeenCalled();
        });

        it("starts a spinner", function() {
            expect(this.dialog.$("button.submit").isLoading()).toBeTruthy();
        })

        it("closes the dialog box if saved successfully", function() {
            this.dialog.model.trigger("saved");
            expect(this.dialog.closeModal).toHaveBeenCalled();
        });

        it("doesn't close the dialog box if it not saved successfully", function() {
            this.dialog.model.trigger("savedFailed");
            expect(this.dialog.closeModal).not.toHaveBeenCalled();
        });

        it("triggers the 'invalidated' event on the model", function() {
            spyOnEvent(this.dialog.pageModel, "invalidated");
            this.dialog.model.trigger("saved");
            expect("invalidated").toHaveBeenTriggeredOn(this.dialog.pageModel);
        })

        it("disables the attachment_links", function() {
            expect(this.dialog.$('.attachment_links')).toHaveClass('disabled');
        })

        it("prevents workfiles from being selected", function() {
            this.dialog.$(".add_workfile").click();
            expect(this.dialog.launchSubModal).not.toHaveBeenCalled();
        })

        it("prevents datasets from being selected", function() {
            this.dialog.$(".add_dataset").click();
            expect(this.dialog.launchSubModal).not.toHaveBeenCalled();
        })
    });

    describe("saveFailed", function() {
        beforeEach(function() {
            spyOn(this.dialog, 'showErrors');
            spyOn(this.dialog.model, 'destroy');
        });

        context("the model was saved", function() {
            beforeEach(function() {
                this.dialog.model.set({'id': fixtures.nextId().toString()});
                this.dialog.saveFailed();
            });

            it("destroys the comment", function() {
                expect(this.dialog.model.destroy).toHaveBeenCalled();
            });

            it("clears the id", function() {
                expect(this.dialog.model.get('id')).toBeUndefined();
            });

            it("calls showErrors", function() {
                expect(this.dialog.showErrors).toHaveBeenCalled();
            });
        });

        context("the model was not saved", function() {
            beforeEach(function() {
                expect(this.dialog.model.get('id')).not.toBeDefined();
                this.dialog.saveFailed();
            });

            it("does not destroy the comment", function() {
                expect(this.dialog.model.destroy).not.toHaveBeenCalled();
            });

            it("calls showErrors", function() {
                expect(this.dialog.showErrors).toHaveBeenCalled();
            });
        });
    });

    describe("Cancel", function() {
        context("while uploading is going on", function() {
            beforeEach(function() {
                spyOn(this.dialog.model, 'saveFiles');
                this.dialog.model.files = [
                    {}
                ];
                this.dialog.modelSaved();
            });

            it("cancel should be replaced by cancel upload button", function() {
                expect(this.dialog.$('.modal_controls .cancel')).not.toBeVisible();
                expect(this.dialog.$('.modal_controls .cancel_upload')).toBeVisible();
            });

            context("when the upload has failed", function() {
                beforeEach(function() {
                    this.dialog.model.trigger('fileUploadFailed');
                });

                it("should hide the cancel upload button again", function() {
                    expect(this.dialog.$('.modal_controls .cancel')).toBeVisible();
                    expect(this.dialog.$('.modal_controls .cancel_upload')).not.toBeVisible();
                })

            });
        })
    })
});
