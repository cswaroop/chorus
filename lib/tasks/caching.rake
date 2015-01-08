namespace :caching do
  desc "THis task will iterate throgh the workspaces in the database and add them to the cache so that users will not experience long delay while loading workspaces on the page"
  task :workspaces => :environment do
    users = User.all
    users.each do | user|
      workspaces = Workspace.workspaces_for(user)
      workspaces = workspaces.includes(Workspace.eager_load_associations).order("lower(name) ASC, id")
      print "Caching workspaces for #{user.username} "
      workspaces.each do |workspace|
        workspace.refresh_cache
        print "."
        $stdout.flush
      end
      printf " done\n"
    end
  end

  desc "TODO"
  task :datasets => :environment do
  end

  desc "TODO"
  task :workfiles => :environment do
  end

end
