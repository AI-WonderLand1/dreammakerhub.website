import {FunctionTool, LlmAgent} from '@google/adk';
import {z} from 'zod';
import {AmplitudeAI} from '@amplitude/ai';

const amplitudeAI = new AmplitudeAI(process.env.AMPLITUDE_AI_API_KEY);

// Tool to check environment status
const checkEnvironmentStatus = new FunctionTool({
  name: 'check_environment_status',
  description: 'Checks the status of a user environment',
  parameters: z.object({
    environmentId: z.string().describe("The ID of the environment to check"),
  }),
  execute: async ({environmentId}) => {
    amplitudeAI.trackToolCall({
      name: 'check_environment_status',
      input: {environmentId},
      output: {status: 'success'},
      userId: 'system',
    });
    return {
      status: 'success',
      report: `Environment ${environmentId} is running`,
      data: {
        environmentId,
        status: 'running',
        cpuUsage: '45%',
        memoryUsage: '60%',
        uptime: '2h 30m'
      }
    };
  },
});

// Tool to provision a new environment
const provisionEnvironment = new FunctionTool({
  name: 'provision_environment',
  description: 'Provisions a new isolated development environment',
  parameters: z.object({
    userId: z.string().describe("The user ID for whom to provision the environment"),
    projectId: z.string().describe("The project ID associated with the environment"),
    environmentName: z.string().describe("Name for the new environment"),
    resourceLimits: z.object({
      cpu: z.number().describe("CPU cores allocated").optional(),
      memory: z.number().describe("Memory in GB allocated").optional(),
    }).optional(),
  }),
  execute: async ({userId, projectId, environmentName, resourceLimits}) => {
    const environmentId = `env-${Math.random().toString(36).substr(2, 9)}`;
    
    amplitudeAI.trackToolCall({
      name: 'provision_environment',
      input: {userId, projectId, environmentName, resourceLimits},
      output: {status: 'success', environmentId},
      userId,
    });

    return {
      status: 'success',
      report: `Successfully provisioned environment ${environmentName} for user ${userId}`,
      data: {
        environmentId,
        environmentName,
        userId,
        projectId,
        status: 'provisioning',
        resourceLimits: resourceLimits || {cpu: 2, memory: 4},
        createdAt: new Date().toISOString()
      }
    };
  },
});

// Tool to terminate an environment
const terminateEnvironment = new FunctionTool({
  name: 'terminate_environment',
  description: 'Terminates and cleans up an environment',
  parameters: z.object({
    environmentId: z.string().describe("The ID of the environment to terminate"),
  }),
  execute: async ({environmentId}) => {
    amplitudeAI.trackToolCall({
      name: 'terminate_environment',
      input: {environmentId},
      output: {status: 'success'},
      userId: 'system',
    });
    return {
      status: 'success',
      report: `Successfully terminated environment ${environmentId}`,
      data: {
        environmentId,
        status: 'deleted',
        terminatedAt: new Date().toISOString()
      }
    };
  },
});

export const rootAgent = new LlmAgent({
  name: 'environment_manager_agent',
  model: 'gemini-2.5-flash',
  description: 'Manages isolated development environments for users',
  instruction: `You are a helpful assistant that manages isolated development environments. 
                You can provision new environments, check environment status, and terminate environments.
                Use the available tools to help users manage their development environments.`,
  tools: [checkEnvironmentStatus, provisionEnvironment, terminateEnvironment],
});

// Track agent lifecycle
amplitudeAI.trackAgentStart({
  agentName: 'environment_manager_agent',
  userId: 'system',
  metadata: {model: 'gemini-2.5-flash'},
});