/**
 * Midnight Network Login Handler
 * Este script gerencia a conexão com a Midnight Network usando mnLace
 */

// Variáveis globais
let isConnecting = false;
let currentWallet = null;
let walletApi = null;

/**
 * Função principal para conectar à Midnight Network
 */
async function connectToMidnight() {
    const loginButton = document.getElementById('loginButton');
    const statusDiv = document.getElementById('status');
    const walletInfoDiv = document.getElementById('walletInfo');
    
    // Prevenir múltiplas conexões simultâneas
    if (isConnecting) {
        showStatus('Conexão já em andamento...', 'info');
        return;
    }
    
    try {
        isConnecting = true;
        loginButton.disabled = true;
        loginButton.textContent = 'Conectando...';
        
        showStatus('Iniciando conexão com Midnight Network...', 'info');
        
        // Verificar se o objeto midnight está disponível
        if (typeof midnight === 'undefined' || !midnight.mnLace) {
            throw new Error('Midnight Network não está disponível. Por favor, instale a extensão mnLace ou acesse através de um navegador compatível.');
        }
        
        showStatus('Solicitando acesso à carteira...', 'info');
        const api = await midnight.mnLace.enable();
        if (!api) {
            throw new Error('Acesso à carteira negado pelo usuário.');
        }
        walletApi = await api.state();
        console.log(walletApi)

        showStatus('Obtendo informações da carteira...', 'info');
//        const networkId = await api.getNetworkId();
        let walletAddress = await walletApi.address;
        if (!walletAddress) {
            const used = await api.getUsedAddresses();
            walletAddress = used && used.length ? used[0] : null;
        }
        
        if (!walletAddress) {
            throw new Error('Não foi possível obter o endereço da carteira.');
        }
        
        // Armazenar informações da carteira
        currentWallet = {
            address: walletAddress,
  //          networkId: networkId,
            connected: true
        };
        
        // Atualizar interface
        updateWalletInfo(walletAddress, networkId);
        
        // Inicializar contrato inteligente
        initializeContract(walletApi);
        
        // Mostrar seção do contrato
        document.getElementById('contractSection').style.display = 'block';
        
        // Inicializar contador de caracteres
        initializeMessageInput();
        
        showStatus('✅ Conectado com sucesso à Midnight Network!', 'success');
        
        // Atualizar botão
        loginButton.textContent = 'Conectado';
        loginButton.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';
        
        console.log('Midnight Network - Carteira conectada:', { address: walletAddress, networkId });
        
    } catch (error) {
        console.error('Erro ao conectar à Midnight Network:', error);
        
        let errorMessage = 'Erro desconhecido ao conectar.';
        
        if (error.message) {
            errorMessage = error.message;
        } else if (error.code) {
            switch (error.code) {
                case 'USER_REJECTED':
                    errorMessage = 'Conexão cancelada pelo usuário.';
                    break;
                case 'NO_WALLET':
                    errorMessage = 'Nenhuma carteira encontrada. Por favor, instale a extensão mnLace.';
                    break;
                case 'NETWORK_ERROR':
                    errorMessage = 'Erro de rede. Verifique sua conexão.';
                    break;
                default:
                    errorMessage = `Erro: ${error.code}`;
            }
        }
        
        showStatus(`❌ ${errorMessage}`, 'error');
        
        // Resetar botão
        loginButton.disabled = false;
        loginButton.textContent = 'Conectar Carteira';
        
    } finally {
        isConnecting = false;
    }
}

/**
 * Atualizar informações da carteira na interface
 */
function updateWalletInfo(address, networkId) {
    const walletInfoDiv = document.getElementById('walletInfo');
    const walletAddressSpan = document.getElementById('walletAddress');
    const networkIdSpan = document.getElementById('networkId');
    const connectionStatusSpan = document.getElementById('connectionStatus');
    
    // Formatar endereço (mostrar primeiros e últimos 8 caracteres)
    const formattedAddress = formatAddress(address);
    
    walletAddressSpan.textContent = formattedAddress;
    networkIdSpan.textContent = networkId || 'Desconhecido';
    connectionStatusSpan.textContent = 'Conectado';
    connectionStatusSpan.style.color = '#2ecc71';
    
    walletInfoDiv.style.display = 'block';
}

/**
 * Formatar endereço da carteira para exibição
 */
function formatAddress(address) {
    if (!address || address.length < 16) {
        return address;
    }
    
    const start = address.substring(0, 8);
    const end = address.substring(address.length - 8);
    
    return `${start}...${end}`;
}

/**
 * Mostrar status/mensagens na interface
 */
function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    // Auto-ocultar mensagens de sucesso após 5 segundos
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

/**
 * Verificar status da conexão periodicamente
 */
async function checkConnectionStatus() {
    if (!currentWallet || !currentWallet.connected) {
        return;
    }
    
    try {
        if (typeof midnight !== 'undefined' && midnight.mnLace) {
            const isStillEnabled = await midnight.mnLace.isEnabled();
            
            if (!isStillEnabled) {
                // Conexão perdida
                currentWallet = null;
                document.getElementById('walletInfo').style.display = 'none';
                document.getElementById('contractSection').style.display = 'none';
                document.getElementById('loginButton').textContent = 'Conectar Carteira';
                document.getElementById('loginButton').style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a24)';
                showStatus('Conexão com a carteira perdida. Por favor, reconecte.', 'error');
            }
        }
    } catch (error) {
        console.warn('Erro ao verificar status da conexão:', error);
    }
}

/**
 * Inicializar a aplicação quando o DOM estiver pronto
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌙 Midnight Network Login - Inicializado');
    
    // Verificar se midnight está disponível
    if (typeof midnight === 'undefined' || !midnight.mnLace) {
        showStatus('⚠️ Extensão mnLace não detectada. Por favor, instale a extensão para continuar.', 'error');
        document.getElementById('loginButton').disabled = true;
    }
    
    // Verificar status da conexão a cada 30 segundos
    setInterval(checkConnectionStatus, 30000);
});

/**
 * Função auxiliar para debug
 */
window.debugMidnight = function() {
    console.log('=== Midnight Network Debug ===');
    console.log('midnight object:', typeof midnight);
    console.log('midnight.mnLace:', midnight?.mnLace);
    console.log('currentWallet:', currentWallet);
    console.log('===========================');
};

/**
 * Funções do Contrato Inteligente
 */

/**
 * Inicializar input de mensagem com contador de caracteres
 */
function initializeMessageInput() {
    const messageInput = document.getElementById('messageInput');
    const charCount = document.getElementById('charCount');
    
    if (messageInput && charCount) {
        messageInput.addEventListener('input', function() {
            const length = this.value.length;
            charCount.textContent = length;
            
            // Mudar cor se estiver perto do limite
            if (length > 900) {
                charCount.style.color = '#e74c3c';
            } else if (length > 700) {
                charCount.style.color = '#f39c12';
            } else {
                charCount.style.color = 'rgba(255, 255, 255, 0.8)';
            }
        });
    }
}

/**
 * Mostrar status da mensagem
 */
function showMessageStatus(message, type = 'info') {
    const statusDiv = document.getElementById('messageStatus');
    
    statusDiv.textContent = message;
    statusDiv.className = `message-status ${type}`;
    statusDiv.style.display = 'block';
    
    // Auto-ocultar mensagens de sucesso após 5 segundos
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

/**
 * Salvar mensagem no contrato inteligente
 */
async function saveMessageToContract() {
    const messageInput = document.getElementById('messageInput');
    const saveButton = document.getElementById('saveMessageBtn');
    
    if (!messageInput || !messageInput.value.trim()) {
        showMessageStatus('Por favor, insira uma mensagem.', 'error');
        return;
    }
    
    try {
        // Desabilitar botão durante o processo
        saveButton.disabled = true;
        saveButton.textContent = '💾 Salvando...';
        
        showMessageStatus('Salvando mensagem na blockchain...', 'info');
        
        // Salvar mensagem no contrato
        const txHash = await window.MidnightContract.savePrivateMessage(messageInput.value);
        
        showMessageStatus(`✅ Mensagem salva com sucesso! Hash: ${txHash.substring(0, 10)}...`, 'success');
        
        // Limpar input
        messageInput.value = '';
        document.getElementById('charCount').textContent = '0';
        
        console.log('Mensagem salva na blockchain:', txHash);
        
    } catch (error) {
        console.error('Erro ao salvar mensagem:', error);
        showMessageStatus(`❌ Erro: ${error.message}`, 'error');
    } finally {
        // Reabilitar botão
        saveButton.disabled = false;
        saveButton.textContent = '💾 Salvar Mensagem';
    }
}

/**
 * Resgatar mensagem do contrato inteligente
 */
async function retrieveMessageFromContract() {
    const retrieveButton = document.getElementById('retrieveMessageBtn');
    const savedMessageDiv = document.getElementById('savedMessage');
    const retrievedContent = document.getElementById('retrievedMessageContent');
    const messageTimestamp = document.getElementById('messageTimestamp');
    
    try {
        // Desabilitar botão durante o processo
        retrieveButton.disabled = true;
        retrieveButton.textContent = '📖 Resgatando...';
        
        showMessageStatus('Buscando mensagem na blockchain...', 'info');
        
        // Resgatar mensagem do contrato
        const message = await window.MidnightContract.retrievePrivateMessage();
        
        if (message) {
            // Mostrar mensagem
            retrievedContent.textContent = message;
            messageTimestamp.textContent = `Resgatado em: ${new Date().toLocaleString('pt-BR')}`;
            savedMessageDiv.style.display = 'block';
            
            showMessageStatus('✅ Mensagem resgatada com sucesso!', 'success');
            
            console.log('Mensagem resgatada:', message);
        } else {
            showMessageStatus('ℹ️ Nenhuma mensagem encontrada para este endereço.', 'info');
            savedMessageDiv.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Erro ao resgatar mensagem:', error);
        showMessageStatus(`❌ Erro: ${error.message}`, 'error');
        savedMessageDiv.style.display = 'none';
    } finally {
        // Reabilitar botão
        retrieveButton.disabled = false;
        retrieveButton.textContent = '📖 Resgatar Mensagem';
    }
}