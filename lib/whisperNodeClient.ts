// Node.js Whisper speech recognition using nodejs-whisper and tiny.en model
import { createWhisper } from 'nodejs-whisper';

export class WhisperNodeClient {
    private whisper: any = null;
    private isLoaded: boolean = false;
    private modelPath: string;

    constructor(modelPath: string) {
        this.modelPath = modelPath;
    }

    async load() {
        if (this.isLoaded) return;
        this.whisper = await createWhisper({ model: 'tiny.en', modelPath: this.modelPath });
        this.isLoaded = true;
    }

    async transcribe(filePath: string): Promise<string | null> {
        if (!this.isLoaded) {
            console.error("Whisper model not loaded.");
            return null;
        }
        try {
            const result = await this.whisper.transcribe(filePath);
            return result.text;
        } catch (error) {
            console.error("Transcription error:", error);
            return null;
        }
    }

    get loaded(): boolean {
        return this.isLoaded;
    }
}
