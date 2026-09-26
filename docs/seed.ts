import { PrismaClient, Role, Mood, ConversationKind, SignalLevel, AlertStatus } from '@prisma/client';
import * as argon2 from '@node-rs/argon2';

const prisma = new PrismaClient();

const isoDate = (d: Date) => d.toISOString().split('T')[0];

async function main() {
  console.log('Seeding SAATHI production database...');

  // 1. Password hashing
  const defaultPasswordHash = await argon2.hash('SaathiPassword2026!', {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  // 2. Seed Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@saathi.org' },
    update: {},
    create: {
      email: 'admin@saathi.org',
      passwordHash: defaultPasswordHash,
      roles: { create: [{ role: Role.ADMIN }, { role: Role.USER }] },
      profile: {
        create: {
          displayName: 'System Admin',
          language: 'English',
          communication: 'Both',
        },
      },
      preference: {
        create: {
          timezone: 'Asia/Kolkata',
          reminderEnabled: false,
        },
      },
    },
  });

  // 3. Seed Caseworkers
  const caseworker1 = await prisma.user.upsert({
    where: { email: 'caseworker.arun@saathi.org' },
    update: {},
    create: {
      email: 'caseworker.arun@saathi.org',
      passwordHash: defaultPasswordHash,
      roles: { create: [{ role: Role.CASEWORKER }, { role: Role.USER }] },
      profile: {
        create: {
          displayName: 'Arun Varma',
          about: 'Senior Caseworker & Safeguarding Officer',
          language: 'English & Hindi',
          communication: 'Both',
        },
      },
      preference: { create: { timezone: 'Asia/Kolkata' } },
    },
  });

  const caseworker2 = await prisma.user.upsert({
    where: { email: 'caseworker.priya@saathi.org' },
    update: {},
    create: {
      email: 'caseworker.priya@saathi.org',
      passwordHash: defaultPasswordHash,
      roles: { create: [{ role: Role.CASEWORKER }, { role: Role.USER }] },
      profile: {
        create: {
          displayName: 'Priya Sen',
          about: 'Community Wellbeing & Support Lead',
          language: 'English, Bengali & Hindi',
          communication: 'Both',
        },
      },
      preference: { create: { timezone: 'Asia/Kolkata' } },
    },
  });

  // 4. Seed Human Listeners & Counsellors
  const listenersData = [
    {
      email: 'ananya.rao@saathi.org',
      name: 'Ananya Rao',
      initials: 'AR',
      role: 'Trained listener',
      languages: ['Hindi', 'English'],
      topics: ['Loneliness', 'Grief', 'Social isolation'],
      bio: 'I offer a calm, judgment-free space where you can share at your own pace.',
      available: true,
    },
    {
      email: 'kabir.mehta@saathi.org',
      name: 'Kabir Mehta',
      initials: 'KM',
      role: 'Volunteer',
      languages: ['English', 'Marathi'],
      topics: ['Family support', 'Uncertainty'],
      bio: 'Sometimes being heard is the first step. I am here to listen without rushing you.',
      available: true,
    },
    {
      email: 'farah.ali@saathi.org',
      name: 'Dr. Farah Ali',
      initials: 'FA',
      role: 'Counsellor',
      languages: ['Hindi', 'Urdu', 'English'],
      topics: ['Trauma recovery', 'Grief'],
      bio: 'I support people through difficult transitions with a gentle, person-centred approach.',
      available: false,
    },
    {
      email: 'rohan.das@saathi.org',
      name: 'Rohan Das',
      initials: 'RD',
      role: 'Trained listener',
      languages: ['Bengali', 'English', 'Hindi'],
      topics: ['Academic pressure', 'Career uncertainty'],
      bio: 'Here to listen when exam and work stress start feeling like too much to carry alone.',
      available: true,
    },
    {
      email: 'sunita.nair@saathi.org',
      name: 'Sunita Nair',
      initials: 'SN',
      role: 'Volunteer',
      languages: ['Malayalam', 'English', 'Tamil'],
      topics: ['Loneliness', 'Elder support', 'Family'],
      bio: 'Quiet company and warm listening for whenever you need a grounding presence.',
      available: true,
    },
    {
      email: 'neha.kapoor@saathi.org',
      name: 'Dr. Neha Kapoor',
      initials: 'NK',
      role: 'Counsellor',
      languages: ['Punjabi', 'Hindi', 'English'],
      topics: ['Relationship transitions', 'Recovery'],
      bio: 'Licensed counselling psychologist focused on gentle, non-judgmental accompaniment.',
      available: false,
    },
  ];

  const seededListeners: any[] = [];
  for (const l of listenersData) {
    const listenerUser = await prisma.user.upsert({
      where: { email: l.email },
      update: {},
      create: {
        email: l.email,
        passwordHash: defaultPasswordHash,
        roles: { create: [{ role: Role.LISTENER }, { role: Role.USER }] },
        profile: {
          create: {
            displayName: l.name,
            about: l.bio,
            language: l.languages.join(', '),
            communication: 'Both',
          },
        },
        preference: { create: { timezone: 'Asia/Kolkata' } },
      },
    });

    await prisma.listenerProfile.upsert({
      where: { userId: listenerUser.id },
      update: {},
      create: {
        userId: listenerUser.id,
        bio: l.bio,
        languages: l.languages,
        topics: l.topics,
        available: l.available,
        verifiedAt: new Date(),
      },
    });

    seededListeners.push(listenerUser);
  }

  // 5. Seed Journey Milestones
  const milestones = [
    { id: 'm1', order: 1, title: 'Joined SAATHI', condition: 'Begin your SAATHI journey', section: 'home', metric: 'joined', target: 1 },
    { id: 'm2', order: 2, title: 'First check-in', condition: 'Complete your first check-in', section: 'home', metric: 'checks', target: 1 },
    { id: 'm3', order: 3, title: 'Reached out', condition: 'Send a message to SAATHI', section: 'talk', metric: 'chats', target: 1 },
    { id: 'm4', order: 4, title: 'Connected with someone', condition: 'Talk with a listener', section: 'support', metric: 'listeners', target: 1 },
    { id: 'm5', order: 5, title: '3 check-ins', condition: 'Check in on three different days', section: 'home', metric: 'checks', target: 3 },
    { id: 'm6', order: 6, title: 'Found your space', condition: 'Join a community', section: 'community', metric: 'groups', target: 1 },
    { id: 'm7', order: 7, title: '7 check-ins', condition: 'Check in on seven different days', section: 'home', metric: 'checks', target: 7 },
    { id: 'm8', order: 8, title: 'Shared support', condition: 'Share a community post', section: 'community', metric: 'posts', target: 1 },
  ];

  for (const m of milestones) {
    await prisma.journeyMilestone.upsert({
      where: { id: m.id },
      update: {},
      create: m,
    });
  }

  // 6. Seed Badges Catalog (24+ badges from prototype)
  const badges = [
    { id: 'b1', name: 'First Step', description: 'You made space for your first check-in.', theme: 'Self-care', metric: 'checks', target: 1, motif: 'sunrise' },
    { id: 'b2', name: 'Reached Out', description: 'You started a conversation with SAATHI.', theme: 'Connection', metric: 'chats', target: 1, motif: 'bubbles' },
    { id: 'b3', name: 'Connected', description: 'You talked with a human listener.', theme: 'Connection', metric: 'listeners', target: 1, motif: 'people' },
    { id: 'b4', name: 'Found Your Space', description: 'You joined a supportive group.', theme: 'Community', metric: 'groups', target: 1, motif: 'home' },
    { id: 'b5', name: 'Staying Connected', description: 'You made space for seven check-ins.', theme: 'Self-care', metric: 'checks', target: 7, motif: 'leaf' },
    { id: 'b6', name: 'Shared Support', description: 'You shared something with your community.', theme: 'Community', metric: 'posts', target: 1, motif: 'hands' },
    { id: 'b7', name: 'Here Again', description: 'You checked in on two different days.', theme: 'Self-care', metric: 'checks', target: 2, motif: 'path' },
    { id: 'b8', name: 'Three Moments', description: 'You checked in on three different days.', theme: 'Self-care', metric: 'checks', target: 3, motif: 'stars' },
    { id: 'b9', name: 'A Little Space', description: 'You checked in on four different days.', theme: 'Self-care', metric: 'checks', target: 4, motif: 'sunrise' },
    { id: 'b10', name: 'Room to Breathe', description: 'You checked in on five different days.', theme: 'Self-care', metric: 'checks', target: 5, motif: 'leaf' },
    { id: 'b11', name: 'Showing Up', description: 'You checked in on six different days.', theme: 'Self-care', metric: 'checks', target: 6, motif: 'path' },
    { id: 'b12', name: 'Ten Moments', description: 'You checked in on ten different days.', theme: 'Self-care', metric: 'checks', target: 10, motif: 'stars' },
    { id: 'b13', name: 'Two Weeks of Moments', description: 'You checked in on fourteen different days.', theme: 'Self-care', metric: 'checks', target: 14, motif: 'sunrise' },
    { id: 'b14', name: 'Open Path', description: 'You checked in on twenty-one different days.', theme: 'Self-care', metric: 'checks', target: 21, motif: 'path' },
    { id: 'b15', name: 'Thirty Moments', description: 'You checked in on thirty different days.', theme: 'Self-care', metric: 'checks', target: 30, motif: 'leaf' },
    { id: 'b16', name: 'A Longer Path', description: 'You checked in on forty-five different days.', theme: 'Self-care', metric: 'checks', target: 45, motif: 'stars' },
    { id: 'b17', name: 'Another Conversation', description: 'You sent two messages to SAATHI.', theme: 'Connection', metric: 'chats', target: 2, motif: 'bubbles' },
    { id: 'b18', name: 'Finding Words', description: 'You sent three messages to SAATHI.', theme: 'Connection', metric: 'chats', target: 3, motif: 'stars' },
    { id: 'b19', name: 'Open Conversation', description: 'You sent five messages to SAATHI.', theme: 'Connection', metric: 'chats', target: 5, motif: 'bubbles' },
    { id: 'b20', name: 'Room to Talk', description: 'You sent ten messages to SAATHI.', theme: 'Connection', metric: 'chats', target: 10, motif: 'people' },
    { id: 'b21', name: 'A Listening Space', description: 'You sent two messages to a listener.', theme: 'Connection', metric: 'listeners', target: 2, motif: 'people' },
    { id: 'b22', name: 'Another Space', description: 'You joined two supportive groups.', theme: 'Community', metric: 'groups', target: 2, motif: 'home' },
    { id: 'b23', name: 'Three Spaces', description: 'You joined three supportive groups.', theme: 'Community', metric: 'groups', target: 3, motif: 'stars' },
    { id: 'b24', name: 'A Second Share', description: 'You shared two community posts.', theme: 'Community', metric: 'posts', target: 2, motif: 'hands' },
    { id: 'b25', name: 'A Place to Begin', description: 'You joined SAATHI.', theme: 'Community', metric: 'joined', target: 1, motif: 'sunrise' },
  ];

  for (const b of badges) {
    await prisma.badge.upsert({
      where: { id: b.id },
      update: {},
      create: b,
    });
  }

  // 7. Seed Communities & Group Channels (From prototype src/data/saathi.ts)
  const communitiesList = [
    { id: 'loneliness', name: 'Living with loneliness', description: 'A gentle space to feel heard and less alone.', icon: 'heart' },
    { id: 'grief', name: 'Grief & remembrance', description: 'Share memories, loss, and ways of carrying on.', icon: 'flower' },
    { id: 'recovery', name: 'Recovery & healing', description: 'Make room for healing at your own pace.', icon: 'sun' },
    { id: 'family', name: 'Family & social support', description: 'Navigate relationships, boundaries, and care.', icon: 'users' },
    { id: 'case', name: 'Court & case support', description: 'Support through hearings, delays and difficult processes.', icon: 'shield' },
    { id: 'uncertainty', name: 'Dealing with uncertainty', description: 'Finding steadiness during waiting and change.', icon: 'compass' },
    { id: 'hardship', name: 'Rebuilding after hardship', description: 'Small steps forward after a difficult chapter.', icon: 'footprints' },
    { id: 'belonging', name: 'Community & belonging', description: 'Find people who understand the need to belong.', icon: 'home' },
    { id: 'financial', name: 'Financial hardship & recovery', description: 'Share practical encouragement through money pressures.', icon: 'hand-coins' },
    { id: 'difficult', name: 'Safe space for difficult days', description: 'A quieter place to share without pressure.', icon: 'cloud-moon' },
    { id: 'strength', name: 'Finding strength', description: 'A space for encouragement through difficult stretches.', icon: 'sparkles' },
  ];

  for (const c of communitiesList) {
    await prisma.community.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
    // Matching group chat channel
    await prisma.group.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }

  // 8. Seed 20 Users with 3 months (85 days) of calendar check-in history
  const NOTES = {
    GOOD: ['Had a long walk and felt lighter.', 'Laughed a lot with friends today.', 'Finished something I had been putting off.', 'Slept well and the morning felt easy.'],
    OKAY: ['A regular day, nothing big.', 'Busy, but I managed.', 'Felt calm most of the day.', 'Quiet evening, just resting.'],
    LOW: ['Felt tired and a bit far away from people.', 'Did not have much energy today.', 'Missing home a little.', 'A slow, heavy kind of day.'],
    DIFFICULT: ['I have been feeling overwhelmed today.', 'Exams are weighing on me.', 'Hard conversation at home.', 'Could not really settle my thoughts.'],
  };

  const pattern: Mood[] = [
    Mood.GOOD, Mood.OKAY, Mood.OKAY, Mood.LOW, Mood.GOOD, Mood.DIFFICULT,
    Mood.OKAY, Mood.GOOD, Mood.LOW, Mood.OKAY, Mood.GOOD, Mood.GOOD,
    Mood.DIFFICULT, Mood.LOW, Mood.OKAY, Mood.GOOD,
  ];

  const today = new Date();

  for (let u = 1; u <= 20; u++) {
    const userEmail = `user${u}@saathi.org`;
    const user = await prisma.user.upsert({
      where: { email: userEmail },
      update: {},
      create: {
        email: userEmail,
        passwordHash: defaultPasswordHash,
        roles: { create: [{ role: Role.USER }] },
        profile: {
          create: {
            displayName: u === 1 ? 'Aarav' : `Saathi Member ${u}`,
            about: 'Finding space to stay connected.',
            language: u % 2 === 0 ? 'English & Hindi' : 'English',
            communication: 'Both',
          },
        },
        preference: {
          create: {
            reminderEnabled: true,
            reminderTime: '20:00',
            timezone: 'Asia/Kolkata',
          },
        },
      },
    });

    // Check-in history generation (85 days)
    for (let i = 85; i >= 1; i--) {
      // Periodic check-in cadence (skip occasional days realistically)
      if ((i * 3 + u) % 5 === 0) continue;

      const dateObj = new Date(today);
      dateObj.setDate(dateObj.getDate() - i);
      const localDate = isoDate(dateObj);

      const mood = pattern[(i * 7 + u) % pattern.length];
      const noteOptions = NOTES[mood];
      const note = noteOptions[(i + u) % noteOptions.length];

      await prisma.checkIn.upsert({
        where: {
          userId_localDate: {
            userId: user.id,
            localDate,
          },
        },
        update: {},
        create: {
          userId: user.id,
          localDate,
          mood,
          rawChoice: mood === Mood.GOOD ? 'Good' : mood === Mood.OKAY ? 'Okay' : mood === Mood.LOW ? 'Low' : 'Difficult',
          note,
          createdAt: dateObj,
        },
      });
    }

    // Award baseline badges
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: user.id, badgeId: 'b1' } },
      update: {},
      create: { userId: user.id, badgeId: 'b1' },
    });
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: user.id, badgeId: 'b25' } },
      update: {},
      create: { userId: user.id, badgeId: 'b25' },
    });
  }

  // 9. Specific Demonstration Alert User (Creates ATTENTION Alert for Caseworkers)
  const alertUser = await prisma.user.upsert({
    where: { email: 'alert.demo@saathi.org' },
    update: {},
    create: {
      email: 'alert.demo@saathi.org',
      passwordHash: defaultPasswordHash,
      roles: { create: [{ role: Role.USER }] },
      profile: {
        create: {
          displayName: 'Rohan (Demo Alert)',
          about: 'Sharing my journey.',
          language: 'Hindi',
        },
      },
      preference: { create: { timezone: 'Asia/Kolkata' } },
    },
  });

  // Seed 5 consecutive "Difficult" days
  for (let i = 5; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = isoDate(d);

    await prisma.checkIn.upsert({
      where: { userId_localDate: { userId: alertUser.id, localDate: dateStr } },
      update: {},
      create: {
        userId: alertUser.id,
        localDate: dateStr,
        mood: Mood.DIFFICULT,
        rawChoice: 'Difficult',
        note: 'Feeling completely exhausted and isolated. Hard to get through today.',
        createdAt: d,
      },
    });
  }

  // Create WellbeingSignal
  const signal = await prisma.wellbeingSignal.create({
    data: {
      userId: alertUser.id,
      level: SignalLevel.ATTENTION,
      confidence: 0.88,
      signals: ['CONSECUTIVE_DIFFICULT_DAYS', 'ISOLATION_CUE', 'BASELINE_DEVIATION'],
      explanation: 'Recent self-reported activity differs significantly from user 30-day baseline (5 consecutive difficult days recorded).',
      recommendation: 'Gentle check-in from listener or supportive in-app message recommended.',
    },
  });

  // Create Alert for Caseworker Dashboard
  await prisma.alert.create({
    data: {
      userId: alertUser.id,
      signalId: signal.id,
      reason: 'Sustained difficult check-ins over 5 consecutive days',
      status: AlertStatus.NEW,
      assigneeId: caseworker1.id,
      notes: 'Initial alert created. Pending caseworker outreach.',
    },
  });

  console.log('SAATHI seed script completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
