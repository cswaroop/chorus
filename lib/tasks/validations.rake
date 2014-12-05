require_relative '../task_helpers/validators/existing_data_sources_validator'
require_relative '../task_helpers/validators/used_ports_validator'

namespace :validations do
  desc 'Check Data Sources'
  task :data_source => :environment do
    legacy_gpdb_instance = Class.new(ActiveRecord::Base) do
      table_name = 'gpdb_instances'
    end

    data_valid = ExistingDataSourcesValidator.run([
      legacy_gpdb_instance,
      DataSource,
      HdfsDataSource,
      GnipDataSource
    ])

    exit(1) unless data_valid
  end

  desc 'Check Used Network Ports'
  task :check_ports do
    required_ports = [3000, 5432, 8080]
    ports_valid = UsedPortsValidator.run(required_ports)

    exit(1) unless ports_valid
  end
end
