export interface Memory {
  id: string;
  content: string;
  timestamp: number;
}

class MemoryService {
  private memories: Memory[] = [];

  addMemory(content: string) {
    const memory: Memory = {
      id: Math.random().toString(36).substring(7),
      content,
      timestamp: Date.now(),
    };
    this.memories.push(memory);
    console.log('Memory added:', memory);
  }

  getMemories(): Memory[] {
    return this.memories;
  }
}

export const memoryService = new MemoryService();
