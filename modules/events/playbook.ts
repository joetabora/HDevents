export const PLAYBOOK_EXECUTION_STATUSES = ['NOT_STARTED', 'READY', 'IN_PROGRESS', 'DONE'] as const;

export type PlaybookExecutionStatus = (typeof PLAYBOOK_EXECUTION_STATUSES)[number];

export type EventPlaybookExecutionItem = {
  id: string;
  title: string;
  ownerId: string;
  dueDate: string;
  status: PlaybookExecutionStatus;
  completed: boolean;
  notes: string;
};

export type EventPlaybookChecklistItem = EventPlaybookExecutionItem & {
  item: string;
  description: string;
};

export type EventPlaybook = {
  purpose: string;
  goals: string[];
  qrScanGoal: number | null;
  theme: string;
  location: string;
  startTime: string;
  endTime: string;
  coreActivities: {
    foodAndRefreshments: string;
    entertainment: string;
    bikeActivity: string;
    engagementOpportunity: string;
  };
  preEventPreparation: string[];
  marketingAssets: string[];
  internalCommunication: string[];
  layoutPlan: string;
  checklist: EventPlaybookChecklistItem[];
  weekFlow: {
    monday: EventPlaybookExecutionItem[];
    tuesday: EventPlaybookExecutionItem[];
    wednesday: EventPlaybookExecutionItem[];
    friday: EventPlaybookExecutionItem[];
    saturday: EventPlaybookExecutionItem[];
  };
  postEventFollowUp: {
    within24Hours: EventPlaybookExecutionItem[];
    within3Days: EventPlaybookExecutionItem[];
    managerMeeting: EventPlaybookExecutionItem[];
  };
  rolesAndResponsibilities: {
    marketingLead: string;
    salesTeam: string;
    serviceTeam: string;
    motorClothes: string;
    gmOwner: string;
    volunteersOrCharities: string;
  };
  successMetrics: string[];
  reusableAssets: string[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function createExecutionItem(title: string, overrides?: Partial<EventPlaybookExecutionItem>): EventPlaybookExecutionItem {
  return {
    id: overrides?.id ?? `item-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'entry'}`,
    title,
    ownerId: overrides?.ownerId ?? '',
    dueDate: overrides?.dueDate ?? '',
    status: overrides?.status ?? 'NOT_STARTED',
    completed: overrides?.completed ?? false,
    notes: overrides?.notes ?? ''
  };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);
}

function isExecutionStatus(value: string): value is PlaybookExecutionStatus {
  return PLAYBOOK_EXECUTION_STATUSES.includes(value as PlaybookExecutionStatus);
}

function asExecutionItem(value: unknown): EventPlaybookExecutionItem | null {
  const record = asRecord(value);
  const title = asString(record.title).trim();
  if (!title) {
    return null;
  }

  const rawStatus = asString(record.status, 'NOT_STARTED');

  return {
    id: asString(record.id, createExecutionItem(title).id),
    title,
    ownerId: asString(record.ownerId),
    dueDate: asString(record.dueDate),
    status: isExecutionStatus(rawStatus) ? rawStatus : 'NOT_STARTED',
    completed: Boolean(record.completed),
    notes: asString(record.notes)
  };
}

function asExecutionList(value: unknown, fallback: EventPlaybookExecutionItem[]): EventPlaybookExecutionItem[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value.map(asExecutionItem).filter((entry): entry is EventPlaybookExecutionItem => Boolean(entry));
  return items;
}

function asChecklist(value: unknown, fallback: EventPlaybookChecklistItem[]): EventPlaybookChecklistItem[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .map((entry) => {
      const record = asRecord(entry);
      const item = asString(record.item).trim();
      if (!item) {
        return null;
      }

      const execution = asExecutionItem({
        id: record.id,
        title: asString(record.title, item),
        ownerId: record.ownerId,
        dueDate: record.dueDate,
        status: record.status,
        completed: record.completed,
        notes: record.notes
      }) ?? createExecutionItem(item);

      return {
        ...execution,
        item,
        description: asString(record.description).trim()
      };
    })
    .filter((entry): entry is EventPlaybookChecklistItem => Boolean(entry));

  return items.length > 0 ? items : fallback;
}

export function defaultEventPlaybook(): EventPlaybook {
  return {
    purpose: 'Drive dealership traffic and create sales opportunities across apparel, parts, service, and motorcycle sales.',
    goals: [
      'Drive dealership traffic',
      'Increase sales opportunities in MotorClothes, Parts, and Sales',
      'Create engaging experiences for the rider community'
    ],
    qrScanGoal: 35,
    theme: '',
    location: '',
    startTime: '11:00 AM',
    endTime: '4:00 PM',
    coreActivities: {
      foodAndRefreshments: 'Free breakfast, cookout, or partner food truck',
      entertainment: 'DJ, live band, or games',
      bikeActivity: 'Bike wash, test rides, slow races, or show and shine',
      engagementOpportunity: 'Raffles, sweepstakes, giveaways, or prize entries'
    },
    preEventPreparation: [
      'Finalize the event theme and secure outside vendors, charities, bands, and food partners.',
      'Confirm permits or approvals for food, music, raffles, and any public activation.',
      'Lock event-day staffing coverage and operating responsibilities.'
    ],
    marketingAssets: [
      'Flyer (print and digital)',
      'Social media graphics for Facebook, Instagram, Stories, and Reels',
      'CRM email segment',
      'Website event listing with SEO description'
    ],
    internalCommunication: [
      'Share event details with team managers.',
      'Assign roles for grill, games, raffles, sign-in, and coverage.',
      'Present layout and staffing plan for manager review.',
      'Distribute final staff instructions before event day.'
    ],
    layoutPlan: 'Define indoor/outdoor footprint, traffic flow, vendor placement, and guest engagement stations.',
    checklist: [
      { ...createExecutionItem('Tent'), item: 'Tent', description: '' },
      { ...createExecutionItem('Table'), item: 'Table', description: '' },
      { ...createExecutionItem('Tablecloth'), item: 'Tablecloth', description: '' },
      { ...createExecutionItem('Chairs'), item: 'Chairs', description: '' },
      { ...createExecutionItem('Graphic (FB)'), item: 'Graphic (FB)', description: '1200x1200' },
      { ...createExecutionItem('Graphic (IG)'), item: 'Graphic (IG)', description: '1080x1920' },
      { ...createExecutionItem('Web Banner'), item: 'Web Banner', description: '' },
      { ...createExecutionItem('Email Graphic'), item: 'Email Graphic', description: '' },
      { ...createExecutionItem('Email Script'), item: 'Email Script', description: '' },
      { ...createExecutionItem('Phone Script'), item: 'Phone Script', description: '' },
      { ...createExecutionItem('Text Script'), item: 'Text Script', description: '' },
      { ...createExecutionItem('Text Blast'), item: 'Text Blast', description: '' },
      { ...createExecutionItem('Motorcycle'), item: 'Motorcycle', description: '' },
      { ...createExecutionItem('Flyers'), item: 'Flyers', description: '' },
      { ...createExecutionItem('Bounce Back Cash'), item: 'Bounce Back Cash', description: '' },
      { ...createExecutionItem('Giveaway Keyword Setup'), item: 'Giveaway Keyword Setup', description: '' },
      { ...createExecutionItem('Giveaway Item'), item: 'Giveaway Item', description: '' },
      { ...createExecutionItem('Other Swag'), item: 'Other Swag', description: '' },
      { ...createExecutionItem('iPad'), item: 'iPad', description: '' },
      { ...createExecutionItem('Poster Sign/Holder'), item: 'Poster Sign/Holder', description: '' },
      { ...createExecutionItem('Guitar'), item: 'Guitar', description: '' },
      { ...createExecutionItem('Balloons'), item: 'Balloons', description: '' },
      { ...createExecutionItem('Flags'), item: 'Flags', description: '' }
    ],
    weekFlow: {
      monday: [createExecutionItem('Post "This Week at the Dealership" teaser on socials.')],
      tuesday: [createExecutionItem('Send CRM email blast.'), createExecutionItem('Place any catering or DoorDash orders.')],
      wednesday: [createExecutionItem('Push mid-week teaser post ("3 Days Away").')],
      friday: [
        createExecutionItem('Post "Happening Tomorrow" reminder content.'),
        createExecutionItem('Confirm vendors and delivery times.'),
        createExecutionItem('Prepare prizes, tables, and signage.')
      ],
      saturday: [
        createExecutionItem('Setup begins at 8:30 AM.'),
        createExecutionItem('Confirm tents, grill, tables, signage, prize entry station, and staff reminders.'),
        createExecutionItem('Capture photo and video content during the event.')
      ]
    },
    postEventFollowUp: {
      within24Hours: [
        createExecutionItem('Post event photos and videos with a thank-you message.'),
        createExecutionItem('Collect raffle entries and track leads into CRM or follow-up system.')
      ],
      within3Days: [createExecutionItem('Send follow-up email to participants and promote the next event.')],
      managerMeeting: [createExecutionItem('Share recap covering attendance, leads captured, and sales impact.')]
    },
    rolesAndResponsibilities: {
      marketingLead: '',
      salesTeam: '',
      serviceTeam: '',
      motorClothes: '',
      gmOwner: '',
      volunteersOrCharities: ''
    },
    successMetrics: [
      'Event attendance and foot traffic',
      'Leads captured from entries or keyword opt-ins',
      'Sales lift in MotorClothes, Parts, Service, and Sales during event hours',
      'Social media engagement including reach, comments, and shares',
      'Customer feedback'
    ],
    reusableAssets: [
      'Social post templates for this week, tomorrow, and live event coverage',
      'Email templates for intro, reminder, and follow-up',
      'Event signage for raffle entry, keyword entry, food station, and games',
      'Staff checklist template'
    ]
  };
}

export function getEventPlaybook(value: unknown): EventPlaybook {
  const base = defaultEventPlaybook();
  const record = asRecord(value);
  const coreActivities = asRecord(record.coreActivities);
  const weekFlow = asRecord(record.weekFlow);
  const postEventFollowUp = asRecord(record.postEventFollowUp);
  const rolesAndResponsibilities = asRecord(record.rolesAndResponsibilities);

  return {
    purpose: asString(record.purpose, base.purpose),
    goals: Array.isArray(record.goals) ? asStringArray(record.goals) : base.goals,
    qrScanGoal: asNumber(record.qrScanGoal) ?? base.qrScanGoal,
    theme: asString(record.theme, base.theme),
    location: asString(record.location, base.location),
    startTime: asString(record.startTime, base.startTime),
    endTime: asString(record.endTime, base.endTime),
    coreActivities: {
      foodAndRefreshments: asString(coreActivities.foodAndRefreshments, base.coreActivities.foodAndRefreshments),
      entertainment: asString(coreActivities.entertainment, base.coreActivities.entertainment),
      bikeActivity: asString(coreActivities.bikeActivity, base.coreActivities.bikeActivity),
      engagementOpportunity: asString(coreActivities.engagementOpportunity, base.coreActivities.engagementOpportunity)
    },
    preEventPreparation: Array.isArray(record.preEventPreparation)
      ? asStringArray(record.preEventPreparation)
      : base.preEventPreparation,
    marketingAssets: Array.isArray(record.marketingAssets) ? asStringArray(record.marketingAssets) : base.marketingAssets,
    internalCommunication: Array.isArray(record.internalCommunication)
      ? asStringArray(record.internalCommunication)
      : base.internalCommunication,
    layoutPlan: asString(record.layoutPlan, base.layoutPlan),
    checklist: Array.isArray(record.checklist) ? asChecklist(record.checklist, []) : base.checklist,
    weekFlow: {
      monday: Array.isArray(weekFlow.monday)
        ? typeof weekFlow.monday[0] === 'string'
          ? asStringArray(weekFlow.monday).map((entry) => createExecutionItem(entry))
          : asExecutionList(weekFlow.monday, [])
        : base.weekFlow.monday,
      tuesday: Array.isArray(weekFlow.tuesday)
        ? typeof weekFlow.tuesday[0] === 'string'
          ? asStringArray(weekFlow.tuesday).map((entry) => createExecutionItem(entry))
          : asExecutionList(weekFlow.tuesday, [])
        : base.weekFlow.tuesday,
      wednesday: Array.isArray(weekFlow.wednesday)
        ? typeof weekFlow.wednesday[0] === 'string'
          ? asStringArray(weekFlow.wednesday).map((entry) => createExecutionItem(entry))
          : asExecutionList(weekFlow.wednesday, [])
        : base.weekFlow.wednesday,
      friday: Array.isArray(weekFlow.friday)
        ? typeof weekFlow.friday[0] === 'string'
          ? asStringArray(weekFlow.friday).map((entry) => createExecutionItem(entry))
          : asExecutionList(weekFlow.friday, [])
        : base.weekFlow.friday,
      saturday: Array.isArray(weekFlow.saturday)
        ? typeof weekFlow.saturday[0] === 'string'
          ? asStringArray(weekFlow.saturday).map((entry) => createExecutionItem(entry))
          : asExecutionList(weekFlow.saturday, [])
        : base.weekFlow.saturday
    },
    postEventFollowUp: {
      within24Hours: Array.isArray(postEventFollowUp.within24Hours)
        ? typeof postEventFollowUp.within24Hours[0] === 'string'
          ? asStringArray(postEventFollowUp.within24Hours).map((entry) => createExecutionItem(entry))
          : asExecutionList(postEventFollowUp.within24Hours, [])
        : base.postEventFollowUp.within24Hours,
      within3Days: Array.isArray(postEventFollowUp.within3Days)
        ? typeof postEventFollowUp.within3Days[0] === 'string'
          ? asStringArray(postEventFollowUp.within3Days).map((entry) => createExecutionItem(entry))
          : asExecutionList(postEventFollowUp.within3Days, [])
        : base.postEventFollowUp.within3Days,
      managerMeeting: Array.isArray(postEventFollowUp.managerMeeting)
        ? typeof postEventFollowUp.managerMeeting[0] === 'string'
          ? asStringArray(postEventFollowUp.managerMeeting).map((entry) => createExecutionItem(entry))
          : asExecutionList(postEventFollowUp.managerMeeting, [])
        : base.postEventFollowUp.managerMeeting
    },
    rolesAndResponsibilities: {
      marketingLead: asString(rolesAndResponsibilities.marketingLead, base.rolesAndResponsibilities.marketingLead),
      salesTeam: asString(rolesAndResponsibilities.salesTeam, base.rolesAndResponsibilities.salesTeam),
      serviceTeam: asString(rolesAndResponsibilities.serviceTeam, base.rolesAndResponsibilities.serviceTeam),
      motorClothes: asString(rolesAndResponsibilities.motorClothes, base.rolesAndResponsibilities.motorClothes),
      gmOwner: asString(rolesAndResponsibilities.gmOwner, base.rolesAndResponsibilities.gmOwner),
      volunteersOrCharities: asString(
        rolesAndResponsibilities.volunteersOrCharities,
        base.rolesAndResponsibilities.volunteersOrCharities
      )
    },
    successMetrics: Array.isArray(record.successMetrics) ? asStringArray(record.successMetrics) : base.successMetrics,
    reusableAssets: Array.isArray(record.reusableAssets) ? asStringArray(record.reusableAssets) : base.reusableAssets
  };
}

export function parseMultilineList(value: string): string[] {
  return value
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function formatMultilineList(value: string[]): string {
  return value.join('\n');
}

export function parseChecklistInput(value: string): EventPlaybookChecklistItem[] {
  return value
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [item, description = '', notes = ''] = entry.split('|').map((part) => part.trim());
      return {
        ...createExecutionItem(item, {
          notes
        }),
        item,
        title: item,
        description
      };
    })
    .filter((entry) => entry.item);
}

export function formatChecklistInput(value: EventPlaybookChecklistItem[]): string {
  return value
    .map((entry) => [entry.item, entry.description, entry.notes].filter(Boolean).join(' | '))
    .join('\n');
}

export function parseExecutionItemsInput(value: string): EventPlaybookExecutionItem[] {
  return value
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => createExecutionItem(entry));
}

export function parseExecutionItemsJson(value: string): EventPlaybookExecutionItem[] {
  if (!value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return asExecutionList(parsed, []);
  } catch {
    throw new Error('Execution items payload is invalid');
  }
}

export function parseChecklistJson(value: string): EventPlaybookChecklistItem[] {
  if (!value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return asChecklist(parsed, []);
  } catch {
    throw new Error('Checklist payload is invalid');
  }
}

export function parseStringListJson(value: string): string[] {
  if (!value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return asStringArray(parsed);
  } catch {
    throw new Error('List payload is invalid');
  }
}
