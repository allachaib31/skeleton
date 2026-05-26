import { HttpError } from '../../../common/errors/HttpError';

export type SocialMediaServiceProvidersSimulationAction =
  | 'SERVICES'
  | 'ADD_ORDER'
  | 'ORDER_STATUS'
  | 'MULTIPLE_ORDER_STATUS'
  | 'CREATE_REFILL'
  | 'MULTIPLE_REFILL'
  | 'REFILL_STATUS'
  | 'MULTIPLE_REFILL_STATUS'
  | 'CREATE_CANCEL'
  | 'BALANCE';

export type SocialMediaServiceType =
  | 'Default'
  | 'Package'
  | 'SEO'
  | 'Custom Comments'
  | 'Mentions with Hashtags'
  | 'Mentions Custom List'
  | 'Mentions Hashtag'
  | 'Mentions User Followers'
  | 'Mentions Media Likers'
  | 'Custom Comments Package'
  | 'Comment Likes'
  | 'Poll'
  | 'Comment Replies'
  | 'Invites from Groups'
  | 'Subscriptions'
  | 'Web Traffic';

export interface SocialMediaServiceOrderField {
  name: string;
  required: boolean;
  descriptionKey: string;
}

const baseOrderFields: SocialMediaServiceOrderField[] = [
  { name: 'service', required: true, descriptionKey: 'SERVICE_ID' },
];

const linkField: SocialMediaServiceOrderField = { name: 'link', required: true, descriptionKey: 'LINK' };
const quantityField: SocialMediaServiceOrderField = { name: 'quantity', required: true, descriptionKey: 'QUANTITY' };
const runsField: SocialMediaServiceOrderField = { name: 'runs', required: false, descriptionKey: 'RUNS' };
const intervalField: SocialMediaServiceOrderField = { name: 'interval', required: false, descriptionKey: 'INTERVAL' };

export const socialMediaServiceTypeRequirements: Record<SocialMediaServiceType, SocialMediaServiceOrderField[]> = {
  Default: [...baseOrderFields, linkField, quantityField, runsField, intervalField],
  Package: [...baseOrderFields, linkField],
  SEO: [...baseOrderFields, linkField, quantityField, { name: 'keywords', required: true, descriptionKey: 'KEYWORDS' }],
  'Custom Comments': [...baseOrderFields, linkField, { name: 'comments', required: true, descriptionKey: 'COMMENTS' }],
  'Mentions with Hashtags': [
    ...baseOrderFields,
    linkField,
    quantityField,
    { name: 'usernames', required: true, descriptionKey: 'USERNAMES' },
    { name: 'hashtags', required: true, descriptionKey: 'HASHTAGS' },
  ],
  'Mentions Custom List': [...baseOrderFields, linkField, { name: 'usernames', required: true, descriptionKey: 'USERNAMES' }],
  'Mentions Hashtag': [...baseOrderFields, linkField, quantityField, { name: 'hashtag', required: true, descriptionKey: 'HASHTAG' }],
  'Mentions User Followers': [...baseOrderFields, linkField, quantityField, { name: 'username', required: true, descriptionKey: 'USERNAME_FOLLOWERS_SOURCE' }],
  'Mentions Media Likers': [...baseOrderFields, linkField, quantityField, { name: 'media', required: true, descriptionKey: 'MEDIA_URL' }],
  'Custom Comments Package': [...baseOrderFields, linkField, { name: 'comments', required: true, descriptionKey: 'COMMENTS' }],
  'Comment Likes': [...baseOrderFields, linkField, quantityField, { name: 'username', required: true, descriptionKey: 'COMMENT_OWNER_USERNAME' }],
  Poll: [...baseOrderFields, linkField, quantityField, { name: 'answer_number', required: true, descriptionKey: 'ANSWER_NUMBER' }],
  'Comment Replies': [
    ...baseOrderFields,
    linkField,
    { name: 'username', required: true, descriptionKey: 'USERNAME' },
    { name: 'comments', required: true, descriptionKey: 'COMMENTS' },
  ],
  'Invites from Groups': [...baseOrderFields, linkField, quantityField, { name: 'groups', required: true, descriptionKey: 'GROUPS' }],
  Subscriptions: [
    ...baseOrderFields,
    { name: 'username', required: true, descriptionKey: 'USERNAME' },
    { name: 'min', required: true, descriptionKey: 'MIN_QUANTITY' },
    { name: 'max', required: true, descriptionKey: 'MAX_QUANTITY' },
    { name: 'posts', required: false, descriptionKey: 'POSTS' },
    { name: 'old_posts', required: false, descriptionKey: 'OLD_POSTS' },
    { name: 'delay', required: true, descriptionKey: 'DELAY' },
    { name: 'expiry', required: false, descriptionKey: 'EXPIRY' },
  ],
  'Web Traffic': [
    ...baseOrderFields,
    linkField,
    quantityField,
    runsField,
    intervalField,
    { name: 'country', required: true, descriptionKey: 'COUNTRY' },
    { name: 'device', required: true, descriptionKey: 'DEVICE' },
    { name: 'type_of_traffic', required: true, descriptionKey: 'TYPE_OF_TRAFFIC' },
    { name: 'google_keyword', required: false, descriptionKey: 'GOOGLE_KEYWORD' },
    { name: 'referring_url', required: false, descriptionKey: 'REFERRING_URL' },
  ],
};

export interface SocialMediaServiceProvidersCredentials {
  baseUrl: string;
  token: string;
}

export type SocialMediaServiceProvidersSimulationInput = {
  apiId: string;
  action: SocialMediaServiceProvidersSimulationAction;
  service?: string;
  link?: string;
  quantity?: string;
  order?: string;
  orders?: string[];
  refill?: string;
  refills?: string[];
  params?: Record<string, string>;
};

const normalizeApiUrl = (baseUrl: string) => {
  const url = new URL(baseUrl);
  const normalized = `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  return normalized.endsWith('/api/v2') ? normalized : `${normalized}/api/v2`;
};

const providerActionMap: Record<SocialMediaServiceProvidersSimulationAction, string> = {
  SERVICES: 'services',
  ADD_ORDER: 'add',
  ORDER_STATUS: 'status',
  MULTIPLE_ORDER_STATUS: 'status',
  CREATE_REFILL: 'refill',
  MULTIPLE_REFILL: 'refill',
  REFILL_STATUS: 'refill_status',
  MULTIPLE_REFILL_STATUS: 'refill_status',
  CREATE_CANCEL: 'cancel',
  BALANCE: 'balance',
};

const parseResponse = async (response: Response) => {
  const text = await response.text();
  if (!response.ok) throw HttpError.badRequest('settingsApis.social_media_provider_request_failed', String(response.status));
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
};

export class SocialMediaServiceProvidersProvider {
  private static async request(credentials: SocialMediaServiceProvidersCredentials, action: SocialMediaServiceProvidersSimulationAction, params: Record<string, string> = {}) {
    const body = new URLSearchParams();
    body.set('key', credentials.token);
    body.set('action', providerActionMap[action]);
    Object.entries(params).forEach(([key, value]) => body.set(key, value));

    const response = await fetch(normalizeApiUrl(credentials.baseUrl), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return parseResponse(response);
  }

  static services(credentials: SocialMediaServiceProvidersCredentials) {
    return this.request(credentials, 'SERVICES');
  }

  static balance(credentials: SocialMediaServiceProvidersCredentials) {
    return this.request(credentials, 'BALANCE');
  }

  static async simulate(credentials: SocialMediaServiceProvidersCredentials, input: SocialMediaServiceProvidersSimulationInput) {
    const body = new URLSearchParams();
    body.set('key', credentials.token);
    body.set('action', providerActionMap[input.action]);

    if (input.action === 'ADD_ORDER') {
      if (!input.service || !input.link) throw HttpError.badRequest('settingsApis.social_media_provider_order_required');
      body.set('service', input.service);
      body.set('link', input.link);
      if (input.quantity) body.set('quantity', input.quantity);
      Object.entries(input.params || {}).forEach(([key, value]) => body.set(key, value));
    }

    if (input.action === 'ORDER_STATUS') {
      if (!input.order) throw HttpError.badRequest('settingsApis.social_media_provider_order_id_required');
      body.set('order', input.order);
    }

    if (input.action === 'MULTIPLE_ORDER_STATUS' || input.action === 'MULTIPLE_REFILL' || input.action === 'CREATE_CANCEL') {
      if (!input.orders?.length) throw HttpError.badRequest('settingsApis.social_media_provider_orders_required');
      body.set('orders', input.orders.join(','));
    }

    if (input.action === 'CREATE_REFILL') {
      if (!input.order) throw HttpError.badRequest('settingsApis.social_media_provider_order_id_required');
      body.set('order', input.order);
    }

    if (input.action === 'REFILL_STATUS') {
      if (!input.refill) throw HttpError.badRequest('settingsApis.social_media_provider_refill_id_required');
      body.set('refill', input.refill);
    }

    if (input.action === 'MULTIPLE_REFILL_STATUS') {
      if (!input.refills?.length) throw HttpError.badRequest('settingsApis.social_media_provider_refills_required');
      body.set('refills', input.refills.join(','));
    }

    const response = await fetch(normalizeApiUrl(credentials.baseUrl), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return parseResponse(response);
  }
}
