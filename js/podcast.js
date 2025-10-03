// =====================================================
// FUNCIONES DE PODCAST (WEB SPEECH API) - SOLO PDF
// =====================================================


// Asegurarse de que el DOM esté completamente cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePodcast);
} else {
    initializePodcast();
}

function initializePodcast() {
    console.log('Podcast.js inicializado correctamente');
    
    // Aquí va TODO tu código de podcast.js que ya tenías
    // (todo el contenido que compartiste anteriormente)
}

// =====================================================
// TU CÓDIGO ORIGINAL DE PODCAST.JS VA AQUÍ
// (todo lo que ya tenías, incluyendo las funciones y event listeners)
// =====================================================

console.log('Podcast.js cargado correctamente');

/**
 * Verifica la compatibilidad del navegador con Web Speech API
 * @returns {boolean} - True si es compatible
 */
function checkSpeechSynthesisSupport() {
    if (!('speechSynthesis' in window)) {
        console.warn('Web Speech API no está disponible en este navegador.');
        return false;
    }
    return true;
}

/**
 * Genera un podcast usando Web Speech API
 * @param {string} text - Texto a convertir en audio
 * @param {Object} options - Configuraciones de voz
 * @returns {Promise} - Promesa de generación de audio
 */
function generatePodcast(text, options = {}) {
    return new Promise((resolve, reject) => {
        try {
            // Verificar compatibilidad
            if (!checkSpeechSynthesisSupport()) {
                reject(new Error('Tu navegador no soporta la función de texto a voz. Prueba con Chrome, Edge o Safari.'));
                return;
            }
            
            // Cancelar cualquier reproducción anterior
            speechSynthesis.cancel();
            
            // Crear utterance con el texto original
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Configurar voz y parámetros
            utterance.lang = options.lang || 'es-ES';
            utterance.rate = options.rate || 1.0;
            utterance.pitch = options.pitch || 1.0;
            utterance.volume = options.volume || 1.0;
            
            // Eventos
            utterance.onstart = function() {
                console.log('Comenzando a reproducir podcast...');
                updatePodcastStatus('Reproduciendo...', 'playing');
            };
            
            utterance.onend = function() {
                console.log('Podcast finalizado.');
                updatePodcastStatus('Reproducción completada', 'completed');
                enablePlayButton();
            };
            
            utterance.onerror = function(event) {
                // Si el error es "interrupted", significa que el usuario detuvo el podcast
                if (event.error === 'interrupted') {
                    console.log('Podcast detenido por el usuario.');
                    updatePodcastStatus('Audio detenido', 'stopped');
                    enablePlayButton();
                } else {
                    console.error('Error en podcast:', event);
                    updatePodcastStatus(`Error: ${event.error}`, 'error');
                    enablePlayButton();
                }
            };
            
            utterance.onpause = function() {
                console.log('Podcast pausado.');
                updatePodcastStatus('Pausado', 'paused');
            };
            
            utterance.onresume = function() {
                console.log('Podcast reanudado.');
                updatePodcastStatus('Reproduciendo...', 'playing');
            };
            
            // Reproducir
            speechSynthesis.speak(utterance);
            
        } catch (error) {
            console.error('Error al generar podcast:', error);
            reject(new Error(`Error al generar el podcast: ${error.message}`));
        }
    });
}

/**
 * Actualiza el estado del podcast
 * @param {string} message - Mensaje de estado
 * @param {string} status - Tipo de estado
 */
function updatePodcastStatus(message, status) {
    const statusElement = document.getElementById('podcast-status');
    if (statusElement) {
        statusElement.textContent = message;
        
        // Aplicar estilos según el estado
        switch (status) {
            case 'playing':
                statusElement.style.color = '#10b981'; // Verde
                break;
            case 'paused':
                statusElement.style.color = '#f59e0b'; // Amarillo
                break;
            case 'completed':
                statusElement.style.color = '#3b82f6'; // Azul
                break;
            case 'stopped':
                statusElement.style.color = '#6b7280'; // Gris oscuro
                break;
            case 'error':
                statusElement.style.color = '#ef4444'; // Rojo
                break;
            default:
                statusElement.style.color = '#6b7280'; // Gris
        }
    }
}

/**
 * Habilita el botón de reproducción
 */
function enablePlayButton() {
    const playBtn = document.querySelector('.podcast-play-btn');
    const pauseBtn = document.querySelector('.podcast-pause-btn');
    
    if (playBtn) {
        playBtn.style.display = 'inline-block';
        playBtn.disabled = false;
    }
    
    if (pauseBtn) {
        pauseBtn.style.display = 'none';
    }
}

/**
 * Deshabilita el botón de reproducción
 */
function disablePlayButton() {
    const playBtn = document.querySelector('.podcast-play-btn');
    const pauseBtn = document.querySelector('.podcast-pause-btn');
    
    if (playBtn) {
        playBtn.style.display = 'none';
        playBtn.disabled = true;
    }
    
    if (pauseBtn) {
        pauseBtn.style.display = 'inline-block';
    }
}

/**
 * Reproduce el podcast
 * @param {string} encodedText - Texto codificado a reproducir
 */
function playPodcast(encodedText) {
    try {
        const decodedContent = decodeURIComponent(encodedText);
        
        // Obtener configuraciones
        const rate = parseFloat(document.getElementById('podcast-rate').value) || 1.0;
        const pitch = parseFloat(document.getElementById('podcast-pitch').value) || 1.0;
        const volume = parseFloat(document.getElementById('podcast-volume').value) || 1.0;
        
        // Actualizar UI
        disablePlayButton();
        updatePodcastStatus('Preparando...', 'loading');
        
        // Generar y reproducir podcast con el texto original
        generatePodcast(decodedContent, {
            lang: 'es-ES',
            rate: rate,
            pitch: pitch,
            volume: volume
        }).catch(error => {
            // Manejar errores
            updatePodcastStatus(`Error: ${error.message}`, 'error');
            enablePlayButton();
            alert(`Error: ${error.message}`);
        });
        
    } catch (error) {
        console.error('Error al reproducir podcast:', error);
        updatePodcastStatus(`Error: ${error.message}`, 'error');
        alert(`Error al reproducir el podcast: ${error.message}`);
    }
}

/**
 * Pausa la reproducción del podcast
 */
function pausePodcast() {
    if ('speechSynthesis' in window) {
        speechSynthesis.pause();
        document.querySelector('.play-btn').style.display = 'inline-block';
        document.querySelector('.pause-btn').style.display = 'none';
        updatePodcastStatus('Pausado', 'paused');
    }
}

/**
 * Reanuda la reproducción del podcast
 */
function resumePodcast() {
    if ('speechSynthesis' in window) {
        speechSynthesis.resume();
        document.querySelector('.play-btn').style.display = 'none';
        document.querySelector('.pause-btn').style.display = 'inline-block';
        updatePodcastStatus('Reproduciendo...', 'playing');
    }
}

/**
 * Detiene completamente la reproducción del podcast
 */
function stopPodcast() {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        document.querySelector('.play-btn').style.display = 'inline-block';
        document.querySelector('.pause-btn').style.display = 'none';
        updatePodcastStatus('Audio detenido', 'stopped');
    }
}

/**
 * Actualiza el valor de velocidad mostrado
 * @param {string} value - Valor de velocidad
 */
function updateRateValue(value) {
    const speedLabels = {
        '0.5': 'Muy lento (0.5x)',
        '0.7': 'Lento (0.7x)',
        '0.8': 'Medio lento (0.8x)',
        '0.9': 'Casi normal (0.9x)',
        '1.0': 'Normal (1.0x)',
        '1.1': 'Rápido (1.1x)',
        '1.2': 'Medio rápido (1.2x)',
        '1.3': 'Rápido (1.3x)',
        '1.5': 'Muy rápido (1.5x)',
        '2.0': 'Ultra rápido (2.0x)'
    };
    
    document.getElementById('rate-value').textContent = speedLabels[value] || `Personalizado (${value}x)`;
}

/**
 * Actualiza el valor de tono mostrado
 * @param {string} value - Valor de tono
 */
function updatePitchValue(value) {
    const pitchLabels = {
        '0.5': 'Muy grave (0.5x)',
        '0.7': 'Grave (0.7x)',
        '0.8': 'Medio grave (0.8x)',
        '0.9': 'Casi normal (0.9x)',
        '1.0': 'Normal (1.0x)',
        '1.1': 'Agudo (1.1x)',
        '1.2': 'Medio agudo (1.2x)',
        '1.3': 'Agudo (1.3x)',
        '1.5': 'Muy agudo (1.5x)'
    };
    
    document.getElementById('pitch-value').textContent = pitchLabels[value] || `Personalizado (${value}x)`;
}

/**
 * Actualiza el valor de volumen mostrado
 * @param {string} value - Valor de volumen
 */
function updateVolumeValue(value) {
    const volumeLabels = {
        '0.0': 'Silencio (0%)',
        '0.1': 'Muy bajo (10%)',
        '0.2': 'Bajo (20%)',
        '0.3': 'Medio bajo (30%)',
        '0.4': 'Medio (40%)',
        '0.5': 'Medio (50%)',
        '0.6': 'Medio alto (60%)',
        '0.7': 'Alto (70%)',
        '0.8': 'Muy alto (80%)',
        '0.9': 'Alto (90%)',
        '1.0': 'Máximo (100%)'
    };
    
    document.getElementById('volume-value').textContent = volumeLabels[value] || `Personalizado (${Math.round(value * 100)}%)`;
}

/**
 * Muestra los controles de podcast en la interfaz
 * @param {string} resultId - ID del div donde mostrar resultados
 * @param {string} content - Contenido del podcast
 * @param {string} title - Título del podcast
 */
function displayPodcastResult(resultId, content, title) {
    const resultDiv = document.getElementById(resultId);
    
    // Procesar contenido para estimar duración
    const wordCount = content.split(/\s+/).length;
    const estimatedMinutes = Math.ceil(wordCount / 150); // Aproximadamente 150 palabras por minuto
    
    resultDiv.innerHTML = `
        <div class="results-header">
            <h3 class="results-title">${title}</h3>
        </div>
        <div class="result-content">
            <div class="podcast-player">
                <div class="podcast-info">
                    <h4>Podcast Generado Exitosamente</h4>
                    <p><strong>Duración estimada:</strong> ${estimatedMinutes} minutos</p>
                    <p><strong>Palabras:</strong> ${wordCount}</p>
                    <p><strong>Idioma:</strong> Español</p>
                </div>
                
                <div class="podcast-controls">
                    <button class="control-btn play-btn" onclick="playPodcast('${encodeURIComponent(content)}')">
                        <i class="fas fa-play"></i> Reproducir
                    </button>
                    <button class="control-btn pause-btn" onclick="pausePodcast()" style="display: none;">
                        <i class="fas fa-pause"></i> Pausar
                    </button>
                    <button class="control-btn stop-btn" onclick="stopPodcast()">
                        <i class="fas fa-stop"></i> Detener
                    </button>
                </div>
                
                <div class="podcast-settings">
                    <div class="setting-group">
                        <label for="podcast-rate">Velocidad:</label>
                        <input type="range" id="podcast-rate" min="0.5" max="2" step="0.1" value="1" 
                               onchange="updateRateValue(this.value)">
                        <span id="rate-value">Normal (1.0x)</span>
                    </div>
                    
                    <div class="setting-group">
                        <label for="podcast-pitch">Tono:</label>
                        <input type="range" id="podcast-pitch" min="0.5" max="1.5" step="0.1" value="1" 
                               onchange="updatePitchValue(this.value)">
                        <span id="pitch-value">Normal (1.0x)</span>
                    </div>
                    
                    <div class="setting-group">
                        <label for="podcast-volume">Volumen:</label>
                        <input type="range" id="podcast-volume" min="0" max="1" step="0.1" value="1" 
                               onchange="updateVolumeValue(this.value)">
                        <span id="volume-value">Máximo (100%)</span>
                    </div>
                </div>
                
                <div class="podcast-text-preview">
                    <h5>Vista previa del contenido:</h5>
                    <div class="text-preview">${content.substring(0, 300)}${content.length > 300 ? '...' : ''}</div>
                </div>
                
                <div class="podcast-status">
                    <p id="podcast-status">Listo para reproducir</p>
                </div>
            </div>
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

// =====================================================
// FUNCIONES DE PROCESAMIENTO DE PDF
// =====================================================

/**
 * Procesa un archivo PDF para extraer su contenido
 * @param {File} file - Archivo PDF
 * @returns {Promise<string>} - Contenido del PDF
 */
async function processPDF(file) {
    try {
        // Inicializar PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
        
        // Leer el archivo como array buffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Cargar el PDF
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        // Extraer texto de todas las páginas
        let textContent = '';
        
        for (let i = 0; i < pdf.numPages; i++) {
            const page = await pdf.getPage(i + 1);
            const textContentOfPage = await page.getTextContent();
            
            // Extraer texto de la página
            textContentOfPage.items.forEach(item => {
                textContent += item.str + ' ';
            });
            
            // Añadir salto de línea entre páginas
            textContent += '\n\n';
        }
        
        return textContent.trim();
    } catch (error) {
        console.error('Error al procesar PDF:', error);
        throw new Error('Error al procesar el archivo PDF. Por favor, verifica que el archivo sea válido.');
    }
}

// =====================================================
// EVENT LISTENERS PARA LOS FORMULARIOS DE PODCAST
// =====================================================

// Formulario de podcast desde PDF (SOLO PDF)
document.getElementById('podcast-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const file = document.getElementById('podcast-file').files[0];
    const resultDiv = document.getElementById('podcast-result');
    
    if (file) {
        // Verificar que sea un archivo PDF
        if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
            resultDiv.innerHTML = '<p style="color: #ef4444;"><strong>Error:</strong> Por favor, selecciona solo archivos PDF.</p>';
            resultDiv.style.display = 'block';
            return;
        }
        
        // Mostrar indicador de procesamiento
        resultDiv.innerHTML = '<p>Procesando PDF y generando podcast... <i class="fas fa-spinner fa-spin"></i></p>';
        resultDiv.style.display = 'block';
        
        try {
            // Procesar el PDF para extraer su contenido
            const content = await processPDF(file);
            
            // Verificar que haya contenido
            if (!content.trim()) {
                throw new Error('El PDF está vacío o no se pudo leer correctamente.');
            }
            
            // Mostrar controles de podcast con el contenido real del PDF
            displayPodcastResult('podcast-result', content, 'Podcast Generado');
            
        } catch (error) {
            resultDiv.innerHTML = `<p style="color: #ef4444;"><strong>Error:</strong> ${error.message}</p>`;
        }
    }
});

// Formulario de podcast desde texto
document.getElementById('podcast-text-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const text = document.getElementById('podcast-text').value;
    const resultDiv = document.getElementById('podcast-text-result');
    
    if (text.trim()) {
        // Mostrar controles de podcast con el texto ingresado
        displayPodcastResult('podcast-text-result', text, 'Podcast Generado');
    } else {
        resultDiv.innerHTML = '<p style="color: #ef4444;"><strong>Error:</strong> Por favor, ingresa algún texto para convertir en podcast.</p>';
        resultDiv.style.display = 'block';
    }
});