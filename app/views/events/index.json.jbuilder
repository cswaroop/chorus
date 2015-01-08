
json.response do
    json.array! @events do |event|
      json.cache! [current_user.id, event], expires_in: 6.months do
        json.id event.id
        json.partial! 'shared/user', user: event.actor, title: 'actor'
        case event.action
          when "NoteOnWorkspace"
            json.action 'NOTE'
          else
            json.action event.action
        end
        json.timestamp event.updated_at
        if event.action == "DataSourceCreated"
          json.data_souce do
            json.partial! 'shared/data_source'
          end
        end
        if event.workspace != nil
          json.partial! 'shared/workspace', workspace: event.workspace
        end
        if event.additional_data && event.additional_data["body"]
          json.body event.additional_data["body"]
        else
          json.body nil
        end
        json.action_type event.action
        json.attachments nil
        json.comments do
          json.array! event.comments do |comment|
            json.partial! 'shared/comment', comment: comment, user: comment.author
          end
        end
        json.is_insight event.insight
        json.partial! 'shared/user', user: event.actor, title: 'promoted_by'
        json.promoted_by event.promoted_by_id
        json.promotion_time event.promotion_time
        json.is_published event.published
        json.complete_json true
      end
    end
end
