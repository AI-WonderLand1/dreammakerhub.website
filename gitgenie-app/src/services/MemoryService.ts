import { collection, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export interface Memory {
  id: string;
  repo: string;
  content: string;
  timestamp: number;
  userId: string;
}

class MemoryService {
  private memories: Memory[] = [];
  private unsubscribe: (() => void) | null = null;
  private currentRepo: string | null = null;
  private currentUserId: string | null = null;
  private listeners: ((memories: Memory[]) => void)[] = [];

  subscribeToRepo(repo: string, userId: string) {
    if (this.currentRepo === repo && this.currentUserId === userId) return;
    
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.currentRepo = repo;
    this.currentUserId = userId;
    this.memories = [];
    this.notifyListeners();

    const q = query(
      collection(db, 'memories'),
      where('repo', '==', repo),
      where('userId', '==', userId)
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const sortedDocs = snapshot.docs.sort((a, b) => {
        const aTime = a.data().timestamp || 0;
        const bTime = b.data().timestamp || 0;
        return aTime - bTime;
      });
      this.memories = sortedDocs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Memory));
      this.notifyListeners();
    }, (error) => {
      console.error("Error fetching memories:", error);
    });
  }

  async addMemory(content: string) {
    if (!this.currentRepo || !this.currentUserId) {
      console.error("Cannot add memory: repo or userId not set");
      return;
    }

    try {
      await addDoc(collection(db, 'memories'), {
        repo: this.currentRepo,
        content,
        timestamp: Date.now(),
        userId: this.currentUserId
      });
      console.log('Memory added to Firestore');
    } catch (error) {
      console.error("Error adding memory:", error);
    }
  }

  getMemories(): Memory[] {
    return this.memories;
  }

  onChange(listener: (memories: Memory[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.memories));
  }
}

export const memoryService = new MemoryService();
