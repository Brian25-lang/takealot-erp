/**
 * Charts module - Google Charts wrapper / Plotly compatibility shim
 * This shim translates Plotly-style calls to Google Charts for GitHub Pages deployment
 */

// Ensure google.charts is loaded before drawing
function ensureChartsLoaded(callback) {
  if (typeof google !== 'undefined' && google.charts) {
    callback();
  } else {
    setTimeout(function() { ensureChartsLoaded(callback); }, 50);
  }
}

/**
 * Plotly-to-Google-Charts shim for CSP compatibility
 */
var Plotly = (function() {
  function getContainer(el) {
    return typeof el === 'string' ? document.getElementById(el) : el;
  }

  function drawChart(container, data, layout, config) {
    if (!container) return;
    container.innerHTML = '';
    if (!data || !data.length) return;
    var trace = data[0];
    var type = trace.type || 'bar';
    var isDark = document.documentElement.classList.contains('dark');
    var bgColor = isDark ? '#1a2744' : 'transparent';
    var textColor = isDark ? '#e2e8f0' : '#424751';

    ensureChartsLoaded(function() {
      try {
        if (type === 'pie') {
          var rows = (trace.values || []).map(function(v, i) { return [trace.labels[i], v]; });
          var dt = new google.visualization.DataTable();
          dt.addColumn('string', 'Label');
          dt.addColumn('number', 'Value');
          dt.addRows(rows);
          var options = {
            backgroundColor: bgColor,
            legend: { textStyle: { color: textColor } },
            pieHole: trace.hole || 0,
            chartArea: { width: '90%', height: '80%' },
            tooltip: { textStyle: { color: '#333' } },
            colors: (trace.marker && trace.marker.colors) ? trace.marker.colors : undefined
          };
          var chart = new google.visualization.PieChart(container);
          chart.draw(dt, options);
        } else if (type === 'scatter') {
          var x = trace.x || [], y = trace.y || [];
          var dt = new google.visualization.DataTable();
          dt.addColumn('string', 'X');
          dt.addColumn('number', 'Y');
          for (var i = 0; i < x.length; i++) dt.addRow([String(x[i]), y[i] || 0]);
          var options = {
            backgroundColor: bgColor,
            legend: { position: 'none' },
            colors: [(trace.line && trace.line.color) || (trace.marker && trace.marker.color) || '#0b4d8c'],
            lineWidth: (trace.line && trace.line.width) || 2,
            pointSize: (trace.marker && trace.marker.size) || 5,
            chartArea: { width: '80%', height: '80%' },
            hAxis: { textStyle: { color: textColor }, gridlines: { color: isDark ? '#2d3f5c' : '#f1f5f9' } },
            vAxis: { textStyle: { color: textColor }, gridlines: { color: isDark ? '#2d3f5c' : '#f1f5f9' } },
            areaOpacity: trace.fill ? 0.1 : 0
          };
          var chart = trace.fill
            ? new google.visualization.AreaChart(container)
            : new google.visualization.LineChart(container);
          chart.draw(dt, options);
        } else {
          var isHorizontal = trace.orientation === 'h';
          var isMultiTrace = data.length > 1;
          var isStacked = layout && layout.barmode === 'stack';

          if (isMultiTrace) {
            var allX = (data[0].x || data[0].y || []).map(String);
            var dt = new google.visualization.DataTable();
            dt.addColumn('string', 'Category');
            data.forEach(function(t) { dt.addColumn('number', t.name || ''); });
            allX.forEach(function(xv, xi) {
              var row = [xv];
              data.forEach(function(t) { row.push((t.y || t.x || [])[xi] || 0); });
              dt.addRow(row);
            });
            var colors = data.map(function(t) { return (t.marker && t.marker.color) || '#0b4d8c'; });
            var options = {
              backgroundColor: bgColor,
              isStacked: isStacked,
              colors: colors,
              legend: { textStyle: { color: textColor } },
              chartArea: { width: '75%', height: '75%' },
              hAxis: { textStyle: { color: textColor }, gridlines: { color: isDark ? '#2d3f5c' : '#f1f5f9' } },
              vAxis: { textStyle: { color: textColor }, gridlines: { color: isDark ? '#2d3f5c' : '#f1f5f9' } }
            };
            var chart = new google.visualization.ColumnChart(container);
            chart.draw(dt, options);
          } else {
            var cats = isHorizontal ? (trace.y || []) : (trace.x || []);
            var vals = isHorizontal ? (trace.x || []) : (trace.y || []);
            var colors = Array.isArray(trace.marker && trace.marker.color)
              ? trace.marker.color
              : cats.map(function() { return (trace.marker && trace.marker.color) || '#0b4d8c'; });
            var dt = new google.visualization.DataTable();
            dt.addColumn('string', 'Category');
            dt.addColumn('number', 'Value');
            dt.addColumn({ type: 'string', role: 'style' });
            cats.forEach(function(c, i) { dt.addRow([String(c), vals[i] || 0, 'color:' + colors[i % colors.length]]); });
            var options = {
              backgroundColor: bgColor,
              legend: { position: 'none' },
              chartArea: { width: isHorizontal ? '60%' : '80%', height: '80%' },
              hAxis: { textStyle: { color: textColor }, gridlines: { color: isDark ? '#2d3f5c' : '#f1f5f9' } },
              vAxis: { textStyle: { color: textColor }, gridlines: { color: isDark ? '#2d3f5c' : '#f1f5f9' } }
            };
            var chart = isHorizontal
              ? new google.visualization.BarChart(container)
              : new google.visualization.ColumnChart(container);
            chart.draw(dt, options);
          }
        }
      } catch (e) {
        container.innerHTML = '<div style="padding:20px;color:#999;text-align:center;font-size:12px;">Chart error: ' + e.message + '</div>';
      }
    });
  }

  return {
    newPlot: function(el, data, layout, config) { drawChart(getContainer(el), data, layout, config); },
    react: function(el, data, layout, config) { drawChart(getContainer(el), data, layout, config); },
    purge: function(el) { var c = getContainer(el); if (c) c.innerHTML = ''; }
  };
})();

// Export for use in other modules
export { Plotly };
