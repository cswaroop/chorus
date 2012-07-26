require File.join(File.dirname(__FILE__), '../integration/spec_helper')

describe "searches for instance name" do

  it "searches for instances" do

    login('edcadmin', 'secret')
    create_gpdb_instance(:name => "search_instance")
    wait_for_ajax
    page.execute_script("$('.chorus_search_container>input').val('search_instance');")
    find('.chorus_search_container>input').native.send_keys(:return)
    wait_for_ajax
    page.should have_content "Search for"
    page.should have_content "search_instance"

  end
end

describe "searches for worksapce name" do

  it "searches for workspaces" do
    login('edcadmin', 'secret')
    create_valid_workspace(:name => "search_workspace")
    wait_for_ajax
    page.execute_script("$('.chorus_search_container>input').val('search_workspace');")
    find('.chorus_search_container>input').native.send_keys(:return)
    wait_for_ajax
    page.should have_content "Search for"
    page.should have_content "search_workspace"

  end
end