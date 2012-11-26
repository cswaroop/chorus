module PackageMaker
  PATHS_TO_PACKAGE = %w{
    bin/
    app/
    config/*
    db/
    doc/
    lib/
    packaging/
    public/
    script/
    solr/conf/
    vendor/
    WEB-INF/
    Gemfile
    Gemfile.lock
    README.md
    Rakefile
    config.ru
    version.rb
    version_build
    .bundle/
  }

  PATHS_TO_EXCLUDE = %w{
    config/secret.key
    config/test.crt
    config/test.key
  }

  extend self

  def make_installer
    rails_root = File.expand_path(File.dirname(__FILE__) + '/../')
    install_root = rails_root + '/tmp/installer/'
    installation_path = install_root + 'chorus_installation'

    FileUtils.rm_rf(install_root)
    FileUtils.mkdir_p(installation_path)

    PATHS_TO_PACKAGE.each do |path|
      source_path = File.join(rails_root, path)
      destination_directory = File.dirname(File.join(installation_path, path))

      FileUtils.mkdir_p(destination_directory)

      if path.match /\*/
        FileUtils.ln_s Dir.glob(source_path), destination_directory
      else
        FileUtils.ln_s source_path, File.join(installation_path, path)
      end
    end

    PATHS_TO_EXCLUDE.each do |path|
      FileUtils.rm(File.join(installation_path, path))
    end

    FileUtils.ln_s File.join(rails_root, 'packaging/install.rb'), install_root

    system("GZIP='--fast' #{rails_root}/packaging/makeself/makeself.sh --follow --nox11 --nowait #{install_root} greenplum-chorus-#{version_name}.sh 'Chorus #{Chorus::VERSION::STRING} installer' ./chorus_installation/bin/ruby ../install.rb") || exit(1)
  end

  def clean_workspace
    run "rm -r .bundle"
  end

  def head_sha
    `git rev-parse HEAD`.strip[0..8]
  end

  def write_version
    File.open('version_build', 'w') do |f|
      f.puts version_name
    end
  end

  def run(cmd)
    puts cmd
    puts %x{#{cmd}}
    $? == 0
  end

  def relative(path)
    current = Pathname.new(Dir.pwd)
    Pathname.new(path).relative_path_from(current).to_s
  end

  def version_name
    "#{Chorus::VERSION::STRING}-#{head_sha}"
  end
end
