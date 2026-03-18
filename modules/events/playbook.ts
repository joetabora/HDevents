export type EventPlaybookChecklistItem = {
  item: string;
  description: string;
  notes: string;
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
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    friday: string[];
    saturday: string[];
  };
  postEventFollowUp: {
    within24Hours: string[];
    within3Days: string[];
    managerMeeting: string[];
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

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);
}

function asChecklist(value: unknown, fallback: EventPlaybookChecklistItem[]): EventPlaybookChecklistItem[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .map((entry) => {
      const record = asRecord(entry);
      const item = asString(record.item).trim();
      const description = asString(record.description).trim();
      const notes = asString(record.notes).trim();

      if (!item) {
        return null;
      }

      return {
        item,
        description,
        notes
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
      { item: 'Tent', description: '', notes: '' },
      { item: 'Table', description: '', notes: '' },
      { item: 'Tablecloth', description: '', notes: '' },
      { item: 'Chairs', description: '', notes: '' },
      { item: 'Graphic (FB)', description: '1200x1200', notes: '' },
      { item: 'Graphic (IG)', description: '1080x1920', notes: '' },
      { item: 'Web Banner', description: '', notes: '' },
      { item: 'Email Graphic', description: '', notes: '' },
      { item: 'Email Script', description: '', notes: '' },
      { item: 'Phone Script', description: '', notes: '' },
      { item: 'Text Script', description: '', notes: '' },
      { item: 'Text Blast', description: '', notes: '' },
      { item: 'Motorcycle', description: '', notes: '' },
      { item: 'Flyers', description: '', notes: '' },
      { item: 'Bounce Back Cash', description: '', notes: '' },
      { item: 'Giveaway Keyword Setup', description: '', notes: '' },
      { item: 'Giveaway Item', description: '', notes: '' },
      { item: 'Other Swag', description: '', notes: '' },
      { item: 'iPad', description: '', notes: '' },
      { item: 'Poster Sign/Holder', description: '', notes: '' },
      { item: 'Guitar', description: '', notes: '' },
      { item: 'Balloons', description: '', notes: '' },
      { item: 'Flags', description: '', notes: '' }
    ],
    weekFlow: {
      monday: ['Post "This Week at the Dealership" teaser on socials.'],
      tuesday: ['Send CRM email blast.', 'Place any catering or DoorDash orders.'],
      wednesday: ['Push mid-week teaser post ("3 Days Away").'],
      friday: [
        'Post "Happening Tomorrow" reminder content.',
        'Confirm vendors and delivery times.',
        'Prepare prizes, tables, and signage.'
      ],
      saturday: [
        'Setup begins at 8:30 AM.',
        'Confirm tents, grill, tables, signage, prize entry station, and staff reminders.',
        'Capture photo and video content during the event.'
      ]
    },
    postEventFollowUp: {
      within24Hours: [
        'Post event photos and videos with a thank-you message.',
        'Collect raffle entries and track leads into CRM or follow-up system.'
      ],
      within3Days: ['Send follow-up email to participants and promote the next event.'],
      managerMeeting: ['Share recap covering attendance, leads captured, and sales impact.']
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
      monday: Array.isArray(weekFlow.monday) ? asStringArray(weekFlow.monday) : base.weekFlow.monday,
      tuesday: Array.isArray(weekFlow.tuesday) ? asStringArray(weekFlow.tuesday) : base.weekFlow.tuesday,
      wednesday: Array.isArray(weekFlow.wednesday) ? asStringArray(weekFlow.wednesday) : base.weekFlow.wednesday,
      friday: Array.isArray(weekFlow.friday) ? asStringArray(weekFlow.friday) : base.weekFlow.friday,
      saturday: Array.isArray(weekFlow.saturday) ? asStringArray(weekFlow.saturday) : base.weekFlow.saturday
    },
    postEventFollowUp: {
      within24Hours: Array.isArray(postEventFollowUp.within24Hours)
        ? asStringArray(postEventFollowUp.within24Hours)
        : base.postEventFollowUp.within24Hours,
      within3Days: Array.isArray(postEventFollowUp.within3Days)
        ? asStringArray(postEventFollowUp.within3Days)
        : base.postEventFollowUp.within3Days,
      managerMeeting: Array.isArray(postEventFollowUp.managerMeeting)
        ? asStringArray(postEventFollowUp.managerMeeting)
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
        item,
        description,
        notes
      };
    })
    .filter((entry) => entry.item);
}

export function formatChecklistInput(value: EventPlaybookChecklistItem[]): string {
  return value
    .map((entry) => [entry.item, entry.description, entry.notes].filter(Boolean).join(' | '))
    .join('\n');
}
