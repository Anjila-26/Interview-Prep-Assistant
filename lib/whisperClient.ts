// Client-side only Whisper speech recognition
let pipelineInstance: any = null;
let transformersModule: any = null;

export class WhisperClient {
    private transcriber: any = null;
    private isLoaded: boolean = false;
    private isLoading: boolean = false;

    async load(progressCallback?: (data: any) => void) {
        if (this.isLoaded || this.isLoading) return;
        if (typeof window === 'undefined') {
            console.warn('WhisperClient can only run in the browser');
            return;
        }
        
        this.isLoading = true;
        try {
            // Dynamic import to ensure it only loads on client side
            if (!transformersModule) {
                transformersModule = await import('@xenova/transformers');
                
                // Configure environment for browser usage
                if (transformersModule.env) {
                    transformersModule.env.allowLocalModels = false;
                    transformersModule.env.useBrowserCache = true;
                    transformersModule.env.backends.onnx.wasm.numThreads = 1;
                }
                
                pipelineInstance = transformersModule.pipeline;
            }
            
            if (!pipelineInstance) {
                throw new Error('Failed to load transformers pipeline');
            }
            
            this.transcriber = await pipelineInstance(
                'automatic-speech-recognition',
                'Xenova/whisper-tiny.en', // Smaller model for faster loading
                { 
                    progress_callback: progressCallback,
                    quantized: true // Use quantized model for faster loading
                }
            );
            this.isLoaded = true;
        } catch (error) {
            console.error("Failed to load Whisper model:", error);
            this.isLoading = false;
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    async transcribe(audioBuffer: Float32Array | ArrayBuffer): Promise<string | null> {
        if (!this.isLoaded) {
            console.error("Whisper model not loaded.");
            return null;
        }
        try {
            const output = await this.transcriber(audioBuffer);
            return output.text || output;
        } catch (error) {
            console.error("Transcription error:", error);
            return null;
        }
    }

    get loaded(): boolean {
        return this.isLoaded;
    }

    get loading(): boolean {
        return this.isLoading;
    }
}
