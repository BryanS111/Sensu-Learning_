// Scroll suave a la sección de herramientas al hacer clic en 'Comenzar Ahora'
document.addEventListener('DOMContentLoaded', function() {
    const comenzarBtn = document.querySelector('.cta-button');
    const toolsSection = document.getElementById('tools');
    if (comenzarBtn && toolsSection) {
        comenzarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toolsSection.scrollIntoView({ behavior: 'smooth' });
        });
    }
});
// Scroll suave al inicio al hacer clic en el botón 'Inicio' del menú
document.addEventListener('DOMContentLoaded', function() {
    const inicioBtn = document.querySelector('.desktop-nav a[href="#"]');
    if (inicioBtn) {
        inicioBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId + '-modal').style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId + '-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Clear results when closing modal
    const resultDivs = document.querySelectorAll(`#${modalId}-result, #${modalId}-ai-result`);
    resultDivs.forEach(div => {
        div.style.display = 'none';
        div.innerHTML = '';
    });
    
    // LIMPIAR ESTADO DEL TEST PARA EVITAR BLOQUEO
    if (window.currentTestQuestions) {
        delete window.currentTestQuestions;
    }
    
    // ASEGURAR QUE LOS BOTONES PRINCIPALES SIGAN SIENDO VISIBLES Y HABILITADOS
    ensureMainButtonsVisible();
}

// Función para asegurar que los botones principales sean visibles y habilitados
function ensureMainButtonsVisible() {
    // Asegurar contenedores de herramientas
    const toolCards = document.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
        if (card) {
            card.style.display = 'block';
        }
    });
    
    // Asegurar sección de herramientas
    const toolsSection = document.getElementById('tools');
    if (toolsSection) {
        toolsSection.style.display = 'block';
    }
    
    // Asegurar contenido principal
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.display = 'block';
    }
    
    // HABILITAR TODOS LOS BOTONES DE HERRAMIENTAS
    const allToolButtons = document.querySelectorAll('.tool-card .option-btn, .tool-card button');
    allToolButtons.forEach(button => {
        if (button) {
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.style.pointerEvents = 'auto';
        }
    });
    
    // HABILITAR BOTONES DE ACCIÓN
    const actionButtons = document.querySelectorAll('.submit-btn, .download-btn, .control-btn');
    actionButtons.forEach(button => {
        if (button) {
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.style.pointerEvents = 'auto';
        }
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
            
            // Clear all results when closing modals
            document.querySelectorAll('.results').forEach(result => {
                result.style.display = 'none';
                result.innerHTML = '';
            });
            
            // LIMPIAR ESTADO DEL TEST PARA EVITAR BLOQUEO
            if (window.currentTestQuestions) {
                delete window.currentTestQuestions;
            }
            
            // ASEGURAR QUE LOS BOTONES PRINCIPALES SIGAN SIENDO VISIBLES Y HABILITADOS
            ensureMainButtonsVisible();
        }
    });
}

// =====================================================
// FUNCIONES DE INTEGRACIÓN CON API GROK 4 FAST
// =====================================================

/**
 * Función principal para llamar a la API de Grok 4 Fast
 * @param {string} prompt - El prompt a enviar a la API
 * @returns {Promise<string>} - Respuesta generada por el modelo
 */
async function callGrokAPI(prompt) {
    try {
        console.log('Enviando solicitud a API Grok 4 Fast...');
        
        const response = await fetch(API_CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.API_KEY}`,
                'HTTP-Referer': window.location.href,
                'X-Title': 'Sensu Learning'
            },
            body: JSON.stringify({
                model: API_CONFIG.MODEL_NAME,
                messages: [
                    {
                        role: "system",
                        content: "Eres un asistente educativo especializado en crear contenido académico claro, conciso y bien estructurado para estudiantes. Usa lenguaje claro y directo. No uses formatos complejos como markdown."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        // Monitorear límites
        const limit = response.headers.get('X-RateLimit-Limit');
        const remaining = response.headers.get('X-RateLimit-Remaining');
        const reset = response.headers.get('X-RateLimit-Reset');
        
        console.log(`Límites - Total: ${limit}, Restantes: ${remaining}, Reinicio: ${reset}`);

        // Verificar si la respuesta es exitosa
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        // Extraer el contenido de la respuesta
        const content = data.choices[0].message.content;
        console.log('Respuesta recibida de API Grok 4 Fast');
        
        return content;
    } catch (error) {
        console.error('Error en llamada a API Grok 4 Fast:', error);
        return `Error al generar el contenido: ${error.message}. Por favor, inténtalo de nuevo.`;
    }
}

// =====================================================
// FUNCIONES DE PROCESAMIENTO DE ARCHIVOS
// =====================================================

// Función para procesar PDF usando PDF.js
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
// FUNCIONES DE GENERACIÓN DE CONTENIDO (MEJORADAS)
// =====================================================

/**
 * Genera un resumen académico usando la API de Grok
 * @param {string} topic - Tema o contenido a resumir
 * @param {boolean} isPDF - Indica si el contenido viene de un PDF
 * @returns {Promise<string>} - Resumen generado
 */
async function generateRealSummary(topic, isPDF = false) {
    // Limitar la longitud del contenido para evitar problemas con la API
    const maxChars = 5000;
    const content = topic.length > maxChars ? topic.substring(0, maxChars) : topic;
    
    const prompt = isPDF 
        ? `Resume el siguiente contenido académico en un formato claro y conciso. 
           El resumen debe ser breve pero completo, con una estructura simple:
           Introducción: Un párrafo corto que explique brevemente el tema
           Conceptos clave: Un párrafo que describa los conceptos más importantes del tema
           Conclusión: Un párrafo que resuma brevemente el significado general
           No uses formatos complejos como markdown. Usa solo texto plano sin separadores entre párrafos.
           Contenido a resumir: ${content}`
        : `Genera un resumen académico breve y claro sobre: ${topic}. 
           El resumen debe tener aproximadamente 100-200 palabras y seguir esta estructura:
           Introducción: Un párrafo corto que explique brevemente el tema
           Conceptos clave: Un párrafo que describa los conceptos más importantes del tema
           Conclusión: Un párrafo que resuma brevemente el significado general
           Usa lenguaje claro y directo. No incluyas formato especial como markdown. 
           Solo texto plano sin separadores entre párrafos.`;
    
    return await callGrokAPI(prompt);
}

/**
 * Genera un cuestionario usando la API de Grok
 * @param {string} topic - Tema del cuestionario
 * @param {number} count - Número de preguntas
 * @param {boolean} isPDF - Indica si el contenido viene de un PDF
 * @returns {Promise<string>} - Cuestionario generado
 */
async function generateRealQuiz(topic, count, isPDF = false) {
    const prompt = isPDF
        ? `Crea un cuestionario de ${count} preguntas basado en el siguiente contenido: ${topic}.
           Para cada pregunta:
           - Proporciona una pregunta clara
           - Proporciona la respuesta correcta
           Formato de ejemplo:
           1. ¿Pregunta aquí?
           Respuesta: La respuesta correcta aquí
           
           2. ¿Otra pregunta?
           Respuesta: La respuesta correcta aquí`
        : `Genera un cuestionario educativo de ${count} preguntas sobre: ${topic}.
           Para cada pregunta:
           - Formula una pregunta clara y educativa
           - Proporciona la respuesta correcta
           Formato de ejemplo:
           1. ¿Pregunta aquí?
           Respuesta: La respuesta correcta aquí
           
           2. ¿Otra pregunta?
           Respuesta: La respuesta correcta aquí`;
    
    return await callGrokAPI(prompt);
}

/**
 /**
 * Genera un test interactivo usando la API de Grok
 * @param {string} topic - Tema del test
 * @param {number} count - Número de preguntas
 * @param {boolean} isPDF - Indica si el contenido viene de un PDF
 * @returns {Promise<string>} - Test generado
 */
async function generateRealTest(topic, count, isPDF = false) {
    const prompt = isPDF
        ? `Crea un test interactivo de EXACTAMENTE ${count} preguntas de opción múltiple BASADO EN EL SIGUIENTE CONTENIDO: ${topic}.
           REGLAS IMPORTANTES:
           - Crea EXACTAMENTE ${count} preguntas numeradas (1, 2, 3, ..., ${count})
           - Cada pregunta debe tener una pregunta clara y DIRECTAMENTE RELACIONADA con el contenido proporcionado
           - Cada pregunta debe tener 3 opciones de respuesta (A, B, C)
           - Marca la respuesta correcta con un asterisco (*) al final de la opción correcta
           - NO inventes información que no esté en el contenido
           - NO hagas preguntas sobre temas diferentes al contenido proporcionado
           - Las respuestas deben ser técnicamente correctas y lógicamente coherentes
           - Formato estricto:
           
           1. ¿Pregunta aquí?
           A) Opción 1
           B) Opción 2*
           C) Opción 3
           
           2. ¿Siguiente pregunta?
           A) Opción 1*
           B) Opción 2
           C) Opción 3`
        : `Genera un test educativo de EXACTAMENTE ${count} preguntas de opción múltiple sobre: ${topic}.
           REGLAS IMPORTANTES:
           - Crea EXACTAMENTE ${count} preguntas numeradas (1, 2, 3, ..., ${count})
           - Cada pregunta debe tener una pregunta clara y educativa
           - Cada pregunta debe tener 3 opciones de respuesta (A, B, C)
           - Marca la respuesta correcta con un asterisco (*) al final de la opción correcta
           - Las respuestas deben ser técnicamente correctas y lógicamente coherentes
           - Formato estricto:
           
           1. ¿Pregunta aquí?
           A) Opción 1
           B) Opción 2*
           C) Opción 3
           
           2. ¿Siguiente pregunta?
           A) Opción 1*
           B) Opción 2
           C) Opción 3`;
    
    return await callGrokAPI(prompt);
}

// =====================================================
// FUNCIONES DE MANEJO DE TESTS DINÁMICOS
// =====================================================

/**
 /**
 * Parsea el contenido del test y crea la estructura interactiva
 * @param {string} content - Contenido del test generado
 * @returns {Array} - Array de preguntas
 */
function parseTestQuestions(content) {
    if (!content || typeof content !== 'string') {
        console.error('Contenido inválido:', content);
        return [];
    }
    
    const lines = content.split('\n');
    const questions = [];
    let currentQuestion = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.length === 0) continue;
        
        if (/^\d+\./.test(line)) {
            // Nueva pregunta
            if (currentQuestion) {
                // Validar que la pregunta anterior tenga opciones
                if (currentQuestion.options && currentQuestion.options.length > 0) {
                    questions.push(currentQuestion);
                }
            }
            
            currentQuestion = {
                question: line,
                options: [],
                correctOption: -1
            };
        } else if (/^[A-C]\)/.test(line)) {
            // Opción de respuesta
            if (currentQuestion) {
                const isCorrect = line.includes('*');
                const optionText = line.replace(/\*/g, '').replace(/^[A-C]\)\s*/, '').trim();
                
                // Solo agregar opción si tiene texto
                if (optionText && optionText.length > 0) {
                    currentQuestion.options.push({
                        text: optionText,
                        isCorrect: isCorrect
                    });
                    
                    if (isCorrect) {
                        currentQuestion.correctOption = currentQuestion.options.length - 1;
                    }
                }
            }
        }
    }
    
    // Agregar la última pregunta si es válida
    if (currentQuestion && currentQuestion.options && currentQuestion.options.length > 0) {
        questions.push(currentQuestion);
    }
    
    return questions;
}

/**
 * Maneja la selección de una opción
 * @param {number} questionIndex - Índice de la pregunta
 * @param {number} optionIndex - Índice de la opción
 */
function selectOption(questionIndex, optionIndex) {
    // Remover selección anterior de esta pregunta
    const previousSelected = document.querySelector(`.option-btn[data-question="${questionIndex}"][data-selected="true"]`);
    if (previousSelected) {
        previousSelected.style.backgroundColor = '';
        previousSelected.style.color = '';
        previousSelected.removeAttribute('data-selected');
    }
    
    // Seleccionar nueva opción
    const selectedBtn = document.querySelector(`.option-btn[data-question="${questionIndex}"][data-option="${optionIndex}"]`);
    if (selectedBtn) {
        selectedBtn.style.backgroundColor = '#3b82f6';
        selectedBtn.style.color = 'white';
        selectedBtn.setAttribute('data-selected', 'true');
    }
}

/**
 * Finaliza el test y muestra los resultados
 * @param {number} totalQuestions - Número total de preguntas
 */
function submitTest(totalQuestions) {
    // Recopilar respuestas seleccionadas
    const answers = [];
    for (let i = 0; i < totalQuestions; i++) {
        const selectedBtn = document.querySelector(`.option-btn[data-question="${i}"][data-selected="true"]`);
        if (selectedBtn) {
            answers.push(parseInt(selectedBtn.getAttribute('data-option')));
        } else {
            answers.push(-1); // No respondida
        }
    }
    
    // Obtener preguntas originales
    const questions = window.currentTestQuestions;
    
    // Verificar que haya preguntas
    if (!questions || questions.length === 0) {
        console.error('No hay preguntas guardadas');
        alert('Error: No se encontraron preguntas guardadas. Por favor, inténtalo de nuevo.');
        return;
    }
    
    // Calcular puntuación
    let correctAnswers = 0;
    for (let i = 0; i < answers.length; i++) {
        if (answers[i] === questions[i].correctOption) {
            correctAnswers++;
        }
    }
    
    const score = Math.round((correctAnswers / totalQuestions) * 10);
    
    // Mostrar resultados
    const resultsDiv = document.querySelector('.test-results');
    const scoreDisplay = resultsDiv.querySelector('.score-display');
    const resultsDetail = resultsDiv.querySelector('.results-detail');
    
    scoreDisplay.textContent = `Calificación: ${score}/10`;
    scoreDisplay.style.color = score >= 6 ? '#10b981' : '#ef4444';
    
    // Mostrar retroalimentación detallada
    let detailHTML = '<h4>Detalle de respuestas:</h4>';
    for (let i = 0; i < questions.length; i++) {
        const userAnswer = answers[i];
        const correctAnswer = questions[i].correctOption;
        const isCorrect = userAnswer === correctAnswer;
        
        detailHTML += `
            <div style="margin: 15px 0; padding: 10px; border-left: 4px solid ${isCorrect ? '#10b981' : '#ef4444'}; background: ${isCorrect ? '#f0fdf4' : '#fef2f2'};">
                <div><strong>${questions[i].question}</strong></div>
                <div style="margin: 5px 0;">
        `;
        
        if (userAnswer !== -1) {
            const userLetter = String.fromCharCode(65 + userAnswer);
            detailHTML += `<div>Tu respuesta: <span style="color: ${isCorrect ? '#10b981' : '#ef4444'}; font-weight: bold;">${userLetter}) ${questions[i].options[userAnswer].text}</span></div>`;
        } else {
            detailHTML += `<div style="color: #6b7280;">No respondida</div>`;
        }
        
        const correctLetter = String.fromCharCode(65 + correctAnswer);
        detailHTML += `<div>Respuesta correcta: <span style="color: #10b981; font-weight: bold;">${correctLetter}) ${questions[i].options[correctAnswer].text}</span></div>`;
        detailHTML += `</div></div>`;
    }
    
    resultsDetail.innerHTML = detailHTML;
    resultsDiv.style.display = 'block';
    
    // Mostrar respuestas correctas en cada pregunta
    document.querySelectorAll('.correct-answer').forEach(element => {
        element.style.display = 'block';
    });
    
    // Deshabilitar botones de opción
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true;
    });
    
    // Ocultar botón de finalizar
    document.querySelector('.test-actions').style.display = 'none';
    
    // ===== SCROLL AUTOMÁTICO HACIA LOS RESULTADOS =====
    setTimeout(() => {
        resultsDiv.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start'
        });
    }, 100);
    
    // ===== LIMPIAR ESTADO GLOBAL INMEDIATAMENTE =====
    setTimeout(() => {
        if (window.currentTestQuestions) {
            delete window.currentTestQuestions;
        }
        cleanupTestState();
    }, 2000);
}

/**
 * Limpia el estado del test para evitar bloqueo
 */
function cleanupTestState() {
    // Limpiar cualquier dato residual del test
    if (window.currentTestQuestions) {
        delete window.currentTestQuestions;
    }
    
    // ASEGURAR QUE LOS BOTONES PRINCIPALES SIGAN SIENDO VISIBLES Y HABILITADOS
    ensureMainButtonsVisible();
}

/**
/**
 * Crea un test interactivo
 * @param {string} content - Contenido del test generado
 * @param {string} title - Título del test
 * @returns {string} - HTML del test interactivo
 */
function createInteractiveTest(content, title) {
    // Parsear preguntas
    const questions = parseTestQuestions(content);
    
    // Verificar si hay preguntas válidas
    if (!questions || questions.length === 0) {
        return `
            <div class="results-header">
                <h3 class="results-title">${title}</h3>
            </div>
            <div class="result-content">
                <p style="color: #ef4444;">Error: No se pudieron generar preguntas válidas. Por favor, inténtalo de nuevo con otro tema.</p>
            </div>
        `;
    }
    
    // Guardar preguntas en un atributo de datos para usar después
    window.currentTestQuestions = questions;
    
    // Crear HTML del test interactivo
    let html = `
        <div class="results-header">
            <h3 class="results-title">${title}</h3>
        </div>
        <div class="test-container">
            <div class="test-questions">
    `;
    
    questions.forEach((question, index) => {
        // Verificar que la pregunta tenga opciones válidas
        if (!question || !question.options || question.options.length === 0) {
            return; // Saltar esta pregunta si no es válida
        }
        
        html += `
            <div class="test-question" data-question="${index}">
                <div class="question-text"><strong>${question.question}</strong></div>
                <div class="options-container">
        `;
        
        question.options.forEach((option, optionIndex) => {
            // Verificar que la opción sea válida
            if (!option || typeof option.text !== 'string') {
                return; // Saltar esta opción si no es válida
            }
            
            const letter = String.fromCharCode(65 + optionIndex); // A, B, C
            html += `
                <button class="option-btn" data-question="${index}" data-option="${optionIndex}" onclick="selectOption(${index}, ${optionIndex})">
                    ${letter}) ${option.text}
                </button>
            `;
        });
        
        // Verificar que haya una opción correcta
        if (question.correctOption >= 0 && question.correctOption < question.options.length) {
            html += `
                </div>
                <div class="correct-answer" style="display: none; margin-top: 10px; font-style: italic; color: #666; padding: 10px; background: #f1f5f9; border-radius: 5px; border-left: 4px solid #3b82f6;">
                    Respuesta correcta: ${String.fromCharCode(65 + question.correctOption)}) ${question.options[question.correctOption].text}
                </div>
            `;
        } else {
            html += `
                </div>
                <div class="correct-answer" style="display: none; margin-top: 10px; font-style: italic; color: #666; padding: 10px; background: #f1f5f9; border-radius: 5px; border-left: 4px solid #3b82f6;">
                    Respuesta correcta: No disponible
                </div>
            `;
        }
        
        html += `
            </div>
        `;
    });
    
    html += `
            </div>
            <div class="test-actions">
                <button class="submit-btn" onclick="submitTest(${questions.length})">Finalizar Test</button>
            </div>
            <div class="test-results" style="display: none; margin-top: 20px; padding: 20px; border-radius: 10px; background: #f8f9fa;">
                <h3>Resultados del Test</h3>
                <div class="score-display" style="font-size: 24px; font-weight: bold; margin: 10px 0;"></div>
                <div class="results-detail"></div>
            </div>
        </div>
    `;
    
    return html;

}

// =====================================================
// FUNCIONES DE MANEJO DE RESULTADOS Y UI (MEJORADAS)
// =====================================================

/**
 * Formatea el contenido para eliminar formatos no deseados
 * @param {string} content - Contenido a formatear
 * @returns {string} - Contenido formateado
 */
function formatContent(content) {
    return content
        .replace(/#\s+/g, '• ')  // Reemplazar encabezados con viñetas
        .replace(/##\s+/g, '• ')
        .replace(/###\s+/g, '• ')
        .replace(/\*\*(.*?)\*\*/g, '$1')  // Eliminar negritas
        .replace(/~~(.*?)~~/g, '$1')  // Eliminar tachado
        .replace(/`(.*?)`/g, '$1')  // Eliminar código
        .replace(/_(.*?)_/g, '$1')  // Eliminar cursiva
        .replace(/\n{3,}/g, '\n\n')  // Reducir saltos de línea múltiples
        .replace(/---/g, '')  // Eliminar separadores tipo ---
        .replace(/__/g, '')  // Eliminar separadores tipo __
        .replace(/\.{3,}/g, '')  // Eliminar puntos suspensivos múltiples
        .replace(/\*{3,}/g, '')  // Eliminar asteriscos múltiples
        .trim();
}

/**
 * Formatea el contenido de cuestionarios para mejor presentación
 * @param {string} content - Contenido del cuestionario
 * @returns {string} - Contenido formateado
 */
function formatQuizContent(content) {
    // No aplicar formato especial para cuestionarios
    return content;
}

/**
 * Muestra los resultados de generación en la interfaz
 * @param {string} resultId - ID del div donde mostrar resultados
 * @param {string} content - Contenido a mostrar
 * @param {string} title - Título del resultado
 * @param {boolean} isTest - Indica si es un test interactivo
 */
function displayResult(resultId, content, title, isTest = false) {
    const resultDiv = document.getElementById(resultId);
    
    if (isTest) {
        // Crear test interactivo
        const interactiveTestHTML = createInteractiveTest(content, title);
        resultDiv.innerHTML = interactiveTestHTML;
    } else if (title.includes('Cuestionario') || title.includes('Test')) {
        // Formatear cuestionarios normales
        let formattedContent = formatQuizContent(content);
        resultDiv.innerHTML = `
            <div class="results-header">
                <h3 class="results-title">${title}</h3>
                <button class="download-btn" onclick="downloadPDF('${encodeURIComponent(formattedContent)}', '${title.toLowerCase().replace(/\s+/g, '_')}.pdf')">Descargar PDF</button>
            </div>
            <div class="result-content">
                <div>${formattedContent.replace(/</g, '<').replace(/>/g, '>').replace(/\n/g, '<br>')}</div>
            </div>
        `;
    } else {
        // Para otros tipos de contenido
        let formattedContent = formatContent(content);
        resultDiv.innerHTML = `
            <div class="results-header">
                <h3 class="results-title">${title}</h3>
                <button class="download-btn" onclick="downloadPDF('${encodeURIComponent(formattedContent)}', '${title.toLowerCase().replace(/\s+/g, '_')}.pdf')">Descargar PDF</button>
            </div>
            <div class="result-content">
                <div>${formattedContent.replace(/</g, '<').replace(/>/g, '>').replace(/\n/g, '<br>')}</div>
            </div>
        `;
    }
    
    resultDiv.style.display = 'block';
    
    // ASEGURAR QUE LOS BOTONES PRINCIPALES SIGAN SIENDO VISIBLES Y HABILITADOS
    ensureMainButtonsVisible();
}

/**
 * Función para descargar contenido como PDF usando jsPDF
 * @param {string} content - Contenido a descargar
 * @param {string} filename - Nombre del archivo
 */
function downloadPDF(content, filename) {
    try {
        // Decodificar el contenido
        const decodedContent = decodeURIComponent(content);
        
        // Procesar contenido
        const lines = decodedContent.split('\n');
        const firstLine = lines[0] || 'Documento';
        const title = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
        
        // Crear documento PDF en orientación vertical (portrait) formato A4
        const doc = new jspdf.jsPDF('p', 'mm', 'a4');
        
        // Configurar márgenes y estilo
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const leftMargin = 20;
        const rightMargin = 20;
        const maxWidth = pageWidth - leftMargin - rightMargin;
        
        // Título principal
        doc.setFontSize(16);
        doc.setTextColor(30, 64, 175); // Color azul principal
        doc.setFont(undefined, 'bold');
        doc.text(title, leftMargin, 20);
        
        // Línea decorativa
        doc.setDrawColor(30, 64, 175);
        doc.line(leftMargin, 25, pageWidth - rightMargin, 25);
        
        // Contenido principal
        doc.setFontSize(12);
        doc.setTextColor(51, 51, 51); // Color gris oscuro
        doc.setFont(undefined, 'normal');
        
        // Posición inicial para el contenido
        let yPos = 35;
        const lineHeight = 7;
        
        // Procesar cada línea del contenido
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.length === 0) {
                // Línea vacía - solo avanzar posición
                yPos += lineHeight / 2;
            } else if (/^\d+\./.test(line)) {
                // Pregunta - poner en negrita
                doc.setFont(undefined, 'bold');
                const splitText = doc.splitTextToSize(line, maxWidth);
                for (let j = 0; j < splitText.length; j++) {
                    doc.text(splitText[j], leftMargin, yPos);
                    yPos += lineHeight;
                    
                    // Verificar si necesitamos una nueva página
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = 20;
                    }
                }
                doc.setFont(undefined, 'normal');
            } else if (/^[A-C]\)/.test(line)) {
                // Opción de respuesta
                doc.setFont(undefined, 'normal');
                const splitText = doc.splitTextToSize(line, maxWidth);
                for (let j = 0; j < splitText.length; j++) {
                    doc.text(splitText[j], leftMargin + 5, yPos);
                    yPos += lineHeight;
                    
                    // Verificar si necesitamos una nueva página
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = 20;
                    }
                }
            } else if (/^Respuesta:/.test(line)) {
                // Respuesta - poner en cursiva
                doc.setFont(undefined, 'italic');
                const splitText = doc.splitTextToSize(line, maxWidth);
                for (let j = 0; j < splitText.length; j++) {
                    doc.text(splitText[j], leftMargin + 5, yPos);
                    yPos += lineHeight;
                    
                    // Verificar si necesitamos una nueva página
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = 20;
                    }
                }
                doc.setFont(undefined, 'normal');
                // Espacio adicional después de la respuesta
                yPos += lineHeight;
            } else {
                // Texto normal - dividir en líneas si es muy largo
                const splitText = doc.splitTextToSize(line, maxWidth);
                for (let j = 0; j < splitText.length; j++) {
                    doc.text(splitText[j], leftMargin, yPos);
                    yPos += lineHeight;
                    
                    // Verificar si necesitamos una nueva página
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = 20;
                    }
                }
            }
            
            // Verificar si necesitamos una nueva página
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = 20;
            }
        }
        
        // Pie de página
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('Generado con Sensu Learning', leftMargin, pageHeight - 15);
        
        // Guardar el PDF
        doc.save(filename);
        
        console.log('PDF generado exitosamente');
    } catch (error) {
        console.error('Error al generar PDF:', error);
        alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    }
}

// =====================================================
// EVENT LISTENERS PARA LOS FORMULARIOS
// =====================================================

// Formulario de resumen desde PDF
document.getElementById('summary-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const file = document.getElementById('summary-file').files[0];
    const resultDiv = document.getElementById('summary-result');
    
    if (file) {
        // Mostrar indicador de procesamiento
        resultDiv.innerHTML = '<p>Procesando PDF y generando resumen... <i class="fas fa-spinner fa-spin"></i></p>';
        resultDiv.style.display = 'block';
        
        try {
            // Procesar el PDF para extraer su contenido
            const processedContent = await processPDF(file);
            
            // Generar resumen basado en el contenido del PDF
            const summaryContent = await generateRealSummary(processedContent, true);
            
            // Mostrar el resultado
            displayResult('summary-result', summaryContent, 'Resumen Generado');
        } catch (error) {
            resultDiv.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    }
});

// Formulario de resumen con IA
document.getElementById('summary-ai-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const topic = document.getElementById('summary-topic').value;
    const resultDiv = document.getElementById('summary-ai-result');
    
    if (topic) {
        // Mostrar indicador de generación
        resultDiv.innerHTML = '<p>Generando resumen... <i class="fas fa-spinner fa-spin"></i></p>';
        resultDiv.style.display = 'block';
        
        try {
            const summaryContent = await generateRealSummary(topic, false);
            displayResult('summary-ai-result', summaryContent, 'Resumen Generado');
        } catch (error) {
            resultDiv.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    }
});

// Formulario de cuestionario desde PDF
document.getElementById('quiz-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const file = document.getElementById('quiz-file').files[0];
    const count = document.getElementById('quiz-count').value;
    const resultDiv = document.getElementById('quiz-result');
    
    if (file) {
        // Mostrar indicador de procesamiento
        resultDiv.innerHTML = '<p>Procesando PDF y generando cuestionario... <i class="fas fa-spinner fa-spin"></i></p>';
        resultDiv.style.display = 'block';
        
        try {
            // Procesar el PDF para extraer su contenido
            const processedContent = await processPDF(file);
            
            // Generar cuestionario basado en el contenido del PDF
            const quizContent = await generateRealQuiz(processedContent, count, true);
            
            // Mostrar el resultado
            displayResult('quiz-result', quizContent, `Cuestionario Generado (${count} preguntas)`);
        } catch (error) {
            resultDiv.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    }
});

// Formulario de cuestionario con IA
document.getElementById('quiz-ai-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const topic = document.getElementById('quiz-ai-topic').value;
    const count = document.getElementById('quiz-ai-count').value;
    const resultDiv = document.getElementById('quiz-ai-result');
    
    if (topic) {
        // Mostrar indicador de generación
        resultDiv.innerHTML = '<p>Generando cuestionario... <i class="fas fa-spinner fa-spin"></i></p>';
        resultDiv.style.display = 'block';
        
        try {
            const quizContent = await generateRealQuiz(topic, count, false);
            displayResult('quiz-ai-result', quizContent, `Cuestionario Generado (${count} preguntas)`);
        } catch (error) {
            resultDiv.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    }
});

// Formulario de test desde PDF
document.getElementById('test-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const file = document.getElementById('test-file').files[0];
    const count = document.getElementById('test-count').value;
    const resultDiv = document.getElementById('test-result');
    
    if (file) {
        // Mostrar indicador de procesamiento
        resultDiv.innerHTML = '<p>Procesando PDF y generando test... <i class="fas fa-spinner fa-spin"></i></p>';
        resultDiv.style.display = 'block';
        
        try {
            // Procesar el PDF para extraer su contenido
            const processedContent = await processPDF(file);
            
            // Generar test basado en el contenido del PDF
            const testContent = await generateRealTest(processedContent, count, true);
            
            // Mostrar el test interactivo
            displayResult('test-result', testContent, `Test Generado (${count} preguntas)`, true);
        } catch (error) {
            resultDiv.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    }
});

// Formulario de test con IA
document.getElementById('test-ai-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const topic = document.getElementById('test-ai-topic').value;
    const count = document.getElementById('test-ai-count').value;
    const resultDiv = document.getElementById('test-ai-result');
    
    if (topic) {
        // Mostrar indicador de generación
        resultDiv.innerHTML = '<p>Generando test... <i class="fas fa-spinner fa-spin"></i></p>';
        resultDiv.style.display = 'block';
        
        try {
            const testContent = await generateRealTest(topic, count, false);
            // Mostrar el test interactivo
            displayResult('test-ai-result', testContent, `Test Generado (${count} preguntas)`, true);
        } catch (error) {
            resultDiv.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    }
});

// Formulario de podcast desde documento (simulado)
document.getElementById('podcast-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const file = document.getElementById('podcast-file').files[0];
    const resultDiv = document.getElementById('podcast-result');
    
    if (file) {
        resultDiv.innerHTML = `
            <div class="results-header">
                <h3 class="results-title">Podcast Generado</h3>
                <button class="download-btn">Descargar Audio</button>
            </div>
            <div class="result-content">
                <p>Podcast educativo generado exitosamente.</p>
                <p><strong>Nota:</strong> La funcionalidad de generación de audio se implementará próximamente con la API de texto a voz.</p>
                <p><strong>Duración estimada:</strong> 15-20 minutos</p>
                <p><strong>Contenido:</strong> Información estructurada en formato audio para estudio multitarea</p>
            </div>
        `;
        resultDiv.style.display = 'block';
        
        // ASEGURAR QUE LOS BOTONES PRINCIPALES SIGAN SIENDO VISIBLES
        ensureMainButtonsVisible();
    }
});

// Formulario de podcast desde texto (simulado)
document.getElementById('podcast-text-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const text = document.getElementById('podcast-text').value;
    const resultDiv = document.getElementById('podcast-text-result');
    
    if (text) {
        resultDiv.innerHTML = `
            <div class="results-header">
                <h3 class="results-title">Podcast Generado</h3>
                <button class="download-btn">Descargar Audio</button>
            </div>
            <div class="result-content">
                <p>Podcast educativo generado exitosamente.</p>
                <p><strong>Nota:</strong> La funcionalidad de generación de audio se implementará próximamente con la API de texto a voz.</p>
                <p><strong>Duración estimada:</strong> 15-20 minutos</p>
                <p><strong>Contenido:</strong> Información estructurada en formato audio para estudio multitarea</p>
            </div>
        `;
        resultDiv.style.display = 'block';
        
        // ASEGURAR QUE LOS BOTONES PRINCIPALES SIGAN SIENDO VISIBLES
        ensureMainButtonsVisible();
    }
});

// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// =====================================================
// FUNCIONES DE LIMPIEZA PARA EVITAR BLOQUEO
// =====================================================

/**
 * Asegura que los botones principales sean visibles y habilitados
 */
function ensureMainButtonsVisible() {
    console.log('Asegurando visibilidad de botones principales...');
    
    // Asegurar contenedores de herramientas
    const toolCards = document.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
        if (card) {
            card.style.display = 'block';
        }
    });
    
    // Asegurar sección de herramientas
    const toolsSection = document.getElementById('tools');
    if (toolsSection) {
        toolsSection.style.display = 'block';
    }
    
    // Asegurar contenido principal
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.display = 'block';
    }
    
    // HABILITAR TODOS LOS BOTONES DE HERRAMIENTAS
    const allToolButtons = document.querySelectorAll('.tool-card .option-btn, .tool-card button, .modal-content button');
    allToolButtons.forEach(button => {
        if (button) {
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.style.pointerEvents = 'auto';
        }
    });
    
    // HABILITAR BOTONES DE ACCIÓN
    const actionButtons = document.querySelectorAll('.submit-btn, .download-btn, .control-btn');
    actionButtons.forEach(button => {
        if (button) {
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.style.pointerEvents = 'auto';
        }
    });
}

// MENU DE HAMBURGUESA PARA MÓVIL
// // Función para el menú móvil
// document.addEventListener('DOMContentLoaded', function() {
//     const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
//     const mobileNav = document.getElementById('mobile-nav');
//     const desktopNav = document.getElementById('desktop-nav');
    
//     if (mobileMenuToggle && mobileNav) {
//         mobileMenuToggle.addEventListener('click', function() {
//             mobileNav.classList.toggle('active');
//         });
//     }
    
//     // Cerrar menú móvil al hacer clic en cualquier enlace
//     const mobileLinks = document.querySelectorAll('.mobile-nav a');
//     mobileLinks.forEach(link => {
//         link.addEventListener('click', function() {
//             mobileNav.classList.remove('active');
//         });
//     });
    
//     // Cerrar menú móvil al hacer clic fuera
//     document.addEventListener('click', function(event) {
//         if (!event.target.closest('.mobile-nav') && !event.target.closest('.mobile-menu-toggle')) {
//             mobileNav.classList.remove('active');
//         }
//     });
// });


// Función para el menú móvil
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileNav.classList.toggle('active');
        });
    }
    
    // Cerrar menú móvil al hacer clic en cualquier enlace
    const mobileLinks = document.querySelectorAll('.mobile-nav a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileNav.classList.remove('active');
        });
    });
    
    // Cerrar menú móvil al hacer clic fuera
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.mobile-nav') && !event.target.closest('.mobile-menu-toggle')) {
            mobileNav.classList.remove('active');
        }
    });
});