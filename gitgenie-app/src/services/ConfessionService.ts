import { collection, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export interface Confession {
  id: string;
  type: string;
  title: string;
  detail: string;
  timestamp: number;
  userId: string;
}

class ConfessionService {
  private confessions: Confession[] = [];
  private unsubscribe: (() => void) | null = null;
  private currentUserId: string | null = null;
  private listeners: ((confessions: Confession[]) => void)[] = [];

  subscribeToUser(userId: string) {
    if (this.currentUserId === userId) return;
    
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.currentUserId = userId;
    this.confessions = [];
    this.notifyListeners();

    const q = query(
      collection(db, 'confessions'),
      where('userId', '==', userId)
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const sortedDocs = snapshot.docs.sort((a, b) => {
        const aTime = a.data().timestamp || 0;
        const bTime = b.data().timestamp || 0;
        return bTime - aTime; // Newest first
      });
      this.confessions = sortedDocs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Confession));
      this.notifyListeners();
    }, (error) => {
      console.error("Error fetching confessions:", error);
    });
  }

  async addConfession(type: string, title: string, detail: string) {
    if (!this.currentUserId) {
      console.error("Cannot add confession: userId not set");
      return;
    }

    try {
      await addDoc(collection(db, 'confessions'), {
        type,
        title,
        detail,
        timestamp: Date.now(),
        userId: this.currentUserId
      });
      console.log('Confession added to Firestore');
    } catch (error) {
      console.error("Error adding confession:", error);
    }
  }

  getConfessions(): Confession[] {
    return this.confessions;
  }

  onChange(listener: (confessions: Confession[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.confessions));
  }
}

export const confessionService = new ConfessionService();
