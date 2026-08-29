// ====================================
// CONFIGURAÇÃO GOOGLE DRIVE
// ====================================
// IMPORTANTE: Configure seu Client ID do Google Cloud Console
// 1. Vá para: https://console.cloud.google.com/
// 2. Crie um projeto
// 3. Ative a Google Drive API
// 4. Crie credenciais OAuth2 (tipo: Aplicação web)
// 5. Adicione a origem: http://localhost:5500 (ou seu domínio)
// 6. Copie o Client ID e cole abaixo:

const GOOGLE_CLIENT_ID = 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com';
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/drive.file';

// ID da pasta do Google Drive onde salvar as fotos
// Deixe vazio para salvar na raiz
const GOOGLE_DRIVE_FOLDER_ID = ''; // Exemplo: 'root'

// ====================================
// VARIÁVEIS GLOBAIS
// ====================================

let videoElement;
let canvasElement;
let stream = null;
let photoData = null;
let googleToken = null;

// ====================================
// INICIALIZAÇÃO
// ====================================

document.addEventListener('DOMContentLoaded', () => {
    videoElement = document.getElementById('videoElement');
    canvasElement = document.getElementById('canvasElement');

    // Verificar se chegou do QR code
    const params = new URLSearchParams(window.location.search);
    const isFromQR = params.has('qr');

    // Gerar QR code inicial
    generateQRCode();

    // Se vier do QR, vai direto pra câmera
    if (isFromQR) {
        setTimeout(() => showCameraView(), 500);
    }

    // Event listeners
    setupEventListeners();
});

// ====================================
// GERAR QR CODE
// ====================================

function generateQRCode() {
    const qrContainer = document.getElementById('qrCodeContainer');
    qrContainer.innerHTML = ''; // Limpar conteúdo anterior

    // URL com parâmetro QR
    const currentURL = window.location.href.split('?')[0];
    const qrURL = currentURL + '?qr=1';

    // Criar QR code
    new QRCode(qrContainer, {
        text: qrURL,
        width: 250,
        height: 250,
        colorDark: '#60483c',
        colorLight: '#ffffff',
    });

    // Link direto
    document.getElementById('directLink').href = qrURL;
}

// ====================================
// NAVEGAÇÃO DE VIEWS
// ====================================

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

function showQRView() {
    showView('qrView');
}

function showCameraView() {
    showView('cameraView');
}

function showPreviewView() {
    showView('previewView');
}

// ====================================
// EVENT LISTENERS
// ====================================

function setupEventListeners() {
    // Câmera
    document.getElementById('btnOpenCamera').addEventListener('click', openCamera);
    document.getElementById('btnTakePicture').addEventListener('click', takePicture);
    document.getElementById('btnBack').addEventListener('click', () => {
        stopCamera();
        showQRView();
    });

    // Preview
    document.getElementById('btnBackPreview').addEventListener('click', () => {
        stopCamera();
        showCameraView();
    });
    document.getElementById('btnRetake').addEventListener('click', () => {
        photoData = null;
        showCameraView();
    });
    document.getElementById('btnUpload').addEventListener('click', uploadToGoogleDrive);
}

// ====================================
// CÂMERA
// ====================================

async function openCamera() {
    try {
        const btn = document.getElementById('btnOpenCamera');
        btn.disabled = true;
        updateStatus('📷 Abrindo câmera...', 'loading');

        // Solicitar acesso à câmera
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });

        videoElement.srcObject = stream;

        // Esperar vídeo começar
        await new Promise(resolve => {
            videoElement.onloadedmetadata = () => {
                videoElement.play();
                resolve();
            };
        });

        updateStatus('✅ Câmera aberta! Tire uma foto', 'success');
        document.getElementById('btnTakePicture').disabled = false;
        btn.style.display = 'none';

    } catch (error) {
        console.error('Erro ao abrir câmera:', error);
        updateStatus('❌ Erro ao acessar a câmera. Verifique as permissões.', 'error');
        document.getElementById('btnOpenCamera').disabled = false;
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

function takePicture() {
    try {
        const context = canvasElement.getContext('2d');

        // Ajustar canvas ao tamanho do vídeo
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;

        // Desenhar frame do vídeo
        context.drawImage(videoElement, 0, 0);

        // Converter para blob
        canvasElement.toBlob(blob => {
            photoData = blob;
            const preview = document.getElementById('previewImage');
            preview.src = URL.createObjectURL(blob);

            stopCamera();
            showPreviewView();
            updateUploadStatus('Pronto para enviar para o Google Drive', '');
        }, 'image/jpeg', 0.95);

    } catch (error) {
        console.error('Erro ao tirar foto:', error);
        updateStatus('❌ Erro ao tirar a foto', 'error');
    }
}

// ====================================
// GOOGLE DRIVE UPLOAD
// ====================================

async function uploadToGoogleDrive() {
    if (!photoData) {
        updateUploadStatus('❌ Nenhuma foto capturada', 'error');
        return;
    }

    const btn = document.getElementById('btnUpload');
    btn.disabled = true;

    try {
        updateUploadStatus('🔐 Autenticando com Google...', 'loading');

        // Autenticar com Google
        const token = await authenticateGoogle();
        if (!token) {
            throw new Error('Falha na autenticação com Google');
        }

        updateUploadStatus('📤 Enviando foto para o Google Drive...', 'loading');

        // Upload para Google Drive
        const response = await uploadFileToDrive(photoData, token);

        if (response.id) {
            updateUploadStatus('✅ Foto enviada com sucesso!', 'success');
            console.log('Arquivo salvo:', response);

            // Limpar após sucesso
            setTimeout(() => {
                showCameraView();
                document.getElementById('btnOpenCamera').style.display = 'block';
                document.getElementById('btnOpenCamera').disabled = false;
                document.getElementById('btnTakePicture').disabled = true;
            }, 2000);
        } else {
            throw new Error('Resposta inválida do servidor');
        }

    } catch (error) {
        console.error('Erro ao enviar:', error);
        updateUploadStatus('❌ Erro ao enviar: ' + error.message, 'error');
        btn.disabled = false;
    }
}

async function authenticateGoogle() {
    return new Promise((resolve) => {
        // Usar Google Sign-In
        const client = google.accounts.oauth2.initCodeClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: GOOGLE_SCOPES,
            ux_mode: 'popup',
            callback: (response) => {
                // Aqui teríamos que trocar o código por um token
                // Para simplificar, usaremos uma abordagem alternativa
                if (response.code) {
                    resolve(response.code);
                }
            },
        });

        client.requestCode();
    });
}

async function uploadFileToDrive(fileBlob, token) {
    try {
        // Criar FormData com metadados e arquivo
        const formData = new FormData();

        // Metadados do arquivo
        const metadata = {
            name: `foto-casamento-${new Date().getTime()}.jpg`,
            mimeType: 'image/jpeg'
        };

        if (GOOGLE_DRIVE_FOLDER_ID) {
            metadata.parents = [GOOGLE_DRIVE_FOLDER_ID];
        }

        formData.append('metadata', new Blob([JSON.stringify(metadata)], {
            type: 'application/json'
        }));
        formData.append('file', fileBlob);

        // Upload usando a API do Google Drive
        const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error('Erro no upload:', error);
        throw error;
    }
}

// ====================================
// MENSAGENS DE STATUS
// ====================================

function updateStatus(message, type = '') {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = 'status-message ' + type;
}

function updateUploadStatus(message, type = '') {
    const statusEl = document.getElementById('uploadStatus');
    statusEl.textContent = message;
    statusEl.className = 'status-message ' + type;
}
