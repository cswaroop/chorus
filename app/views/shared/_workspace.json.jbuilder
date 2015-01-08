json.workspace do
  json.id workspace.id
  json.name workspace.name
  json.is_deleted workspace.deleted?
  # TODO: Where should I get the entity_type parameter? (Prakash 12/15/14)
  json.entity_type "workspace"
  json.summary workspace.summary
  json.archived_at workspace.archived_at
  json.permission workspace.permissions_for(user)
  json.public workspace.public
  json.datasets_count workspace.associated_datasets.size
  json.members_count workspace.members.size
  json.workfiles_count workspace.workfiles.size
  json.insights_count workspace.owned_notes.where(:insight => true).count
  json.recent_insights_count workspace.owned_notes.where(:insight => true).recent.count
  json.recent_comments_count workspace.owned_notes.recent.count
  json.has_recent_comments workspace.owned_notes.recent.count > 0
  json.has_milestones workspace.milestones_count > 0
end

