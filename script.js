// ====================================
// CONFIGURAÇÃO GOOGLE APPS SCRIPT
// ====================================

// URL da implantação do seu Google Apps Script
const GOOGLE_APPS_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbzmg8sbeZcsCM0nlMDQ3nMOFw8iLtkuboRTocBvoDcxgCAx7F5zl4XE7kkPXoRBrYqe/exec';


// ====================================
// VARIÁVEIS GLOBAIS
// ====================================

let camera;
let canvas;
let stream = null;
let photoData = null;
let currentFacingMode = 'environment';


// ====================================
// INICIALIZAÇÃO
// ====================================

document.addEventListener('DOMContentLoaded', () => {

    camera = document.getElementById('camera');
    canvas = document.getElementById('canvas');

    // Verificar se chegou através do QR Code
    const params = new URLSearchParams(window.location.search);
    const isFromQR = params.has('qr');

    // Verificar se está na página de câmera
    const isOnCameraPage =
        window.location.pathname.includes('camera.html') ||
        window.location.href.includes('camera.html');

    // Gerar QR Code
    generateQRCode();

    // Configurar botões
    setupEventListeners();

});


// ====================================
// GERAR QR CODE
// ====================================

function generateQRCode() {

    const qrContainer =
        document.getElementById('qrCode');

    if (!qrContainer) {
        console.error(
            'Elemento qrCode não encontrado.'
        );
        return;
    }

    // Limpar QR anterior
    qrContainer.innerHTML = '';

    // URL atual sem parâmetros
    const currentURL =
        window.location.href.split('?')[0];

    // Se estiver em index.html, gera QR para camera.html
    // Se estiver em camera.html, gera QR para camera.html
    let baseURL = currentURL.replace('index.html', 'camera.html');
    if (!baseURL.includes('camera.html')) {
        baseURL = currentURL.replace(/\/$/, '') + '/camera.html';
    }

    // URL que será aberta pelo celular
    const qrURL =
        baseURL + '?qr=1';

    // Criar QR Code
    new QRCode(qrContainer, {

        text: qrURL,

        width: 250,

        height: 250,

        colorDark: '#60483c',

        colorLight: '#ffffff'

    });

    // Link direto
    const directLink =
        document.getElementById('directLink');

    if (directLink) {
        directLink.href = qrURL;
    }

}


// ====================================
// EVENT LISTENERS
// ====================================

function setupEventListeners() {

    // Botão abrir câmera
    const btnOpenCamera =
        document.getElementById('abrirCamera');

    if (btnOpenCamera) {
        btnOpenCamera.addEventListener(
            'click',
            openCamera
        );
    }

    // Botão tirar foto
    const btnTakePicture =
        document.getElementById('tirarFoto');

    if (btnTakePicture) {
        btnTakePicture.addEventListener(
            'click',
            () => {

                if (!stream) {
                    openCamera();
                    return;
                }

                takePicture();

            }
        );
    }

    const btnToggleCamera =
        document.getElementById('alternarCamera');

    if (btnToggleCamera) {
        btnToggleCamera.addEventListener(
            'click',
            toggleCamera
        );
    }

    // Botão enviar foto
    const btnUpload =
        document.getElementById('enviarFoto');

    const galleryInput =
        document.getElementById('galeriaFoto');

    if (btnUpload) {
        btnUpload.addEventListener(
            'click',
            () => {

                if (galleryInput && btnUpload.dataset.galleryReady !== 'true') {
                    galleryInput.click();
                    return;
                }

                uploadToGoogleDrive();

            }
        );
    }

    if (galleryInput) {
        galleryInput.addEventListener(
            'change',
            handleGallerySelection
        );
    }

}


// ====================================
// SELECIONAR FOTO DA GALERIA
// ====================================

function handleGallerySelection(event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }

    photoData = file;

    const preview =
        document.getElementById('preview');

    if (preview) {
        if (preview.dataset.objectUrl) {
            URL.revokeObjectURL(preview.dataset.objectUrl);
        }

        const imageURL = URL.createObjectURL(file);
        preview.src = imageURL;
        preview.dataset.objectUrl = imageURL;
    }

    const previewContainer =
        document.getElementById('previewContainer');

    const btnUpload =
        document.getElementById('enviarFoto');

    if (previewContainer) {
        previewContainer.style.display = 'block';
    }

    if (btnUpload) {
        btnUpload.dataset.galleryReady = 'true';
        btnUpload.textContent = '💕 Compartilhar foto';
        btnUpload.disabled = false;
    }

    updateStatus(
        '✅ Foto escolhida! Clique em compartilhar.',
        'success'
    );

}


// ====================================
// ABRIR CÂMERA
// ====================================

async function openCamera() {

    try {

        const btnTakePicture =
            document.getElementById('tirarFoto');

        const btnToggleCamera =
            document.getElementById('alternarCamera');

        const cameraArea =
            document.querySelector('.camera-area');

        // Desabilitar botão
        if (btnToggleCamera) {
            btnToggleCamera.disabled = true;
        }

        updateStatus(
            '📷 Abrindo câmera...',
            'loading'
        );

        // Verificar suporte
        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {
            throw new Error(
                'Seu navegador não suporta acesso à câmera.'
            );
        }

        stopCamera();

        // Solicitar câmera
        stream =
            await navigator
                .mediaDevices
                .getUserMedia({

                    video: {

                        facingMode: {
                            ideal: currentFacingMode
                        },

                        width: {
                            ideal: 1920
                        },

                        height: {
                            ideal: 1080
                        }

                    },

                    audio: false

                });

        // Colocar câmera no vídeo
        camera.srcObject = stream;

        if (cameraArea) {
            cameraArea.style.display = 'block';
        }

        // Esperar vídeo carregar
        await new Promise(
            resolve => {

                camera.onloadedmetadata =
                    () => {

                        camera.play();

                        resolve();

                    };

            }
        );

        updateStatus(
            '✅ Câmera aberta! Tire uma foto',
            'success'
        );

        // Liberar botão tirar foto
        if (btnTakePicture) {
            btnTakePicture.disabled = false;
        }

        if (btnToggleCamera) {
            btnToggleCamera.disabled = false;
            updateCameraToggleLabel();
        }

    } catch (error) {

        console.error(
            'Erro ao abrir câmera:',
            error
        );

        let mensagem =
            '❌ Erro ao acessar a câmera.';

        if (error.name === 'NotAllowedError') {
            mensagem =
                '❌ Permissão da câmera foi negada.';
        }
        else if (error.name === 'NotFoundError') {
            mensagem =
                '❌ Nenhuma câmera encontrada.';
        }
        else if (error.name === 'NotReadableError') {
            mensagem =
                '❌ A câmera está sendo usada por outro aplicativo.';
        }

        updateStatus(
            mensagem,
            'error'
        );

        if (document.getElementById('alternarCamera')) {
            document.getElementById('alternarCamera').disabled = false;
        }

    }

}


// ====================================
// ALTERNAR CÂMERA
// ====================================

async function toggleCamera() {

    currentFacingMode =
        currentFacingMode === 'environment'
            ? 'user'
            : 'environment';

    await openCamera();

}


function updateCameraToggleLabel() {

    const btnToggleCamera =
        document.getElementById('alternarCamera');

    if (!btnToggleCamera) {
        return;
    }

    btnToggleCamera.textContent =
        currentFacingMode === 'environment'
            ? '🔄 Usar câmera frontal'
            : '🔄 Usar câmera traseira';

}


// ====================================
// PARAR CÂMERA
// ====================================

function stopCamera() {

    if (stream) {

        stream
            .getTracks()
            .forEach(track => {

                track.stop();

            });

        stream = null;

    }

    if (camera) {
        camera.srcObject = null;
    }

}


// ====================================
// TIRAR FOTO
// ====================================

function takePicture() {

    try {

        if (!camera.videoWidth) {

            updateStatus(
                '❌ A câmera ainda não está pronta.',
                'error'
            );

            return;

        }

        const context =
            canvas.getContext('2d');

        // Tamanho real do vídeo
        canvas.width = camera.videoWidth;
        canvas.height = camera.videoHeight;

        // Desenhar imagem
        context.drawImage(

            camera,

            0,

            0,

            canvas.width,

            canvas.height

        );

        // Converter para JPEG
        canvas.toBlob(

            blob => {

                if (!blob) {

                    updateStatus(
                        '❌ Não foi possível criar a foto.',
                        'error'
                    );

                    return;

                }

                // Guardar foto
                photoData = blob;

                // Mostrar prévia
                const preview =
                    document.getElementById('preview');

                if (preview) {

                    // Liberar URL anterior
                    if (preview.dataset.objectUrl) {
                        URL.revokeObjectURL(
                            preview.dataset.objectUrl
                        );
                    }

                    const imageURL =
                        URL.createObjectURL(blob);

                    preview.src = imageURL;

                    preview.dataset.objectUrl =
                        imageURL;

                }

                // Parar câmera
                stopCamera();

                const cameraArea =
                    document.querySelector('.camera-area');

                if (cameraArea) {
                    cameraArea.style.display = 'none';
                }

                // Mostrar preview container
                const previewContainer =
                    document.getElementById('previewContainer');

                if (previewContainer) {
                    previewContainer.style.display = 'block';
                }

                // Habilitar botão enviar
                const btnUpload =
                    document.getElementById('enviarFoto');

                if (btnUpload) {
                    btnUpload.dataset.galleryReady = 'true';
                    btnUpload.textContent = '💕 Compartilhar foto';
                    btnUpload.disabled = false;
                }

                updateStatus(
                    '📸 Foto pronta! Clique em compartilhar.',
                    'success'
                );

            },

            'image/jpeg',

            0.85

        );

    } catch (error) {

        console.error(
            'Erro ao tirar foto:',
            error
        );

        updateStatus(
            '❌ Erro ao tirar a foto.',
            'error'
        );

    }

}


// ====================================
// ENVIAR PARA GOOGLE DRIVE
// ====================================

async function uploadToGoogleDrive() {

    // Verificar foto
    if (!photoData) {

        updateStatus(
            '❌ Nenhuma foto capturada.',
            'error'
        );

        return;

    }

    // Verificar URL
    if (
        !GOOGLE_APPS_SCRIPT_URL ||
        GOOGLE_APPS_SCRIPT_URL.includes(
            'COLE_AQUI'
        )
    ) {

        updateStatus(
            '❌ URL do Google Apps Script não configurada.',
            'error'
        );

        return;

    }

    const btn =
        document.getElementById('enviarFoto');

    if (btn) {
        btn.disabled = true;
    }

    try {

        updateStatus(
            '📤 Preparando foto...',
            'loading'
        );

        const fotoComprimida =
            await compressImage(photoData);

        // Converter foto para Base64
        const base64 =
            await blobToBase64(fotoComprimida);

        // Remover: data:image/jpeg;base64,
        const base64Data =
            base64.split(',')[1];

        // Criar nome da foto
        const agora = new Date();

        const nomeArquivo =
            'foto-casamento-' +
            formatarData(agora) +
            '-' +
            agora.getTime() +
            '.jpg';

        updateStatus(
            '☁️ Enviando para o Google Drive...',
            'loading'
        );

        // Criar dados
        const formData =
            new URLSearchParams();

        formData.append(
            'photo',
            base64Data
        );

        formData.append(
            'fileName',
            nomeArquivo
        );

        // Enviar para Apps Script
        const response =
            await fetch(
                GOOGLE_APPS_SCRIPT_URL,
                {

                    method: 'POST',

                    mode: 'no-cors',

                    body: formData

                }
            );

        // Sucesso
        updateStatus(
            '✅ Foto enviada ao Apps Script! Obrigado! 💕',
            'success'
        );

        console.log(
            '📸 Requisição enviada para o Google Drive:',
            response.type
        );

        // Limpar foto
        photoData = null;

        // Esperar um pouco
        setTimeout(
            () => {

                resetCameraInterface();

            },
            2000
        );

    } catch (error) {

        console.error(
            'Erro ao enviar foto:',
            error
        );

        updateStatus(

            '❌ Erro ao enviar: ' +
            error.message,

            'error'

        );

        if (btn) {
            btn.disabled = false;
        }

    }

}


// ====================================
// COMPRIMIR FOTO ANTES DO ENVIO
// ====================================

function compressImage(blob) {

    return new Promise(
        (resolve, reject) => {

            const image = new Image();
            const imageURL = URL.createObjectURL(blob);

            image.onload = () => {

                URL.revokeObjectURL(imageURL);

                const maxSize = 1600;
                const scale = Math.min(
                    1,
                    maxSize / Math.max(image.width, image.height)
                );

                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(image.width * scale));
                canvas.height = Math.max(1, Math.round(image.height * scale));

                const context = canvas.getContext('2d');
                context.drawImage(
                    image,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                canvas.toBlob(
                    compressedBlob => {

                        if (!compressedBlob) {
                            reject(new Error('Não foi possível otimizar a foto.'));
                            return;
                        }

                        resolve(compressedBlob);

                    },
                    'image/jpeg',
                    0.75
                );

            };

            image.onerror = () => {
                URL.revokeObjectURL(imageURL);
                reject(new Error('Não foi possível ler a foto.'));
            };

            image.src = imageURL;

        }
    );

}


// ====================================
// BLOB → BASE64
// ====================================

function blobToBase64(blob) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onloadend =
                () => {

                    resolve(
                        reader.result
                    );

                };

            reader.onerror =
                error => {

                    reject(error);

                };

            reader.readAsDataURL(blob);

        }
    );

}


// ====================================
// FORMATAR DATA
// ====================================

function formatarData(data) {

    const ano =
        data.getFullYear();

    const mes =
        String(
            data.getMonth() + 1
        ).padStart(2, '0');

    const dia =
        String(
            data.getDate()
        ).padStart(2, '0');

    const hora =
        String(
            data.getHours()
        ).padStart(2, '0');

    const minuto =
        String(
            data.getMinutes()
        ).padStart(2, '0');

    const segundo =
        String(
            data.getSeconds()
        ).padStart(2, '0');

    return (
        `${ano}-${mes}-${dia}_${hora}-${minuto}-${segundo}`
    );

}


// ====================================
// RESETAR INTERFACE
// ====================================

function resetCameraInterface() {

    const btnOpenCamera =
        document.getElementById('abrirCamera');

    const btnTakePicture =
        document.getElementById('tirarFoto');

    const btnUpload =
        document.getElementById('enviarFoto');

    const previewContainer =
        document.getElementById('previewContainer');

    const cameraArea =
        document.querySelector('.camera-area');

    const galleryInput =
        document.getElementById('galeriaFoto');

    if (btnOpenCamera) {
        btnOpenCamera.style.display = 'block';
        btnOpenCamera.disabled = false;
    }

    if (btnTakePicture) {
        btnTakePicture.disabled = Boolean(btnOpenCamera);
    }

    if (btnUpload) {
        btnUpload.disabled = !galleryInput;
        delete btnUpload.dataset.galleryReady;
        btnUpload.textContent = 'abrir galeria';
    }

    if (galleryInput) {
        galleryInput.value = '';
    }

    if (previewContainer) {
        previewContainer.style.display = 'none';
    }

    if (cameraArea) {
        cameraArea.style.display = 'none';
    }

    // Limpar preview
    const preview =
        document.getElementById('preview');

    if (preview) {

        if (preview.dataset.objectUrl) {

            URL.revokeObjectURL(
                preview.dataset.objectUrl
            );

            delete preview.dataset.objectUrl;

        }

        preview.src = '';

    }

    updateStatus(
        '📷 Pronto para tirar outra foto!',
        ''
    );

}


// ====================================
// MENSAGENS DE STATUS
// ====================================

function updateStatus(
    message,
    type = ''
) {

    const statusEl =
        document.getElementById('status');

    if (!statusEl) {

        console.warn(
            'status não encontrado.'
        );

        return;

    }

    statusEl.textContent =
        message;

    statusEl.className =
        'status ' + type;

}


// ====================================
// LIMPEZA AO SAIR DA PÁGINA
// ====================================

window.addEventListener(
    'beforeunload',
    () => {

        stopCamera();

    }
);
