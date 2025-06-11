let ocorrencias = [];
let clientesOcorrencias = [];

const apiBaseUrl = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'https://painelcrm-pbcontabilidade.onrender.com';

// Função para formatar data para dd/mm/aaaa
function formatarData(data) {
  if (!data) return '';
  const dataStr = data.split('T')[0];
  const [ano, mes, dia] = dataStr.split('-');
  if (!ano || !mes || !dia) {
    console.error('Formato de data inválido:', data);
    return '';
  }
  return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
}

// Função para obter data atual em formato YYYY-MM-DD
function getDataAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function showSuccessToast(message) {
  const toast = document.getElementById('successToast');
  const toastMessage = document.getElementById('successToastMessage');
  if (toast && toastMessage) {
    toastMessage.textContent = message;
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
  } else {
    console.error('Toast elements not found:', { toast, toastMessage });
    alert(message);
  }
}

function showErrorToast(message) {
  const toast = document.getElementById('errorToast');
  const toastMessage = document.getElementById('errorToastMessage');
  if (toast && toastMessage) {
    toastMessage.textContent = message;
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
  } else {
    console.error('Toast error elements not found:', { toast, toastMessage });
    alert(message);
  }
}

// Função para remover o .modal-backdrop manualmente
function removerModalBackdrop() {
  const backdrop = document.querySelector('.modal-backdrop');
  if (backdrop) {
    backdrop.remove();
  }
  document.body.classList.remove('modal-open');
  document.body.style.removeProperty('padding-right');
}

async function popularClientes() {
  console.log('Iniciando popularClientes');
  try {
    const token = localStorage.getItem('token');
    console.log('Token para GET /api/clientes:', token ? 'Presente' : 'Ausente');
    if (!token) {
      throw new Error('Token de autenticação ausente.');
    }
    const response = await fetch(`${apiBaseUrl}/api/clientes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Resposta GET /api/clientes:', response.status, response.statusText);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! Status: ${response.status}, Mensagem: ${errorData.error || 'Desconhecida'}`);
    }
    clientesOcorrencias = await response.json();
    console.log('Clientes recebidos:', clientesOcorrencias.length, clientesOcorrencias);
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
    showErrorToast('Erro ao carregar lista de clientes: ' + error.message);
  }
}

async function renderizarOcorrencias() {
  console.log('Rendering ocorrencias');
  const ocorrenciasBody = document.getElementById('ocorrenciasBody');
  if (!ocorrenciasBody) {
    console.error('Elemento ocorrenciasBody não encontrado');
    showErrorToast('Erro: Interface não carregada corretamente.');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    console.log('Token:', token ? 'Present' : 'Missing');
    if (!token) {
      throw new Error('Token de autenticação ausente.');
    }

    const response = await fetch(`${apiBaseUrl}/api/ocorrencias-crm`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Ocorrencias response:', response.status, response.statusText);

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('permissao');
        showErrorToast('Sessão expirada. Faça login novamente.');
        setTimeout(() => window.location.href = 'login.html', 1000);
        return;
      }
      const errorData = await response.json();
      throw new Error(`HTTP error! Status: ${response.status}, Mensagem: ${errorData.error || 'Desconhecida'}`);
    }

    ocorrencias = await response.json();
    const contadorCasosAbertos = document.getElementById('contadorCasosAbertos');
    if (contadorCasosAbertos) {
      const casosAbertos = ocorrencias.filter(ocorrencia => !ocorrencia.data_resolucao).length;
      contadorCasosAbertos.textContent = `Casos em Aberto: ${casosAbertos}`;
      console.log('Casos em aberto contados:', casosAbertos); // Para depuração
    }
    console.log('Ocorrencias recebidas:', ocorrencias.length, ocorrencias);

    ocorrenciasBody.innerHTML = '';
    const filtroInput = document.getElementById('filtroInput');
    const filtro = filtroInput ? filtroInput.value.toLowerCase() : '';
    const ocorrenciasFiltradas = ocorrencias.filter(ocorrencia => {
      const cliente = clientesOcorrencias.find(c => c.id === ocorrencia.cliente_id) || { codigo: '', nome: '' };
      return ocorrencia.id.toString().includes(filtro) ||
             cliente.nome.toLowerCase().includes(filtro) ||
             cliente.codigo.toLowerCase().includes(filtro);
    });

    ocorrenciasFiltradas.forEach(ocorrencia => {
      const cliente = clientesOcorrencias.find(c => c.id === ocorrencia.cliente_id) || { codigo: '-', nome: '-' };
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => editarOcorrencia(ocorrencia.id));
      tr.innerHTML = `
        <td>${ocorrencia.id || ''}</td>
        <td>${ocorrencia.titulo_descricao || ''}</td>
        <td>${cliente.codigo} - ${cliente.nome}</td>
        <td>${formatarData(ocorrencia.data_registro)}</td>
        <td>${formatarData(ocorrencia.data_resolucao)}</td>
      `;
      ocorrenciasBody.appendChild(tr);
    });
    console.log('Tabela de ocorrências renderizada com sucesso');
  } catch (error) {
    console.error('Erro ao carregar ocorrências:', error);
    showErrorToast('Erro ao carregar ocorrências: ' + error.message);
  }
}

function abrirModal() {
  const modalElement = document.getElementById('ocorrenciaModal');
  const modal = new bootstrap.Modal(modalElement, { backdrop: 'static', keyboard: false });
  document.getElementById('ocorrenciaModalLabel').textContent = 'Criar Ocorrência';
  document.getElementById('ocorrenciaForm').reset();
  document.getElementById('ocorrenciaId').value = '';
  document.getElementById('clienteId').value = '';
  document.getElementById('clienteSearch').value = '';
  document.getElementById('dataRegistro').value = getDataAtual();
  modal.show();
}

function editarOcorrencia(id) {
  const ocorrencia = ocorrencias.find(o => o.id === id);
  if (!ocorrencia) {
    showErrorToast('Ocorrência não encontrada.');
    return;
  }

  const modalElement = document.getElementById('ocorrenciaModal');
  const modal = new bootstrap.Modal(modalElement, { backdrop: 'static', keyboard: false });
  document.getElementById('ocorrenciaModalLabel').textContent = 'Editar Ocorrência';
  document.getElementById('ocorrenciaId').value = id;
  document.getElementById('dataRegistro').value = ocorrencia.data_registro ? ocorrencia.data_registro.split('T')[0] : '';
  const cliente = clientesOcorrencias.find(c => c.id === ocorrencia.cliente_id) || { id: '', codigo: '', nome: '' };
  document.getElementById('clienteId').value = cliente.id;
  document.getElementById('clienteSearch').value = cliente.id ? `${cliente.codigo} - ${cliente.nome}` : '';
  document.getElementById('tituloDescricao').value = ocorrencia.titulo_descricao || '';
  document.getElementById('descricaoApontamento').value = ocorrencia.descricao_apontamento || '';
  document.getElementById('responsavelInterno').value = ocorrencia.responsavel_interno || '';
  document.getElementById('acaoTomada').value = ocorrencia.acao_tomada || '';
  document.getElementById('acompanhamentoEricaOperacional').value = ocorrencia.acompanhamento_erica_operacional || '';
  document.getElementById('dataResolucao').value = ocorrencia.data_resolucao ? ocorrencia.data_resolucao.split('T')[0] : '';
  document.getElementById('feedbackCliente').value = ocorrencia.feedback_cliente || '';
  modal.show();
}

async function salvarOcorrencia(event) {
  event.preventDefault();
  console.log('Iniciando salvarOcorrencia');
  const modalElement = document.getElementById('ocorrenciaModal');
  const modal = bootstrap.Modal.getInstance(modalElement);
  const id = document.getElementById('ocorrenciaId').value;
  const dataRegistro = document.getElementById('dataRegistro').value;
  const clienteId = document.getElementById('clienteId').value;
  const tituloDescricao = document.getElementById('tituloDescricao').value.trim();
  const descricaoApontamento = document.getElementById('descricaoApontamento').value.trim();
  const responsavelInterno = document.getElementById('responsavelInterno').value.trim();
  const acaoTomada = document.getElementById('acaoTomada').value.trim();
  const acompanhamentoEricaOperacional = document.getElementById('acompanhamentoEricaOperacional').value.trim();
  const dataResolucao = document.getElementById('dataResolucao').value;
  const feedbackCliente = document.getElementById('feedbackCliente').value.trim();

  if (!dataRegistro || !clienteId || !tituloDescricao || !descricaoApontamento || !responsavelInterno || !acaoTomada || !acompanhamentoEricaOperacional) {
    console.log('Campos obrigatórios ausentes:', { dataRegistro, clienteId, tituloDescricao, descricaoApontamento, responsavelInterno, acaoTomada, acompanhamentoEricaOperacional });
    showErrorToast('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  const ocorrenciaData = {
    data_registro: dataRegistro,
    cliente_id: parseInt(clienteId),
    titulo_descricao: tituloDescricao,
    descricao_apontamento: descricaoApontamento,
    responsavel_interno: responsavelInterno,
    acao_tomada: acaoTomada,
    acompanhamento_erica_operacional: acompanhamentoEricaOperacional,
    data_resolucao: dataResolucao || null,
    feedback_cliente: feedbackCliente || null
  };

  try {
    const token = localStorage.getItem('token');
    console.log('Token para salvar ocorrência:', token ? 'Presente' : 'Ausente');
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${apiBaseUrl}/api/ocorrencias-crm/${id}` : `${apiBaseUrl}/api/ocorrencias-crm`;
    console.log('Enviando requisição:', method, url, ocorrenciaData);
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ocorrenciaData)
    });

    console.log('Resposta salvar ocorrência:', response.status, response.statusText);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! Status: ${response.status}, Mensagem: ${errorData.error || 'Desconhecida'}`);
    }

    showSuccessToast(id ? 'Ocorrência atualizada com sucesso!' : 'Ocorrência criada com sucesso!');
    modal.hide();
    removerModalBackdrop();
    document.getElementById('ocorrenciaForm').reset();
    document.getElementById('clienteId').value = '';
    document.getElementById('clienteSearch').value = '';
    document.getElementById('dataRegistro').value = getDataAtual();
    await renderizarOcorrencias();
    console.log('Ocorrência salva e tabela atualizada');
  } catch (error) {
    console.error('Erro ao salvar ocorrência:', error);
    showErrorToast('Erro ao salvar ocorrência: ' + error.message);
  }
}

// Função para mostrar sugestões de clientes
function mostrarSugestoesClientes(termo) {
  const suggestionsContainer = document.getElementById('clienteSuggestions');
  suggestionsContainer.innerHTML = '';
  if (!termo.trim()) {
    suggestionsContainer.style.display = 'none';
    return;
  }

  const termoLower = termo.toLowerCase();
  const clientesFiltrados = clientesOcorrencias.filter(cliente =>
    cliente.codigo.toLowerCase().includes(termoLower) ||
    cliente.nome.toLowerCase().includes(termoLower)
  );

  if (clientesFiltrados.length === 0) {
    suggestionsContainer.style.display = 'none';
    return;
  }

  clientesFiltrados.forEach(cliente => {
    const suggestionItem = document.createElement('a');
    suggestionItem.href = '#';
    suggestionItem.classList.add('list-group-item', 'list-group-item-action');
    suggestionItem.textContent = `${cliente.codigo} - ${cliente.nome}`;
    suggestionItem.dataset.clienteId = cliente.id;
    suggestionItem.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('clienteSearch').value = `${cliente.codigo} - ${cliente.nome}`;
      document.getElementById('clienteId').value = cliente.id;
      suggestionsContainer.innerHTML = '';
      suggestionsContainer.style.display = 'none';
    });
    suggestionsContainer.appendChild(suggestionItem);
  });
  suggestionsContainer.style.display = 'block';
}

function filtrarOcorrencias() {
  renderizarOcorrencias();
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Inicializando ocorrencia.js');
  console.log('API_BASE_URL:', apiBaseUrl);
  const token = localStorage.getItem('token');
  const permissao = localStorage.getItem('permissao');
  console.log('Token:', token ? 'Presente' : 'Ausente', 'Permissao:', permissao);

  if (!token || !['Operador', 'Gerente'].includes(permissao)) {
    console.log('Acesso negado:', { token: !!token, permissao });
    showErrorToast('Acesso negado. Faça login como Operador ou Gerente.');
    setTimeout(() => window.location.href = 'login.html', 1000);
    return;
  }

  const form = document.getElementById('ocorrenciaForm');
  const dataRegistroInput = document.getElementById('dataRegistro');
  const clienteSearchInput = document.getElementById('clienteSearch');
  const criarOcorrenciaBtn = document.querySelector('button[data-bs-target="#ocorrenciaModal"]');
  const cancelarBtn = document.getElementById('cancelarOcorrencia');
  const suggestionsContainer = document.getElementById('clienteSuggestions');
  const filtroInput = document.getElementById('filtroInput');

  if (form && dataRegistroInput && clienteSearchInput && criarOcorrenciaBtn && cancelarBtn && suggestionsContainer && filtroInput) {
    dataRegistroInput.value = getDataAtual();
    form.addEventListener('submit', salvarOcorrencia);
    criarOcorrenciaBtn.addEventListener('click', abrirModal);

    // Evento de busca no campo cliente
    clienteSearchInput.addEventListener('input', () => {
      const termo = clienteSearchInput.value;
      if (!termo.trim()) {
        document.getElementById('clienteId').value = '';
      }
      mostrarSugestoesClientes(termo);
    });

    // Esconder sugestões ao clicar fora
    document.addEventListener('click', (e) => {
      if (!clienteSearchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.display = 'none';
      }
    });

    // Evento para o botão Cancelar
    cancelarBtn.addEventListener('click', () => {
      const modalElement = document.getElementById('ocorrenciaModal');
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal.hide();
      removerModalBackdrop();
      form.reset();
      document.getElementById('clienteId').value = '';
      document.getElementById('clienteSearch').value = '';
      document.getElementById('dataRegistro').value = getDataAtual();
      suggestionsContainer.innerHTML = '';
      suggestionsContainer.style.display = 'none';
    });

    // Evento para quando o modal é completamente fechado
    const modalElement = document.getElementById('ocorrenciaModal');
    modalElement.addEventListener('hidden.bs.modal', () => {
      removerModalBackdrop();
      form.reset();
      document.getElementById('clienteId').value = '';
      document.getElementById('clienteSearch').value = '';
      document.getElementById('dataRegistro').value = getDataAtual();
      suggestionsContainer.innerHTML = '';
      suggestionsContainer.style.display = 'none';
    });

    // Evento para o filtro
    filtroInput.addEventListener('input', filtrarOcorrencias);

    console.log('Formulário e botões inicializados');
  } else {
    console.error('Elementos não encontrados:', { form, dataRegistroInput, clienteSearchInput, criarOcorrenciaBtn, cancelarBtn, suggestionsContainer, filtroInput });
  }

  await popularClientes();
  await renderizarOcorrencias();
});