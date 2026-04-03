/**
 * ============================================================================
 * SERVICES MOCKS
 * ============================================================================
 *
 * Mock classes untuk external services dalam testing.
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

/**
 * Mock WhatsApp API Service
 */
export const mockWhatsappApiService = () => ({
  sendMessage: jest.fn().mockResolvedValue({
    messaging_product: 'whatsapp',
    contacts: [{ input: '6281234567890', wa_id: '6281234567890' }],
    messages: [{ id: 'wamid.test123' }],
  }),
  downloadMedia: jest.fn().mockResolvedValue({
    buffer: Buffer.from('test'),
    fileName: 'test.jpg',
  }),
  sendTypingIndicator: jest.fn().mockResolvedValue(undefined),
});

/**
 * Mock AI Orchestrator Service
 */
export const mockAiOrchestratorService = () => ({
  processMessage: jest.fn().mockResolvedValue({
    content: 'This is a test response',
    toolCalls: [],
    model: 'gpt-4',
    provider: 'openai',
    executionTime: 500,
  }),
  getNaturalResponse: jest.fn().mockResolvedValue({
    content: 'Natural response after tool execution',
    model: 'gpt-4',
    provider: 'openai',
    executionTime: 300,
  }),
});

/**
 * Mock Tool Registry Service
 */
export const mockToolRegistryService = () => ({
  registerTool: jest.fn(),
  executeTool: jest.fn().mockResolvedValue({
    success: true,
    data: { result: 'test' },
    message: 'Tool executed successfully',
  }),
  getAvailableTools: jest.fn().mockReturnValue([]),
});

/**
 * Mock Media Service
 */
export const mockMediaService = () => ({
  saveFromBuffer: jest.fn().mockResolvedValue({
    filename: 'test.jpg',
    originalName: 'test.jpg',
    url: 'http://localhost:3000/media/test.jpg',
    path: '/uploads/test.jpg',
  }),
  uploadFile: jest.fn().mockResolvedValue({
    filename: 'uploaded.jpg',
    originalName: 'uploaded.jpg',
    url: 'http://localhost:3000/media/uploaded.jpg',
    path: '/uploads/uploaded.jpg',
  }),
});

/**
 * Mock Config Service
 */
export const mockConfigService = () => ({
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      'whatsapp.apiUrl': 'https://graph.facebook.com/v18.0',
      'whatsapp.accessToken': 'test-token',
      'whatsapp.phoneNumberId': '123456',
      'openai.apiKey': 'test-openai-key',
      'jwt.secret': 'test-jwt-secret',
    };
    return config[key] || null;
  }),
});

/**
 * Mock Http Service
 */
export const mockHttpService = () => ({
  post: jest.fn().mockReturnValue({
    toPromise: jest.fn().mockResolvedValue({ data: { success: true } }),
  }),
  get: jest.fn().mockReturnValue({
    toPromise: jest.fn().mockResolvedValue({ data: {} }),
  }),
});
