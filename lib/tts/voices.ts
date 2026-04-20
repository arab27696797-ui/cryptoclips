export interface VoiceDefinition {
  id: string
  name: string
  gender: 'male' | 'female'
  language: string
  languageName: string
  previewUrl?: string
}

export const VOICES: VoiceDefinition[] = [
  { id: 'en-US-AriaNeural', name: 'Aria', gender: 'female', language: 'en', languageName: 'English (US)' },
  { id: 'en-US-GuyNeural', name: 'Guy', gender: 'male', language: 'en', languageName: 'English (US)' },
  { id: 'en-US-JennyNeural', name: 'Jenny', gender: 'female', language: 'en', languageName: 'English (US)' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia', gender: 'female', language: 'en', languageName: 'English (UK)' },
  { id: 'en-GB-RyanNeural', name: 'Ryan', gender: 'male', language: 'en', languageName: 'English (UK)' },

  { id: 'es-ES-ElviraNeural', name: 'Elvira', gender: 'female', language: 'es', languageName: 'Spanish' },
  { id: 'es-ES-AlvaroNeural', name: 'Alvaro', gender: 'male', language: 'es', languageName: 'Spanish' },
  { id: 'es-MX-DaliaNeural', name: 'Dalia', gender: 'female', language: 'es', languageName: 'Spanish (Mexico)' },

  { id: 'pt-BR-FranciscaNeural', name: 'Francisca', gender: 'female', language: 'pt', languageName: 'Portuguese (BR)' },
  { id: 'pt-BR-AntonioNeural', name: 'Antonio', gender: 'male', language: 'pt', languageName: 'Portuguese (BR)' },

  { id: 'ru-RU-SvetlanaNeural', name: 'Svetlana', gender: 'female', language: 'ru', languageName: 'Russian' },
  { id: 'ru-RU-DmitryNeural', name: 'Dmitry', gender: 'male', language: 'ru', languageName: 'Russian' },
]

export function getVoiceById(id: string): VoiceDefinition | undefined {
  return VOICES.find((voice) => voice.id === id)
}

export function getVoicesByLanguage(language: string): VoiceDefinition[] {
  return VOICES.filter((voice) => voice.language === language)
}

export function listAllVoices(): VoiceDefinition[] {
  return VOICES
}
