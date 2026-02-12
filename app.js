// ========== BANCO DE DADOS (localStorage) ==========
let pacientes = JSON.parse(localStorage.getItem('andy_pacientes')) || [];
let pacienteAtualId = null;
let docPacienteId = null;
let xrayPacienteId = null;
let ultimoDocumento = '';

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
  renderPatientList();
  renderPatientSelectors();
  initToothGrid();
  showSection('patients');
});

// ========== SEÇÕES / NAVEGAÇÃO ==========
window.showSection = function(section) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  
  if (section === 'patients') {
    document.getElementById('patientsSection').classList.add('active');
    document.getElementById('nav-patients').classList.add('active');
    renderPatientList();
    renderPatientSelectors();
  } else if (section === 'record') {
    document.getElementById('recordSection').classList.add('active');
    document.getElementById('nav-patients').classList.add('active'); // highlight pacientes
    if (pacienteAtualId) loadClinicalRecord();
  } else if (section === 'documents') {
    document.getElementById('documentsSection').classList.add('active');
    document.getElementById('nav-documents').classList.add('active');
    renderPatientSelectors();
  } else if (section === 'xray') {
    document.getElementById('xraySection').classList.add('active');
    document.getElementById('nav-xray').classList.add('active');
    renderPatientSelectors();
    loadXrays();
  }
}

// ========== PACIENTES ==========
window.addPatient = function() {
  const nome = prompt('Nome completo do paciente:');
  if (!nome) return;
  const novo = {
    id: Date.now(),
    nome: nome,
    idade: '',
    contato: '',
    odontograma: Array(32).fill(false),
    notas: '',
    radiografias: [],
    documentos: []
  };
  pacientes.push(novo);
  localStorage.setItem('andy_pacientes', JSON.stringify(pacientes));
  renderPatientList();
  renderPatientSelectors();
}

function renderPatientList() {
  const el = document.getElementById('patientList');
  if (pacientes.length === 0) {
    el.innerHTML = '<p style="color: #6c7a89;">Nenhum paciente cadastrado.</p>';
    return;
  }
  let html = '<ul style="list-style: none;">';
  pacientes.forEach(p => {
    html += `<li style="padding: 14px; border-bottom: 1px solid #e0ecf0; display: flex; justify-content: space-between;">
                <span><strong>${p.nome}</strong> ${p.idade ? '· '+p.idade : ''}</span>
                <span>
                  <button class="btn-small" onclick="selectPatient(${p.id})"><i class="fas fa-folder-open"></i></button>
                  <button class="btn-small" onclick="deletePatient(${p.id})" style="background: none; color: #c00;"><i class="fas fa-trash"></i></button>
                </span>
              </li>`;
  });
  html += '</ul>';
  el.innerHTML = html;
}

window.selectPatient = function(id) {
  pacienteAtualId = id;
  showSection('record');
}

window.deletePatient = function(id) {
  if (confirm('Remover paciente?')) {
    pacientes = pacientes.filter(p => p.id !== id);
    localStorage.setItem('andy_pacientes', JSON.stringify(pacientes));
    renderPatientList();
    renderPatientSelectors();
  }
}

function renderPatientSelectors() {
  const selects = ['patientSelector', 'docPatientSelector', 'xrayPatientSelector'];
  selects.forEach(selId => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    let options = '<option value="">— Selecione —</option>';
    pacientes.forEach(p => {
      options += `<option value="${p.id}">${p.nome}</option>`;
    });
    sel.innerHTML = options;
  });
}

// ========== PRONTUÁRIO / ODONTOGRAMA ==========
function initToothGrid() {
  const grid = document.getElementById('teethGrid');
  let html = '';
  for (let i = 1; i <= 32; i++) {
    html += `<div class="tooth" data-tooth="${i}" onclick="toggleTooth(${i})">
              <span>🦷</span>${i}
            </div>`;
  }
  grid.innerHTML = html;
}

window.toggleTooth = function(toothNum) {
  if (!pacienteAtualId) return alert('Selecione um paciente.');
  const paciente = pacientes.find(p => p.id == pacienteAtualId);
  if (!paciente) return;
  if (!paciente.odontograma) paciente.odontograma = Array(32).fill(false);
  paciente.odontograma[toothNum-1] = !paciente.odontograma[toothNum-1];
  localStorage.setItem('andy_pacientes', JSON.stringify(pacientes));
  highlightTeeth(paciente.odontograma);
}

function highlightTeeth(odontoArray) {
  const teeth = document.querySelectorAll('.tooth');
  teeth.forEach((t, idx) => {
    if (odontoArray && odontoArray[idx]) t.classList.add('selected');
    else t.classList.remove('selected');
  });
}

window.loadClinicalRecord = function() {
  const sel = document.getElementById('patientSelector');
  if (!sel.value) return alert('Escolha um paciente');
  pacienteAtualId = parseInt(sel.value);
  const paciente = pacientes.find(p => p.id == pacienteAtualId);
  if (paciente) {
    document.getElementById('recordPatientName').innerText = paciente.nome;
    document.getElementById('clinicalNotes').value = paciente.notas || '';
    if (!paciente.odontograma) paciente.odontograma = Array(32).fill(false);
    highlightTeeth(paciente.odontograma);
    showSection('record');
  }
}

window.openRecord = function() {
  const sel = document.getElementById('patientSelector');
  if (sel.value) loadClinicalRecord();
}

window.saveClinicalRecord = function() {
  if (!pacienteAtualId) return;
  const paciente = pacientes.find(p => p.id == pacienteAtualId);
  if (paciente) {
    paciente.notas = document.getElementById('clinicalNotes').value;
    localStorage.setItem('andy_pacientes', JSON.stringify(pacientes));
    alert('Prontuário salvo!');
  }
}

// ========== GERADOR DE DOCUMENTOS ==========
window.updateDocPatient = function() {
  const sel = document.getElementById('docPatientSelector');
  docPacienteId = sel.value ? parseInt(sel.value) : null;
}

window.generateDoc = function(tipo) {
  if (!docPacienteId) return alert('Selecione um paciente.');
  const paciente = pacientes.find(p => p.id == docPacienteId);
  if (!paciente) return;
  
  const hoje = new Date().toLocaleDateString('pt-BR');
  let conteudo = '';
  const nome = paciente.nome;
  
  switch(tipo) {
    case 'prescricao':
      conteudo = `RECEITUÁRIO MÉDICO\nDr. Andy Odontologia - CRO 0000\n\nPaciente: ${nome}\nData: ${hoje}\n\nPrescrição:\n- Amoxicilina 500mg, 1 cápsula de 8/8h por 7 dias.\n- Ibuprofeno 600mg, 1 comprimido de 6/6h se dor.\n\n${'_'.repeat(40)}\nAssinatura e carimbo`;
      break;
    case 'orcamento':
      conteudo = `ORÇAMENTO ODONTOLÓGICO\nPaciente: ${nome}\nData: ${hoje}\n\nProcedimentos:\n1. Restauração dente 26 ........ R$ 250,00\n2. Profilaxia ................... R$ 120,00\n3. Aplicação de flúor ........... R$ 80,00\n\nTOTAL: R$ 450,00\n\nValidade: 30 dias.`;
      break;
    case 'laudo':
      conteudo = `LAUDO ODONTOLÓGICO\nPaciente: ${nome}\nData: ${hoje}\n\nExame: Radiografia panorâmica\nConclusão: Presença de cárie proximal no dente 15, reabilitação indicada.\n\n${'_'.repeat(40)}\nDr. Andy - CRO 1234`;
      break;
    case 'atestado':
      conteudo = `ATESTADO ODONTOLÓGICO\nAtesto que ${nome} compareceu a esta clínica no dia ${hoje}, para atendimento de urgência, necessitando de repouso por 24 horas.\n\n${'_'.repeat(40)}\nCarimbo e assinatura`;
      break;
  }
  ultimoDocumento = conteudo;
  document.getElementById('docContent').innerText = conteudo;
}

window.printDoc = function() {
  if (!ultimoDocumento) return alert('Nenhum documento gerado.');
  const win = window.open('', '_blank');
  win.document.write(`<pre style="font-family: monospace; padding: 20px;">${ultimoDocumento}</pre>`);
  win.document.close();
  win.print();
}

// ========== RADIOGRAFIAS ==========
window.loadXrays = function() {
  const sel = document.getElementById('xrayPatientSelector');
  if (!sel.value) {
    document.getElementById('xrayGallery').innerHTML = '<p>Selecione um paciente.</p>';
    return;
  }
  xrayPacienteId = parseInt(sel.value);
  const paciente = pacientes.find(p => p.id == xrayPacienteId);
  if (paciente) {
    const galeria = document.getElementById('xrayGallery');
    if (!paciente.radiografias || paciente.radiografias.length === 0) {
      galeria.innerHTML = '<p>Nenhuma radiografia.</p>';
      return;
    }
    let html = '';
    paciente.radiografias.forEach((imgBase64, idx) => {
      html += `<div class="radio-item">
                <img src="${imgBase64}" alt="radiografia" onclick="verImagem('${imgBase64}')">
                <small>Raio-X ${idx+1}</small>
                <button class="btn-small" onclick="deleteXray(${idx})" style="margin-top:6px;">🗑️</button>
              </div>`;
    });
    galeria.innerHTML = html;
  }
}

window.handleXrayUpload = function(event) {
  if (!xrayPacienteId) return alert('Selecione um paciente.');
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const paciente = pacientes.find(p => p.id == xrayPacienteId);
    if (!paciente.radiografias) paciente.radiografias = [];
    paciente.radiografias.push(e.target.result);
    localStorage.setItem('andy_pacientes', JSON.stringify(pacientes));
    loadXrays();
  };
  reader.readAsDataURL(file);
  document.getElementById('xrayUpload').value = '';
}

window.deleteXray = function(index) {
  const paciente = pacientes.find(p => p.id == xrayPacienteId);
  if (paciente && paciente.radiografias) {
    paciente.radiografias.splice(index, 1);
    localStorage.setItem('andy_pacientes', JSON.stringify(pacientes));
    loadXrays();
  }
}

window.verImagem = function(src) {
  const win = window.open();
  win.document.write(`<img src="${src}" style="max-width:100%;">`);
}
