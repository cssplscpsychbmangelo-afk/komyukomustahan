/* ============================================================
   SUPERPOWER: What Would You Do If You Could?
   Kumustahan activity — power data, questions, and the reveal math.

   Everything is client-side. No tracking, no accounts, no network.
   Exposed as window.SUPERPOWERS (also importable in Node for the
   static card renderer).
   ============================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SUPERPOWERS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ---------- the three questions ---------- */

  const QUESTIONS = [
    {
      id: 'q1',
      kicker: 'Question One',
      prompt: 'If you could change one thing in your life right now, what would it be?',
      short: 'What I would change',
      options: [
        { key: 'A', value: 0, label: 'Protect myself and the people I care about.' },
        { key: 'B', value: 1, label: 'Change something unfair in the world.' },
        { key: 'C', value: 2, label: 'Understand people and be understood.' },
        { key: 'D', value: 3, label: 'Find peace and escape from overwhelming situations.' }
      ]
    },
    {
      id: 'q2',
      kicker: 'Question Two',
      prompt: 'What do you think people need the most today?',
      short: 'What people need',
      options: [
        { key: 'A', value: 0, label: 'Safety and protection.' },
        { key: 'B', value: 1, label: 'Justice and freedom.' },
        { key: 'C', value: 2, label: 'Healing and compassion.' },
        { key: 'D', value: 3, label: 'Hope and solidarity.' }
      ]
    },
    {
      id: 'q3',
      kicker: 'Question Three',
      prompt: 'If you could give yourself one gift, what would it be?',
      short: 'The gift I would give myself',
      options: [
        { key: 'A', value: 0, label: 'Courage to face anything.' },
        { key: 'B', value: 1, label: 'The ability to make things right.' },
        { key: 'C', value: 2, label: 'The chance to start over.' },
        { key: 'D', value: 3, label: 'The strength to keep going.' }
      ]
    }
  ];

  /* ---------- the 16 powers ----------
     n     : index on the card (01…16)
     name  : in-world codename
     title : "The ___" epithet
     domain: one-word element
     desc  : what the power does (activity text, verbatim)
     vision: visualization line (activity text, verbatim)
     c1/c2/c3 : RGB triples used by the card renderer
                    c1 = core light, c2 = mid aura, c3 = deep field
     sigil : key in sigils.js
  ------------------------------------- */

  const POWERS = [
    {
      n: 1, key: 'aegis', name: 'AEGIS', title: 'The Shield of Protection',
      domain: 'PROTECTION', sigil: 'shield',
      desc: 'Create an invisible barrier that protects people from harm, abuse, and danger.',
      vision: 'A golden energy shield expanding around people who need protection.',
      c1: [255, 214, 140], c2: [214, 150, 62], c3: [58, 34, 12]
    },
    {
      n: 2, key: 'chronos', name: 'CHRONOS', title: 'The Keeper of Time',
      domain: 'TIME', sigil: 'clock',
      desc: 'Pause, rewind, or slow down time to make room for rest, reflection, and second chances.',
      vision: 'Blue clock fragments floating around a person with frozen raindrops.',
      c1: [168, 214, 255], c2: [86, 148, 224], c3: [14, 32, 62]
    },
    {
      n: 3, key: 'vitalis', name: 'VITALIS', title: 'The Healer',
      domain: 'HEALING', sigil: 'bloom',
      desc: 'Heal emotional wounds, ease suffering, and help people recover.',
      vision: 'Warm green and pink light flowing from the hands, surrounded by glowing butterflies.',
      c1: [168, 244, 184], c2: [104, 196, 158], c3: [18, 52, 44]
    },
    {
      n: 4, key: 'sonora', name: 'SONORA', title: 'The Voice of the Voiceless',
      domain: 'EXPRESSION', sigil: 'wave',
      desc: 'Amplify unheard voices and make people listen to those who are often ignored.',
      vision: 'Radiating golden sound waves spreading across a dark crowd.',
      c1: [255, 199, 128], c2: [226, 138, 72], c3: [56, 30, 14]
    },
    {
      n: 5, key: 'verdant', name: 'VERDANT', title: 'The Life Bringer',
      domain: 'RENEWAL', sigil: 'sprout',
      desc: 'Restore what has been damaged and help people and communities flourish again.',
      vision: 'Flowers and vines growing wherever the superhero walks.',
      c1: [186, 246, 160], c2: [110, 200, 108], c3: [20, 52, 28]
    },
    {
      n: 6, key: 'warp', name: 'WARP', title: 'The Space Walker',
      domain: 'FREEDOM', sigil: 'portal',
      desc: 'Travel anywhere instantly, whether to safety, opportunity, or a place of peace.',
      vision: 'A violet portal opening with stars and swirling cosmic particles.',
      c1: [206, 168, 255], c2: [138, 92, 226], c3: [34, 18, 64]
    },
    {
      n: 7, key: 'veritas', name: 'VERITAS', title: 'The Truth Seeker',
      domain: 'TRUTH', sigil: 'eye',
      desc: 'Reveal lies, expose manipulation, and uncover what others try to hide.',
      vision: 'A glowing golden eye surrounded by floating symbols and shattered illusions.',
      c1: [255, 229, 158], c2: [210, 168, 74], c3: [52, 40, 16]
    },
    {
      n: 8, key: 'ignis', name: 'IGNIS', title: 'The Phoenix Spirit',
      domain: 'RESILIENCE', sigil: 'phoenix',
      desc: 'Rise again after every setback and inspire others to do the same.',
      vision: 'Fiery phoenix wings emerging from a person surrounded by embers.',
      c1: [255, 176, 118], c2: [230, 96, 56], c3: [64, 20, 14]
    },
    {
      n: 9, key: 'nexus', name: 'NEXUS', title: 'The Unifier',
      domain: 'SOLIDARITY', sigil: 'weave',
      desc: 'Connect people, build understanding, and unite individuals toward a common cause.',
      vision: 'Glowing golden threads connecting people across a city.',
      c1: [255, 214, 148], c2: [222, 158, 84], c3: [46, 36, 20]
    },
    {
      n: 10, key: 'aether', name: 'AETHER', title: 'The Free Spirit',
      domain: 'LIBERATION', sigil: 'wing',
      desc: 'Break invisible barriers and free yourself and others from limiting circumstances.',
      vision: 'A person flying through clouds with translucent blue wings.',
      c1: [178, 232, 255], c2: [104, 176, 236], c3: [16, 40, 60]
    },
    {
      n: 11, key: 'empathia', name: 'EMPATHIA', title: 'The Heart Reader',
      domain: 'EMPATHY', sigil: 'heart',
      desc: 'Understand what others feel and recognize struggles that remain unseen.',
      vision: 'Glowing hearts and colorful emotional waves surrounding the superhero.',
      c1: [255, 190, 214], c2: [228, 118, 166], c3: [58, 20, 42]
    },
    {
      n: 12, key: 'volt', name: 'VOLT', title: 'The Unstoppable Force',
      domain: 'COURAGE', sigil: 'bolt',
      desc: 'Gain extraordinary strength and courage to confront challenges and defend others.',
      vision: 'Blue lightning surging through the superhero’s arms and body.',
      c1: [168, 204, 255], c2: [92, 142, 240], c3: [16, 28, 62]
    },
    {
      n: 13, key: 'atlas', name: 'ATLAS', title: 'The World Mover',
      domain: 'ACTION', sigil: 'monolith',
      desc: 'Move obstacles, rebuild damaged spaces, and turn impossible tasks into achievable ones.',
      vision: 'Floating stones and structures moving through green energy.',
      c1: [176, 240, 208], c2: [98, 194, 156], c3: [18, 48, 42]
    },
    {
      n: 14, key: 'oracle', name: 'ORACLE', title: 'The Future Seer',
      domain: 'WISDOM', sigil: 'thread',
      desc: 'See possible futures and make decisions that create better outcomes.',
      vision: 'Multiple glowing timelines branching out from a person’s hands.',
      c1: [190, 212, 255], c2: [126, 150, 232], c3: [22, 28, 56]
    },
    {
      n: 15, key: 'lumen', name: 'LUMEN', title: 'The Hope Keeper',
      domain: 'HOPE', sigil: 'star',
      desc: 'Restore hope and give people a reason to keep moving forward.',
      vision: 'A radiant light illuminating a dark landscape, with stars appearing in its wake.',
      c1: [255, 240, 196], c2: [238, 200, 116], c3: [48, 40, 22]
    },
    {
      n: 16, key: 'nova', name: 'NOVA', title: 'The Reality Shaper',
      domain: 'TRANSFORMATION', sigil: 'nova',
      desc: 'Reshape reality, challenge existing limitations, and create possibilities that did not exist before.',
      vision: 'A purple cosmic energy field transforming a broken landscape into a new world.',
      c1: [228, 178, 255], c2: [166, 102, 240], c3: [40, 16, 64]
    }
  ];

  /* ---------- the reveal math ----------
     Assign A=0, B=1, C=2, D=3.
     Power Index = 1 + ((5·Q1 + 3·Q2 + 7·Q3) mod 16)
     64 combinations -> 16 powers.
  -------------------------------------- */

  const VALUE = { A: 0, B: 1, C: 2, D: 3 };

  function weights(answers) {
    // answers: { q1:'A'|'B'|'C'|'D', q2:…, q3:… }
    const a = answers || {};
    return {
      q1: VALUE[a.q1] ?? 0,
      q2: VALUE[a.q2] ?? 0,
      q3: VALUE[a.q3] ?? 0
    };
  }

  function powerIndex(answers) {
    const { q1, q2, q3 } = weights(answers);
    return 1 + (((5 * q1 + 3 * q2 + 7 * q3) % 16) + 16) % 16;
  }

  function powerFor(answers) {
    return POWERS[powerIndex(answers) - 1];
  }

  /* how many of the 64 combinations land on each power (3–5, not uniform) */
  function odds() {
    const out = {};
    POWERS.forEach(p => { out[p.key] = 0; });
    ['A', 'B', 'C', 'D'].forEach(q1 =>
      ['A', 'B', 'C', 'D'].forEach(q2 =>
        ['A', 'B', 'C', 'D'].forEach(q3 => {
          out[powerFor({ q1, q2, q3 }).key] += 1;
        })));
    return out;
  }

  function comboOf(answers) {
    return `${answers.q1 || '·'}${answers.q2 || '·'}${answers.q3 || '·'}`;
  }

  /* ---------- copy used across the page ---------- */

  const COPY = {
    title: 'SUPERPOWER',
    subtitle: 'What Would You Do If You Could?',
    length: 'Kumustahan Activity · 10–15 minutes',
    spiel: [
      'Imagine waking up tomorrow with a superpower.',
      'Not just any superpower, but one that reflects what you need, what you value, and what you wish you could change in the world today.',
      'Maybe you want to protect someone. Maybe you want to escape from everything for a while. Maybe you want to fight injustice, heal people, or simply have enough time to breathe.',
      'In this activity, you will answer three simple questions. Your answers will be combined to reveal a superpower that you will carry for the rest of this activity.',
      'Once you discover your power, think about this:',
      'If you had this power today, where would you use it, who would you use it for, and what would you change?',
      'There are no wrong answers. Your power is yours to define.'
    ],
    question: 'There are no wrong answers. Choose the answer that feels truest today.',
    processing: 'Your answers have been processed.',
    reveal: 'Your choices have revealed something about the power you carry. But remember, a superpower is only as meaningful as the way you choose to use it.',
    reflectionIntro: 'Set a timer for one to two minutes. Complete these statements — for your own life, and for the world we live in.',
    reflectionFields: [
      'My superpower is',
      'I would use it in',
      'I need this power because',
      'If I could change one thing using this power, it would be'
    ],
    twist: 'After discovering your superpower, what is one thing you can already do today without having that power?',
    closing: 'Maybe we cannot stop time, heal every wound, rewrite reality, or protect everyone from everything. But we can choose to listen, speak up, help someone, stand with others, and make things a little better. Sometimes, the world doesn’t need another superhero. It needs ordinary people who refuse to be indifferent.'
  };

  return { QUESTIONS, POWERS, VALUE, COPY, weights, powerIndex, powerFor, odds, comboOf };
});
