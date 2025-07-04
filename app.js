
document.addEventListener('DOMContentLoaded', () => {
  const themeBtn = document.getElementById('toggle-theme');
  const body = document.body;

  const account = document.getElementById('account');
  const riskPercent = document.getElementById('riskPercent');
  const manualStop = document.getElementById('manualStop');
  const rrr = document.getElementById('rrr');
  const calculateBtn = document.getElementById('calculate');
  const resultsDiv = document.getElementById('results');
  const historyTable = document.getElementById('tradeHistory').querySelector('tbody');
  const clearBtn = document.getElementById('clearHistory');

  let equityChart, pnlChart, drawdownChart;

  themeBtn.addEventListener('click', () => {
    const current = body.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  const savedTheme = localStorage.getItem('theme') || 'dark';
  body.setAttribute('data-theme', savedTheme);

  calculateBtn.addEventListener('click', () => {
    const acc = parseFloat(account.value);
    const risk = parseFloat(riskPercent.value);
    const stopPct = parseFloat(manualStop.value);
    const ratio = parseFloat(rrr.value);

    if (!acc || !risk || !stopPct) {
      resultsDiv.innerHTML = "<p>Please fill in all required fields.</p>";
      return;
    }

    const riskDollar = acc * (risk / 100);
    const stopDecimal = stopPct / 100;
    const posSize = riskDollar / stopDecimal;
    const posValue = posSize;
    const target = ratio ? riskDollar * ratio : null;

    resultsDiv.innerHTML = `
      <p><strong>Risk ($):</strong> $${riskDollar.toFixed(2)}</p>
      <p><strong>Stop Loss:</strong> ${stopPct.toFixed(2)}%</p>
      <p><strong>Position Size:</strong> ${posSize.toFixed(2)} units</p>
      <p><strong>Position Value:</strong> $${posValue.toFixed(2)}</p>
      ${target ? `<p><strong>Take Profit Target:</strong> $${target.toFixed(2)}</p>` : ''}
      <button id="logTrade">Log Trade</button>
    `;

    document.getElementById('logTrade').addEventListener('click', () => {
      const pl = prompt("Enter profit or loss ($):", "0");
      if (pl === null) return;
      const trade = {
        date: new Date().toLocaleString(),
        risk: riskDollar.toFixed(2),
        size: posValue.toFixed(2),
        result: parseFloat(pl).toFixed(2)
      };
      const history = JSON.parse(localStorage.getItem("jorank_history") || "[]");
      history.unshift(trade);
      localStorage.setItem("jorank_history", JSON.stringify(history));
      updateHistory();
    });
  });

  clearBtn.addEventListener('click', () => {
    if (confirm("Clear all trade history?")) {
      localStorage.removeItem("jorank_history");
      updateHistory();
    }
  });

  function updateHistory() {
    const history = JSON.parse(localStorage.getItem("jorank_history") || "[]");
    historyTable.innerHTML = "";
    history.forEach((t, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${t.date}</td>
        <td>$${t.risk}</td>
        <td>$${t.size}</td>
        <td>$${t.result}</td>
        <td><button onclick="deleteTrade(${i})">🗑️</button></td>
      `;
      historyTable.appendChild(row);
    });
    updateCharts(history);
  }

  window.deleteTrade = (index) => {
    const history = JSON.parse(localStorage.getItem("jorank_history") || "[]");
    history.splice(index, 1);
    localStorage.setItem("jorank_history", JSON.stringify(history));
    updateHistory();
  };

  function updateCharts(data) {
    const labels = data.map(d => d.date).reverse();
    const pnl = data.map(d => parseFloat(d.result)).reverse();
    const equity = [];
    let sum = 0;
    pnl.forEach(p => {
      sum += p;
      equity.push(sum);
    });

    const peak = [...equity];
    for (let i = 1; i < peak.length; i++) {
      peak[i] = Math.max(peak[i], peak[i - 1]);
    }
    const drawdown = equity.map((val, i) => ((val - peak[i]) / peak[i]) * 100);

    if (equityChart) equityChart.destroy();
    if (pnlChart) pnlChart.destroy();
    if (drawdownChart) drawdownChart.destroy();

    const ctx1 = document.getElementById('equityCurveChart').getContext('2d');
    equityChart = new Chart(ctx1, {
      type: 'line',
      data: {
        labels, datasets: [{ label: "Equity Curve", data: equity, borderColor: "#00c853", fill: false }]
      }
    });

    const ctx2 = document.getElementById('pnlChart').getContext('2d');
    pnlChart = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels, datasets: [{ label: "P&L", data: pnl, backgroundColor: "#2962ff" }]
      }
    });

    const ctx3 = document.getElementById('drawdownChart').getContext('2d');
    drawdownChart = new Chart(ctx3, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: "Drawdown (%)",
          data: drawdown,
          borderColor: "#d50000",
          fill: false
        }]
      }
    });
  }

  updateHistory();
});
