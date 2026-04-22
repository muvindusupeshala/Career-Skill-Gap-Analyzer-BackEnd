const router = require('express').Router();
const protect = require('../middleware/auth');
const { generateJson, generateText } = require('../services/aiStudio');
const Assessment = require('../models/Assessment');
const CareerPath = require('../models/CareerPath');
const LearningResource = require('../models/LearningResource');
const CareerRecommendation = require('../models/CareerRecommendation');
const SkillGap = require('../models/SkillGap');
const Progress = require('../models/Progress');
const AiRecommendationBundle = require('../models/AiRecommendationBundle');
const AiChatSession = require('../models/AiChatSession');

const toObj = (value) => {
  if (!value) return {};
  if (typeof value.toObject === 'function') return value.toObject();
  if (value instanceof Map) return Object.fromEntries(value);
  return value;
};

const normalizeSkills = (skills) => {
  const src = toObj(skills);
  return Object.entries(src).map(([name, level]) => ({
    name,
    level: Number(level || 0),
  }));
};

const buildAssessmentContext = async (userId) => {
  const assessment = await Assessment.findOne({ userId });
  if (!assessment) return null;

  const skills = normalizeSkills(assessment.skills);
  const overall = Number(assessment.overallScore || 0);
  return {
    skills,
    overall,
    gpa: assessment.gpa || '',
    quals: assessment.quals || '',
    source: assessment.source || 'chatbot',
  };
};

const AI_SYSTEM = [
  'You are a career coach assistant for IT undergraduates.',
  'Use only the provided data.',
  'Do not invent fake links, courses, or credentials.',
  'When resources are provided, only select from that list.',
  'Return valid JSON only with no markdown.',
].join(' ');

const calcScore = (userSkills, required) => {
  const keys = Object.keys(required);
  if (keys.length === 0) return 0;
  const total = keys.reduce((sum, skill) => {
    const userLevel = Number(userSkills[skill] || 0);
    const reqLevel = Number(required[skill] || 0);
    if (!reqLevel) return sum;
    return sum + Math.min(userLevel / reqLevel, 1);
  }, 0);
  return Math.round((total / keys.length) * 100);
};

const buildRecommendations = async (userId, assessmentCtx) => {
  const existing = await CareerRecommendation.findOne({ userId });
  if (existing && Array.isArray(existing.recommendations) && existing.recommendations.length > 0) {
    return existing.recommendations;
  }

  const careerPaths = await CareerPath.find();
  const skills = Object.fromEntries((assessmentCtx.skills || []).map((s) => [s.name, s.level]));

  return careerPaths
    .map((path) => {
      const requiredMap = (path.requiredSkills || []).reduce((acc, item) => {
        if (item?.skillName) acc[item.skillName] = item.requiredLevel || 0;
        return acc;
      }, {});
      return { careerTitle: path.title, matchScore: calcScore(skills, requiredMap) };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .map((rec, i) => ({ ...rec, rank: i + 1 }));
};

const buildLocalChatFallback = (message, plan) => {
  const q = String(message || '').toLowerCase();
  const careers = Array.isArray(plan?.careers) ? plan.careers : [];
  const resources = Array.isArray(plan?.resources) ? plan.resources : [];

  const topCareers = careers.slice(0, 3);
  const topResources = resources.slice(0, 6);

  const careerText = topCareers.length
    ? topCareers.map((c, i) => `${i + 1}. ${c.careerTitle} (${c.matchScore}%)`).join('\n')
    : 'No career matches are available yet.';

  const resourceText = topResources.length
    ? topResources.map((r, i) => `${i + 1}. ${r.title} (${r.provider}) - ${r.url}`).join('\n')
    : 'No learning resources are available yet.';

  const firstCareer = topCareers[0];
  const firstResource = topResources[0];

  const hasAny = (...words) => words.some((w) => q.includes(w));

  if (hasAny('hello', 'hi', 'hey', 'who are you')) {
    return {
      reply: `Hi! I am GURU, your career assistant. I can help with career planning, interview prep, learning schedules, projects, CV improvements, and study strategy.\n\nCurrent top role: ${firstCareer ? `${firstCareer.careerTitle} (${firstCareer.matchScore}%)` : 'Not available yet'}\nStarter resource: ${firstResource ? `${firstResource.title} - ${firstResource.url}` : 'Not available yet'}`,
      actionItems: ['Ask for a 7-day plan for your top role', 'Ask for project ideas based on your level'],
      recommendedCareerTitles: topCareers.map((c) => c.careerTitle),
      recommendedResourceIds: topResources.slice(0, 2).map((r) => String(r.resourceId)),
    };
  }

  if (hasAny('interview', 'resume', 'cv', 'linkedin', 'hr', 'behavioral')) {
    return {
      reply: `For job readiness, use this sequence:\n1. Build one strong portfolio project aligned to your target role.\n2. Prepare a concise CV focused on impact (metrics + outcomes).\n3. Practice role-specific interview questions 30 minutes daily.\n4. Improve communication with mock explanations of your projects.\n\nIf you want, I can create a tailored interview prep plan for your target role this week.`,
      actionItems: ['Ask for 20 interview questions for your target role', 'Ask for a CV bullet rewrite using your project details'],
      recommendedCareerTitles: topCareers.map((c) => c.careerTitle),
      recommendedResourceIds: topResources.slice(0, 3).map((r) => String(r.resourceId)),
    };
  }

  if (hasAny('project', 'portfolio', 'build', 'github')) {
    const role = firstCareer?.careerTitle || 'your target role';
    return {
      reply: `Great question. Build projects that prove skills for ${role}:\n1. One end-to-end project with frontend + backend + database.\n2. One data or automation project with measurable output.\n3. Add deployment, tests, and a clear README with architecture.\n\nShare your current level and I can suggest 3 project ideas with step-by-step implementation milestones.`,
      actionItems: ['Ask for beginner/intermediate/advanced project ideas', 'Ask for a project timeline with weekly milestones'],
      recommendedCareerTitles: topCareers.map((c) => c.careerTitle),
      recommendedResourceIds: topResources.slice(0, 4).map((r) => String(r.resourceId)),
    };
  }

  if (hasAny('roadmap', 'plan', 'schedule', 'week', 'month')) {
    return {
      reply: `Use this simple execution framework:\n- Week 1: Strengthen 1 weak core skill and finish one short course module.\n- Week 2: Build a mini project feature using that skill.\n- Week 3: Add testing, documentation, and deployment.\n- Week 4: Review gaps and prepare for interviews.\n\nTop careers now:\n${careerText}`,
      actionItems: ['Ask for a personalized 30-day roadmap', 'Track progress and update plan weekly'],
      recommendedCareerTitles: topCareers.map((c) => c.careerTitle),
      recommendedResourceIds: topResources.slice(0, 4).map((r) => String(r.resourceId)),
    };
  }

  if (q.includes('resource') || q.includes('learn') || q.includes('course')) {
    return {
      reply: `Here are your best learning resources right now:\n${resourceText}`,
      actionItems: ['Pick 1 resource and complete the first module this week', 'Track progress after 7 days'],
      recommendedCareerTitles: topCareers.map((c) => c.careerTitle),
      recommendedResourceIds: topResources.map((r) => String(r.resourceId)),
    };
  }

  if (q.includes('career') || q.includes('recommend')) {
    return {
      reply: `These are your top career recommendations:\n${careerText}`,
      actionItems: ['Focus on top 1 career path', 'Close 2 key skill gaps this month'],
      recommendedCareerTitles: topCareers.map((c) => c.careerTitle),
      recommendedResourceIds: topResources.slice(0, 3).map((r) => String(r.resourceId)),
    };
  }

  return {
    reply: `I can answer both career-specific and general professional growth questions.\n\nFor your question: "${String(message || '').slice(0, 160)}"\n\nBased on your profile, this is a strong next move:\nTop careers:\n${careerText}\n\nTop resources:\n${resourceText}\n\nAsk me for: interview prep, project ideas, CV improvement, study schedules, or skill troubleshooting.`,
    actionItems: ['Ask one specific goal for this week', 'Request a detailed next-step plan'],
    recommendedCareerTitles: topCareers.map((c) => c.careerTitle),
    recommendedResourceIds: topResources.slice(0, 4).map((r) => String(r.resourceId)),
  };
};

const getOrGeneratePlan = async (userId, refresh = false) => {
  const assessment = await Assessment.findOne({ userId });
  if (!assessment) {
    const err = new Error('Assessment required before generating AI plan.');
    err.statusCode = 404;
    throw err;
  }

  if (!refresh) {
    const existingPlan = await AiRecommendationBundle.findOne({ userId });
    if (existingPlan) return existingPlan;
  }

  const assessmentCtx = await buildAssessmentContext(userId);
  const recommendations = await buildRecommendations(userId, assessmentCtx);
  const resourceDocs = await LearningResource.find().limit(600);

  const weakSkills = (assessmentCtx.skills || []).filter((s) => s.level < 2).map((s) => s.name);
  const topRecs = recommendations.slice(0, 8);

  const resourceList = resourceDocs.map((r) => ({
    resourceId: String(r._id),
    title: r.title,
    skill: r.skill,
    provider: r.provider,
    free: r.free,
    type: r.type,
    url: r.url,
  }));

  const fallback = {
    overview: 'Focus first on the top 2 career options and close weak core skills with short, practical courses.',
    careers: topRecs.slice(0, 5).map((r) => ({
      careerTitle: r.careerTitle,
      matchScore: r.matchScore,
      reason: 'Good alignment with your current skill profile.',
      prioritySkills: weakSkills.slice(0, 3),
    })),
    resources: resourceList.slice(0, 10).map((r) => ({
      resourceId: r.resourceId,
      reason: `Useful for improving ${r.skill || 'core skills'}.`,
    })),
  };

  const aiPlan = await generateJson({
    systemPrompt: AI_SYSTEM,
    userPrompt: `Assessment: ${JSON.stringify(assessmentCtx)}\nRanked careers: ${JSON.stringify(topRecs)}\nWeak skills: ${JSON.stringify(weakSkills)}\nAvailable resources (must only pick from this list): ${JSON.stringify(resourceList)}\nReturn JSON with keys: overview(string), careers(array max 6: {careerTitle:string, matchScore:number, reason:string, prioritySkills:string[]}), resources(array max 12: {resourceId:string, reason:string}).`,
    fallback,
  });

  const careersByTitle = new Map(topRecs.map((r) => [r.careerTitle, r]));
  const resourcesById = new Map(resourceList.map((r) => [r.resourceId, r]));

  const normalizedCareers = (Array.isArray(aiPlan.careers) ? aiPlan.careers : [])
    .map((c) => {
      const base = careersByTitle.get(c.careerTitle);
      if (!base) return null;
      return {
        careerTitle: base.careerTitle,
        matchScore: Number(c.matchScore ?? base.matchScore ?? 0),
        reason: c.reason || 'Good fit for your profile.',
        prioritySkills: Array.isArray(c.prioritySkills) ? c.prioritySkills.slice(0, 5) : [],
      };
    })
    .filter(Boolean)
    .slice(0, 6);

  const normalizedResources = (Array.isArray(aiPlan.resources) ? aiPlan.resources : [])
    .map((r) => {
      const base = resourcesById.get(String(r.resourceId || ''));
      if (!base) return null;
      return {
        resourceId: base.resourceId,
        title: base.title,
        skill: base.skill,
        provider: base.provider,
        url: base.url,
        reason: r.reason || `Useful for ${base.skill || 'your goal'}.`,
      };
    })
    .filter(Boolean)
    .slice(0, 12);

  const upserted = await AiRecommendationBundle.findOneAndUpdate(
    { userId },
    {
      userId,
      assessmentId: assessment._id,
      overview: aiPlan.overview || fallback.overview,
      careers: normalizedCareers,
      resources: normalizedResources,
      generatedAt: new Date(),
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return upserted;
};

router.get('/plan', protect, async (req, res) => {
  try {
    const refresh = String(req.query.refresh || '').toLowerCase() === 'true';
    const plan = await getOrGeneratePlan(req.user.id, refresh);
    res.json(plan);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

router.get('/chat/history', protect, async (req, res) => {
  try {
    const session = await AiChatSession.findOne({ userId: req.user.id });
    const plan = await AiRecommendationBundle.findOne({ userId: req.user.id });
    res.json({
      messages: session?.messages || [],
      plan: plan || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/chat/history', protect, async (req, res) => {
  try {
    await AiChatSession.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { messages: [] } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ ok: true, message: 'Chat history cleared.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/chat', protect, async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(400).json({ message: 'Message is required.' });

    const [assessmentCtx, plan] = await Promise.all([
      buildAssessmentContext(req.user.id),
      getOrGeneratePlan(req.user.id, false),
    ]);

    if (!assessmentCtx) {
      return res.status(404).json({ message: 'Complete assessment first to use AI chat.' });
    }

    const session = await AiChatSession.findOne({ userId: req.user.id });
    const recentMessages = (session?.messages || []).slice(-8);

    const fallback = buildLocalChatFallback(message, plan);

    const aiReply = await generateText({
      systemPrompt: [
        'You are GURU, a practical and intelligent career assistant.',
        'Answer clearly and specifically for the user question.',
        'You can answer general professional questions too (interviews, communication, planning, learning strategy), not only career list queries.',
        'Prefer concise, actionable steps.',
        'If recommending resources, only use provided resources.',
      ].join(' '),
      userPrompt: `User message: ${message}\nAssessment: ${JSON.stringify(assessmentCtx)}\nSaved AI plan: ${JSON.stringify({ overview: plan.overview, careers: plan.careers, resources: plan.resources })}\nRecent chat: ${JSON.stringify(recentMessages)}\nRespond in plain text with a short explanation and 3-6 actionable bullets when useful.`,
      fallback: fallback.reply,
    });

    const careerMap = new Map((plan.careers || []).map((c) => [c.careerTitle, c]));
    const resourceMap = new Map((plan.resources || []).map((r) => [String(r.resourceId), r]));

    const selectedCareers = (Array.isArray(fallback.recommendedCareerTitles) ? fallback.recommendedCareerTitles : [])
      .map((title) => careerMap.get(title))
      .filter(Boolean)
      .slice(0, 4);

    const selectedResources = (Array.isArray(fallback.recommendedResourceIds) ? fallback.recommendedResourceIds : [])
      .map((id) => resourceMap.get(String(id)))
      .filter(Boolean)
      .slice(0, 6);

    const saved = await AiChatSession.findOneAndUpdate(
      { userId: req.user.id },
      {
        $push: {
          messages: {
            $each: [
              { role: 'user', content: message, createdAt: new Date() },
              { role: 'assistant', content: aiReply || fallback.reply, createdAt: new Date() },
            ],
            $slice: -60,
          },
        },
        $set: { lastBundleAt: plan.generatedAt || new Date() },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      reply: aiReply || fallback.reply,
      actionItems: Array.isArray(fallback.actionItems) ? fallback.actionItems.slice(0, 5) : [],
      recommendedCareers: selectedCareers,
      recommendedResources: selectedResources,
      messages: saved.messages,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

router.get('/career-recommendation', protect, async (req, res) => {
  try {
    const [assessmentCtx, recommendation] = await Promise.all([
      buildAssessmentContext(req.user.id),
      CareerRecommendation.findOne({ userId: req.user.id }),
    ]);

    if (!assessmentCtx || !recommendation) {
      return res.status(404).json({ message: 'Assessment and recommendations are required first.' });
    }

    const topThree = (recommendation.recommendations || []).slice(0, 3);
    const fallback = {
      summary: 'Your strongest current fit is based on practical overlap between your present skills and career requirements.',
      strengths: [],
      focusAreas: [],
      nextStep: 'Use Skill Gap Analysis to close your highest-impact missing skills first.',
    };

    const ai = await generateJson({
      systemPrompt: AI_SYSTEM,
      userPrompt: `User assessment: ${JSON.stringify(assessmentCtx)}\nTop recommendations: ${JSON.stringify(topThree)}\nReturn JSON with keys: summary(string), strengths(string[]), focusAreas(string[]), nextStep(string).`,
      fallback,
    });

    res.json(ai);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/career-path/:title', protect, async (req, res) => {
  try {
    const [assessmentCtx, career] = await Promise.all([
      buildAssessmentContext(req.user.id),
      CareerPath.findOne({ title: req.params.title }),
    ]);

    if (!assessmentCtx || !career) {
      return res.status(404).json({ message: 'Assessment and valid career path are required.' });
    }

    const fallback = {
      fitSummary: 'This career is a potential fit if you improve the required skills where your current level is lower.',
      readinessLabel: 'Developing',
      topMissingSkills: [],
      plan: [],
    };

    const ai = await generateJson({
      systemPrompt: AI_SYSTEM,
      userPrompt: `Assessment: ${JSON.stringify(assessmentCtx)}\nCareer path: ${JSON.stringify(career)}\nReturn JSON with keys: fitSummary(string), readinessLabel(string), topMissingSkills(string[]), plan(string[] max 4).`,
      fallback,
    });

    res.json(ai);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/skill-gap/:careerTitle', protect, async (req, res) => {
  try {
    const [assessmentCtx, gap] = await Promise.all([
      buildAssessmentContext(req.user.id),
      SkillGap.findOne({ userId: req.user.id, targetCareer: req.params.careerTitle }),
    ]);

    if (!assessmentCtx || !gap) {
      return res.status(404).json({ message: 'Generate skill gap first for this career.' });
    }

    const importantGaps = (gap.gaps || []).filter((g) => (g.gap || 0) > 0).slice(0, 5);
    const fallback = {
      prioritySummary: 'Close the largest gaps first to improve readiness quickly.',
      milestones: [],
      weeklyPlan: [],
    };

    const ai = await generateJson({
      systemPrompt: AI_SYSTEM,
      userPrompt: `Assessment: ${JSON.stringify(assessmentCtx)}\nSkill gap: ${JSON.stringify({ targetCareer: gap.targetCareer, readinessScore: gap.readinessScore, gaps: importantGaps })}\nReturn JSON with keys: prioritySummary(string), milestones(string[]), weeklyPlan(string[] max 4).`,
      fallback,
    });

    res.json(ai);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/learning-resources', protect, async (req, res) => {
  try {
    const plan = await getOrGeneratePlan(req.user.id, false);
    res.json({
      summary: plan.overview,
      picks: plan.resources,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

router.get('/progress', protect, async (req, res) => {
  try {
    const progressRows = await Progress.find({ userId: req.user.id }).sort({ createdAt: 1 });
    if (!Array.isArray(progressRows) || progressRows.length === 0) {
      return res.status(404).json({ message: 'No progress history found yet.' });
    }

    const first = progressRows[0];
    const last = progressRows[progressRows.length - 1];
    const delta = {
      overall: Number((last.overall || 0) - (first.overall || 0)),
      programming: Number((last.programming || 0) - (first.programming || 0)),
      data: Number((last.data || 0) - (first.data || 0)),
      infra: Number((last.infra || 0) - (first.infra || 0)),
      softSkills: Number((last.softSkills || 0) - (first.softSkills || 0)),
    };

    const fallback = {
      summary: 'Your progress trend is measurable; keep reinforcing the fastest-growing areas while focusing one weak area each week.',
      beforeVsAfter: [
        `Overall: ${first.overall || 0}% -> ${last.overall || 0}%`,
      ],
      nextFocus: [],
    };

    const ai = await generateJson({
      systemPrompt: AI_SYSTEM,
      userPrompt: `First snapshot: ${JSON.stringify(first)}\nLatest snapshot: ${JSON.stringify(last)}\nDelta: ${JSON.stringify(delta)}\nReturn JSON with keys: summary(string), beforeVsAfter(string[]), nextFocus(string[] max 4).`,
      fallback,
    });

    res.json({
      ...ai,
      delta,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
