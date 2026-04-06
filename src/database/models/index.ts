/**
 * ============================================================================
 * MODELS INDEX
 * ============================================================================
 *
 * Export semua models untuk centralized import.
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

// Core Models
export { User, UserStatus } from './user.model';
export { ChatHistory, MessageType, MessageRole, MessageStatus } from './chat-history.model';
export { Product } from './product.model';
export { Cart, CartStatus, ProductOrder } from './cart.model';
export { Order, OrderStatus, PickupStatus } from './order.model';

// Promo Models
export { Promo, DiscountType } from './promo.model';
export { PromoProduct } from './promo-product.model';
export { PromoUsageLog } from './promo-usage-log.model';

// Payment Models (NEW)
export { OrderPayment, PaymentStatus, FeeType } from './order-payment.model';
export { OrderOtp, OtpPurpose, OtpStatus } from './order-otp.model';

// AI Models
export { StudioAI, StudioStatus } from './studio-ai.model';
export { AgentAI } from './agent-ai.model';
export { ModelAI } from './model-ai.model';
export { Cost, CostOperationType } from './cost.model';

// Cron/Reminder Models
export { Survey, SurveyStatus } from './survey.model';
export { SurveyDetail, SurveyActivity } from './survey-detail.model';
export { ReminderProducts } from './reminder-products.model';

// Blast Message Models
export {
  MetaBlastMessage,
  BlastMessageStatus,
  BlastProcessingStatus,
} from './meta-blast-message.model';
export { BlastRecipients, RecipientStatus } from './blast-recipients.model';

// Template & Media Models
export { TemplateMessage, TemplateCategory, TemplateStatus } from './template-message.model';
export { MediaMessage } from './media-message.model';

// Support Models
export { GeneralVariables } from './general-variables.model';
export { KnowledgeBase } from './knowledge-base.model';
export { UserPenalty, PenaltyStatus } from './user-penalty.model';
export { UserNeedHelp, HelpSessionStatus } from './user-need-help.model';
export { ChatUserComplain, ComplainCategory } from './chat-user-complain.model';
export { Personalization } from './personalization.model';
export { ProductsHistory } from './products-history.model';

// KTP Verification
export { KtpVerification } from './ktp-verification.model';

// Logging Models
export { ErrorLog } from './error-log.model';
export { WebhookRequest } from './webhook-request.model';
