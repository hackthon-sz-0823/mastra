import { wasteClassifierAgent } from './mastra/agents/waste-classifier';
import { simpleClassifierAgent } from './mastra/agents/simple-classifier';

// Cloudflare Workers类型定义
interface Env {
  OPENAI_API_KEY?: string;
  DATABASE_URL?: string;
}

// Cloudflare Workers入口点
export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    try {
      // 设置环境变量
      if (env.OPENAI_API_KEY) {
        process.env.OPENAI_API_KEY = env.OPENAI_API_KEY;
      }
      if (env.DATABASE_URL) {
        process.env.DATABASE_URL = env.DATABASE_URL;
      }

      const url = new URL(request.url);
      
      // CORS处理
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }

      // 处理API路由
      if (url.pathname.startsWith('/api/agents/')) {
        return handleAgentRequest(request, url);
      }

      // 健康检查
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

async function handleAgentRequest(request: Request, url: URL): Promise<Response> {
  try {
    const pathParts = url.pathname.split('/');
    const agentName = pathParts[3]; // /api/agents/{agentName}
    const action = pathParts[4]; // run, chat, etc.

    if (!agentName || !action) {
      return new Response(JSON.stringify({ error: 'Invalid agent endpoint' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 根据agent名称获取对应的agent
    let agent;
    if (agentName === 'wasteClassifier') {
      agent = wasteClassifierAgent;
    } else if (agentName === 'simpleClassifier') {
      agent = simpleClassifierAgent;
    } else {
      return new Response(JSON.stringify({ error: 'Agent not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let result;
    if (action === 'run' && request.method === 'POST') {
      const body = await request.json();
      // 直接调用agent的generate方法
      result = await agent.generate(body.messages || [{ role: 'user', content: body.input || body.prompt || '' }]);
    } else if (action === 'chat' && request.method === 'POST') {
      const body = await request.json();
      result = await agent.generate(body.messages || [{ role: 'user', content: body.input || body.message || '' }]);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Agent request error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Agent execution failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}