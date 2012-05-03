require 'spec_helper'

describe InstancesController do
  before do
    @user = FactoryGirl.create(:user)
    log_in @user
    @instance1 = FactoryGirl.create(:instance)
    @instance2 = FactoryGirl.create(:instance)
  end

  describe "#index" do
    it_behaves_like "an action that requires authentication", :get, :index

    it "returns instances to which the user has access" do
      mock(Instance).for_user(@user)

      get :index
      response.code.should == "200"
    end
  end

  describe "#update" do
    let(:changed_attributes) { {"name" => "changed"} }

    before do
      instance = FactoryGirl.build(:instance)
      stub(Gpdb::ConnectionBuilder).update!('1', changed_attributes, @user) { instance }
    end

    it "should reply with successful update" do
      put :update, :id => '1', :instance => changed_attributes
      response.code.should == "200"
    end

    it "should handle invalid updates" do
      instance = FactoryGirl.build(:instance, :name => nil)
      stub(Gpdb::ConnectionBuilder).update!('1', changed_attributes, @user) { raise(ActiveRecord::RecordInvalid.new(instance)) }
      put :update, :id => '1', :instance => changed_attributes
      response.code.should == "422"
    end

    it "should handle security transgressions" do
      stub(Gpdb::ConnectionBuilder).update!('1', changed_attributes, @user) { raise(SecurityTransgression.new) }
      put :update, :id => '1', :instance => changed_attributes
      response.code.should == "403"
    end
  end

  describe "#create" do
    it_behaves_like "an action that requires authentication", :put, :update

    context "with valid attributes" do
      let(:valid_attributes) { Hash.new }

      before do
        instance = FactoryGirl.build(:instance, :name => "new")
        stub(Gpdb::ConnectionBuilder).create!(valid_attributes, @user) { instance }
      end

      it "reports that the instance was created" do
        post :create, :instance => valid_attributes
        response.code.should == "201"
      end

      it "renders the newly created instance" do
        post :create, :instance => valid_attributes
        decoded_response.name.should == "new"
      end
    end

    context "with invalid attributes" do
      let(:invalid_attributes) { Hash.new }

      before do
        instance = FactoryGirl.build(:instance, :name => nil)
        stub(Gpdb::ConnectionBuilder).create!(invalid_attributes, @user) { raise(ActiveRecord::RecordInvalid.new(instance)) }
      end

      it "responds with validation errors" do
        post :create, :instance => invalid_attributes
        response.code.should == "422"
      end
    end
  end
end
