// src/lib/tasks.js

// requirement.kind:
//  - "min_stake"       → يحتاج Staking بحد أدنى ETH
//  - "presale_min_hr"  → يحتاج شراء HR من البري سيل
//  - "min_onchain_xp"  → يحتاج XP on-chain (من عقد الستيك)  ❌ (مش رح نستخدمه للمهمة هاي)
//  - "min_profile_xp"  → يحتاج XP من البروفايل (off-chain XP من /xp/profile)
//  - "none"            → بدون شرط (بس لازم المحفظة تكون متصلة)

export const TASKS = [
  // 1 ) XP MILESTONE ////////////////

  // الشرط: 10 XP من /xp/
  {
    id: "xp_10_onchain",
    title: "Reach 10 profile XP",
    description:
      "Reach at least 10 XP in your HeatRush profile from daily tank, tasks and referrals.",
    points: 5,
    xp: 1,
    tag: "Profile • Milestone",
    type: "onchain",
    requirement: {
      kind: "min_profile_xp",
      minXp: 10, // الشرط: 10 XP من /xp/profile
    },
    link: "/profile",
    icon: "target",
  },

  // الشرط: 30 XP من /xp/
  {
    id: "xp_30_onchain",
    title: "Reach 30 profile XP",
    description:
      "Reach at least 30 XP in your HeatRush profile from daily tank, tasks and referrals.",
    points: 25,
    xp: 2,
    tag: "Profile • Milestone",
    type: "onchain",
    requirement: {
      kind: "min_profile_xp",
      minXp: 30, // الشرط: 30 XP من /xp/profile
    },
    link: "/profile",
    icon: "target",
  },

  // الشرط: 300 XP من /xp/
  {
    id: "xp_300_onchain",
    title: "Reach 300 profile XP",
    description:
      "Reach at least 300 XP in your HeatRush profile from daily tank, tasks and referrals.",
    points: 50,
    xp: 4,
    tag: "Profile • Milestone",
    type: "onchain",
    requirement: {
      kind: "min_profile_xp",
      minXp: 300, // الشرط: 300 XP من /xp/profile
    },
    link: "/profile",
    icon: "target",
  },






  // 2) ON-CHAIN ////////////////////

  //  STAKING 0.0001 ETH
  {
    id: "stake_0_0001_eth",
    title: "Stake at least 0.0001 ETH",
    description:
      "Lock 0.0001 ETH or more into HeatRush staking on Base to prove real on-chain commitment.",
    points: 300,
    xp: 6,
    tag: "On-chain • Staking",
    type: "onchain",
    requirement: {
      kind: "min_stake",
      valueEth: 0.0001,
    },
    link: "/staking",
    icon: "flame",
  },

  //  STAKING 0.001 ETH
  {
    id: "stake_0_001_eth",
    title: "Stake at least 0.0001 ETH",
    description:
      "Lock 0.001 ETH or more into HeatRush staking on Base to prove real on-chain commitment.",
    points: 400,
    xp: 14,
    tag: "On-chain • Staking",
    type: "onchain",
    requirement: {
      kind: "min_stake",
      valueEth: 0.001,
    },
    link: "/staking",
    icon: "flame",
  },

  // • STAKING 0.1 ETH
  {
    id: "stake_0_1_eth",
    title: "Stake at least 0.1 ETH",
    description:
      "Lock 0.1 ETH or more into HeatRush staking on Base to prove real on-chain commitment.",
    points: 1000,
    xp: 60,
    tag: "On-chain • Staking",
    type: "onchain",
    requirement: {
      kind: "min_stake",
      valueEth: 0.1,
    },
    link: "/staking",
    icon: "flame",
  },

  // • STAKING 0.2 ETH
  {
    id: "stake_0_2_eth",
    title: "Stake at least 0.2 ETH",
    description:
      "Lock 0.2 ETH or more into HeatRush staking on Base to prove real on-chain commitment.",
    points: 2000,
    xp: 200,
    tag: "On-chain • Staking",
    type: "onchain",
    requirement: {
      kind: "min_stake",
      valueEth: 0.2,
    },
    link: "/staking",
    icon: "flame",
  },

  //  • PRESALE 1 HR
  {
    id: "join_presale_once10",
    title: "Join the Public Presale",
    description:
      "Buy into the HeatRush public presale on Base and lock in your HR allocation before TGE.",
    points: 100,
    xp: 10,
    tag: "On-chain • Presale",
    type: "onchain",
    requirement: {
      kind: "presale_min_hr",
      minHr: 10, // يعني لازم totalHrFor >= 1 HR (رقم رمزي بسيط)
    },
    link: "/presale",
    icon: "coins",
  },

  //  • PRESALE 50 HR
  {
    id: "join_presale_once50",
    title: "Join the Public Presale",
    description:
      "Buy at least 50 HR in the HeatRush public presale on Base to unlock this quest.",
    points: 350,
    xp: 30,
    tag: "On-chain • Presale",
    type: "onchain",
    requirement: {
      kind: "presale_min_hr",
      minHr: 100, // يعني لازم totalHrFor >= 50 HR (رقم رمزي بسيط)
    },
    link: "/presale",
    icon: "coins",
  },




  // 3) SOCIAL / COMMUNITY ////////////////

  // follow_x_
  {
    id: "follow_x_main",
    title: "Follow HeatRush on X",
    description:
      "Follow the official HeatRush account on X to stay ahead of drops, updates, and ecosystem news.",
    points: 50,
    xp: 1,
    tag: "Community • Social",
    type: "social",
    requirement: {
      kind: "none",
    },
    link: "https://x.com/Rush_finance",
    icon: "twitter",
  },

  //  join_telegram
  {
    id: "join_telegram",
    title: "Join the official HeatRush Telegram",
    description:
      "Join the official HeatRush Telegram channel to stay on top of announcements.",
    points: 50,
    xp: 1,
    tag: "Community • Social",
    type: "social",
    requirement: {
      kind: "none",
    },
    link: "https://web.telegram.org/k/#@Heat_rush",
    icon: "telegram",
  },

  //  follow_and_retweet_x (الأول)
  {
    id: "follow_and_retweet_x",
    title: "Like & retweet",
    description:
      "Follow the official HeatRush account on X and retweet the main campaign post to boost the signal.",
    points: 50,
    xp: 1,
    tag: "Community • Social",
    type: "social",
    requirement: {
      kind: "none",
    },
    link: "https://x.com/Rush_finance/status/1992886251905520074?s=20",
    icon: "x",
  },

  //  follow_and_retweet_x (الثاني – للتويتة الجديدة)
  {
    id: "Like & Retweet HeatRush on X",
    title: "Like & Retweet",
    description:
      "Like and retweet the latest HeatRush campaign post on X to boost the signal and support the ecosystem.",
    points: 50,
    xp: 1,
    tag: "Community • Social",
    type: "social",
    requirement: {
      kind: "none",
    },
    link: "https://x.com/Rush_finance/status/1995578533389979668?s=20",
    icon: "twitter",
  },





  // 4 ) SYSTEM / OFF-CHAIN ////////////////

  // • READ FULL DASHBOARD
  {
    id: "read_full_dashboard",
    title: "Explore your full dashboard",
    description:
      "Open the Dashboard and review your staking, airdrop, and presale status.",
    points: 100,
    xp: 0,
    tag: "System • Overview",
    type: "system",
    requirement: {
      kind: "none",
    },
    link: "/dashboard",
    icon: "dashboard",
  },
];
