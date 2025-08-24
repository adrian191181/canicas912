const state = {
  odd: null,
  oddType: null,
  left: [],
  right: [],
  weighs: 0,
  finished: false,
  selected: null,
  touchDragging: null, // para soporte táctil
};

const el = {
  beam: document.getElementById("beam"),
  leftPan: document.getElementById("leftPan"),
  rightPan: document.getElementById("rightPan"),
  tray: document.getElementById("tray"),
  coinsList: document.getElementById("coinsList"),
  log: document.getElementById("log"),
  history: document.getElementById("history"),
  final: document.getElementById("final"),
  weighBtn: document.getElementById("weighBtn"),
  guessBtn: document.getElementById("guessBtn"),
  resetBtn: document.getElementById("resetBtn"),
  weighCount: document.getElementById("weighCount"),
  scale: document.querySelector(".scale"),
};

const ALL = Array.from({ length: 12 }, (_, i) => i + 1);

function init() {
  state.odd = Math.floor(Math.random() * 12) + 1;
  state.oddType = Math.random() < 0.5 ? "heavy" : "light";
  state.left = [];
  state.right = [];
  state.weighs = 0;
  state.finished = false;
  state.selected = null;
  state.touchDragging = null;
  el.log.innerHTML = "";
  el.history.innerHTML = "";
  el.final.innerHTML = "";
  renderCoins();
  renderPans();
  tilt("eq");
  updateCount();
  log(
    `Juego iniciado. Hay una canica distinta (pesada o ligera). Tienes 3 intentos.`
  );
}

function renderCoins() {
  el.coinsList.innerHTML = "";
  ALL.forEach((n) => {
    const s = document.createElement("span");
    s.textContent = n;
    s.className = "chip";
    s.setAttribute("draggable", "true");
    if (state.selected === n) s.classList.add("selected");

    // Click tradicional para seleccionar
    s.onclick = () => selectCoin(n);

    // Drag start (ratón)
    s.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", n);
      // opcional: mostrar ghost
    });

    // Soporte táctil: inicia "arrastre" táctil
    s.addEventListener(
      "touchstart",
      (e) => {
        state.touchDragging = n;
      },
      { passive: true }
    );

    el.coinsList.appendChild(s);
  });
}

function selectCoin(n) {
  if (state.finished) return;
  if (state.selected === n) {
    state.selected = null;
  } else {
    state.selected = n;
  }
  renderCoins();
}

function renderPans() {
  const fill = (container, arr, side) => {
    container.innerHTML = "";
    arr.forEach((n) => {
      const s = document.createElement("span");
      s.textContent = n;
      s.className = "chip selected";
      s.setAttribute("draggable", "true");

      // permitir quitar con click (comportamiento anterior)
      s.onclick = () => {
        state[side] = state[side].filter((x) => x !== n);
        renderPans();
        renderCoins();
      };

      // dragstart desde las bandejas
      s.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", n);
      });

      // touchstart para arrastrar desde bandeja
      s.addEventListener(
        "touchstart",
        (e) => {
          state.touchDragging = n;
        },
        { passive: true }
      );

      container.appendChild(s);
    });
  };
  fill(el.leftPan, state.left, "left");
  fill(el.rightPan, state.right, "right");
}

function tilt(which) {
  if (which === "eq") el.beam.style.transform = "translateX(-50%) rotate(0deg)";
  if (which === "left")
    el.beam.style.transform = "translateX(-50%) rotate(-8deg)";
  if (which === "right")
    el.beam.style.transform = "translateX(-50%) rotate(8deg)";
}

function log(msg, cls = "") {
  el.log.innerHTML += `<p class="${cls}">${msg}</p>`;
  el.log.scrollTop = el.log.scrollHeight;
}

function updateCount() {
  el.weighCount.textContent = `${state.weighs} / 3 pesadas`;
}

function weigh() {
  if (state.finished) return;
  if (state.weighs >= 3) {
    log("Ya no tienes más pesadas.", "bad");
    return;
  }
  if (state.left.length === 0 && state.right.length === 0) {
    log("Coloca canicas en la balanza.", "warn");
    return;
  }
  state.weighs++;
  let weightLeft = state.left.length;
  let weightRight = state.right.length;
  if (state.left.includes(state.odd))
    weightLeft += state.oddType === "heavy" ? 1 : -1;
  if (state.right.includes(state.odd))
    weightRight += state.oddType === "heavy" ? 1 : -1;
  let result = "eq";
  if (weightLeft > weightRight) result = "left";
  if (weightRight > weightLeft) result = "right";
  tilt(result);
  updateCount();
  el.history.innerHTML += `<div>Pesada ${state.weighs}: [${state.left}] vs [${state.right}] → ${result}</div>`;
  log(
    `Pesada ${state.weighs}: La balanza ${
      result === "eq"
        ? "se equilibró"
        : result === "left"
        ? "bajó izquierda"
        : "bajó derecha"
    }.`
  );
  state.left = [];
  state.right = [];
  renderPans();
}

function guess() {
  if (state.finished) return;
  const pick = prompt("Ingresa el número de la canica sospechosa (1-12):");
  const num = parseInt(pick);
  if (!ALL.includes(num)) return;
  state.finished = true;
  if (num === state.odd) {
    el.final.innerHTML = `✅ Correcto: La canica ${num} es la distinta (${
      state.oddType === "heavy" ? "más pesada" : "más ligera"
    }).`;
    log(
      `¡Acertaste! La canica ${num} era la diferente (${state.oddType}).`,
      "ok"
    );
  } else {
    el.final.innerHTML = `❌ Fallaste. La canica ${
      state.odd
    } era la distinta (${
      state.oddType === "heavy" ? "más pesada" : "más ligera"
    }).`;
    log(
      `Fallaste. La canica correcta era ${state.odd} (${state.oddType}).`,
      "bad"
    );
  }
}

// --- Drag & Drop sobre la balanza (decidir izquierda/derecha) ---
el.scale.addEventListener("dragover", (e) => {
  e.preventDefault(); // necesario para permitir drop
});

el.scale.addEventListener("drop", (e) => {
  e.preventDefault();
  if (state.finished) return;
  const data = e.dataTransfer.getData("text/plain");
  const id = parseInt(data);
  if (!ALL.includes(id)) return;

  const rect = el.scale.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const isLeft = clickX < rect.width / 2;
  const sideName = isLeft ? "left" : "right";

  // quitar de cualquier lado previo
  state.left = state.left.filter((x) => x !== id);
  state.right = state.right.filter((x) => x !== id);

  // añadir al lado correspondiente (si no está ya)
  if (!state[sideName].includes(id)) state[sideName].push(id);

  // limpiar selección si venía por selección
  state.selected = null;
  renderPans();
  renderCoins();
});

// Soporte táctil: al soltar en pantalla (touchend) añadimos la canica según posición
document.addEventListener(
  "touchend",
  (e) => {
    if (!state.touchDragging) return;
    if (state.finished) {
      state.touchDragging = null;
      return;
    }
    // usamos el primer touch que cambió
    const touch = e.changedTouches[0];
    if (!touch) {
      state.touchDragging = null;
      return;
    }
    const rect = el.scale.getBoundingClientRect();
    // si el touch terminó fuera de la balanza, no hacer nada
    if (
      touch.clientX < rect.left ||
      touch.clientX > rect.right ||
      touch.clientY < rect.top ||
      touch.clientY > rect.bottom
    ) {
      // si quieres: podrías detectar también soltar fuera para remover de bandejas
      state.touchDragging = null;
      return;
    }
    const clickX = touch.clientX - rect.left;
    const isLeft = clickX < rect.width / 2;
    const sideName = isLeft ? "left" : "right";
    const id = state.touchDragging;

    // quitar de cualquier lado previo e insertar
    state.left = state.left.filter((x) => x !== id);
    state.right = state.right.filter((x) => x !== id);
    if (!state[sideName].includes(id)) state[sideName].push(id);

    state.selected = null;
    state.touchDragging = null;
    renderPans();
    renderCoins();
  },
  { passive: true }
);

// También permitimos el antiguo comportamiento de "click en cualquier parte de la balanza"
// para usuarios que prefieren seleccionar y luego hacer clic en la balanza.
el.scale.addEventListener("click", (e) => {
  if (state.finished) return;
  if (!state.selected) return;
  const rect = el.scale.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const isLeft = clickX < rect.width / 2;
  const sideName = isLeft ? "left" : "right";

  if (
    !state.left.includes(state.selected) &&
    !state.right.includes(state.selected)
  ) {
    state[sideName].push(state.selected);
  }
  state.selected = null;
  renderPans();
  renderCoins();
});

// Botones
el.weighBtn.onclick = weigh;
el.guessBtn.onclick = guess;
el.resetBtn.onclick = init;

// inicializar
init();
