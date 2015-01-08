class JobSubscription < ActiveRecord::Base
  attr_accessible :user, :condition

  belongs_to :user, :touch => true
  belongs_to :job, :touch => true
end