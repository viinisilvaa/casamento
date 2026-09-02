// ====================================
// CONFIGURAÇÃO GOOGLE APPS SCRIPT
// ====================================

// URL da implantação do seu Google Apps Script
const GOOGLE_APPS_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbwORG8lRvY0sRwQ5z-kzyrSrsmujyPPNxoEU4bBK-Es-3z8HNucNAyMlx6JqIwlGJOD/exec';


// ====================================
// VARIÁVEIS GLOBAIS
// ====================================

let videoElement;
let canvasElement;
let stream = null;
let photoData = null;


// ====================================
// INICIALIZAÇÃO
// ====================================

document.addEventListener('DOMContentLoaded', () => {

    videoElement = document.getElementById('videoElement');
    canvasElement = document.getElementById('canvasElement');

    // Verificar se chegou através do QR Code
    const params = new URLSearchParams(window.location.search);
    const isFromQR = params.has('qr');

    // Gerar QR Code
    generateQRCode();

    // Se veio pelo QR Code,
    // abrir a câmera automaticamente
    if (isFromQR) {

        setTimeout(() => {
            showCameraView();
        }, 500);

    }

    // Configurar botões
    setupEventListeners();

});


// ====================================
// GERAR QR CODE
// ====================================

function generateQRCode() {

    const qrContainer =
        document.getElementById('qrCodeContainer');

    if (!qrContainer) {
        console.error(
            'Elemento qrCodeContainer não encontrado.'
        );
        return;
    }

    // Limpar QR anterior
    qrContainer.innerHTML = '';

    // URL atual sem parâmetros
    const currentURL =
        window.location.href.split('?')[0];

    // URL que será aberta pelo celular
    const qrURL =
        currentURL + '?qr=1';

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
// NAVEGAÇÃO ENTRE TELAS
// ====================================

function showView(viewId) {

    document
        .querySelectorAll('.view')
        .forEach(view => {

            view.classList.add('hidden');

        });

    const view =
        document.getElementById(viewId);

    if (view) {

        view.classList.remove('hidden');

    } else {

        console.error(
            'View não encontrada:',
            viewId
        );

    }

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

    // Botão abrir câmera
    const btnOpenCamera =
        document.getElementById('btnOpenCamera');

    if (btnOpenCamera) {

        btnOpenCamera.addEventListener(
            'click',
            openCamera
        );

    }


    // Botão tirar foto
    const btnTakePicture =
        document.getElementById('btnTakePicture');

    if (btnTakePicture) {

        btnTakePicture.addEventListener(
            'click',
            takePicture
        );

    }


    // Botão voltar da câmera
    const btnBack =
        document.getElementById('btnBack');

    if (btnBack) {

        btnBack.addEventListener(
            'click',
            () => {

                stopCamera();

                showQRView();

            }
        );

    }


    // Botão voltar da prévia
    const btnBackPreview =
        document.getElementById('btnBackPreview');

    if (btnBackPreview) {

        btnBackPreview.addEventListener(
            'click',
            () => {

                stopCamera();

                showCameraView();

            }
        );

    }


    // Tirar outra foto
    const btnRetake =
        document.getElementById('btnRetake');

    if (btnRetake) {

        btnRetake.addEventListener(
            'click',
            () => {

                photoData = null;

                showCameraView();

                // Reabrir câmera
                openCamera();

            }
        );

    }


    // Enviar foto
    const btnUpload =
        document.getElementById('btnUpload');

    if (btnUpload) {

        btnUpload.addEventListener(
            'click',
            uploadToGoogleDrive
        );

    }

}


// ====================================
// ABRIR CÂMERA
// ====================================

async function openCamera() {

    try {

        const btnOpenCamera =
            document.getElementById(
                'btnOpenCamera'
            );

        const btnTakePicture =
            document.getElementById(
                'btnTakePicture'
            );


        // Desabilitar botão
        if (btnOpenCamera) {

            btnOpenCamera.disabled = true;

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


        // Detectar celular
        const isMobile =
            /iPhone|iPad|iPod|Android/i.test(
                navigator.userAgent
            );


        // Celular = câmera traseira
        // Computador = câmera frontal
        const facingMode =
            isMobile
                ? 'environment'
                : 'user';


        // Solicitar câmera
        stream =
            await navigator
                .mediaDevices
                .getUserMedia({

                    video: {

                        facingMode: {
                            ideal: facingMode
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
        videoElement.srcObject =
            stream;


        // Esperar vídeo carregar
        await new Promise(
            resolve => {

                videoElement.onloadedmetadata =
                    () => {

                        videoElement.play();

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


        // Esconder botão abrir câmera
        if (btnOpenCamera) {

            btnOpenCamera.style.display =
                'none';

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


        if (btnOpenCamera) {

            btnOpenCamera.disabled = false;

        }

    }

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


    if (videoElement) {

        videoElement.srcObject = null;

    }

}


// ====================================
// TIRAR FOTO
// ====================================

function takePicture() {

    try {

        if (!videoElement.videoWidth) {

            updateStatus(
                '❌ A câmera ainda não está pronta.',
                'error'
            );

            return;

        }


        const context =
            canvasElement.getContext('2d');


        // Tamanho real do vídeo
        canvasElement.width =
            videoElement.videoWidth;

        canvasElement.height =
            videoElement.videoHeight;


        // Desenhar imagem
        context.drawImage(

            videoElement,

            0,

            0,

            canvasElement.width,

            canvasElement.height

        );


        // Converter para JPEG
        canvasElement.toBlob(

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
                    document.getElementById(
                        'previewImage'
                    );


                if (preview) {

                    // Liberar URL anterior
                    if (preview.dataset.objectUrl) {

                        URL.revokeObjectURL(
                            preview.dataset.objectUrl
                        );

                    }


                    const imageURL =
                        URL.createObjectURL(blob);


                    preview.src =
                        imageURL;


                    preview.dataset.objectUrl =
                        imageURL;

                }


                // Parar câmera
                stopCamera();


                // Mostrar prévia
                showPreviewView();


                updateUploadStatus(
                    '📸 Foto pronta! Clique em enviar.',
                    ''
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

        updateUploadStatus(
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

        updateUploadStatus(
            '❌ URL do Google Apps Script não configurada.',
            'error'
        );

        return;

    }


    const btn =
        document.getElementById(
            'btnUpload'
        );


    if (btn) {

        btn.disabled = true;

    }


    try {

        updateUploadStatus(
            '📤 Preparando foto...',
            'loading'
        );


        // Converter foto para Base64
        const base64 =
            await blobToBase64(photoData);


        // Remover:
        // data:image/jpeg;base64,
        const base64Data =
            base64.split(',')[1];


        // Criar nome da foto
        const agora =
            new Date();


        const nomeArquivo =
            'foto-casamento-' +
            formatarData(agora) +
            '-' +
            agora.getTime() +
            '.jpg';


        updateUploadStatus(
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

                    body: formData

                }
            );


        // Verificar resposta HTTP
        if (!response.ok) {

            throw new Error(
                `Erro HTTP ${response.status}`
            );

        }


        // Ler resposta
        const result =
            await response.json();


        console.log(
            'Resposta do Google Apps Script:',
            result
        );


        // Verificar sucesso
        if (!result.sucesso) {

            throw new Error(
                result.mensagem ||
                'O Google Apps Script recusou o envio.'
            );

        }


        // Sucesso
        updateUploadStatus(
            '✅ Foto enviada com sucesso!',
            'success'
        );


        console.log(
            '📸 Foto salva no Google Drive:',
            result
        );


        // Limpar foto
        photoData = null;


        // Esperar um pouco
        setTimeout(
            () => {

                resetCameraInterface();

                showCameraView();

            },
            2000
        );


    } catch (error) {

        console.error(
            'Erro ao enviar foto:',
            error
        );


        updateUploadStatus(

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
        document.getElementById(
            'btnOpenCamera'
        );


    const btnTakePicture =
        document.getElementById(
            'btnTakePicture'
        );


    const btnUpload =
        document.getElementById(
            'btnUpload'
        );


    if (btnOpenCamera) {

        btnOpenCamera.style.display =
            'block';

        btnOpenCamera.disabled =
            false;

    }


    if (btnTakePicture) {

        btnTakePicture.disabled =
            true;

    }


    if (btnUpload) {

        btnUpload.disabled =
            false;

    }


    // Limpar preview
    const preview =
        document.getElementById(
            'previewImage'
        );


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
        document.getElementById(
            'statusMessage'
        );


    if (!statusEl) {

        console.warn(
            'statusMessage não encontrado.'
        );

        return;

    }


    statusEl.textContent =
        message;


    statusEl.className =
        'status-message ' + type;

}


function updateUploadStatus(
    message,
    type = ''
) {

    const statusEl =
        document.getElementById(
            'uploadStatus'
        );


    if (!statusEl) {

        console.warn(
            'uploadStatus não encontrado.'
        );

        return;

    }


    statusEl.textContent =
        message;


    statusEl.className =
        'status-message ' + type;

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