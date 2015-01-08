class ChangePhd2DataSourceHdfsVersion < ActiveRecord::Migration

  class HdfsDataSource < ActiveRecord::Base; end

  def up
    HdfsDataSource.
        where(:hdfs_version => 'Pivotal HD 2.0').
        update_all(:hdfs_version => 'Pivotal HD 2')
  end

  def down
    HdfsDataSource.
        where(:hdfs_version => 'Pivotal HD 2').
        update_all(:hdfs_version => 'Pivotal HD 2.0')
  end
end
