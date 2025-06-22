/**
 * AI配置相关类型定义
 */

export const AIProviderType = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE_AI: 'google_ai',
  AZURE_OPENAI: 'azure_openai',
  BAIDU_QIANFAN: 'baidu_qianfan',
  ALIBABA_DASHSCOPE: 'alibaba_dashscope',
  ZHIPU_AI: 'zhipu_ai',
  CUSTOM: 'custom'
} as const;

export type AIProviderType = typeof AIProviderType[keyof typeof AIProviderType];

export interface AIAPIConfig {
  id: number;
  user_id: number;
  title: string;
  provider_type: AIProviderType;
  api_key: string; // 已脱敏的API密钥
  api_endpoint?: string;
  model_name?: string;
  
  system_prompt?: string;
  default_prompt?: string;
  
  is_primary: boolean;
  is_active: boolean;
  
  use_for_innovation_analysis: boolean;
  use_for_paper_recommendation: boolean;
  use_for_research_analysis: boolean;
  use_for_chat: boolean;
  use_for_prompt_generation: boolean;
  
  max_tokens: number;
  temperature: string;
  top_p: string;
  frequency_penalty: string;
  presence_penalty: string;
  
  created_at: string;
  updated_at?: string;
}

export interface AIAPIConfigCreate {
  title: string;
  provider_type: AIProviderType;
  api_key: string;
  api_endpoint?: string;
  model_name?: string;
  
  system_prompt?: string;
  default_prompt?: string;
  
  is_primary?: boolean;
  is_active?: boolean;
  
  use_for_innovation_analysis?: boolean;
  use_for_paper_recommendation?: boolean;
  use_for_research_analysis?: boolean;
  use_for_chat?: boolean;
  use_for_prompt_generation?: boolean;
  
  max_tokens?: number;
  temperature?: string;
  top_p?: string;
  frequency_penalty?: string;
  presence_penalty?: string;
}

export interface AIAPIConfigUpdate {
  title?: string;
  provider_type?: AIProviderType;
  api_key?: string;
  api_endpoint?: string;
  model_name?: string;
  
  system_prompt?: string;
  default_prompt?: string;
  
  is_primary?: boolean;
  is_active?: boolean;
  
  use_for_innovation_analysis?: boolean;
  use_for_paper_recommendation?: boolean;
  use_for_research_analysis?: boolean;
  use_for_chat?: boolean;
  use_for_prompt_generation?: boolean;
  
  max_tokens?: number;
  temperature?: string;
  top_p?: string;
  frequency_penalty?: string;
  presence_penalty?: string;
}

export interface AIAPIConfigListResponse {
  configs: AIAPIConfig[];
  total: number;
  primary_config_id?: number;
}

export interface GeneratePromptRequest {
  keywords: string[];
  task_type: string;
  context?: string;
  config_id?: number;
}

export interface GeneratePromptResponse {
  prompt: string;
  config_used: AIAPIConfig;
}

export interface TestConfigRequest {
  config_id: number;
  test_prompt?: string;
}

export interface TestConfigResponse {
  success: boolean;
  response?: string;
  error?: string;
  latency_ms?: number;
}

export interface SetPrimaryConfigRequest {
  config_id: number;
}

// AI提供商选项
export const AI_PROVIDER_OPTIONS = [
  { value: AIProviderType.OPENAI, label: 'OpenAI', description: '支持GPT-3.5、GPT-4等模型' },
  { value: AIProviderType.ANTHROPIC, label: 'Anthropic', description: '支持Claude系列模型' },
  { value: AIProviderType.GOOGLE_AI, label: 'Google AI', description: '支持Gemini等模型' },
  { value: AIProviderType.AZURE_OPENAI, label: 'Azure OpenAI', description: 'Microsoft Azure上的OpenAI服务' },
  { value: AIProviderType.BAIDU_QIANFAN, label: '百度千帆', description: '百度的大模型平台' },
  { value: AIProviderType.ALIBABA_DASHSCOPE, label: '阿里云灵积', description: '阿里云的大模型服务' },
  { value: AIProviderType.ZHIPU_AI, label: '智谱AI', description: '支持ChatGLM等模型' },
  { value: AIProviderType.CUSTOM, label: '自定义', description: '自定义API端点' }
];

// 任务类型选项
export const TASK_TYPE_OPTIONS = [
  { value: 'innovation_analysis', label: '创新点分析', description: '分析论文或研究的创新点' },
  { value: 'paper_recommendation', label: '论文推荐', description: '推荐相关研究论文' },
  { value: 'research_analysis', label: '研究分析', description: '分析研究方向和趋势' },
  { value: 'chat', label: '聊天对话', description: '智能对话和问答' },
  { value: 'prompt_generation', label: '提示词生成', description: '生成AI提示词' }
];

// 默认模型配置
export const DEFAULT_MODEL_CONFIGS = {
  [AIProviderType.OPENAI]: {
    model_name: 'gpt-3.5-turbo',
    max_tokens: 4000,
    temperature: '0.7'
  },
  [AIProviderType.ANTHROPIC]: {
    model_name: 'claude-3-sonnet-20240229',
    max_tokens: 4000,
    temperature: '0.7'
  },
  [AIProviderType.GOOGLE_AI]: {
    model_name: 'gemini-pro',
    max_tokens: 4000,
    temperature: '0.7'
  },
  [AIProviderType.AZURE_OPENAI]: {
    model_name: 'gpt-35-turbo',
    max_tokens: 4000,
    temperature: '0.7'
  },
  [AIProviderType.BAIDU_QIANFAN]: {
    model_name: 'ERNIE-Bot',
    max_tokens: 4000,
    temperature: '0.7'
  },
  [AIProviderType.ALIBABA_DASHSCOPE]: {
    model_name: 'qwen-turbo',
    max_tokens: 4000,
    temperature: '0.7'
  },
  [AIProviderType.ZHIPU_AI]: {
    model_name: 'chatglm_turbo',
    max_tokens: 4000,
    temperature: '0.7'
  },
  [AIProviderType.CUSTOM]: {
    model_name: 'custom-model',
    max_tokens: 4000,
    temperature: '0.7'
  }
};