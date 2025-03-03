const editor = document.getElementById('editor');
const output = document.getElementById('output');
const outputContainer = document.getElementById('output-container');

var InputSubmit = document.querySelectorAll("input[type='submit']")[0];
var InputPedidoParaIa = document.querySelector('#InputPedidoParaIa');

mermaid.initialize({ startOnLoad: true });

function highlightSyntax(text) {
  return text
    .replace(
      /\b(graph|subgraph|end|TD|LR|TB|RL)\b/g,
      '<span class="keyword">$1</span>'
    )
    .replace(
      /(\[|\(|\{)([^\]|\)|\}]+)(\]|\)|\})/g,
      '$1<span class="node">$2</span>$3'
    )
    .replace(/(--?>|==?>|\.-+>|\-.+>)/g, '<span class="edge">$1</span>')
    .replace(/(\|)([^|]+)(\|)/g, '$1<span class="string">$2</span>$3');
}

// Variáveis globais para pan e zoom
let isDragging = false;
let startX, startY;
let translateX = 0,
  translateY = 0;
let scale = 1;
const zoomStep = 0.2;
const maxScale = 3;
const minScale = 0.5;

function updateTransform() {
  output.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

function updateDiagram() {
  const code = editor.textContent;
  editor.innerHTML = highlightSyntax(code);

  // Preserve cursor position
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);

  // Armazena os valores antes da atualização
  const prevTranslateX = translateX;
  const prevTranslateY = translateY;
  const prevScale = scale;

  output.innerHTML = '';
  mermaid.render('mermaid-diagram', code, (svgCode) => {
    output.innerHTML = svgCode;

    // Reaplica as transformações anteriores
    translateX = prevTranslateX;
    translateY = prevTranslateY;
    scale = prevScale;
    updateTransform();
  });
}

editor.addEventListener('input', updateDiagram);
updateDiagram();

// Pan funcionalidade
output.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX - translateX;
  startY = e.clientY - translateY;
  output.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  e.preventDefault();
  translateX = e.clientX - startX;
  translateY = e.clientY - startY;
  updateTransform();
});

document.addEventListener('mouseup', () => {
  isDragging = false;
  output.style.cursor = 'grab';
});

output.addEventListener('mouseleave', () => {
  if (isDragging) {
    isDragging = false;
    output.style.cursor = 'grab';
  }
});

// Botões de Zoom
const zoomInButton = document.getElementById('zoom-in');
const zoomOutButton = document.getElementById('zoom-out');

zoomInButton.addEventListener('click', () => {
  if (scale < maxScale) {
    scale += zoomStep;
    updateTransform();
  }
});

zoomOutButton.addEventListener('click', () => {
  if (scale > minScale) {
    scale -= zoomStep;
    updateTransform();
  }
});

function chamadaApiDeIa(pedidoDeDiagrama) {
  const userQuery = encodeURIComponent(pedidoDeDiagrama);

  return fetch(
    `https://free-unoficial-gpt4o-mini-api-g70n.onrender.com/chat/?query=Gere%20um%20codigo%20mermaid%20js%2C%20responda%20somente%20o%20codigo%20mermaid%20para%20o%20seguinte%20diagrama%3A%20${userQuery}`,
    { headers: { Accept: 'application/json' } }
  )
    .then((res) => res.json())
    .then((data) => {
      console.log('Resposta completa da API:', data);

      if (!data.results) return null;

      const mermaidCode = data.results
        .replace(/```mermaid\s*/, '')
        .replace(/```$/, '')
        .trim();

      return mermaidCode;
    })
    .catch((err) => {
      console.error('Erro na chamada da API:', err);
      return null;
    });
}

InputSubmit.onclick = async (e) => {
  e.preventDefault();
  let pedidoDoUsuario = InputPedidoParaIa.value.trim();

  if (!pedidoDoUsuario) {
    console.warn('O campo está vazio!');
    return;
  }

  let respostaIa = await chamadaApiDeIa(pedidoDoUsuario);

  if (respostaIa) {
    editor.textContent = respostaIa;
    updateDiagram();
  }

  console.log('Resposta processada:', respostaIa);
};
