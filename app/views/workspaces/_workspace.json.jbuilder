json.id workspace.id
json.name workspace.name
# TODO: Where should I get the entity_type parameter? (Prakash 12/15/14)
json.entity_type "workspace"
json.is_deleted workspace.deleted?
json.summary workspace.summary
json.archived_at workspace.archived_at
json.permission workspace.permissions_for(user)
json.public workspace.public
json.datasets_count  workspace.dataset_count(user)
json.members_count workspace.members.size
json.workfiles_count workspace.workfiles.size
json.insights_count workspace.owned_notes.where(:insight => true).count
json.recent_insights_count workspace.owned_notes.where(:insight => true).recent.count
json.recent_comments_count workspace.owned_notes.recent.count
json.has_recent_comments workspace.owned_notes.recent.count > 0
json.has_milestones workspace.milestones_count > 0
json.partial! 'shared/user', user: workspace.owner, title: 'owner', options: options
json.is_member workspace.member?(user)
json.is_project workspace.is_project
json.project_status workspace.project_status
json.project_status_reason workspace.project_status_reason
json.milestone_count workspace.milestones_count
json.milestone_completed_count workspace.milestones_achieved_count
json.project_target_date workspace.project_target_date.try(:strftime, "%Y-%m-%dT%H:%M:%SZ")
comments_hash = workspace.latest_comments_hash
json.number_of_insights comments_hash[:number_of_insights]
json.number_of_comments comments_hash[:number_of_comments]
json.latest_comment_list do
  json.array! comments_hash[:latest_comment_list] do |comment|
    json.partial! 'shared/comment', comment: comment, user: comment.author
  end
  json.array! comments_hash[:latest_notes_list] do |note|
    json.partial! 'shared/event', event: note, user: note.actor, action: 'NOTE', options: options
  end
end
latest_insight = comments_hash[:latest_insight]
if latest_insight == nil
  json.latest_insight nil
else
  json.latest_insight do
    json.partial! 'shared/event', event: latest_insight, user: latest_insight.actor, options: options
  end
end
