export interface Viseme {
  mouth: number;
  jaw: number;
  lips: number;
  timestamp: number;
}

const VISEME_MAP: Record<string, { mouth: number; jaw: number; lips: number }> = {
  "A": { mouth: 0.8, jaw: 0.7, lips: 0.3 },
  "E": { mouth: 0.6, jaw: 0.5, lips: 0.2 },
  "I": { mouth: 0.4, jaw: 0.3, lips: 0.1 },
  "O": { mouth: 0.9, jaw: 0.8, lips: 0.5 },
  "U": { mouth: 0.7, jaw: 0.6, lips: 0.4 },
  "B": { mouth: 0.1, jaw: 0.1, lips: 0.9 },
  "P": { mouth: 0.1, jaw: 0.1, lips: 0.9 },
  "M": { mouth: 0.2, jaw: 0.2, lips: 0.8 },
  "F": { mouth: 0.2, jaw: 0.1, lips: 0.7 },
  "V": { mouth: 0.2, jaw: 0.1, lips: 0.7 },
  "TH": { mouth: 0.3, jaw: 0.3, lips: 0.2 },
  "L": { mouth: 0.4, jaw: 0.4, lips: 0.3 },
  "T": { mouth: 0.3, jaw: 0.3, lips: 0.3 },
  "S": { mouth: 0.3, jaw: 0.2, lips: 0.3 },
  "Z": { mouth: 0.3, jaw: 0.2, lips: 0.3 },
  "CH": { mouth: 0.4, jaw: 0.4, lips: 0.3 },
  "J": { mouth: 0.4, jaw: 0.4, lips: 0.4 },
  "N": { mouth: 0.3, jaw: 0.3, lips: 0.2 },
  "NG": { mouth: 0.3, jaw: 0.3, lips: 0.2 },
  "K": { mouth: 0.3, jaw: 0.3, lips: 0.2 },
  "G": { mouth: 0.3, jaw: 0.3, lips: 0.3 },
  "H": { mouth: 0.2, jaw: 0.2, lips: 0.2 },
  "W": { mouth: 0.5, jaw: 0.4, lips: 0.5 },
  "Y": { mouth: 0.4, jaw: 0.3, lips: 0.3 },
  "R": { mouth: 0.4, jaw: 0.3, lips: 0.3 },
  "D": { mouth: 0.3, jaw: 0.3, lips: 0.3 },
};

function mapPhonemeToViseme(phoneme: string): { mouth: number; jaw: number; lips: number } {
  const upper = phoneme.toUpperCase();
  for (const [key, value] of Object.entries(VISEME_MAP)) {
    if (upper.includes(key) || key.includes(upper)) {
      return value;
    }
  }
  return { mouth: 0, jaw: 0, lips: 0 };
}

export function generateVisemesFromText(text: string, speechRate: number = 150): Viseme[] {
  const words = text.toLowerCase().replace(/[^a-z]/g, "").split("").filter(Boolean);
  const visemes: Viseme[] = [];
  const msPerPhoneme = 60000 / speechRate;
  let currentTime = 0;

  for (let i = 0; i < words.length; i++) {
    const char = words[i];
    const phoneme = mapPhonemeToViseme(char);
    
    visemes.push({
      mouth: phoneme.mouth,
      jaw: phoneme.jaw,
      lips: phoneme.lips,
      timestamp: currentTime,
    });

    currentTime += msPerPhoneme * 0.5;
  }

  if (visemes.length === 0) {
    visemes.push({ mouth: 0, jaw: 0, lips: 0, timestamp: 0 });
  }

  return visemes;
}

export function getVisemeAtTime(visemes: Viseme[], time: number): { mouth: number; jaw: number; lips: number } {
  if (visemes.length === 0) return { mouth: 0, jaw: 0, lips: 0 };
  if (visemes.length === 1) return visemes[0];

  for (let i = 0; i < visemes.length - 1; i++) {
    const duration = visemes[i + 1].timestamp - visemes[i].timestamp;
    if (time >= visemes[i].timestamp && time < visemes[i + 1].timestamp && duration > 0) {
      const t = (time - visemes[i].timestamp) / duration;
      return {
        mouth: visemes[i].mouth * (1 - t) + visemes[i + 1].mouth * t,
        jaw: visemes[i].jaw * (1 - t) + visemes[i + 1].jaw * t,
        lips: visemes[i].lips * (1 - t) + visemes[i + 1].lips * t,
      };
    }
  }

  return visemes[visemes.length - 1];
}

export function getTotalDuration(visemes: Viseme[]): number {
  if (visemes.length === 0) return 0;
  return visemes[visemes.length - 1].timestamp + 100;
}