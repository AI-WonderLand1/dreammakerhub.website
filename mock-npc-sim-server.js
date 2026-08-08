/**
 * Mock NPC-Sim API Server
 * This is a simple mock server that mimics the npc-sim API for demonstration purposes
 * In a real application, you would use your actual npc-sim implementation
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

// In-memory storage for the simulation state
let state = {
  currentTick: 0,
  isPaused: false,
  worldYear: 0,
  npcs: [
    {
      id: 'alice',
      name: 'Alice',
      hunger: 20,
      social: 80,
      stress: 30,
      traits: { aggression: 20, sociability: 80, ambition: 60 },
      tribeId: null,
      beliefId: null,
      status: 'alive',
      age: 25,
      createdAtTick: 0
    },
    {
      id: 'bob',
      name: 'Bob',
      hunger: 40,
      social: 40,
      stress: 50,
      traits: { aggression: 60, sociability: 40, ambition: 70 },
      tribeId: null,
      beliefId: null,
      status: 'alive',
      age: 30,
      createdAtTick: 0
    },
    {
      id: 'charlie',
      name: 'Charlie',
      hunger: 30,
      social: 60,
      stress: 40,
      traits: { aggression: 30, sociability: 70, ambition: 50 },
      tribeId: null,
      beliefId: null,
      status: 'alive',
      age: 22,
      createdAtTick: 0
    }
  ],
  relationships: [
    {
      id: 'rel-1',
      npcIdA: 'alice',
      npcIdB: 'bob',
      score: 30,
      type: 'ally',
      lastInteractionTick: 0
    },
    {
      id: 'rel-2',
      npcIdA: 'bob',
      npcIdB: 'charlie',
      score: -20,
      type: 'rival',
      lastInteractionTick: 0
    }
  ],
  tribes: [],
  religions: [],
  events: []
};

// Helper to generate random ID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// GET /api/sim/tick - Get current state
app.get('/api/sim/tick', (c) => {
  return c.json({
    success: true,
    state: state
  });
});

// POST /api/sim/tick - Advance simulation
app.post('/api/sim/tick', async (c) => {
  try {
    const body = await c.req.json();
    const count = typeof body.count === 'number' ? body.count : 1;
    
    let lastResult = null;
    
    for (let i = 0; i < count; i++) {
      lastResult = await tickSimulation();
      if (lastResult.skipped) break;
    }
    
    return c.json({ success: true, result: lastResult });
  } catch (err) {
    console.error('Tick error:', err);
    return c.json({ success: false, error: String(err) }, 500 );
  }
});

// POST /api/sim/reset - Reset simulation
app.post('/api/sim/reset', (c) => {
  // Reset to initial state
  state = {
    currentTick: 0,
    isPaused: false,
    worldYear: 0,
    npcs: [
      {
        id: 'alice',
        name: 'Alice',
        hunger: 20,
        social: 80,
        stress: 30,
        traits: { aggression: 20, sociability: 80, ambition: 60 },
        tribeId: null,
        beliefId: null,
        status: 'alive',
        age: 25,
        createdAtTick: 0
      },
      {
        id: 'bob',
        name: 'Bob',
        hunger: 40,
        social: 40,
        stress: 50,
        traits: { aggression: 60, sociability: 40, ambition: 70 },
        tribeId: null,
        beliefId: null,
        status: 'alive',
        age: 30,
        createdAtTick: 0
      },
      {
        id: 'charlie',
        name: 'Charlie',
        hunger: 30,
        social: 60,
        stress: 40,
        traits: { aggression: 30, sociability: 70, ambition: 50 },
        tribeId: null,
        beliefId: null,
        status: 'alive',
        age: 22,
        createdAtTick: 0
      }
    ],
    relationships: [
      {
        id: 'rel-1',
        npcIdA: 'alice',
        npcIdB: 'bob',
        score: 30,
        type: 'ally',
        lastInteractionTick: 0
      },
      {
        id: 'rel-2',
        npcIdA: 'bob',
        npcIdB: 'charlie',
        score: -20,
        type: 'rival',
        lastInteractionTick: 0
      }
    ],
    tribes: [],
    religions: [],
    events: []
  };
  
  return c.json({ success: true });
});

// POST /api/sim/pause - Pause simulation
app.post('/api/sim/pause', (c) => {
  state.isPaused = true;
  return c.json({ success: true });
});

// POST /api/sim/resume - Resume simulation
app.post('/api/sim/resume', (c) => {
  state.isPaused = false;
  return c.json({ success: true });
});

// POST /api/sim/command - Send command to NPC
app.post('/api/sim/command', async (c) => {
  try {
    const body = await c.req.json();
    const { npcId, action, dialogue } = body;
    
    // Find the NPC
    const npc = state.npcs.find(n => n.id === npcId);
    if (!npc) {
      return c.json({ success: false, error: 'NPC not found' }, 404);
    }
    
    // Process the command (simplified)
    let result = { success: true };
    
    switch (action) {
      case 'talk':
        if (dialogue) {
          // Add a dialogue event
          state.events.push({
            id: generateId(),
            tick: state.currentTick,
            type: 'dialogue',
            actorId: npcId,
            targetId: null,
            description: dialogue
          });
          
          // Maybe affect social needs
          npc.social = Math.min(100, npc.social + 10);
          npc.stress = Math.max(0, npc.stress - 5);
        }
        break;
        
      case 'work':
        // Simulate work
        npc.hunger = Math.min(100, npc.hunger + 15);
        npc.social = Math.max(0, npc.social - 10);
        npc.stress = Math.min(100, npc.stress + 5);
        
        // Add work event
        state.events.push({
          id: generateId(),
          tick: state.currentTick,
          type: 'work',
          actorId: npcId,
          targetId: null,
          description: `${npc.name} is working`
        });
        break;
        
      case 'rest':
        // Simulate rest
        npc.hunger = Math.max(0, npc.hunger - 5);
        npc.social = Math.min(100, npc.social + 5);
        npc.stress = Math.max(0, npc.stress - 15);
        
        // Add rest event
        state.events.push({
          id: generateId(),
          tick: state.currentTick,
          type: 'rest',
          actorId: npcId,
          targetId: null,
          description: `${npc.name} is resting`
        });
        break;
        
      default:
        result = { success: false, error: 'Unknown action' };
    }
    
    return c.json(result);
  } catch (err) {
    console.error('Command error:', err);
    return c.json({ success: false, error: String(err) }, 500);
  }
});

// Core simulation tick function
async function tickSimulation() {
  if (state.isPaused) {
    return { skipped: true, currentTick: state.currentTick };
  }
  
  // Increment tick
  state.currentTick++;
  state.worldYear = Math.floor(state.currentTick / (365 * 24 * 60)); // Assuming ticks are minutes
  
  // Process NPC needs (simple decay)
  for (const npc of state.npcs) {
    // Needs increase over time
    npc.hunger = Math.min(100, npc.hunger + 0.5);
    npc.social = Math.max(0, npc.social - 0.3);
    npc.stress = Math.min(100, npc.stress + 0.2);
    
    // Apply some random variation
    npc.hunger += (Math.random() - 0.5) * 0.5;
    npc.social += (Math.random() - 0.5) * 0.3;
    npc.stress += (Math.random() - 0.5) * 0.2;
    
    // Clamp values
    npc.hunger = Math.max(0, Math.min(100, npc.hunger));
    npc.social = Math.max(0, Math.min(100, npc.social));
    npc.stress = Math.max(0, Math.min(100, npc.stress));
  }
  
  // Generate some random events occasionally
  if (Math.random() < 0.1) { // 10% chance per tick
    const npc = state.npcs[Math.floor(Math.random() * state.npcs.length)];
    const eventTypes = ['idle', 'socialize', 'work', 'rest'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    let description = '';
    switch (eventType) {
      case 'idle':
        description = `${npc.name} is standing idle`;
        break;
      case 'socialize':
        // Find another NPC to socialize with
        const otherNpcs = state.npcs.filter(n => n.id !== npc.id);
        if (otherNpcs.length > 0) {
          const target = otherNpcs[Math.floor(Math.random() * otherNpcs.length)];
          description = `${npc.name} is socializing with ${target.name}`;
          
          // Update relationship score
          const rel = state.relationships.find(r => 
            (r.npcIdA === npc.id && r.npcIdB === target.id) || 
            (r.npcIdA === target.id && r.npcIdB === npc.id)
          );
          if (rel) {
            rel.score = Math.min(100, rel.score + 5);
            rel.lastInteractionTick = state.currentTick;
          }
        } else {
          description = `${npc.name} wants to socialize but is alone`;
        }
        break;
      case 'work':
        description = `${npc.name} is working`;
        // Increase hunger and stress, decrease social
        npc.hunger = Math.min(100, npc.hunger + 10);
        npc.stress = Math.min(100, npc.stress + 5);
        npc.social = Math.max(0, npc.social - 5);
        break;
      case 'rest':
        description = `${npc.name} is resting`;
        // Decrease hunger and stress, increase social
        npc.hunger = Math.max(0, npc.hunger - 5);
        npc.stress = Math.max(0, npc.stress - 10);
        npc.social = Math.min(100, npc.social + 10);
        break;
    }
    
    if (description) {
      state.events.push({
        id: generateId(),
        tick: state.currentTick,
        type: eventType,
        actorId: npc.id,
        targetId: null,
        description: description
      });
      
      // Keep events array from growing too large
      if (state.events.length > 1000) {
        state.events = state.events.slice(-500); // Keep last 500 events
      }
    }
  }
  
  // Return tick result
  return {
    tick: state.currentTick,
    skipped: false,
    decisions: [], // In a real implementation, this would contain NPC decisions
    events: state.events.slice(-10) // Return last 10 events
  };
}

// Start the server
const port = Number(process.env.PORT) || 8080;
console.log(`Mock NPC-Sim API server running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
