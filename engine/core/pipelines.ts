// Pipeline-to-Engine Compiler
// Transforms AI-PLAYGROUND pipeline configurations into AI-WonderLand engine substrates

import { EngineConfig, EngineManager } from './engine/core/runtime/engine-manager';
import { ExecutionGraph, ExecutionNode, NodeType } from './engine/core/execution/types';
import { GraphExecutor, NodeRunner } from './engine/core/execution/executor';
import { createClient } from '@supabase/supabase-js';
import { EventSource, EventStream } from './event-stream';

/**
 * Converts a pipeline configuration to an engine configuration
 * This bridges AI-PLAYGROUND's pipeline paradigm with AI-WonderLand's engine paradigm
 */
export class PipelineToEngineCompiler {
  private supabase: ReturnType<typeof createClient>;
  
  constructor() {
    // Use AI-WonderLand's existing supabase configuration
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string
    );
  }
  
  /**
   * Compiles a pipeline graph to an engine configuration
   * @param pipeline - AI-PLAYGROUND workflow template
   * @param graph - Execution graph for engine
   */
  async compilePipeline(pipeline: any, graph: ExecutionGraph): Promise<EngineConfig> {
    // Convert pipeline to engine configuration
    const engineConfig: EngineConfig = {
      name: pipeline.name,
      version: pipeline.version || '1.0.0',
      // Additional fields from AI-PLAYGROUND pipeline
      memoryNodes: pipeline.memoryNodes || [],
      eventTriggers: pipeline.events || [],
      // Convert pipeline to execution graph
      dependencies: this.convertPipelineToGraph(pipeline),
      // Use EventStream for real-time updates
      eventStream: new EventStream(pipeline.id),
      // Use Supabase Edge Functions for execution
      edgeFunctions: this.compileEdgeFunctions(pipeline),
    };
    
    // Apply pipeline-specific configurations
    this.applyPipelineConfig(engineConfig, pipeline);
    
    // Register the engine
    await this.registerEngine(engineConfig);
    
    return engineConfig;
  }
  
  /**
   * Converts pipeline workflow to AI-WonderLand execution graph
   * @param pipeline - AI-PLAYGROUND pipeline configuration
   * @returns ExecutionGraph compatible with AI-WonderLand
   */
  private convertPipelineToGraph(pipeline: any): ExecutionGraph {
    const graph: ExecutionGraph = {
      id: pipeline.id,
      nodes: {},
      metadata: {
        source: 'pipeline',
        version: pipeline.version || '1.0.0',
        template: pipeline.template,
        createdAt: pipeline.timestamp || Date.now(),
        runtimeConfig: this.extractRuntimeConfig(pipeline),
      }
    };
    
    // Convert each pipeline node to ExecutionNode
    for (const node of pipeline.nodes) {
      const executionNode: ExecutionNode = {
        id: node.id,
        type: this.mapNodeType(node.type),
        inputs: this.convertNodeInputs(node),
        outputs: {},
        deps: this.convertDependencies(node, pipeline.nodes),
        status: 'pending',
        metadata: {
          category: node.category,
          config: this.encryptNodeConfig(node.config),
          pipelineNodeId: node.id,
        },
        retryPolicy: this.extractRetryPolicy(pipeline),
      };
      
      graph.nodes[executionNode.id] = executionNode;
    }
    
    return graph;
  }
  
  /**
   * Map pipeline node types to AI-WonderLand NodeTypes
   * @param pipelineNodeType - AI-PLAYGROUND node type
   * @returns NodeType compatible with AI-WonderLand
   */
  private mapNodeType(pipelineNodeType: string): NodeType {
    const typeMapping: Record<string, NodeType> = {
      'trigger': 'engine.render',
      'agent': 'ai.generate',
      'code': 'custom',
      'http': 'asset.stream',
      'scheduler': 'asset.stream',
      'if': 'engine.render',
      'split': 'engine.render',
      'merge': 'engine.render',
      'calculator': 'custom',
      'email': 'asset.stream',
      'git': 'engine.render',
    };
    
    return typeMapping[pipelineNodeType] || 'custom';
  }
  
  /**
   * Convert pipeline connections to dependency format
   * @param node - Pipeline node
   * @param allNodes - All pipeline nodes
   * @returns Dependency array
   */
  private convertDependencies(node: any, allNodes: any[]): string[] {
    const deps: string[] = [];
    
    // Find incoming connections
    for (const connection of node.connections || []) {
      if (Array.isArray(connection)) {
        // Handle pipeline-specific connection patterns
        for (const conn of connection) {
          if (conn.fromNode && conn.toNode && conn.fromNode !== node.id) {
            deps.push(conn.fromNode);
          }
        }
      } else if (typeof connection === 'object' && connection.fromId && connection.toId) {
        // Handle standard connection pattern
        if (connection.fromId !== node.id) {
          deps.push(connection.fromId);
        }
      }
    }
    
    return deps;
  }
  
  /**
   * Extract runtime configuration from pipeline
   * @param pipeline - AI-PLAYGROUND pipeline
   * @returns Runtime configuration
   */
  private extractRuntimeConfig(pipeline: any): Record<string, unknown> {
    return {
      name: pipeline.name,
      description: pipeline.description,
      runtimeType: 'pipeline-to-engine-compiler',
      supportedNodes: pipeline.nodes?.map((n: any) => n.type),
      maxNodesPerPipeline: pipeline.maxNodesPerPipeline || 50,
      pipelineTemplate: pipeline.template || 'default',
      supportsExpressions: true, // AI-PLAYGROUND expressions like {{ $now }}
      supportsScheduledExecution: !!pipeline.scheduledExecution,
      subscriptionLevel: pipeline.subscriptionLevel || 'basic',
    };
  }
  
  /**
   * Compile Supabase Edge Functions from pipeline
   * @param pipeline - AI-PLAYGROUND pipeline
   * @returns Array of edge function configurations
   */
  private compileEdgeFunctions(pipeline: any): Record<string, any> {
    const edgeFunctions: Record<string, any> = {};
    
    // Compile pipeline execution Edge Function
    edgeFunctions.executePipeline = {
      source: `createFunction('executePipeline', async (event) => {
        const { pipelineId, inputs, trigger } = event.body;
        
        // Get pipeline from storage
        const { data: pipeline } = await supabase
          .from('pipeline_templates')
          .select('*')
          .eq('id', pipelineId)
          .single();
        
        if (!pipeline) {
          return {
            status: 404,
            body: JSON.stringify({ error: 'Pipeline not found' })
          };
        }
        
        // Convert pipeline to execution graph
        const graph = await compilePipelineToGraph(pipeline, inputs, trigger);
        
        // Execute pipeline through AI-WonderLand engine
        const executor = new GraphExecutor();
        await this.registerPipelineRunners(executor, pipeline);
        
        const result = await executor.execute(graph, {});
        
        // Stream real-time updates through EventSource
        await eventStream.publish('pipeline:execution', {
          pipelineId,
          status: result.success ? 'success' : 'error',
          result,
          timestamp: Date.now()
        });
        
        return {
          status: result.success ? 200 : 500,
          body: JSON.stringify(result)
        };
      })`,
      permissions: ['read:pipeline_templates', 'write:execution_results', 'read:supabase'],
    };
    
    // Compile expression evaluation Edge Function
    edgeFunctions.evaluateExpression = {
      source: `createFunction('evaluateExpression', async (event) => {
        const { template, context, pipelineId } = event.body;
        
        // Evaluate expressions like {{ $now }}, {{ $json }}, {{ $node[].output }}
        const result = await evaluateExpressions(template, context);
        
        // Cache expression results in Supabase for real-time updates
        await supabase
          .from('expression_results')
          .upsert({
            id: crypto.randomUUID(),
            pipeline_id: pipelineId,
            timestamp: Date.now(),
            template,
            result,
            context
          });
        
        return {
          status: 200,
          body: JSON.stringify({ result })
        };
      })`,
      permissions: ['read:pipeline_templates', 'write:expression_results'],
    };
    
    // Compile pipeline storage Edge Function
    edgeFunctions.savePipeline = {
      source: `createFunction('savePipeline', async (event) => {
        const pipeline = event.body;
        
        // Encrypt pipeline configuration for storage
        const encryptedConfig = await encryptPipelineConfig(pipeline.config);
        
        // Store pipeline in Supabase with real-time updates
        const { data, error } = await supabase
          .from('pipeline_templates')
          .upsert({
            id: pipeline.id,
            name: pipeline.name,
            description: pipeline.description,
            nodes: pipeline.nodes,
            connections: pipeline.connections,
            encrypted_config: encryptedConfig,
            template: pipeline.template,
            metadata: {
              version: pipeline.version || '1.0.0',
              runtimeConfig: pipeline.runtimeConfig,
              createdAt: Date.now(),
              createdBy: pipeline.createdBy || 'system'
            }
          });
        
        if (error) {
          return {
            status: 500,
            body: JSON.stringify({ error: error.message })
          };
        }
        
        // Publish real-time event
        await eventStream.publish('pipeline:saved', { pipelineId: pipeline.id, ...data });
        
        return {
          status: 200,
          body: JSON.stringify({ success: true, pipeline: data })
        };
      })`,
      permissions: ['write:pipeline_templates', 'read:pipeline_templates'],
    };
    
    return edgeFunctions;
  }
  
  /**
   * Apply pipeline-specific configuration to engine
   * @param engineConfig - Engine configuration
   * @param pipeline - AI-PLAYGROUND pipeline
   */
  private applyPipelineConfig(engineConfig: EngineConfig, pipeline: any): void {
    if (!engineConfig.runtimeConfig) {
      engineConfig.runtimeConfig = {};
    }
    
    // Apply pipeline-specific settings
    engineConfig.runtimeConfig = {
      ...engineConfig.runtimeConfig,
      pipeline: {
        id: pipeline.id,
        name: pipeline.name,
        description: pipeline.description,
        template: pipeline.template,
        supportsRealTimeUpdates: pipeline.realTimeUpdates || false,
        supportsMemoryPersistence: pipeline.memory || false,
        supportsCronTriggers: pipeline.cron || false,
      },
      // Expression support for pipelines
      expressionSupport: {
        enabled: true,
        variables: ['{{ $now }}', '{{ $today }}', '{{ $json }}', '{{ $node[].output }}'],
        parser: 'js',
      },
      // Real-time streaming
      streaming: {
        enabled: true,
        eventSource: 'supabase',
        channel: `pipeline:${pipeline.id}`,
        events: {
          nodeExecution: 'pipeline:node:executed',
          pipelineComplete: 'pipeline:complete',
          pipelineError: 'pipeline:error',
          realTimeUpdate: 'pipeline:real_time_update',
        },
      },
    };
  }
  
  /**
   * Register pipeline runners with the executor
   * @param executor - Graph executor
   * @param pipeline - AI-PLAYGROUND pipeline
   */
  private async registerPipelineRunners(executor: GraphExecutor, pipeline: any): Promise<void> {
    // Register AI agent runner
    executor.registerRunner('ai.generate', {
      async run(node: ExecutionNode, context: any): Promise<Record<string, unknown>> {
        const { model, systemPrompt, temperature } = node.metadata?.config || {};
        
        // Get AI from providers (this would need to be adapted to actual provider system)
        const response = await this.getAIResponse(node.inputs.prompt, model, systemPrompt, temperature);
        
        return {
          content: response,
          model,
          timestamp: Date.now(),
        };
      }
    });
    
    // Register HTTP request runner
    executor.registerRunner('asset.stream', {
      async run(node: ExecutionNode, context: any): Promise<Record<string, unknown>> {
        const { httpMethod, httpUrl, httpHeaders, httpBody } = node.metadata?.config || {};
        
        const options: RequestInit = {
          method: httpMethod,
          headers: httpHeaders ? JSON.parse(httpHeaders) : {},
          body: httpBody ? JSON.parse(httpBody) : undefined,
        };
        
        const response = await fetch(httpUrl, options);
        const data = await response.text();
        
        return {
          status: response.status,
          data: data,
          timestamp: Date.now(),
        };
      }
    });
    
    // Register expression evaluation runner
    executor.registerRunner('custom', {
      async run(node: ExecutionNode, context: any): Promise<Record<string, unknown>> {
        const { code } = node.metadata?.config || {};
        
        try {
          // Evaluate the code with pipeline context
          const result = await this.evaluateExpression(code, context);
          
          return {
            result: result,
            timestamp: Date.now(),
          };
        } catch (error) {
          throw new Error(`Expression evaluation failed: ${error.message}`);
        }
      }
    });
  }
  
  /**
   * Encrypt node configuration for storage
   * @param config - Node configuration
   * @returns Encrypted configuration
   */
  private encryptNodeConfig(config: any): string {
    // Simple encryption for now - would use proper encryption in production
    return Buffer.from(JSON.stringify(config)).toString('base64');
  }
  
  /**
   * Extract retry policy from pipeline
   * @param pipeline - AI-PLAYGROUND pipeline
   * @returns Retry policy configuration
   */
  private extractRetryPolicy(pipeline: any): any {
    return pipeline.retryPolicy || {
      maxRetries: 3,
      backoffMs: 1000,
    };
  }
  
  /**
   * Evaluate expressions used in pipelines
   * @param expression - Expression to evaluate
   * @param context - Evaluation context
   */
  private evaluateExpression(expression: string, context: any): any {
    // This would be implemented based on expression parsing
    // AI-PLAYGROUND has expression parser in src/utils/expressionParser.ts
    return expression;
  }
  
  /**
   * Get AI response from provider
   * @param prompt - Input prompt
   * @param model - Model to use
   * @param systemPrompt - System prompt
   * @param temperature - Temperature setting
   */
  private async getAIResponse(prompt: string, model: string, systemPrompt: string, temperature: number): Promise<string> {
    // This would integrate with AI-WonderLand's provider system
    // For now, return a placeholder
    return `AI response to: ${prompt} using model: ${model}`;
  }
  
  /**
   * Register compiled engine with EngineManager
   * @param engineConfig - Engine configuration
   */
  private async registerEngine(engineConfig: EngineConfig): Promise<void> {
    // This would integrate with AI-WonderLand's EngineManager
    // Register engine with single active engine rule
    // Engine would be loaded via engineManager.loadEngine()
  }
}

export default PipelineToEngineCompiler;