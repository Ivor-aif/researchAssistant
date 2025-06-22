import { apiClient } from '../api';
import type {
  AIAPIConfig,
  AIAPIConfigCreate,
  AIAPIConfigUpdate,
  AIAPIConfigListResponse,
  GeneratePromptRequest,
  GeneratePromptResponse,
  TestConfigRequest,
  TestConfigResponse,
  SetPrimaryConfigRequest
} from '../types/aiConfig';

/**
 * AI配置服务
 */
export class AIConfigService {
  /**
   * 获取用户的所有AI配置
   */
  static async getUserConfigs(): Promise<AIAPIConfigListResponse> {
    try {
      console.log('🔧 获取用户AI配置列表');
      const response = await apiClient.get('/api/ai-config/');
      return response.data;
    } catch (error) {
      console.error('❌ 获取AI配置列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定的AI配置
   */
  static async getConfig(configId: number): Promise<AIAPIConfig> {
    try {
      console.log('🔧 获取AI配置详情:', configId);
      const response = await apiClient.get(`/api/ai-config/${configId}`);
      return response.data;
    } catch (error) {
      console.error('❌ 获取AI配置详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建新的AI配置
   */
  static async createConfig(configData: AIAPIConfigCreate): Promise<AIAPIConfig> {
    try {
      console.log('🔧 创建AI配置:', configData.title);
      const response = await apiClient.post('/api/ai-config/', configData);
      return response.data;
    } catch (error) {
      console.error('❌ 创建AI配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新AI配置
   */
  static async updateConfig(configId: number, configData: AIAPIConfigUpdate): Promise<AIAPIConfig> {
    try {
      console.log('🔧 更新AI配置:', configId);
      const response = await apiClient.put(`/api/ai-config/${configId}`, configData);
      return response.data;
    } catch (error) {
      console.error('❌ 更新AI配置失败:', error);
      throw error;
    }
  }

  /**
   * 删除AI配置
   */
  static async deleteConfig(configId: number): Promise<void> {
    try {
      console.log('🔧 删除AI配置:', configId);
      await apiClient.delete(`/api/ai-config/${configId}`);
    } catch (error) {
      console.error('❌ 删除AI配置失败:', error);
      throw error;
    }
  }

  /**
   * 设置主配置
   */
  static async setPrimaryConfig(configId: number): Promise<void> {
    try {
      console.log('🔧 设置主配置:', configId);
      const request: SetPrimaryConfigRequest = { config_id: configId };
      await apiClient.post('/api/ai-config/set-primary', request);
    } catch (error) {
      console.error('❌ 设置主配置失败:', error);
      throw error;
    }
  }

  /**
   * 测试AI配置
   */
  static async testConfig(configId: number, testPrompt?: string): Promise<TestConfigResponse> {
    try {
      console.log('🔧 测试AI配置:', configId);
      const request: TestConfigRequest = {
        config_id: configId,
        test_prompt: testPrompt
      };
      const response = await apiClient.post(`/api/ai-config/test/${configId}`, request);
      return response.data;
    } catch (error) {
      console.error('❌ 测试AI配置失败:', error);
      throw error;
    }
  }

  /**
   * 生成AI提示词
   */
  static async generatePrompt(request: GeneratePromptRequest): Promise<GeneratePromptResponse> {
    try {
      console.log('🔧 生成AI提示词:', request.keywords);
      const response = await apiClient.post('/api/ai-config/generate-prompt', request);
      return response.data;
    } catch (error) {
      console.error('❌ 生成AI提示词失败:', error);
      throw error;
    }
  }

  /**
   * 获取适用于特定任务的AI配置
   */
  static async getConfigsForTask(taskType: string): Promise<AIAPIConfig[]> {
    try {
      console.log('🔧 获取任务相关AI配置:', taskType);
      const response = await apiClient.get(`/api/ai-config/for-task/${taskType}`);
      return response.data;
    } catch (error) {
      console.error('❌ 获取任务相关AI配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取主配置
   */
  static async getPrimaryConfig(): Promise<AIAPIConfig> {
    try {
      console.log('🔧 获取主配置');
      const response = await apiClient.get('/api/ai-config/primary');
      return response.data;
    } catch (error) {
      console.error('❌ 获取主配置失败:', error);
      throw error;
    }
  }

  /**
   * 验证API密钥格式
   */
  static validateApiKey(providerType: string, apiKey: string): { valid: boolean; message?: string } {
    if (!apiKey || apiKey.trim().length === 0) {
      return { valid: false, message: 'API密钥不能为空' };
    }

    switch (providerType) {
      case 'openai':
        if (!apiKey.startsWith('sk-')) {
          return { valid: false, message: 'OpenAI API密钥应以"sk-"开头' };
        }
        break;
      case 'anthropic':
        if (!apiKey.startsWith('sk-ant-')) {
          return { valid: false, message: 'Anthropic API密钥应以"sk-ant-"开头' };
        }
        break;
      case 'google_ai':
        if (apiKey.length < 20) {
          return { valid: false, message: 'Google AI API密钥长度不足' };
        }
        break;
      default:
        // 对于其他提供商，只检查基本格式
        if (apiKey.length < 10) {
          return { valid: false, message: 'API密钥长度不足' };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * 获取提供商的默认端点
   */
  static getDefaultEndpoint(providerType: string): string | undefined {
    const endpoints: Record<string, string> = {
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com',
      google_ai: 'https://generativelanguage.googleapis.com/v1',
      baidu_qianfan: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1',
      alibaba_dashscope: 'https://dashscope.aliyuncs.com/api/v1',
      zhipu_ai: 'https://open.bigmodel.cn/api/paas/v4'
    };

    return endpoints[providerType];
  }

  /**
   * 格式化配置显示名称
   */
  static formatConfigDisplayName(config: AIAPIConfig): string {
    const providerName = config.provider_type.toUpperCase();
    const modelInfo = config.model_name ? ` (${config.model_name})` : '';
    const primaryFlag = config.is_primary ? ' [主配置]' : '';
    
    return `${config.title} - ${providerName}${modelInfo}${primaryFlag}`;
  }

  /**
   * 获取配置的使用场景描述
   */
  static getConfigUsageDescription(config: AIAPIConfig): string[] {
    const usages: string[] = [];
    
    if (config.use_for_innovation_analysis) usages.push('创新点分析');
    if (config.use_for_paper_recommendation) usages.push('论文推荐');
    if (config.use_for_research_analysis) usages.push('研究分析');
    if (config.use_for_chat) usages.push('聊天对话');
    if (config.use_for_prompt_generation) usages.push('提示词生成');
    
    return usages;
  }
}

export default AIConfigService;