json.response do
  json.array! @workspaces do |workspace|
    json.cache! [current_user.id, workspace], expires_in: 6.months do
      json.partial! 'workspaces/workspace', workspace: workspace, user: current_user, options: @options
    end
  end
end

