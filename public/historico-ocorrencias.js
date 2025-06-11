let ocorrencias = [];

// Usar API_BASE_URL de config.js ou fallback
const apiBaseUrl = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'https://painelcrm-pbcontabilidade.onrender.com';

// Lista fixa de departamentos
const DEPARTAMENTOS = ['Fiscal', 'Contábil', 'DP', 'Societário', 'Regularização'];

// Função para formatar data para dd/mm/aaaa
function formatarData(data) {
  if (!data) return '';
  const date = new Date(data);
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  return `${dia}/${mes}/${ano}`;
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

function popularFiltroSetor() {
  const filtroSetor = document.getElementById('filtroSetor');
  if (!filtroSetor) return;
  filtroSetor.innerHTML = '<option value="">Todos</option>';
  DEPARTAMENTOS.sort().forEach(setor => {
    const option = document.createElement('option');
    option.value = setor;
    option.textContent = setor;
    filtroSetor.appendChild(option);
  });
}

async function renderizarOcorrencias() {
  console.log('Rendering ocorrencias');
  const ocorrenciasBody = document.getElementById('ocorrenciasBody');
  const filtroInput = document.getElementById('filtroInput');
  const filtroSetor = document.getElementById('filtroSetor');
  if (!ocorrenciasBody || !filtroInput || !filtroSetor) {
    console.error('Elementos DOM não encontrados:', { ocorrenciasBody, filtroInput, filtroSetor });
    showErrorToast('Erro: Interface não carregada corretamente.');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    console.log('Token:', token ? 'Present' : 'Missing');
    if (!token) {
      throw new Error('Token de autenticação ausente. Faça login novamente.');
    }

    console.log('API_BASE_URL:', apiBaseUrl);
    console.log('Enviando requisição para:', `${apiBaseUrl}/api/ocorrencias`);
    const response = await fetch(`${apiBaseUrl}/api/ocorrencias`, {
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
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    ocorrencias = await response.json();
    console.log('Ocorrencias recebidas:', ocorrencias.length);

    // Popular dropdown apenas se ainda não foi populado
    if (filtroSetor.options.length <= 1) {
      popularFiltroSetor();
    }

    const filtroTexto = filtroInput.value.toLowerCase();
    const filtroSetorSelecionado = filtroSetor.value;
    console.log('Filtros aplicados:', { filtroSetorSelecionado, filtroTexto });

    const ocorrenciasFiltradas = ocorrencias.filter(ocorrencia => {
      const matchesSetor = !filtroSetorSelecionado || ocorrencia.setor === filtroSetorSelecionado;
      const matchesTexto =
        (ocorrencia.setor || '').toLowerCase().includes(filtroTexto) ||
        (ocorrencia.cliente_impactado || '').toLowerCase().includes(filtroTexto) ||
        (ocorrencia.descricao || '').toLowerCase().includes(filtroTexto);
      return matchesSetor && matchesTexto;
    });
    console.log('Ocorrencias filtradas:', ocorrenciasFiltradas.length);

    ocorrenciasBody.innerHTML = '';
    ocorrenciasFiltradas.forEach(ocorrencia => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${ocorrencia.id || ''}</td>
        <td>${formatarData(ocorrencia.data_ocorrencia)}</td>
        <td>${ocorrencia.setor || ''}</td>
        <td>${ocorrencia.cliente_impactado || ''}</td>
        <td>${ocorrencia.valor_desconto || ''}</td>
        <td>${ocorrencia.colaborador_nome || ''}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="mostrarDetalhes(${ocorrencia.id})">
            <i class="bi bi-eye-fill"></i> Visualizar
          </button>
        </td>
      `;
      ocorrenciasBody.appendChild(tr);
    });
  } catch (error) {
    console.error('Erro ao carregar ocorrências:', error);
    showErrorToast('Erro ao carregar ocorrências: ' + error.message);
  }
}

function mostrarDetalhes(id) {
  const ocorrencia = ocorrencias.find(o => o.id === id);
  if (!ocorrencia) {
    showErrorToast('Ocorrência não encontrada.');
    return;
  }

  const detalhesContent = document.getElementById('detalhesContent');
  detalhesContent.innerHTML = `
    <p><strong>ID:</strong> ${ocorrencia.id || '-'}</p>
    <p><strong>Data da Ocorrência:</strong> ${formatarData(ocorrencia.data_ocorrencia)}</p>
    <p><strong>Setor:</strong> ${ocorrencia.setor || '-'}</p>
    <p><strong>Descrição:</strong> ${ocorrencia.descricao || '-'}</p>
    <p><strong>Cliente Impactado:</strong> ${ocorrencia.cliente_impactado || '-'}</p>
    <p><strong>Valor do Desconto:</strong> ${ocorrencia.valor_desconto || '-'}</p>
    <p><strong>Tipo de Desconto:</strong> ${ocorrencia.tipo_desconto || '-'}</p>
    <p><strong>Colaborador Nome:</strong> ${ocorrencia.colaborador_nome || '-'}</p>
    <p><strong>Colaborador Cargo:</strong> ${ocorrencia.colaborador_cargo || '-'}</p>
    <p><strong>Advertido:</strong> ${ocorrencia.advertido || '-'}</p>
    <p><strong>Tipo de Advertência:</strong> ${ocorrencia.tipo_advertencia || '-'}</p>
    <p><strong>Advertência Outra:</strong> ${ocorrencia.advertencia_outra || '-'}</p>
    <p><strong>Cliente Comunicado:</strong> ${ocorrencia.cliente_comunicado || '-'}</p>
    <p><strong>Meio de Comunicação:</strong> ${ocorrencia.meio_comunicacao || '-'}</p>
    <p><strong>Comunicação Outro:</strong> ${ocorrencia.comunicacao_outro || '-'}</p>
    <p><strong>Ações Imediatas:</strong> ${ocorrencia.acoes_imediatas || '-'}</p>
    <p><strong>Ações Corretivas:</strong> ${ocorrencia.acoes_corretivas || '-'}</p>
    <p><strong>Ações Preventivas:</strong> ${ocorrencia.acoes_preventivas || '-'}</p>
    <p><strong>Responsável Nome:</strong> ${ocorrencia.responsavel_nome || '-'}</p>
    <p><strong>Responsável Data:</strong> ${formatarData(ocorrencia.responsavel_data)}</p>
  `;

  const modal = new bootstrap.Modal(document.getElementById('detalhesModal'));
  modal.show();
}

function exportarPDF() {
  const filtroSetor = document.getElementById('filtroSetor');
  const filtroInput = document.getElementById('filtroInput');
  const filtroSetorSelecionado = filtroSetor ? filtroSetor.value : '';
  const filtroTexto = filtroInput ? filtroInput.value.toLowerCase() : '';
  console.log('Exportando PDF com filtros:', { filtroSetorSelecionado, filtroTexto });

  const ocorrenciasFiltradas = ocorrencias.filter(ocorrencia => {
    const matchesSetor = !filtroSetorSelecionado || ocorrencia.setor === filtroSetorSelecionado;
    const matchesTexto =
      (ocorrencia.setor || '').toLowerCase().includes(filtroTexto) ||
      (ocorrencia.cliente_impactado || '').toLowerCase().includes(filtroTexto) ||
      (ocorrencia.descricao || '').toLowerCase().includes(filtroTexto);
    return matchesSetor && matchesTexto;
  });

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.text('Histórico de Ocorrências' + (filtroSetorSelecionado ? ` - ${filtroSetorSelecionado}` : ''), 14, 10);
  doc.autoTable({
    head: [
      [
        'ID', 'Data', 'Setor', 'Descrição', 'Cliente Impactado', 'Valor Desconto',
        'Tipo Desconto', 'Colaborador Nome', 'Colaborador Cargo', 'Advertido',
        'Tipo Advertência', 'Advertência Outra', 'Cliente Comunicado',
        'Meio Comunicação', 'Comunicação Outro', 'Ações Imediatas',
        'Ações Corretivas', 'Ações Preventivas', 'Responsável Nome',
        'Responsável Data'
      ]
    ],
    body: ocorrenciasFiltradas.map(ocorrencia => [
      ocorrencia.id || '',
      formatarData(ocorrencia.data_ocorrencia) || '',
      ocorrencia.setor || '',
      ocorrencia.descricao || '',
      ocorrencia.cliente_impactado || '',
      ocorrencia.valor_desconto || '',
      ocorrencia.tipo_desconto || '',
      ocorrencia.colaborador_nome || '',
      ocorrencia.colaborador_cargo || '',
      ocorrencia.advertido || '',
      ocorrencia.tipo_advertencia || '',
      ocorrencia.advertencia_outra || '',
      ocorrencia.cliente_comunicado || '',
      ocorrencia.meio_comunicacao || '',
      ocorrencia.comunicacao_outro || '',
      ocorrencia.acoes_imediatas || '',
      ocorrencia.acoes_corretivas || '',
      ocorrencia.acoes_preventivas || '',
      ocorrencia.responsavel_nome || '',
      formatarData(ocorrencia.responsavel_data) || ''
    ]),
    styles: { fontSize: 8 },
    columnStyles: { 3: { cellWidth: 30 } } // Ajuste para descrição longa
  });
  doc.save(`historico_ocorrencias${filtroSetorSelecionado ? `_${filtroSetorSelecionado}` : ''}.pdf`);
}

function filtrarOcorrencias() {
  renderizarOcorrencias();
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('Inicializando historico-ocorrencias.js');
  console.log('API_BASE_URL disponível:', typeof API_BASE_URL !== 'undefined');
  console.log('API_BASE_URL:', apiBaseUrl);
  const token = localStorage.getItem('token');
  const permissao = localStorage.getItem('permissao');

  if (!token || permissao !== 'Gerente') {
    showErrorToast('Acesso negado. Faça login como Gerente.');
    setTimeout(() => window.location.href = 'login.html', 1000);
    return;
  }

  const filtroInput = document.getElementById('filtroInput');
  const filtroSetor = document.getElementById('filtroSetor');
  if (!filtroInput || !filtroSetor) {
    console.error('Filtros não encontrados:', { filtroInput, filtroSetor });
    showErrorToast('Erro: Interface não carregada corretamente.');
    return;
  }

  filtroInput.addEventListener('input', filtrarOcorrencias);
  filtroSetor.addEventListener('change', () => {
    console.log('Setor selecionado:', filtroSetor.value);
    filtrarOcorrencias();
  });
  renderizarOcorrencias();
});