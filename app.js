const currencyOptions = {
  INR: { locale: "en-IN", symbol: "₹" },
  USD: { locale: "en-US", symbol: "$" },
  EUR: { locale: "de-DE", symbol: "€" },
  GBP: { locale: "en-GB", symbol: "£" },
  JPY: { locale: "ja-JP", symbol: "¥" },
  AUD: { locale: "en-AU", symbol: "A$" },
  CAD: { locale: "en-CA", symbol: "C$" },
  SGD: { locale: "en-SG", symbol: "S$" },
};

const state = {
  activeTool: "sip",
  currency: "INR",
};

const elements = {
  wallpaper: document.querySelector("#live-wallpaper"),
  currencySelect: document.querySelector("#currency-select"),
  currencySymbol: document.querySelector("#currency-symbol"),
  tabs: [...document.querySelectorAll(".tab-button")],
  panels: [...document.querySelectorAll(".tool-panel")],
  primaryLabel: document.querySelector("#primary-label"),
  primaryValue: document.querySelector("#primary-value"),
  secondaryCopy: document.querySelector("#secondary-copy"),
  metricALabel: document.querySelector("#metric-a-label"),
  metricA: document.querySelector("#metric-a"),
  metricBLabel: document.querySelector("#metric-b-label"),
  metricB: document.querySelector("#metric-b"),
  metricCLabel: document.querySelector("#metric-c-label"),
  metricC: document.querySelector("#metric-c"),
  chart: document.querySelector("#result-chart"),
};

function formatCurrency(value) {
  const option = currencyOptions[state.currency] || currencyOptions.INR;

  return new Intl.NumberFormat(option.locale, {
    style: "currency",
    currency: state.currency,
    maximumFractionDigits: 0,
  }).format(value);
}

const wallpaperState = {
  particles: [],
  width: 0,
  height: 0,
  animationId: null,
};

const fields = {
  sipAmount: document.querySelector("#sip-amount"),
  sipReturn: document.querySelector("#sip-return"),
  sipYears: document.querySelector("#sip-years"),
  stepupAmount: document.querySelector("#stepup-amount"),
  stepupRate: document.querySelector("#stepup-rate"),
  stepupReturn: document.querySelector("#stepup-return"),
  stepupYears: document.querySelector("#stepup-years"),
  emiPrincipal: document.querySelector("#emi-principal"),
  emiRate: document.querySelector("#emi-rate"),
  emiYears: document.querySelector("#emi-years"),
};

function valueOf(input) {
  return Number(input.value) || 0;
}

function monthlyRate(annualRate) {
  return annualRate / 100 / 12;
}

function normalSip(amount, annualReturn, years) {
  const months = Math.max(1, Math.round(years * 12));
  const invested = amount * months;
  const series = buildSipSeries(amount, annualReturn, years);
  const maturity = series.length ? series[series.length - 1].value : invested;

  return {
    invested,
    maturity,
    gain: maturity - invested,
    years,
    series,
  };
}

function stepUpSip(amount, stepUpRate, annualReturn, years) {
  const months = Math.max(1, Math.round(years * 12));
  const rate = monthlyRate(annualReturn);
  let maturity = 0;
  let invested = 0;
  const series = [];

  for (let month = 1; month <= months; month += 1) {
    const currentYear = Math.floor((month - 1) / 12);
    const monthlyAmount = amount * (1 + stepUpRate / 100) ** currentYear;
    invested += monthlyAmount;
    maturity = (maturity + monthlyAmount) * (1 + rate);

    if (month % 12 === 0) {
      series.push({
        label: `Y${month / 12}`,
        invested,
        value: maturity,
      });
    }
  }

  return {
    invested,
    maturity,
    gain: maturity - invested,
    years,
    series,
  };
}

function emi(principal, annualRate, years) {
  const months = Math.max(1, Math.round(years * 12));
  const rate = monthlyRate(annualRate);
  const monthlyPayment =
    rate === 0
      ? principal / months
      : (principal * rate * (1 + rate) ** months) / ((1 + rate) ** months - 1);
  const totalPayment = monthlyPayment * months;
  const interest = totalPayment - principal;

  return {
    principal,
    monthlyPayment,
    totalPayment,
    interest,
    years,
    series: buildEmiSeries(principal, monthlyPayment, rate, months),
  };
}

function buildSipSeries(amount, annualReturn, years) {
  const months = Math.max(1, Math.round(years * 12));
  const rate = monthlyRate(annualReturn);
  let value = 0;
  let invested = 0;
  const series = [];

  for (let month = 1; month <= months; month += 1) {
    invested += amount;
    value = (value + amount) * (1 + rate);

    if (month % 12 === 0) {
      series.push({
        label: `Y${month / 12}`,
        invested,
        value,
      });
    }
  }

  return series;
}

function buildEmiSeries(principal, monthlyPayment, rate, months) {
  let balance = principal;
  const series = [];

  for (let month = 1; month <= months; month += 1) {
    const interest = balance * rate;
    const principalPaid = monthlyPayment - interest;
    balance = Math.max(0, balance - principalPaid);

    if (month % 12 === 0 || month === months) {
      series.push({
        label: `Y${Math.ceil(month / 12)}`,
        invested: principal - balance,
        value: balance,
      });
    }
  }

  return series;
}

function setTool(tool) {
  state.activeTool = tool;

  elements.tabs.forEach((button) => {
    const active = button.dataset.tool === tool;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  elements.panels.forEach((panel) => {
    panel.classList.toggle("is-hidden", panel.dataset.panel !== tool);
  });

  calculate();
}

function calculate() {
  if (state.activeTool === "sip") {
    const result = normalSip(
      valueOf(fields.sipAmount),
      valueOf(fields.sipReturn),
      valueOf(fields.sipYears),
    );

    renderInvestmentResult(result, "Estimated maturity value");
    return;
  }

  if (state.activeTool === "stepup") {
    const result = stepUpSip(
      valueOf(fields.stepupAmount),
      valueOf(fields.stepupRate),
      valueOf(fields.stepupReturn),
      valueOf(fields.stepupYears),
    );

    renderInvestmentResult(result, "Step-up maturity value");
    return;
  }

  const result = emi(
    valueOf(fields.emiPrincipal),
    valueOf(fields.emiRate),
    valueOf(fields.emiYears),
  );

  elements.primaryLabel.textContent = "Monthly EMI";
  elements.primaryValue.textContent = formatCurrency(result.monthlyPayment);
  elements.secondaryCopy.textContent = `${formatCurrency(result.totalPayment)} total payment over ${result.years} years.`;
  elements.metricALabel.textContent = "Principal";
  elements.metricA.textContent = formatCurrency(result.principal);
  elements.metricBLabel.textContent = "Total interest";
  elements.metricB.textContent = formatCurrency(result.interest);
  elements.metricCLabel.textContent = "Loan tenure";
  elements.metricC.textContent = `${result.years} years`;
  drawChart(result.series, "Principal paid", "Balance", true);
}

function renderInvestmentResult(result, label) {
  elements.primaryLabel.textContent = label;
  elements.primaryValue.textContent = formatCurrency(result.maturity);
  elements.secondaryCopy.textContent = `${formatCurrency(result.gain)} estimated wealth gain over ${result.years} years.`;
  elements.metricALabel.textContent = "Invested amount";
  elements.metricA.textContent = formatCurrency(result.invested);
  elements.metricBLabel.textContent = "Estimated returns";
  elements.metricB.textContent = formatCurrency(result.gain);
  elements.metricCLabel.textContent = "Duration";
  elements.metricC.textContent = `${result.years} years`;
  drawChart(result.series, "Invested", "Value", false);
}

function drawChart(series, firstLabel, secondLabel, invertSecond) {
  const canvas = elements.chart;
  const context = canvas.getContext("2d");
  const pixelRatio = window.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(width * pixelRatio));
  canvas.height = Math.max(1, Math.floor(height * pixelRatio));
  context.scale(pixelRatio, pixelRatio);
  context.clearRect(0, 0, width, height);

  const padding = { top: 26, right: 22, bottom: 42, left: 42 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...series.flatMap((point) => [point.invested, point.value]), 1);
  const barGap = 8;
  const groupWidth = chartWidth / Math.max(series.length, 1);
  const barWidth = Math.max(4, Math.min(18, (groupWidth - barGap) / 2));

  context.strokeStyle = "#dce4df";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(padding.left, padding.top);
  context.lineTo(padding.left, padding.top + chartHeight);
  context.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  context.stroke();

  series.forEach((point, index) => {
    const groupX = padding.left + index * groupWidth + groupWidth / 2;
    const firstHeight = (point.invested / maxValue) * chartHeight;
    const secondHeight = (point.value / maxValue) * chartHeight;
    const baseline = padding.top + chartHeight;

    context.fillStyle = "#0d766e";
    context.fillRect(groupX - barWidth - 2, baseline - firstHeight, barWidth, firstHeight);
    context.fillStyle = invertSecond ? "#b94b4b" : "#d9911f";
    context.fillRect(groupX + 2, baseline - secondHeight, barWidth, secondHeight);

    if (series.length <= 20 || index % 2 === 0) {
      context.fillStyle = "#65706c";
      context.font = "11px Inter, sans-serif";
      context.textAlign = "center";
      context.fillText(point.label, groupX, height - 16);
    }
  });

  context.textAlign = "left";
  context.font = "12px Inter, sans-serif";
  context.fillStyle = "#0d766e";
  context.fillText(firstLabel, padding.left, 16);
  context.fillStyle = invertSecond ? "#b94b4b" : "#d9911f";
  context.fillText(secondLabel, padding.left + 110, 16);
}

elements.tabs.forEach((button) => {
  button.addEventListener("click", () => setTool(button.dataset.tool));
});

Object.values(fields).forEach((input) => {
  input.addEventListener("input", calculate);
});

elements.currencySelect.addEventListener("change", () => {
  state.currency = elements.currencySelect.value;
  elements.currencySymbol.textContent =
    (currencyOptions[state.currency] || currencyOptions.INR).symbol;
  calculate();
});

window.addEventListener("resize", calculate);
setupWallpaper();
calculate();

function setupWallpaper() {
  const canvas = elements.wallpaper;
  const context = canvas.getContext("2d");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function resizeWallpaper() {
    const pixelRatio = window.devicePixelRatio || 1;
    wallpaperState.width = window.innerWidth;
    wallpaperState.height = window.innerHeight;
    canvas.width = Math.floor(wallpaperState.width * pixelRatio);
    canvas.height = Math.floor(wallpaperState.height * pixelRatio);
    canvas.style.width = `${wallpaperState.width}px`;
    canvas.style.height = `${wallpaperState.height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const particleCount = Math.max(34, Math.floor(wallpaperState.width / 28));
    wallpaperState.particles = Array.from({ length: particleCount }, (_, index) => ({
      x: Math.random() * wallpaperState.width,
      y: Math.random() * wallpaperState.height,
      size: 1.4 + Math.random() * 2.8,
      speed: 0.18 + Math.random() * 0.52,
      phase: Math.random() * Math.PI * 2,
      tone: index % 4 === 0 ? "gold" : "teal",
    }));
  }

  function drawWallpaper(time = 0) {
    const { width, height, particles } = wallpaperState;
    context.clearRect(0, 0, width, height);

    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#edf7f3");
    gradient.addColorStop(0.5, "#fbfcf8");
    gradient.addColorStop(1, "#edf2f7");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    drawWave(context, width, height, time, "#0d766e", 0.13, 0.34);
    drawWave(context, width, height, time + 1800, "#d9911f", 0.11, 0.58);
    drawGrid(context, width, height, time);

    particles.forEach((particle) => {
      particle.y -= particle.speed;
      particle.x += Math.sin(time / 1200 + particle.phase) * 0.28;

      if (particle.y < -12) {
        particle.y = height + 12;
        particle.x = Math.random() * width;
      }

      context.beginPath();
      context.fillStyle =
        particle.tone === "gold" ? "rgba(217, 145, 31, 0.32)" : "rgba(13, 118, 110, 0.22)";
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    });

    if (!motionQuery.matches) {
      wallpaperState.animationId = requestAnimationFrame(drawWallpaper);
    }
  }

  resizeWallpaper();
  drawWallpaper();
  window.addEventListener("resize", () => {
    resizeWallpaper();
    calculate();
  });

  motionQuery.addEventListener("change", () => {
    if (wallpaperState.animationId) {
      cancelAnimationFrame(wallpaperState.animationId);
    }
    drawWallpaper();
  });
}

function drawWave(context, width, height, time, color, alpha, verticalPosition) {
  const yBase = height * verticalPosition;
  const amplitude = Math.max(22, height * 0.045);
  const speed = time / 1400;

  context.beginPath();
  context.moveTo(0, yBase);

  for (let x = 0; x <= width; x += 18) {
    const y =
      yBase +
      Math.sin(x / 120 + speed) * amplitude +
      Math.cos(x / 260 - speed * 0.8) * amplitude * 0.55;
    context.lineTo(x, y);
  }

  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  context.fillStyle = hexToRgba(color, alpha);
  context.fill();
}

function drawGrid(context, width, height, time) {
  const gap = 72;
  const drift = (time / 70) % gap;
  context.strokeStyle = "rgba(23, 33, 31, 0.045)";
  context.lineWidth = 1;

  for (let x = -gap + drift; x < width + gap; x += gap) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + height * 0.28, height);
    context.stroke();
  }

  for (let y = -gap + drift; y < height + gap; y += gap) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y + width * 0.1);
    context.stroke();
  }
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
