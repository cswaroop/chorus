require 'spec_helper'

describe SqlExecutor do
  let(:check_id) { "0.1234" }

  describe "#preview_dataset" do
    context "with live data", :greenplum_integration do
      let(:account) { GreenplumIntegration.real_account }
      let(:database) { GpdbDatabase.find_by_name_and_data_source_id(GreenplumIntegration.database_name, GreenplumIntegration.real_data_source) }
      let(:table) { database.find_dataset_in_schema('pg_all_types', 'test_schema') }
      let(:user) { account.owner }

      subject { SqlExecutor.preview_dataset(table, table.schema.connect_with(account), check_id, user) }

      it "returns a SqlResult object with the correct rows" do
        row = subject.rows[0]
        row[0..-2].should == [
            "(1,2)",
            "1.2",
            "{1,2,3}",
            "1",
            "1",
            "10101",
            "101",
            "t",
            "(2,2),(1,1)",
            "xDEADBEEF",
            "var char",
            "char      ",
            "192.168.100.128/25",
            "<(1,2),3>",
            "2011-01-01",
            "10.01",
            "192.168.100.128",
            "10",
            "3 days 04:05:06",
            "[(1,1),(2,2)]",
            "08:00:2b:01:02:03",
            "$1,000.00",
            "0.02000",
            "[(1,1),(2,2),(3,3)]",
            "(0,0)",
            "((10,10),(20,20),(30,30))",
            "1.1",
            "1",
            "2",
            "text",
            "04:05:06",
            "01:02:03-08",
            "1999-01-08 04:05:06",
        ]
        Time.parse(row[-1]).should == Time.parse("1999-01-08 04:05:06-08")
      end

      it "gives each column the right 'name' attribute" do
        subject.columns.map(&:name).should == %w{
        t_composite
        t_decimal
        t_array
        t_bigint
        t_bigserial
        t_bit
        t_varbit
        t_bool
        t_box
        t_bytea
        t_varchar
        t_char
        t_cidr
        t_circle
        t_date
        t_double
        t_inet
        t_integer
        t_interval
        t_lseg
        t_macaddr
        t_money
        t_numeric
        t_path
        t_point
        t_polygon
        t_real
        t_smallint
        t_serial
        t_text
        t_time_without_time_zone
        t_time_with_time_zone
        t_timestamp_without_time_zone
        t_timestamp_with_time_zone
      }
      end

      it "gives each column the right 'data_type' attribute" do
        subject.columns.map(&:data_type).should == %w{
          complex
          numeric
          _int4
          int8
          bigserial
          bit
          varbit
          bool
          box
          bytea
          varchar
          bpchar
          cidr
          circle
          date
          float8
          inet
          int4
          interval
          lseg
          macaddr
          money
          numeric
          path
          point
          polygon
          float4
          int2
          serial
          text
          time
          timetz
          timestamp
          timestamptz
      }
      end
    end

    context "without live data" do
      it "uses the default preview row limit" do
        stub.proxy(ChorusConfig.instance).[](anything)
        stub(ChorusConfig.instance).[]('default_preview_row_limit') { 123 }
        mock(SqlExecutor).execute_sql(anything, anything, anything, anything, anything, :limit => 123)
        SqlExecutor.preview_dataset(datasets(:table), Object.new, Object.new, Object.new)
      end
    end
  end

  describe "#execute_sql", :greenplum_integration do
    let(:schema) { GpdbSchema.find_by_name!('test_schema') }
    let(:sql) { 'create table surface_warnings (id INT PRIMARY KEY); drop table surface_warnings; create table surface_warnings (id INT PRIMARY KEY); drop table surface_warnings' }
    let(:check_id) { '42' }
    let(:timeout) { nil }
    let(:account) { instance_accounts(:chorus_gpdb42_test_superuser) }
    let(:user) { account.owner }
    let(:connection) { schema.connect_with(account) }
    let(:result) { SqlExecutor.execute_sql(sql, connection, schema, check_id, user) }

    before do
      stub.proxy(ChorusConfig.instance).[].with_any_args
      stub(ChorusConfig.instance).[]('execution_timeout_in_minutes') { timeout }
    end

    after do
      admin = users(:admin)
      schema.connect_as(admin).drop_table('table_with_warning')
    end

    it "returns a SqlResult" do
      result.should be_a SqlResult
    end

    it "sets the schema on the SqlResult" do
      result.schema.should == schema
    end

    it 'includes warnings from postgres' do
      result.warnings.should_not be_empty
    end

    context 'when a limit is given' do
      it "passes the limit to CancelableQuery" do
        any_instance_of(CancelableQuery) do |query|
          mock.proxy(query).execute(sql, :limit => 42)
        end
        SqlExecutor.execute_sql(sql, connection, Object.new, check_id, user, :limit => 42)
      end
    end

    context "with a timeout set" do
      let(:timeout) { 100 }

      it "times out when the query exceeds the timeout limit" do
        fake_connection = Object.new
        fake_query = Object.new
        sql = "SELECT pg_sleep(.2);"

        mock(CancelableQuery).new(fake_connection, check_id, user) { fake_query }
        mock(fake_query).execute(sql, {:timeout => 60 * timeout}) { raise GreenplumConnection::QueryError }

        expect {
          SqlExecutor.execute_sql(sql, fake_connection, Object.new, check_id, user)
        }.to raise_error(GreenplumConnection::QueryError)
      end
    end
  end

  describe "#stream", :greenplum_integration do
    let(:schema) { GpdbSchema.find_by_name!('test_schema') }
    let(:sql) { 'SELECT 1 as "one", 2 as "two"' }
    let(:check_id) { '42' }
    let(:timeout) { nil }
    let(:account) { instance_accounts(:chorus_gpdb42_test_superuser) }
    let(:user) { account.owner }
    let(:connection) { schema.connect_with(account) }
    let(:result) { SqlExecutor.stream(sql, connection, check_id, user) }

    it "returns an enumerator containing that query result" do
      result.to_a.should == [ "one,two\n", "1,2\n" ]
    end


  end

  describe "#cancel_query" do
    it "cancels the query" do
      fake_connection = Object.new
      fake_query = Object.new
      connection_provider = Object.new
      account = Object.new
      user = Object.new

      mock(connection_provider).connect_with(account) { fake_connection }
      mock(CancelableQuery).new(fake_connection, check_id, user) { fake_query }
      mock(fake_query).cancel

      SqlExecutor.cancel_query(connection_provider, account, check_id, user)
    end
  end
end