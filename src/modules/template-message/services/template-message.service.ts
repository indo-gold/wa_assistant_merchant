/**
 * ============================================================================
 * TEMPLATE MESSAGE SERVICE
 * ============================================================================
 * 
 * Service untuk mengelola WhatsApp message templates.
 * - Get template by name
 * - List all templates
 * - Parse template components
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TemplateMessage, TemplateStatus } from '../../../database/models';

export interface TemplateComponents {
  header?: {
    type: string;
    parameters: any[];
  };
  body?: {
    type: string;
    parameters: any[];
  };
  buttons?: any[];
}

@Injectable()
export class TemplateMessageService {
  private readonly logger = new Logger(TemplateMessageService.name);

  constructor(
    @InjectModel(TemplateMessage)
    private readonly templateModel: typeof TemplateMessage,
  ) {}

  /**
   * ==========================================================================
   * GET TEMPLATE BY NAME
   * ==========================================================================
   * Get template by template name.
   */
  async getTemplateByName(templateName: string): Promise<TemplateMessage | null> {
    try {
      return this.templateModel.findOne({
        where: {
          template_name: templateName,
          status: TemplateStatus.APPROVED,
        },
      });
    } catch (error) {
      this.logger.error(`Error getting template: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * ==========================================================================
   * GET ALL TEMPLATES
   * ==========================================================================
   * Get all approved templates.
   */
  async getAllTemplates(): Promise<TemplateMessage[]> {
    return this.templateModel.findAll({
      where: {
        status: TemplateStatus.APPROVED,
      },
      order: [['template_name', 'ASC']],
    });
  }

  /**
   * ==========================================================================
   * PARSE TEMPLATE JSON
   * ==========================================================================
   * Parse template JSON untuk ekstrak components.
   */
  parseTemplateJson(template: TemplateMessage): TemplateComponents | null {
    try {
      const jsonData = JSON.parse(template.json);
      const components: TemplateComponents = {};

      if (jsonData.components && Array.isArray(jsonData.components)) {
        for (const component of jsonData.components) {
          if (component.type === 'HEADER') {
            components.header = {
              type: component.format || 'TEXT',
              parameters: component.example?.header_handle || 
                         component.example?.header_text || [],
            };
          } else if (component.type === 'BODY') {
            components.body = {
              type: 'TEXT',
              parameters: component.example?.body_text?.[0] || [],
            };
          } else if (component.type === 'BUTTONS') {
            components.buttons = component.buttons || [];
          }
        }
      }

      return components;
    } catch (error) {
      this.logger.error(`Error parsing template JSON: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * ==========================================================================
   * BUILD TEMPLATE MESSAGE
   * ==========================================================================
   * Build template message untuk WhatsApp API.
   */
  buildTemplateMessage(
    templateName: string,
    languageCode: string = 'id',
    components?: TemplateComponents,
  ): any {
    const message: any = {
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
      },
    };

    if (components) {
      const componentList = [];

      if (components.header) {
        componentList.push({
          type: 'header',
          parameters: components.header.parameters.map((param) => ({
            type: components.header?.type === 'IMAGE' ? 'image' : 'text',
            [components.header?.type === 'IMAGE' ? 'image' : 'text']: param,
          })),
        });
      }

      if (components.body) {
        componentList.push({
          type: 'body',
          parameters: components.body.parameters.map((param) => ({
            type: 'text',
            text: param,
          })),
        });
      }

      if (componentList.length > 0) {
        message.template.components = componentList;
      }
    }

    return message;
  }

  /**
   * ==========================================================================
   * SYNC TEMPLATE
   * ==========================================================================
   * Sync template dari Meta API ke database.
   */
  async syncTemplate(
    templateId: string,
    templateName: string,
    category: string,
    status: string,
    jsonData: any,
  ): Promise<TemplateMessage> {
    const [template, created] = await this.templateModel.findOrCreate({
      where: { template_id: templateId },
      defaults: {
        template_id: templateId,
        template_name: templateName,
        category: category as any,
        status: status === 'APPROVED' ? TemplateStatus.APPROVED : 
                status === 'REJECTED' ? TemplateStatus.REJECTED : 
                TemplateStatus.PENDING,
        json: JSON.stringify(jsonData),
        created_at: new Date(),
      },
    });

    if (!created) {
      await template.update({
        template_name: templateName,
        category: category as any,
        status: status === 'APPROVED' ? TemplateStatus.APPROVED : 
                status === 'REJECTED' ? TemplateStatus.REJECTED : 
                TemplateStatus.PENDING,
        json: JSON.stringify(jsonData),
      });
    }

    this.logger.log(`Synced template: ${templateName} (${created ? 'created' : 'updated'})`);
    return template;
  }
}
