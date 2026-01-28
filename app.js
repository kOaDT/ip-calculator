const POWERS = [128, 64, 32, 16, 8, 4, 2, 1];
const OCTET_LABELS = ["1st", "2nd", "3rd", "4th"];

const octetInputs = document.querySelectorAll(".octet-input");
const binaryOutput = document.getElementById("binary-output");
const bitTableBody = document.getElementById("bit-table-body");
const stepsSection = document.getElementById("steps-section");

function isValidOctet(value) {
  if (value === "") return false;
  const num = Number(value);
  return Number.isInteger(num) && num >= 0 && num <= 255;
}

function octetToBinary(decimal) {
  const bits = [];
  const steps = [];
  let remainder = decimal;

  for (const power of POWERS) {
    const isOn = remainder >= power;
    bits.push(isOn ? 1 : 0);
    steps.push({
      value: remainder,
      power,
      bit: isOn ? 1 : 0,
      newRemainder: isOn ? remainder - power : remainder,
    });
    if (isOn) remainder -= power;
  }

  return { bits, steps };
}

function renderBinaryOutput(octets) {
  const parts = octets.map((val) => {
    if (!isValidOctet(val)) return null;
    return octetToBinary(Number(val)).bits.join("");
  });

  if (parts.every((p) => p !== null)) {
    binaryOutput.innerHTML = parts
      .map((p) => `<span class="binary-group">${p}</span>`)
      .join('<span class="binary-separator">.</span>');
  } else {
    binaryOutput.innerHTML = "";
  }
}

function renderTable(octets) {
  const rows = octets
    .map((val, i) => {
      if (!isValidOctet(val)) return buildEmptyRow(i);
      const decimal = Number(val);
      const { bits } = octetToBinary(decimal);
      return buildRow(decimal, bits, i);
    })
    .join("");

  bitTableBody.innerHTML = rows;
}

function buildEmptyRow(index) {
  const emptyCells = POWERS.map(
    () => `<td class="bit-off">–</td>`
  ).join("");

  return `<tr>
    <th class="row-label"><span class="row-label-ordinal">${OCTET_LABELS[index]}</span> <span class="row-label-value">—</span></th>
    ${emptyCells}
    <td class="row-result bit-off">—</td>
  </tr>`;
}

function buildRow(decimal, bits, index) {
  const bitCells = bits
    .map((b) => `<td class="${b ? "bit-on" : "bit-off"}">${b}</td>`)
    .join("");

  return `<tr>
    <th class="row-label"><span class="row-label-ordinal">${OCTET_LABELS[index]}</span> <span class="row-label-value">${decimal}</span></th>
    ${bitCells}
    <td class="row-result">${bits.join("")}</td>
  </tr>`;
}

function renderSteps(octets) {
  const details = octets
    .map((val, i) => {
      if (!isValidOctet(val)) return "";
      const decimal = Number(val);
      const { bits, steps } = octetToBinary(decimal);
      return buildStepsDetail(decimal, bits, steps, i);
    })
    .filter(Boolean);

  if (details.length > 0) {
    stepsSection.innerHTML =
      '<p class="steps-heading">Click to see how each octet is calculated</p>' +
      details.join("");
  } else {
    stepsSection.innerHTML = "";
  }
}

function buildStepsDetail(decimal, bits, steps, index) {
  const stepsHtml = steps
    .map((s) => {
      if (s.bit === 1) {
        return `<div class="step">
          <span class="step-value">${s.value}</span> ≥ ${s.power} → <span class="step-bit on">1</span>, remainder = ${s.value} − ${s.power} = <span class="step-value">${s.newRemainder}</span>
        </div>`;
      }
      return `<div class="step">
        <span class="step-value">${s.value}</span> &lt; ${s.power} → <span class="step-bit off">0</span>
      </div>`;
    })
    .join("");

  const chevron = `<span class="summary-chevron" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;

  return `
    <details class="octet-details">
      <summary>${OCTET_LABELS[index]} octet: <strong>${decimal}</strong> = <span class="accent">${bits.join("")}</span>${chevron}</summary>
      <div class="steps">
        ${stepsHtml}
      </div>
    </details>`;
}

function getOctetValues() {
  return Array.from(octetInputs).map((input) => input.value.trim());
}

function update() {
  const values = getOctetValues();

  octetInputs.forEach((input) => {
    const val = input.value.trim();
    input.classList.toggle("invalid", val !== "" && !isValidOctet(val));
  });

  renderBinaryOutput(values);
  renderTable(values);
  renderSteps(values);
}

function handleInput(e) {
  const input = e.target;
  input.value = input.value.replace(/[^0-9]/g, "");

  if (input.value.length === 3 && isValidOctet(input.value)) {
    const nextIndex = Number(input.dataset.index) + 1;
    if (nextIndex < 4) {
      octetInputs[nextIndex].focus();
      octetInputs[nextIndex].select();
    }
  }

  update();
}

function handleKeydown(e) {
  const input = e.target;
  const index = Number(input.dataset.index);

  if (e.key === "." || (e.key === "Tab" && !e.shiftKey)) {
    const nextIndex = index + 1;
    if (nextIndex < 4) {
      e.preventDefault();
      octetInputs[nextIndex].focus();
      octetInputs[nextIndex].select();
    }
  }

  if (e.key === "Tab" && e.shiftKey && index > 0) {
    e.preventDefault();
    octetInputs[index - 1].focus();
    octetInputs[index - 1].select();
  }

  if (e.key === "Backspace" && input.value === "" && index > 0) {
    octetInputs[index - 1].focus();
  }
}

function handlePaste(e) {
  const pasted = (e.clipboardData || window.clipboardData).getData("text").trim();
  const parts = pasted.split(".");

  if (parts.length === 4) {
    e.preventDefault();
    parts.forEach((part, i) => {
      octetInputs[i].value = part.replace(/[^0-9]/g, "").slice(0, 3);
    });
    octetInputs[3].focus();
    update();
  }
}

octetInputs.forEach((input) => {
  input.addEventListener("input", handleInput);
  input.addEventListener("keydown", handleKeydown);
  input.addEventListener("paste", handlePaste);
});

update();
octetInputs[0].focus();
