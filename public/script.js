let clientes = [];
let paginaAtual = 1;
const clientesPorPagina = 10;
let filtrosAtivos = {
  regime_fiscal: null,
  situacao: null,
  estado: null,
  status: null,
  segmento: null,
  sistema: null
};

function renderNavbar() {
  console.log('Rendering navbar');
  const permissao = localStorage.getItem('permissao');
  const navbarLinks = document.getElementById('navbar-navigation'); // Corrigido para navbar-navigation
  const navbarLinksTop = document.getElementById('navbarLinksTop');
  if (!navbarLinks || !navbarLinksTop) {
    console.error('Elementos navbar-navigation ou navbarLinksTop não encontrados');
    return;
  }
  console.log('Permissao:', permissao);

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  let linksHtml = '';
  let topLinksHtml = '';

  if (!permissao) {
    linksHtml = `<a class="nav-link${currentPage === 'login.html' ? ' active' : ''}" href="login.html"><i class="fas fa-sign-in-alt me-2"></i>Login</a>`;
  } else {
    linksHtml += `
      <a class="nav-link${currentPage === 'index.html' ? ' active' : ''}" href="index.html"><i class="fas fa-users me-2"></i>Clientes</a>
    `;

    if (['Gerente', 'Gestor'].includes(permissao)) {
      linksHtml += `
        <a class="nav-link${currentPage === 'ocorrencias-gestor.html' ? ' active' : ''}" href="ocorrencias-gestor.html"><i class="fas fa-exclamation-circle me-2"></i>Ocorrências Gestor</a>
      `;
    }

    if (['Operador', 'Gerente'].includes(permissao)) {
      linksHtml += `
        <a class="nav-link${currentPage === 'ocorrencia.html' ? ' active' : ''}" href="ocorrencia.html"><i class="fas fa-file-alt me-2"></i>Ocorrências</a>
      `;
    }

    if (permissao === 'Gerente') {
      linksHtml += `
        <a class="nav-link${currentPage === 'historico-ocorrencias.html' ? ' active' : ''}" href="historico-ocorrencias.html"><i class="fas fa-history me-2"></i>Histórico de Ocorrências</a>
      `;
    }

    topLinksHtml += `
      <button class="btn btn-outline-light btn-sm" id="exportarPDFBtn" onclick="exportarPDF()">
        <i class="fas fa-file-pdf me-2"></i>Exportar PDF
      </button>
      <button class="btn btn-outline-danger btn-sm" onclick="logout()">
        <i class="fas fa-sign-out-alt me-2"></i>Sair
      </button>
    `;
  }

  navbarLinks.innerHTML = linksHtml;
  navbarLinksTop.innerHTML = topLinksHtml;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('permissao');
  window.location.href = 'login.html';
}

function getUniqueValues(field) {
  const values = [...new Set(clientes.map(cliente => cliente[field]).filter(val => val !== null && val !== ''))];
  return values.sort();
}

function showFilterDropdown(column, icon) {
  const existingDropdown = document.querySelector('.filter-dropdown');
  if (existingDropdown) existingDropdown.remove();

  const values = getUniqueValues(column);
  if (values.length === 0) return;

  const rect = icon.getBoundingClientRect();
  const dropdown = document.createElement('div');
  dropdown.className = 'dropdown-menu filter-dropdown show';
  dropdown.style.position = 'absolute';
  dropdown.style.left = `${rect.left + window.scrollX}px`;
  dropdown.style.top = `${rect.bottom + window.scrollY}px`;
  dropdown.innerHTML = `
    <div class="dropdown-item p-0">
      <select class="form-select" id="filter-${column}">
        <option value="">Selecione</option>
        ${values.map(value => `<option value="${value}">${value}</option>`).join('')}
      </select>
    </div>
  `;
  document.body.appendChild(dropdown);

  const select = dropdown.querySelector('select');
  select.value = filtrosAtivos[column] || '';
  select.focus();

  select.addEventListener('change', () => {
    filtrosAtivos[column] = select.value || null;
    dropdown.remove();
    updateFilterIcons();
    renderizarClientes();
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== icon) {
      dropdown.remove();
    }
  }, { once: true });
}

function updateFilterIcons() {
  document.querySelectorAll('.filter-icon').forEach(icon => {
    const column = icon.dataset.column;
    icon.classList.toggle('text-success', filtrosAtivos[column]);
  });
}

function limparFiltros() {
  filtrosAtivos = {
    regime_fiscal: null,
    situacao: null,
    estado: null,
    status: null,
    segmento: null,
    sistema: null
  };
  const filtroInput = document.getElementById('filtroInput');
  if (filtroInput) filtroInput.value = '';
  updateFilterIcons();
  renderizarClientes();
}

async function renderizarClientes() {
  console.log('Rendering clients');
  const clientesBody = document.getElementById('clientesBody');
  const paginacaoInfo = document.getElementById('paginacaoInfo');
  if (!clientesBody || !paginacaoInfo) {
    console.error('Elementos DOM não encontrados:', { clientesBody, paginacaoInfo });
    showErrorToast('Erro: Interface não carregada corretamente.');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    console.log('Token:', token ? 'Present' : 'Missing');
    const response = await fetch(`${API_BASE_URL}/api/clientes`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Clientes response:', response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    clientes = await response.json();
    console.log('Clientes recebidos:', clientes);
    clientesBody.innerHTML = '';
    const filtroInput = document.getElementById('filtroInput');
    const filtro = filtroInput ? filtroInput.value.toLowerCase() : '';
    let clientesFiltrados = clientes.filter(cliente => 
      (cliente.codigo || '').toLowerCase().includes(filtro) ||
      (cliente.nome || '').toLowerCase().includes(filtro) ||
      (cliente.razao_social || '').toLowerCase().includes(filtro) ||
      (cliente.cpf_cnpj || '').toLowerCase().includes(filtro) ||
      (cliente.situacao || '').toLowerCase().includes(filtro) ||
      (cliente.municipio || '').toLowerCase().includes(filtro) ||
      (cliente.status || '').toLowerCase().includes(filtro) ||
      (cliente.grupo || '').toLowerCase().includes(filtro) ||
      (cliente.segmento || '').toLowerCase().includes(filtro) ||
      (cliente.sistema || '').toLowerCase().includes(filtro) ||
      (Array.isArray(cliente.tipo_servico) ? cliente.tipo_servico.join(', ').toLowerCase().includes(filtro) : '')
    );

    Object.keys(filtrosAtivos).forEach(column => {
      if (filtrosAtivos[column]) {
        clientesFiltrados = clientesFiltrados.filter(cliente => cliente[column] === filtrosAtivos[column]);
      }
    });

    const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);
    paginaAtual = Math.min(paginaAtual, totalPaginas || 1);

    const inicio = (paginaAtual - 1) * clientesPorPagina;
    const fim = inicio + clientesPorPagina;
    const clientesPagina = clientesFiltrados.slice(inicio, fim);

    clientesPagina.forEach(cliente => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-icon')) {
          editarCliente(cliente.id);
        }
      });
      tr.innerHTML = `
        <td>${cliente.codigo || ''}</td>
        <td>${cliente.nome || ''}</td>
        <td>${cliente.razao_social || ''}</td>
        <td>${cliente.cpf_cnpj || ''}</td>
        <td>${cliente.regime_fiscal || ''}</td>
        <td>${cliente.situacao || ''}</td>
        <td>${cliente.tipo_pessoa || ''}</td>
        <td>${cliente.estado || ''}</td>
        <td>${cliente.municipio || ''}</td>
        <td>${cliente.status || ''}</td>
        <td>${cliente.possui_ie || ''}</td>
        <td>${cliente.ie || ''}</td>
        <td>${cliente.filial || ''}</td>
        <td>${cliente.empresa_matriz || ''}</td>
        <td>${cliente.grupo || ''}</td>
        <td>${cliente.segmento || ''}</td>
        <td>${cliente.data_entrada ? cliente.data_entrada.substring(0, 10).split('-').reverse().join('/') : ''}</td>
        <td>${cliente.data_saida ? cliente.data_saida.substring(0, 10).split('-').reverse().join('/') : ''}</td>
        <td>${cliente.sistema || ''}</td>
        <td>${Array.isArray(cliente.tipo_servico) ? cliente.tipo_servico.join(', ') : ''}</td>
      `;
      clientesBody.appendChild(tr);
    });

    paginacaoInfo.textContent = `Página ${paginaAtual} de ${totalPaginas} (${clientesFiltrados.length} clientes)`;

    // Armazenar clientesFiltrados globalmente para uso nas funções de paginação
    window.clientesFiltrados = clientesFiltrados;
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
    showErrorToast('Erro ao carregar clientes: ' + error.message);
  }
}

function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.text('Lista de Clientes Filtrados', 20, 10);
  doc.autoTable({
    head: [['Código', 'Nome', 'Razão Social', 'CPF/CNPJ', 'Estado', 'Status', 'Segmento', 'Sistema', 'Tipo de Serviço']],
    body: (window.clientesFiltrados || clientes).map(cliente => [
      cliente.codigo || '',
      cliente.nome || '',
      cliente.razao_social || '',
      cliente.cpf_cnpj || '',
      cliente.estado || '',
      cliente.status || '',
      cliente.segmento || '',
      cliente.sistema || '',
      Array.isArray(cliente.tipo_servico) ? cliente.tipo_servico.join(', ') : ''
    ])
  });
  doc.save('clientes_filtrados.pdf');
}

function abrirModal() {
  const modal = new bootstrap.Modal(document.getElementById('clienteModal'));
  document.getElementById('clienteModalLabel').textContent = 'Adicionar Cliente';
  document.getElementById('clienteForm').reset();
  document.getElementById('clienteIndex').value = '';
  document.querySelectorAll('#tipo_servico input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  document.getElementById('excluirClienteBtn').style.display = 'none'; // Esconde o botão Excluir
  modal.show();
}

function editarCliente(id) {
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) {
    showErrorToast('Cliente não encontrado.');
    return;
  }

  const modal = new bootstrap.Modal(document.getElementById('clienteModal'));
  document.getElementById('clienteModalLabel').textContent = 'Editar Cliente';
  document.getElementById('codigo').value = cliente.codigo || '';
  document.getElementById('nome').value = cliente.nome || '';
  document.getElementById('razao_social').value = cliente.razao_social || '';
  document.getElementById('cpf_cnpj').value = cliente.cpf_cnpj || '';
  document.getElementById('regime_fiscal').value = cliente.regime_fiscal || 'Simples Nacional';
  document.getElementById('situacao').value = cliente.situacao || 'Ativo';
  document.getElementById('tipo_pessoa').value = cliente.tipo_pessoa || 'Física';
  document.getElementById('estado').value = cliente.estado || 'SP';
  document.getElementById('municipio').value = cliente.municipio || '';
  document.getElementById('status').value = cliente.status || 'Ativo';
  document.getElementById('possui_ie').value = cliente.possui_ie || 'Não';
  document.getElementById('ie').value = cliente.ie || '';
  document.getElementById('filial').value = cliente.filial || '';
  document.getElementById('empresa_matriz').value = cliente.empresa_matriz || '';
  document.getElementById('grupo').value = cliente.grupo || '';
  document.getElementById('segmento').value = cliente.segmento || '';
  document.getElementById('data_entrada').value = cliente.data_entrada ? cliente.data_entrada.split('T')[0] : '';
  document.getElementById('data_saida').value = cliente.data_saida ? cliente.data_saida.split('T')[0] : '';
  document.getElementById('sistema').value = cliente.sistema || '';

  document.querySelectorAll('#tipo_servico input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });

  const tipoServico = Array.isArray(cliente.tipo_servico) ? cliente.tipo_servico : [];
  const hasCombinado = tipoServico.includes('Escrita Fiscal') && 
                      tipoServico.includes('Contábil') && 
                      tipoServico.includes('Departamento Pessoal');
  const hasCombinado2 = tipoServico.includes('Escrita Fiscal') && 
                        tipoServico.includes('Contábil') && 
                        !tipoServico.includes('Departamento Pessoal');
  if (hasCombinado) {
    document.getElementById('tipo_servico_combinado').checked = true;
  } else if (hasCombinado2) {
    document.getElementById('tipo_servico_combinado2').checked = true;
  }
  tipoServico.forEach(servico => {
    const checkbox = document.querySelector(`#tipo_servico input[value="${servico}"]`);
    if (checkbox && !hasCombinado && !hasCombinado2) {
      checkbox.checked = true;
    }
  });

  document.getElementById('clienteIndex').value = id;
  document.getElementById('excluirClienteBtn').style.display = 'block'; // Mostrar botão Excluir
  modal.show();
}

function excluirCliente(id) {
  if (confirm('Deseja excluir este cliente?')) {
    fetch(`${API_BASE_URL}/api/clientes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        showSuccessToast('Cliente excluído com sucesso!');
        renderizarClientes();
        bootstrap.Modal.getInstance(document.getElementById('clienteModal')).hide();
      } else {
        showErrorToast(result.error || 'Erro ao excluir cliente.');
      }
    })
    .catch(error => {
      showErrorToast('Erro ao excluir cliente: ' + error.message);
    });
  }
}

function filtrarClientes() {
  paginaAtual = 1;
  renderizarClientes();
}

function irParaPrimeiraPagina() {
  paginaAtual = 1;
  renderizarClientes();
}

function irParaPaginaAnterior() {
  if (paginaAtual > 1) {
    paginaAtual--;
    renderizarClientes();
  }
}

function irParaProximaPagina() {
  if (!window.clientesFiltrados) return;
  const totalPaginas = Math.ceil(window.clientesFiltrados.length / clientesPorPagina);
  if (paginaAtual < totalPaginas) {
    paginaAtual++;
    renderizarClientes();
  }
}

function irParaUltimaPagina() {
  if (!window.clientesFiltrados) return;
  const totalPaginas = Math.ceil(window.clientesFiltrados.length / clientesPorPagina);
  paginaAtual = totalPaginas || 1;
  renderizarClientes();
}

function showSuccessToast(message) {
  const toast = document.getElementById('successToast');
  document.getElementById('successToastMessage').textContent = message;
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
}

function showErrorToast(message) {
  const toast = document.getElementById('errorToast');
  document.getElementById('errorToastMessage').textContent = message;
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
}

function inicializarEventos() {
  const filtroInput = document.getElementById('filtroInput');
  const clienteForm = document.getElementById('clienteForm');
  const limparFiltrosBtn = document.getElementById('limparFiltros');
  const excluirClienteBtn = document.getElementById('excluirClienteBtn');

  const missingElements = [];
  if (!filtroInput) missingElements.push('filtroInput');
  if (!clienteForm) missingElements.push('clienteForm');
  if (!limparFiltrosBtn) missingElements.push('limparFiltros');
  if (!excluirClienteBtn) missingElements.push('excluirClienteBtn');

  if (missingElements.length > 0) {
    console.error('Elementos DOM faltando:', missingElements);
    showErrorToast(`Erro: Elementos não encontrados no HTML: ${missingElements.join(', ')}`);
    return;
  }

  filtroInput.addEventListener('input', filtrarClientes);
  limparFiltrosBtn.addEventListener('click', limparFiltros);

  document.querySelectorAll('.filter-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      showFilterDropdown(icon.dataset.column, icon);
    });
  });

  excluirClienteBtn.addEventListener('click', () => {
    const id = document.getElementById('clienteIndex').value;
    if (id) {
      excluirCliente(id);
    }
  });

  clienteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const checkboxes = Array.from(document.querySelectorAll('#tipo_servico input[type="checkbox"]:checked'));
    let tipoServico = [];
    
    checkboxes.forEach(checkbox => {
      if (checkbox.value === 'Escrita Fiscal,Contábil,Departamento Pessoal') {
        tipoServico.push('Escrita Fiscal', 'Contábil', 'Departamento Pessoal');
      } else if (checkbox.value === 'Escrita Fiscal,Contábil') {
        tipoServico.push('Escrita Fiscal', 'Contábil');
      } else {
        tipoServico.push(checkbox.value);
      }
    });

    tipoServico = [...new Set(tipoServico)];

    const dataEntrada = document.getElementById('data_entrada').value || null;
    const dataSaida = document.getElementById('data_saida').value || null;

    const cliente = {
      codigo: document.getElementById('codigo').value,
      nome: document.getElementById('nome').value,
      razao_social: document.getElementById('razao_social').value,
      cpf_cnpj: document.getElementById('cpf_cnpj').value,
      regime_fiscal: document.getElementById('regime_fiscal').value,
      situacao: document.getElementById('situacao').value,
      tipo_pessoa: document.getElementById('tipo_pessoa').value,
      estado: document.getElementById('estado').value,
      municipio: document.getElementById('municipio').value,
      status: document.getElementById('status').value,
      possui_ie: document.getElementById('possui_ie').value,
      ie: document.getElementById('ie').value,
      filial: document.getElementById('filial').value,
      empresa_matriz: document.getElementById('empresa_matriz').value,
      grupo: document.getElementById('grupo').value,
      segmento: document.getElementById('segmento').value,
      data_entrada: dataEntrada,
      data_saida: dataSaida,
      sistema: document.getElementById('sistema').value,
      tipo_servico: tipoServico.length > 0 ? tipoServico : []
    };
    const id = document.getElementById('clienteIndex').value;

    if (cliente.data_entrada && cliente.data_saida && new Date(cliente.data_saida) < new Date(cliente.data_entrada)) {
      showErrorToast('Data de Saída deve ser posterior à Data de Entrada.');
      return;
    }

    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `${API_BASE_URL}/api/clientes/${id}` : `${API_BASE_URL}/api/clientes`;
      console.log('Enviando cliente:', {
        ...cliente,
        data_entrada: cliente.data_entrada,
        data_saida: cliente.data_saida
      });
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(cliente)
      });
      const result = await response.json();
      if (result.success) {
        showSuccessToast(id ? 'Cliente atualizado com sucesso!' : 'Cliente adicionado com sucesso!');
        renderizarClientes();
        bootstrap.Modal.getInstance(document.getElementById('clienteModal')).hide();
      } else {
        showErrorToast(result.error || result.details || 'Erro ao salvar cliente.');
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      showErrorToast('Erro ao salvar cliente: ' + error.message);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM carregado');
  renderNavbar();
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  if (currentPage === 'index.html') {
    inicializarEventos();
    renderizarClientes();
  }
});