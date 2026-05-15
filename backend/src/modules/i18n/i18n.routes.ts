import { Router } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { I18nController } from './i18n.controller';

const router = Router();

/**
 * @swagger
 * /i18n/languages:
 *   get:
 *     summary: List public languages
 *     tags: [I18n]
 *     responses:
 *       200:
 *         description: Available languages
 */
router.get('/languages', asyncHandler(I18nController.listLanguages));

/**
 * @swagger
 * /i18n/languages/{code}:
 *   get:
 *     summary: Get language bundle
 *     tags: [I18n]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Language bundle
 *       404:
 *         description: Language not found
 */
router.get('/languages/:code', asyncHandler(I18nController.getLanguage));

export default router;
