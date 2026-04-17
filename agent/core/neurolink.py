import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from collections import defaultdict
import hashlib

@dataclass
class Node:
    id: str
    type: str
    content: Any
    connections: List[str] = field(default_factory=list)
    metadata: Dict = field(default_factory=dict)
    activation: float = 0.0

class Neurolink:
    def __init__(self):
        self.nodes: Dict[str, Node] = {}
        self.type_index: Dict[str, List[str]] = defaultdict(list)
        self.connection_weights: Dict[tuple, float] = {}
    
    def add_node(self, node_type: str, content: Any, metadata: Dict = None) -> str:
        node_id = hashlib.md5(f"{node_type}:{json.dumps(content)}".encode()).hexdigest()[:12]
        if node_id in self.nodes:
            self.nodes[node_id].activation += 0.1
            return node_id
        node = Node(
            id=node_id,
            type=node_type,
            content=content,
            metadata=metadata or {},
            activation=1.0
        )
        self.nodes[node_id] = node
        self.type_index[node_type].append(node_id)
        return node_id
    
    def connect(self, node_id_1: str, node_id_2: str, weight: float = 1.0):
        if node_id_1 in self.nodes and node_id_2 in self.nodes:
            self.nodes[node_id_1].connections.append(node_id_2)
            self.nodes[node_id_2].connections.append(node_id_1)
            self.connection_weights[(node_id_1, node_id_2)] = weight
            self.connection_weights[(node_id_2, node_id_1)] = weight
    
    def activate(self, node_id: str, strength: float = 1.0, depth: int = 2):
        if node_id not in self.nodes or depth <= 0:
            return
        self.nodes[node_id].activation += strength
        for conn_id in self.nodes[node_id].connections[:10]:
            weight = self.connection_weights.get((node_id, conn_id), 0.5)
            self.activate(conn_id, strength * weight * 0.8, depth - 1)
    
    def get_activated_nodes(self, min_activation: float = 0.5, limit: int = 20) -> List[Node]:
        sorted_nodes = sorted(
            [n for n in self.nodes.values() if n.activation >= min_activation],
            key=lambda x: x.activation,
            reverse=True
        )[:limit]
        for node in sorted_nodes:
            node.activation *= 0.9
        return sorted_nodes
    
    def query(self, pattern: Dict, limit: int = 10) -> List[Node]:
        results = []
        for node in self.nodes.values():
            match = True
            for key, value in pattern.items():
                if key == "type":
                    if node.type != value:
                        match = False
                elif key in node.metadata:
                    if node.metadata[key] != value:
                        match = False
                else:
                    match = False
            if match:
                results.append(node)
        return results[:limit]
    
    def get_context(self, node_id: str, depth: int = 1) -> Dict:
        if node_id not in self.nodes:
            return {}
        node = self.nodes[node_id]
        context = {
            "node": {"id": node.id, "type": node.type, "content": node.content},
            "connections": []
        }
        for conn_id in node.connections:
            if conn_id in self.nodes:
                conn_node = self.nodes[conn_id]
                context["connections"].append({
                    "id": conn_id,
                    "type": conn_node.type,
                    "weight": self.connection_weights.get((node_id, conn_id), 0.5)
                })
        return context
    
    def decay_all(self, factor: float = 0.95):
        for node in self.nodes.values():
            node.activation *= factor
