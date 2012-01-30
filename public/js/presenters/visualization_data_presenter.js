;(function(ns) {
    ns.presenters.visualizations = {};

    ns.presenters.visualizations.XY = function(task, options) {
        this.task = task;
        this.options = options;
    };

    _.extend(ns.presenters.visualizations.XY.prototype, {
        present: function() {
            var rows = this.task.get("result").rows;
            var xs = _.pluck(rows, this.options.x);
            var ys = _.pluck(rows, this.options.y);
            var data = _.map(rows, function(_row, i) {
                return { x: xs[i], y: ys[i] };
            });

            return _.extend(data, {
                maxX : _.max(xs),
                maxY : _.max(ys),
                minX : _.min(xs),
                minY : _.min(ys)
            });
        }
    });

    ns.presenters.visualizations.Frequency = function(task, options) {
        this.task = task;
        this.options = options;
    };

    _.extend(ns.presenters.visualizations.Frequency.prototype, {
        present: function() {
            var groups = _.groupBy(this.task.get("result").rows, this.options.column);
            var groupLengths = {};
            _.each(groups, function(val, groupName) {
                groupLengths[groupName] = val.length;
            });
            return { frequencies : groupLengths };
        }
    });

    ns.presenters.visualizations.Boxplot = function(task, options) {
        this.task = task;
        this.options = options;
    };

    _.extend(ns.presenters.visualizations.Boxplot.prototype, {
        present: function() {
            var y = this.options.y;

            var groups = _.groupBy(this.task.get("result").rows, this.options.x);
            return _.map(groups, function(rows, keyName){
                var values = _.pluck(rows, y);
                var min = _.min(values);
                var max = _.max(values);
                var quartiles = jStat.quartiles(values);

                return [keyName, min, quartiles[0], quartiles[2], max];
            })
        }
    });
})(chorus);
