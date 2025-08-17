// Your script here.
const voicesDropdown = document.getElementById('voices');
        const rateSlider = document.getElementById('rate');
        const pitchSlider = document.getElementById('pitch');
        const textArea = document.getElementById('text');
        const speakButton = document.getElementById('speak');
        const stopButton = document.getElementById('stop');
        const rateValue = document.getElementById('rate-value');
        const pitchValue = document.getElementById('pitch-value');
        const errorMessage = document.getElementById('error-message');

        // Speech synthesis variables
        let voices = [];
        let currentUtterance = null;

        // Initialize the application
        function init() {
            // Check if Web Speech API is supported
            if (!('speechSynthesis' in window)) {
                showError('Speech synthesis is not supported in your browser.');
                speakButton.disabled = true;
                return;
            }

            // Load voices when they become available
            loadVoices();
            
            // Some browsers require a delay or user interaction before voices are loaded
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = loadVoices;
            }

            // Set up event listeners
            setupEventListeners();
        }

        // Load available voices into the dropdown
        function loadVoices() {
            voices = speechSynthesis.getVoices();
            
            // Clear existing options (except the first one)
            voicesDropdown.innerHTML = '<option value="">Select A Voice</option>';
            
            if (voices.length === 0) {
                showError('No voices available. Please try refreshing the page.');
                return;
            }

            // Populate dropdown with available voices
            voices.forEach((voice, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${voice.name} (${voice.lang})`;
                
                // Mark default voice
                if (voice.default) {
                    option.textContent += ' - Default';
                }
                
                voicesDropdown.appendChild(option);
            });

            // Select first voice by default
            if (voices.length > 0 && voicesDropdown.value === '') {
                voicesDropdown.value = '0';
            }

            hideError();
        }

        // Set up all event listeners
        function setupEventListeners() {
            // Speak button
            speakButton.addEventListener('click', handleSpeak);
            
            // Stop button
            stopButton.addEventListener('click', handleStop);
            
            // Rate slider
            rateSlider.addEventListener('input', updateRateValue);
            
            // Pitch slider
            pitchSlider.addEventListener('input', updatePitchValue);
            
            // Voice dropdown change
            voicesDropdown.addEventListener('change', handleVoiceChange);
            
            // Text area change (for real-time validation)
            textArea.addEventListener('input', validateInput);
        }

        // Handle speak button click
        function handleSpeak() {
            const text = textArea.value.trim();
            
            // Validate input
            if (!text) {
                showError('Please enter some text to speak.');
                textArea.focus();
                return;
            }

            if (voices.length === 0) {
                showError('No voices available. Please try refreshing the page.');
                return;
            }

            // Stop any current speech
            if (currentUtterance) {
                speechSynthesis.cancel();
            }

            // Create new utterance
            currentUtterance = new SpeechSynthesisUtterance(text);
            
            // Set voice if one is selected
            const selectedVoiceIndex = voicesDropdown.value;
            if (selectedVoiceIndex !== '' && voices[selectedVoiceIndex]) {
                currentUtterance.voice = voices[selectedVoiceIndex];
            }

            // Set rate and pitch
            currentUtterance.rate = parseFloat(rateSlider.value);
            currentUtterance.pitch = parseFloat(pitchSlider.value);

            // Set up event listeners for the utterance
            currentUtterance.onstart = function() {
                speakButton.textContent = 'Speaking...';
                speakButton.disabled = true;
                hideError();
            };

            currentUtterance.onend = function() {
                resetSpeakButton();
                currentUtterance = null;
            };

            currentUtterance.onerror = function(event) {
                showError('An error occurred during speech synthesis: ' + event.error);
                resetSpeakButton();
                currentUtterance = null;
            };

            // Start speaking
            speechSynthesis.speak(currentUtterance);
        }

        // Handle stop button click
        function handleStop() {
            if (speechSynthesis.speaking || speechSynthesis.pending) {
                speechSynthesis.cancel();
                resetSpeakButton();
                currentUtterance = null;
            }
        }

        // Handle voice change (restart speech if currently speaking)
        function handleVoiceChange() {
            if (speechSynthesis.speaking && currentUtterance) {
                // Stop current speech
                speechSynthesis.cancel();
                
                // Restart with new voice after a short delay
                setTimeout(() => {
                    if (currentUtterance) {
                        handleSpeak();
                    }
                }, 100);
            }
        }

        // Update rate value display
        function updateRateValue() {
            rateValue.textContent = parseFloat(rateSlider.value).toFixed(1);
            
            // Update current utterance if speaking
            if (speechSynthesis.speaking && currentUtterance) {
                // Note: Rate can't be changed mid-speech, would need to restart
                // This is a limitation of the Web Speech API
            }
        }

        // Update pitch value display
        function updatePitchValue() {
            pitchValue.textContent = parseFloat(pitchSlider.value).toFixed(1);
            
            // Note: Pitch can't be changed mid-speech, would need to restart
            // This is a limitation of the Web Speech API
        }

        // Validate text input
        function validateInput() {
            const text = textArea.value.trim();
            if (!text && errorMessage.textContent.includes('enter some text')) {
                hideError();
            }
        }

        // Reset speak button to original state
        function resetSpeakButton() {
            speakButton.textContent = 'Speak';
            speakButton.disabled = false;
        }

        // Show error message
        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }

        // Hide error message
        function hideError() {
            errorMessage.style.display = 'none';
        }

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', init);

        // Also try to load voices when the page becomes visible (helpful for some browsers)
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden && voices.length === 0) {
                setTimeout(loadVoices, 100);
            }
        });