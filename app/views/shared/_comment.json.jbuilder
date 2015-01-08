json.id comment.id
json.partial! 'shared/user', user: user, title: 'author'
# TODO : The old code is sanitizing the comment.body. Need to figure out if we need to do it here. (Prakash 12/15/14)
json.body comment.body
json.action 'SUB_COMMENT'
json.timestamp comment.created_at
json.entity_type comment.entity_type_name
