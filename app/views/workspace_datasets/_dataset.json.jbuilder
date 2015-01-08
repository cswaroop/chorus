json.recent_comments do
  json.array! dataset.most_recent_comments do |comment|
    json.partial! 'shared/comment', comment: comment, user: comment.author
  end
end
json.comment_count dataset.most_recent_comments.size
json.id dataset.id
json.object_name dataset.name
if dataset.schema != nil
  json.partial! 'schema', schema: dataset.schema, options: options
end
json.entity_type dataset.entity_type_name