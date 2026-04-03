/**
 * ============================================================================
 * KNOWLEDGE BASE SERVICE
 * ============================================================================
 *
 * Service untuk mengelola knowledge base dan FAQ.
 * - Search knowledge base dengan keywords
 * - Support 2 mode: keywords dan allin
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { KnowledgeBase, GeneralVariables } from '../../../database/models';

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(
    @InjectModel(KnowledgeBase)
    private readonly knowledgeBaseModel: typeof KnowledgeBase,
    @InjectModel(GeneralVariables)
    private readonly generalVariablesModel: typeof GeneralVariables,
  ) {}

  /**
   * ==========================================================================
   * SEARCH KNOWLEDGE BASE
   * ==========================================================================
   * Search knowledge base dengan keywords.
   * Support 2 mode dari general_variables:
   * - keywords: Search dengan LIKE query
   * - allin: Ambil semua knowledge base
   *
   * @param keywords - Array keywords untuk pencarian
   * @returns String berisi hasil pencarian (question + answer)
   */
  async searchKnowledgeBase(keywords: string[]): Promise<string> {
    try {
      const answers: string[] = [];
      const seenIds = new Set<number>();

      // Get knowledge method dari general variables
      const knowledgeMethod = await this.generalVariablesModel.findOne({
        where: { variable: 'knowledge_method' },
        attributes: ['value'],
      });

      const method = knowledgeMethod?.value || 'keywords';

      if (method === 'keywords') {
        // Mode keywords: search dengan LIKE query
        for (const word of keywords) {
          const conditions: any[] = [
            { keyword: { [Op.like]: `%${word}%` } },
            { question: { [Op.like]: `%${word}%` } },
          ];

          const results = await this.knowledgeBaseModel.findAll({
            attributes: ['id', 'question', 'answer'],
            where: {
              [Op.or]: conditions,
            },
          });

          for (const item of results) {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              answers.push(`question: ${item.question}\nanswer: ${item.answer}`);
            }
          }
        }
      } else if (method === 'allin') {
        // Mode allin: ambil semua knowledge base
        const results = await this.knowledgeBaseModel.findAll({
          attributes: ['id', 'question', 'answer'],
        });

        for (const item of results) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            answers.push(`question: ${item.question}\nanswer: ${item.answer}`);
          }
        }
      }

      // Gabungkan semua hasil jadi satu string
      return answers.join('\n\n');
    } catch (error) {
      this.logger.error(`Error searching knowledge base: ${(error as Error).message}`);
      return '';
    }
  }

  /**
   * ==========================================================================
   * GET ALL KNOWLEDGE BASE
   * ==========================================================================
   * Ambil semua knowledge base entries.
   */
  async getAllKnowledgeBase(): Promise<KnowledgeBase[]> {
    return this.knowledgeBaseModel.findAll({
      order: [['id', 'ASC']],
    });
  }

  /**
   * ==========================================================================
   * FIND BY KEYWORD
   * ==========================================================================
   * Cari knowledge base by exact keyword.
   */
  async findByKeyword(keyword: string): Promise<KnowledgeBase[]> {
    return this.knowledgeBaseModel.findAll({
      where: {
        keyword: { [Op.like]: `%${keyword}%` },
      },
    });
  }
}
