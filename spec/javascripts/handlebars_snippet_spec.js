describe("handlebars", function() {
    describe("registered helpers", function() {
        describe("cache_buster", function() {
            it("should be different when called at different times", function() {
                var first_cb, second_cb;
                runs(function() {
                    first_cb = Handlebars.compile("{{cache_buster}}")();
                });

                waits(1); // milliseconds

                runs(function() {
                    second_cb = Handlebars.compile("{{cache_buster}}")();
                });

                runs(function() {
                    expect(first_cb).not.toEqual(second_cb);
                });
            });
        });

        describe("ifAdmin", function() {
            beforeEach(function() {
                this.originalUser = chorus.user;
                this.ifAdminSpy = jasmine.createSpy();
                this.ifAdminSpy.inverse = jasmine.createSpy();
            });

            afterEach(function() {
                chorus.user = this.originalUser;
            });

            describe("when the user is an admin", function() {
                beforeEach(function() {
                    chorus.user.set({ admin: true });
                });

                it("returns executes the block", function() {
                    Handlebars.helpers.ifAdmin(this.ifAdminSpy);
                    expect(this.ifAdminSpy).toHaveBeenCalled();
                    expect(this.ifAdminSpy.inverse).not.toHaveBeenCalled();
                })
            });

            describe("when the user is not an admin", function() {
                beforeEach(function() {
                    chorus.user.set({ admin: false });
                });

                it("does not execute the block", function() {
                    Handlebars.helpers.ifAdmin(this.ifAdminSpy);
                    expect(this.ifAdminSpy.inverse).toHaveBeenCalled();
                    expect(this.ifAdminSpy).not.toHaveBeenCalled();
                });
            });

            describe("when chorus.user is undefined", function() {
                beforeEach(function() {
                    chorus.user = undefined;
                });

                it("does not execute the block", function() {
                    Handlebars.helpers.ifAdmin(this.ifAdminSpy);
                    expect(this.ifAdminSpy.inverse).toHaveBeenCalled();
                    expect(this.ifAdminSpy).not.toHaveBeenCalled();
                });
            })
        });

        describe("ifAll", function() {
            beforeEach(function() {
                this.ifAllSpy = jasmine.createSpy('ifAll');
                this.ifAllSpy.inverse = jasmine.createSpy('ifAll.inverse');
            });

            it("throws an exception if no arguments were passed", function() {
                var exceptionThrown;
                try {
                    Handlebars.helpers.ifAll(this.ifAllSpy, this.ifAllSpy.inverse);
                } catch (e) {
                    exceptionThrown = e;
                }
                expect(exceptionThrown).toMatch(/argument/);
            });

            context("when an else block is present", function() {
                beforeEach(function() {
                    this.template = "{{#ifAll first second}}yes{{else}}no{{/ifAll}}";
                });

                it("renders the else block if any arguments are falsy", function() {
                    var context = {first: true, second: false};
                    var string = Handlebars.compile(this.template)(context);
                    expect(string).toBe("no");
                });

                it("renders the block if all arguments are truthy", function() {
                    var context = {first: true, second: true};
                    var string = Handlebars.compile(this.template)(context);
                    expect(string).toBe("yes");
                });
            });

            context("when an else block is not present", function() {
                beforeEach(function() {
                    this.template = "{{#ifAll first second}}yes{{/ifAll}}";
                });

                it("renders nothing if any arguments are falsy", function() {
                    var context = {first: true, second: false};
                    var string = Handlebars.compile(this.template)(context);
                    expect(string).toBe("");
                });

                it("renders the block if all arguments are truthy", function() {
                    var context = {first: true, second: true};
                    var string = Handlebars.compile(this.template)(context);
                    expect(string).toBe("yes");
                });
            });
        });

        describe("ifAny", function() {
            beforeEach(function() {
                this.ifAnySpy = jasmine.createSpy('ifAny');
                this.ifAnySpy.inverse = jasmine.createSpy('ifAny.inverse');
            });

            it("throws an exception if no arguments were passed", function() {
                var exceptionThrown;
                try {
                    Handlebars.helpers.ifAny(this.ifAnySpy, this.ifAnySpy.inverse);
                } catch (e) {
                    exceptionThrown = e;
                }
                expect(exceptionThrown).toMatch(/argument/);
            });

            context("when an else block is present", function() {
                beforeEach(function() {
                    this.template = "{{#ifAny first second}}yes{{else}}no{{/ifAny}}";
                });

                it("renders the else block if all arguments are falsy", function() {
                    var context = {first: false, second: false};
                    var string = Handlebars.compile(this.template)(context);
                    expect(string).toBe("no");
                });

                it("renders the block if any arguments are truthy", function() {
                    var context = {first: false, second: true};
                    var string = Handlebars.compile(this.template)(context);
                    expect(string).toBe("yes");
                });
            });

            context("when an else block is not present", function() {
                beforeEach(function() {
                    this.template = "{{#ifAny first second}}yes{{/ifAny}}";
                });

                it("renders nothing if all arguments are falsy", function() {
                    var context = {first: false, second: false};
                    var string = Handlebars.compile(this.template)(context);
                    expect(string).toBe("");
                });

                it("renders the block if any arguments are truthy", function() {
                    var context = {first: true, second: false};
                    var string = Handlebars.compile(this.template)(context);
                    expect(string).toBe("yes");
                });
            });
        });

        describe("displayNameFromPerson", function() {
            it("renders the fullname", function() {
                expect(Handlebars.helpers.displayNameFromPerson({firstName: "EDC", lastName: "Admin"})).toBe("EDC Admin");
            })
        })

        describe("displayTimestamp", function() {
            it("renders the timestamp", function() {
                expect(Handlebars.helpers.displayTimestamp("2011-11-23 15:42:02.321")).toBe("November 23");
            })

            it("tolerates bogus timestamps", function() {
                expect(Handlebars.helpers.displayTimestamp("yo momma")).toBe("WHENEVER");
            })

            it("tolerates undefined", function() {
                expect(Handlebars.helpers.displayTimestamp()).toBe("WHENEVER");
            })
        })

        describe("moreLink", function() {
            describe("when the collection has more than 2 elements", function() {
                it("returns markup", function() {
                    expect($("<div>" + Handlebars.helpers.moreLink([1,2,3]) + "</div>").find("a.more")).toExist();
                })
            });
            describe("when the collection has less than 3 elements", function() {
                it("returns no markup", function() {
                    expect($("<div>" + Handlebars.helpers.moreLink([1,2]) + "</div>").find("a.more")).not.toExist();
                })
            });
        });

        describe("currentUserName", function() {
            beforeEach(function() {
                this.template = "{{currentUserName}}";
                chorus.session.set({userName : "bob"});
            });
            it("should return the user", function(){
                expect(Handlebars.compile(this.template)({})).toBe(chorus.session.get("userName"));
            });
        });

        describe("eachWithMoreLink", function() {
            beforeEach(function() {
                this.yieldSpy = jasmine.createSpy();
                this.yieldSpy.inverse = jasmine.createSpy();
                spyOn(Handlebars.helpers, "moreLink");
            });

            describe("when the collection has more than max elements", function() {
                beforeEach(function() {
                    this.collection = [1,2,3];
                    Handlebars.helpers.eachWithMoreLink(this.collection, 2, this.yieldSpy, this.yieldSpy.inverse);
                })

                it("yields to the block the maximum number of times", function() {
                    expect(this.yieldSpy.callCount).toBe(2);
                })

                it("calls moreLink", function() {
                    expect(Handlebars.helpers.moreLink).toHaveBeenCalledWith(this.collection);
                })
            })

            describe("when the collection has less than max elements", function() {
                beforeEach(function() {
                    this.collection = [1];
                    Handlebars.helpers.eachWithMoreLink(this.collection, 2, this.yieldSpy, this.yieldSpy.inverse);
                })

                it("yields to the block for each element", function() {
                    expect(this.yieldSpy.callCount).toBe(1);
                })

                it("calls moreLink", function() {
                    expect(Handlebars.helpers.moreLink).toHaveBeenCalledWith(this.collection);
                })
            })
        })
    });

});
