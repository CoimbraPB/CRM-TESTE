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
    console.error('Toast elements not found:', { toast, toastMessage });
    alert(message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('Inicializando ocorrencias-gestor.js');
  const token = localStorage.getItem('token');
  const permissao = localStorage.getItem('permissao');
  const permissoesPermitidas = ['Gerente', 'Gestor'];

  if (!token || !permissoesPermitidas.includes(permissao)) {
    showErrorToast('Acesso negado. Faça login como Gerente ou Gestor.');
    setTimeout(() => window.location.href = 'login.html', 1000);
    return;
  }

  const form = document.getElementById('ocorrenciaForm');
  const advertidoSelect = document.getElementById('advertido');
  const tipoAdvertenciaContainer = document.getElementById('tipo_advertencia_container');
  const advertenciaOutraContainer = document.getElementById('advertencia_outra_container');
  const tipoAdvertenciaSelect = document.getElementById('tipo_advertencia');
  const clienteComunicadoSelect = document.getElementById('cliente_comunicado');
  const meioComunicacaoContainer = document.getElementById('meio_comunicacao_container');
  const comunicacaoOutroContainer = document.getElementById('comunicacao_outro_container');
  const meioComunicacaoSelect = document.getElementById('meio_comunicacao');

  const requiredElements = [
    'ocorrenciaForm', 'advertido', 'tipo_advertencia_container', 'advertencia_outra_container',
    'tipo_advertencia', 'cliente_comunicado', 'meio_comunicacao_container',
    'comunicacao_outro_container', 'meio_comunicacao', 'data_ocorrencia', 'setor',
    'descricao', 'cliente_impactado', 'valor_desconto', 'colaborador_nome',
    'colaborador_cargo', 'advertencia_outra', 'comunicacao_outro', 'acoes_imediatas',
    'acoes_corretivas', 'acoes_preventivas', 'responsavel_nome', 'responsavel_data'
  ];

  const missingElements = requiredElements.filter(id => !document.getElementById(id));
  if (missingElements.length > 0) {
    console.error('Elementos do formulário não encontrados:', missingElements);
    showErrorToast(`Erro: Campos não encontrados no formulário: ${missingElements.join(', ')}`);
    return;
  }

  advertidoSelect.addEventListener('change', () => {
    tipoAdvertenciaContainer.style.display = advertidoSelect.value === 'Sim' ? 'block' : 'none';
    advertenciaOutraContainer.style.display = advertidoSelect.value === 'Sim' && tipoAdvertenciaSelect.value === 'Outra' ? 'block' : 'none';
  });

  tipoAdvertenciaSelect.addEventListener('change', () => {
    advertenciaOutraContainer.style.display = tipoAdvertenciaSelect.value === 'Outra' ? 'block' : 'none';
  });

  clienteComunicadoSelect.addEventListener('change', () => {
    meioComunicacaoContainer.style.display = clienteComunicadoSelect.value === 'Sim' ? 'block' : 'none';
    comunicacaoOutroContainer.style.display = clienteComunicadoSelect.value === 'Sim' && meioComunicacaoSelect.value === 'Outro' ? 'block' : 'none';
  });

  meioComunicacaoSelect.addEventListener('change', () => {
    comunicacaoOutroContainer.style.display = meioComunicacaoSelect.value === 'Outro' ? 'block' : 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Submetendo formulário de ocorrência');

    const ocorrencia = {
      data_ocorrencia: document.getElementById('data_ocorrencia').value,
      setor: document.getElementById('setor').value,
      descricao: document.getElementById('descricao').value,
      cliente_impactado: document.getElementById('cliente_impactado').value,
      valor_desconto: document.getElementById('valor_desconto').value,
      tipo_desconto: document.querySelector('input[name="tipo_desconto"]:checked')?.value || '',
      colaborador_nome: document.getElementById('colaborador_nome').value,
      colaborador_cargo: document.getElementById('colaborador_cargo').value,
      advertido: document.getElementById('advertido').value,
      tipo_advertencia: advertidoSelect.value === 'Sim' ? document.getElementById('tipo_advertencia').value : '',
      advertencia_outra: tipoAdvertenciaSelect.value === 'Outra' ? document.getElementById('advertencia_outra').value : '',
      cliente_comunicado: document.getElementById('cliente_comunicado').value,
      meio_comunicacao: clienteComunicadoSelect.value === 'Sim' ? document.getElementById('meio_comunicacao').value : '',
      comunicacao_outro: meioComunicacaoSelect.value === 'Outro' ? document.getElementById('comunicacao_outro').value : '',
      acoes_imediatas: document.getElementById('acoes_imediatas').value,
      acoes_corretivas: document.getElementById('acoes_corretivas').value,
      acoes_preventivas: document.getElementById('acoes_preventivas').value,
      responsavel_nome: document.getElementById('responsavel_nome').value,
      responsavel_data: document.getElementById('responsavel_data').value
    };

    try {
      console.log('Enviando ocorrência:', ocorrencia);
      const response = await fetch(`${API_BASE_URL}/api/ocorrencias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ocorrencia)
      });
      console.log('Resposta do servidor:', response.status);
      const result = await response.json();
      if (result.success) {
        showSuccessToast('Ocorrência registrada com sucesso!');
        form.reset();
        tipoAdvertenciaContainer.style.display = 'none';
        advertenciaOutraContainer.style.display = 'none';
        meioComunicacaoContainer.style.display = 'none';
        comunicacaoOutroContainer.style.display = 'none';
      } else {
        showErrorToast(result.error || 'Erro ao registrar ocorrência.');
      }
    } catch (error) {
      console.error('Erro ao enviar ocorrência:', error);
      showErrorToast('Erro ao registrar ocorrência: ' + error.message);
    }
  });
});