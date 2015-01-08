json.response do
  json.array! @datasets do |dataset|
    json.cache! [current_user.id, dataset], expires_in: 5.seconds do
      partial = dataset.class.name.underscore
      json.partial! partial, dataset: dataset, options: @options
    end
  end
end