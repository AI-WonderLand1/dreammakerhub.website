import { PipelineToEngineCompiler } from './engine/core/pipelines';
import { logger } from '@lib/logger';

// Initialize pipeline compiler as a singleton
const pipelineCompiler = new PipelineToEngineCompiler();

/**
 * Load AI-PLAYGROUND pipeline template into AI-WonderLand engine
 * This provides the pipeline-to-engine compilation bridge
 */
export async function loadPipelineFromTemplate(templateId: string): Promise<void> {
  try {
    // Fetch pipeline template from storage (Supabase)
    const { data: template, error } = await supabase
      .from('pipeline_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    if (error) {
      throw new Error(`Failed to load pipeline template: ${error.message}`);
    }
    
    if (!template) {
      throw new Error(`Pipeline template ${templateId} not found`);
    }
    
    // Compile pipeline to engine using PipelineToEngineCompiler
    const compiler = new PipelineToEngineCompiler();
    const engineConfig = await compiler.compilePipeline(template, {} as any);
    
    // Register this as an available pipeline in Supabase
    await supabase
      .from('pipeline_templates')
      .upsert({
        id: templateId,
        name: template.name,
        description: template.description,
        type: 'engine_instance',
        status: 'available',
        engine_config: engineConfig,
        compiler_version: '1.0.0',
        template_version: template.version || '1.0.0',
        available_at: Date.now(),
        usage_count: 0,
        rating: template.rating || 0,
        updated_at: Date.now(),
      });
    
  } catch (error) {
    logger.error('Failed to load AI-PLAYGROUND pipeline template:', error);
    throw error;
  }
}

/**
 * Compile pipeline to engine configuration
 * @param pipelineId - ID of pipeline to compile
 * @param userId - User identifier
 * @returns Compiled engine configuration
 */
export async function compilePipelineToEngine(pipelineId: string, userId?: string): Promise<any> {
  try {
    // Get pipeline template
    const { data: template, error: templateError } = await supabase
      .from('pipeline_templates')
      .select('*')
      .eq('id', pipelineId)
      .single();
    
    if (templateError) {
      throw new Error(`Failed to fetch pipeline template: ${templateError.message}`);
    }
    
    if (!template) {
      throw new Error(`Pipeline template ${pipelineId} not found`);
    }
    
    // Check user permissions and subscription level
    if (userId) {
      const { data: user, error: userError } = await supabase
        .from('user_subscriptions')
        .select('subscription_tier, pipeline_access')
        .eq('user_id', userId)
        .single();
      
      if (!userError && user) {
        // Check if template is available for this subscription level
        if (user.subscription_tier === 'free' && template.subscription_level === 'premium') {
          throw new Error('This pipeline requires a premium subscription');
        }
        
        // Check if user has access to this pipeline through their organization
        const { data: orgAccess } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', userId);
        
        if (orgAccess?.some(org => org.organization_id === template.organization_id)) {
          // User has organization access
        } else if (template.user_id === userId) {
          // User is owner
        } else if (template.is_public) {
          // Template is public
        } else {
          throw new Error('Access denied: You do not have permission to use this pipeline');
        }
      }
    }
    
    // Compile pipeline using PipelineToEngineCompiler
    const compiler = new PipelineToEngineCompiler();
    const executionGraph = await compiler.compilePipeline(template, {} as any);
    
    // Register compilation result for real-time updates
    await supabase.from('pipeline_compilations').insert({
      id: crypto.randomUUID(),
      pipeline_id: pipelineId,
      compiled_at: Date.now(),
      compilation_version: '1.0.0',
      status: 'success',
      engine_config: executionGraph,
      compilation_metadata: {
        template_version: template.version || '1.0.0',
        compiler_version: '1.0.0',
        user_id: userId,
        compilation_method: 'automatic'
      },
    });
    
    // Update pipeline usage count
    await supabase
      .from('pipeline_templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', pipelineId);
    
    return {
      success: true,
      engineConfig: executionGraph,
      pipelineId: pipelineId,
      templateId: templateId,
      compilationMetadata: {
        version: '1.0.0',
        compiledAt: Date.now(),
        subscriptionVerified: !!userId,
      }
    };
    
  } catch (error) {
    logger.error('Pipeline compilation failed:', error);
    
    // Register compilation failure for analytics
    await supabase.from('pipeline_compilations').insert({
      id: crypto.randomUUID(),
      pipeline_id: pipelineId,
      compiled_at: Date.now(),
      compilation_version: '1.0.0',
      status: 'error',
      error: error.message,
      compilation_metadata: { compilation_method: 'automatic' }
    });
    
    throw error;
  }
}

/**
 * Save compiled engine configuration to Supabase
 * @param pipelineId - Pipeline ID
 * @param engineConfig - Compiled engine configuration
 * @param userId - User identifier for access control
 */
export async function saveCompiledEngine(pipelineId: string, engineConfig: any, userId?: string): Promise<void> {
  try {
    const engineId = crypto.randomUUID();
    
    // Store compiled engine in Supabase for real-time sharing and collaboration
    const { data, error } = await supabase.from('compiled_engines').insert({
      id: engineId,
      pipeline_id: pipelineId,
      engine_config: engineConfig,
      created_by: userId,
      created_at: Date.now(),
      status: 'active',
      metadata: {
        compilation_engine: 'PipelineToEngineCompiler',
        compilation_version: '1.0.0',
        runtime_type: 'engine_substrate',
        realTimeUpdates: true,
        subscribesToPipelineUpdates: true,
      }
    });
    
    if (error) {
      throw new Error(`Failed to save compiled engine: ${error.message}`);
    }
    
    // If userId provided, update pipeline compilation access
    if (userId) {
      await supabase.from('pipeline_user_access').upsert({
        pipeline_id: pipelineId,
        user_id: userId,
        access_level: 'read_write',
        compiled_engine_id: engineId,
        granted_at: Date.now(),
        granted_by: userId,
        permissions: {
          execute: true,
          modify: true,
          share: true,
          realTimeAccess: true,
        }
      });
    }
    
    // Publish real-time event
    if (supabase) {
      await supabase.channel(`pipeline:${pipelineId}`).send({
        type: 'broadcast',
        event: 'engine:compiled',
        payload: {
          engineId,
          pipelineId,
          status: 'success',
          compiledAt: Date.now(),
          userId,
        }
      });
    }
    
  } catch (error) {
    logger.error('Failed to save compiled engine:', error);
    throw error;
  }
}

/**
 * Get all available pipeline templates for user
 * @param userId - User identifier
 * @param filters - Optional filters
 * @returns Array of available pipeline templates
 */
export async function getAvailablePipelines(userId?: string, filters?: any): Promise<any[]> {
  try {
    let query = supabase
      .from('pipeline_templates')
      .select('*')
      .eq('status', 'available')
      .order('rating', { ascending: false })
      .order('usage_count', { ascending: false });
    
    // Apply filters if provided
    if (filters) {
      if (filters.templateType) {
        query = query.eq('template_type', filters.templateType);
      }
      if (filters.subscriptionLevel) {
        query = query.eq('subscription_level', filters.subscriptionLevel);
      }
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch available pipelines: ${error.message}`);
    }
    
    // Filter by user permissions if userId provided
    let availablePipelines = data || [];
    
    if (userId) {
      // Get user's subscription tier and organization
      const { data: user } = await supabase
        .from('user_subscriptions')
        .select('subscription_tier, organization_id')
        .eq('user_id', userId)
        .single();
      
      // Filter pipelines based on user permissions
      availablePipelines = availablePipelines.filter(pipeline => {
        // Check if pipeline is publicly available
        if (pipeline.is_public) return true;
        
        // Check if user is owner
        if (pipeline.user_id === userId) return true;
        
        // Check if user belongs to organization that owns the pipeline
        if (user?.organization_id && pipeline.organization_id === user.organization_id) {
          return true;
        }
        
        // Check if pipeline is available for user's subscription level
        if (pipeline.subscription_level === 'free' || pipeline.subscription_level === user?.subscription_tier) {
          return true;
        }
        
        return false;
      });
    }
    
    return availablePipelines || [];
    
  } catch (error) {
    logger.error('Failed to get available pipelines:', error);
    throw error;
  }
}