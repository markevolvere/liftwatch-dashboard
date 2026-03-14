// Chart.js Helpers for LiftWatch Portal

// Common chart options
const commonOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: true,
      labels: {
        font: { family: 'system-ui, -apple-system, sans-serif', size: 12 },
        color: '#6b7280',
        usePointStyle: true,
        padding: 15
      }
    },
    tooltip: {
      backgroundColor: '#1a1a2e',
      padding: 10,
      titleFont: { size: 12 },
      bodyFont: { size: 11 },
      displayColors: true,
      borderColor: '#e2e5ea',
      borderWidth: 1
    }
  },
  scales: {
    x: {
      grid: { color: '#e2e5ea', drawBorder: false },
      ticks: { font: { size: 11 }, color: '#6b7280' }
    },
    y: {
      grid: { color: '#e2e5ea', drawBorder: false },
      ticks: { font: { size: 11 }, color: '#6b7280' }
    }
  }
};

// Line chart for timeline
function createTimelineChart(canvasId, timelineData) {
  const labels = timelineData.map(d => d[0]);
  const values = timelineData.map(d => d[1]);

  new Chart(document.getElementById(canvasId), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Jobs Posted',
        data: values,
        borderColor: '#2d4a8a',
        backgroundColor: 'rgba(45, 74, 138, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#2d4a8a',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4
      }]
    },
    options: {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        filler: { propagate: true }
      }
    }
  });
}

// Bar chart for top companies
function createCompanyChart(canvasId, companyData, maxItems = 10) {
  const data = companyData.slice(0, maxItems);
  const labels = data.map(d => d[0]);
  const values = data.map(d => d[1]);

  new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Jobs',
        data: values,
        backgroundColor: '#2d4a8a',
        borderColor: '#1f3557',
        borderWidth: 0
      }]
    },
    options: {
      ...commonOptions,
      indexAxis: 'y',
      scales: {
        x: {
          ...commonOptions.scales.x,
          beginAtZero: true,
          ticks: { stepSize: 1 }
        },
        y: commonOptions.scales.y
      }
    }
  });
}

// Bar chart for categories
function createCategoryChart(canvasId, categoryData) {
  const labels = categoryData.map(d => d[0]);
  const values = categoryData.map(d => d[1]);

  new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Jobs',
        data: values,
        backgroundColor: '#2d4a8a',
        borderColor: '#1f3557',
        borderWidth: 0
      }]
    },
    options: {
      ...commonOptions,
      scales: {
        y: {
          ...commonOptions.scales.y,
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}

// Bar chart for states
function createStateChart(canvasId, stateData) {
  const labels = stateData.map(d => d[0]);
  const values = stateData.map(d => d[1]);

  new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Jobs',
        data: values,
        backgroundColor: '#2d4a8a',
        borderColor: '#1f3557',
        borderWidth: 0
      }]
    },
    options: {
      ...commonOptions,
      scales: {
        y: {
          ...commonOptions.scales.y,
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}

// Doughnut chart for categories
function createCategoryDoughnut(canvasId, categoryData, maxItems = 8) {
  const data = categoryData.slice(0, maxItems);
  const labels = data.map(d => d[0]);
  const values = data.map(d => d[1]);
  
  const colors = [
    '#2d4a8a', '#3a5fa6', '#4774c2', '#5489de', '#6b9ef4',
    '#86b5ff', '#a2c8ff', '#bdd9ff'
  ];

  new Chart(document.getElementById(canvasId), {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        legend: {
          ...commonOptions.plugins.legend,
          position: 'right'
        }
      }
    }
  });
}

// Sparkline (small inline chart)
function createSparkline(canvasId, data) {
  const values = data.map(d => d[1]);
  const labels = data.map((_, i) => i);

  new Chart(document.getElementById(canvasId), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        borderColor: '#2d4a8a',
        backgroundColor: 'transparent',
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  });
}
