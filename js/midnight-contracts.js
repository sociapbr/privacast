/**
 * Midnight Network Smart Contract Integration
 * Contrato inteligente para salvar e resgatar mensagens privadas
 */

// Configuração do contrato
const CONTRACT_ADDRESS = 'mid1z3t4g9pq2m5x8v6c7n2k9p0q1w2e3r4t5y6u7i8o9p0';
const CONTRACT_SCRIPT_HASH = '0x1234567890abcdef1234567890abcdef12345678';

/**
 * Estrutura de dados para mensagens privadas
 * @typedef {Object} PrivateMessage
 * @property {string} owner - Endereço do proprietário da mensagem
 * @property {string} content - Conteúdo da mensagem (encriptado)
 * @property {number} timestamp - Timestamp de quando foi salva
 * @property {boolean} exists - Se a mensagem existe
 */

/**
 * Classe para interagir com o contrato inteligente
 */
class MidnightContract {
    constructor(walletApi) {
        this.walletApi = walletApi;
        this.contractAddress = CONTRACT_ADDRESS;
    }
    getOwnerAddress() {
        return this.walletApi?.address || '';
    }
    async deriveKey() {
        const owner = this.getOwnerAddress();
        console.log(owner);
        const enc = new TextEncoder();
        const salt = enc.encode('midnight-demo-salt');
        const baseKey = await crypto.subtle.importKey('raw', enc.encode(owner), { name: 'PBKDF2' }, false, ['deriveKey']);
        return await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
            baseKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }
    getStorageKey() {
        return 'midnight:msg:' + this.getOwnerAddress();
    }

    /**
     * Salvar uma mensagem privada no contrato
     * @param {string} message - Mensagem a ser salva
     * @returns {Promise<string>} - Hash da transação
     */
    async savePrivateMessage(message) {
        try {
            if (!this.walletApi) {
                throw new Error('Carteira não conectada');
            }
            const encryptedMessage = await this.encryptMessage(message);
            const record = { content: encryptedMessage, timestamp: Date.now() };
            const api = await midnight.mnLace.enable();
            const payload = { to: this.contractAddress, scriptHash: CONTRACT_SCRIPT_HASH, method: 'saveMessage', params: record };
            const tx = { ...payload, serialize: () => new TextEncoder().encode(JSON.stringify(payload)) };
            const txHash = await api.submitTransaction(tx);
            return txHash;
        } catch (error) {
            throw new Error(`Erro ao salvar mensagem: ${error.message}`);
        }
    }

    /**
     * Resgatar mensagem privada do contrato
     * @returns {Promise<string>} - Mensagem descriptografada
     */
    async retrievePrivateMessage() {
        try {
            if (!this.walletApi) {
                throw new Error('Carteira não conectada');
            }
            const item = localStorage.getItem(this.getStorageKey());
            if (!item) {
                return null;
            }
            const stored = JSON.parse(item);
            const decryptedMessage = await this.decryptMessage(stored.content);
            return decryptedMessage;
        } catch (error) {
            throw new Error(`Erro ao resgatar mensagem: ${error.message}`);
        }
    }

    /**
     * Verificar se o usuário tem uma mensagem salva
     * @returns {Promise<boolean>} - True se existe mensagem
     */
    async hasMessage() {
        try {
            return !!localStorage.getItem(this.getStorageKey());
        } catch (error) {
            return false;
        }
    }

    /**
     * Criptografar mensagem usando chave pública
     * @param {string} message - Mensagem a criptografar
     * @returns {Promise<string>} - Mensagem criptografada
     */
    async encryptMessage(message) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const key = await this.deriveKey();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );
        const encryptedArray = new Uint8Array(encrypted);
        const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
        const ivBase64 = btoa(String.fromCharCode(...iv));
        return `${ivBase64}:${encryptedBase64}`;
    }

    /**
     * Descriptografar mensagem
     * @param {string} encryptedMessage - Mensagem criptografada
     * @returns {Promise<string>} - Mensagem descriptografada
     */
    async decryptMessage(encryptedMessage) {
        const [ivBase64, encryptedBase64] = encryptedMessage.split(':');
        if (!ivBase64 || !encryptedBase64) {
            throw new Error('Formato de mensagem inválido');
        }
        const encryptedArray = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));
        const iv = new Uint8Array(atob(ivBase64).split('').map(c => c.charCodeAt(0)));
        const key = await this.deriveKey();
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encryptedArray
        );
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    }

    /**
     * Enviar transação para o contrato
     * @param {string} method - Método do contrato
     * @param {Object} data - Dados da transação
     * @returns {Promise<string>} - Hash da transação
     */
    async sendTransaction(method, data) {
        try {
            // Preparar a transação
            const tx = {
                to: this.contractAddress,
                method: method,
                params: data,
                gas: '1000000',
                gasPrice: '1000000000'
            };

            // Enviar via wallet API
            const txHash = await this.walletApi.sendTransaction(tx);
            return txHash;
            
        } catch (error) {
            throw new Error(`Erro ao enviar transação: ${error.message}`);
        }
    }

    /**
     * Consultar contrato
     * @param {string} method - Método do contrato
     * @param {Object} params - Parâmetros da consulta
     * @returns {Promise<Object>} - Resultado da consulta
     */
    async queryContract(method, params) {
        try {
            // Simular consulta ao contrato
            // Em produção, isso seria feito via API da Midnight Network
            const response = await this.simulateContractCall(method, params);
            return response;
            
        } catch (error) {
            throw new Error(`Erro ao consultar contrato: ${error.message}`);
        }
    }

    /**
     * Simular chamada ao contrato (para demonstração)
     * @param {string} method - Método do contrato
     * @param {Object} params - Parâmetros
     * @returns {Promise<Object>} - Resultado simulado
     */
    async simulateContractCall(method, params) {
        // Simulação de dados do contrato
        const mockData = {
            saveMessage: { success: true, txHash: '0x' + Math.random().toString(16).substr(2, 64) },
            getMessage: {
                exists: Math.random() > 0.5,
                content: 'U2FsdGVkX1+testeencryptedmessage1234567890abcdef',
                timestamp: Date.now() - Math.floor(Math.random() * 86400000)
            },
            hasMessage: { exists: Math.random() > 0.5 }
        };

        // Pequeno delay para simular rede
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return mockData[method] || { success: true };
    }
}

/**
 * Funções auxiliares para integração com a UI
 */

let contractInstance = null;

/**
 * Inicializar contrato com wallet API
 * @param {Object} walletApi - API da carteira conectada
 * @returns {MidnightContract} - Instância do contrato
 */
function initializeContract(walletApi) {
    contractInstance = new MidnightContract(walletApi);
    return contractInstance;
}

/**
 * Salvar mensagem privada (função para UI)
 * @param {string} message - Mensagem a ser salva
 * @returns {Promise<string>} - Hash da transação
 */
async function savePrivateMessage(message) {
    if (!contractInstance) {
        throw new Error('Contrato não inicializado. Por favor, conecte sua carteira primeiro.');
    }
    
    if (!message || message.trim().length === 0) {
        throw new Error('Por favor, insira uma mensagem válida.');
    }
    
    if (message.length > 1000) {
        throw new Error('Mensagem muito longa. Máximo 1000 caracteres.');
    }
    
    return await contractInstance.savePrivateMessage(message.trim());
}

/**
 * Resgatar mensagem privada (função para UI)
 * @returns {Promise<string>} - Mensagem resgatada
 */
async function retrievePrivateMessage() {
    if (!contractInstance) {
        throw new Error('Contrato não inicializado. Por favor, conecte sua carteira primeiro.');
    }
    
    return await contractInstance.retrievePrivateMessage();
}

/**
 * Verificar se usuário tem mensagem salva
 * @returns {Promise<boolean>} - True se existe mensagem
 */
async function hasPrivateMessage() {
    if (!contractInstance) {
        return false;
    }
    
    return await contractInstance.hasMessage();
}

// Exportar funções para uso global
window.MidnightContract = {
    initializeContract,
    savePrivateMessage,
    retrievePrivateMessage,
    hasPrivateMessage
};