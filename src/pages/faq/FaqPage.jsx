// src/pages/faq/FaqPage.jsx
import React from "react";
import "../../styles/faq.css";

const FaqPage = () => {
  return (
    <div className="faq-page">
      {/* HEADER */}
      <div className="faq-header">
        <h1 className="faq-title">FAQ & Help Center</h1>
        <p className="faq-subtitle">
          Quick answers to the most common questions about HeatRush, airdrop,
          presale, staking, XP and referrals.
        </p>
      </div>

      {/* SECTION: GENERAL */}
      <section className="faq-section">
        <h2 className="faq-section-title">General</h2>

        <div className="faq-item">
          <h3 className="faq-question">What is HeatRush?</h3>
          <p className="faq-answer">
            HeatRush is a next-generation Web3 platform that gamifies user
            engagement through tasks, NFT ownership, and token incentives. Built
            on Base Network and powered by OP Stack, HeatRush also integrates
            AI-powered project analysis to unlock investment opportunities for
            its users.
          </p>
        </div>

        <div className="faq-item">
          <h3 className="faq-question">Which network does HeatRush use?</h3>
          <p className="faq-answer">
            HeatRush runs on Base Mainnet. Make sure your wallet is connected to
            Base before staking, joining the presale, or claiming HR.
          </p>
        </div>
      </section>

      {/* SECTION: AIRDROP & TGE */}
      <section className="faq-section">
        <h2 className="faq-section-title">Airdrop & TGE</h2>

        <div className="faq-item">
          <h3 className="faq-question">
            What is the airdrop snapshot shown on the Airdrop page?
          </h3>
          <p className="faq-answer">
            The airdrop snapshot is a fixed record of points you earned during
            the campaign phase. These points are converted into a base HR
            allocation (hr_base) which you can later unlock faster by staking
            more ETH or reaching higher tiers.
          </p>
        </div>

        <div className="faq-item">
          <h3 className="faq-question">
            TGE is live. What does &quot;your HR is unlocking over time&quot; mean?
          </h3>
          <p className="faq-answer">
            It means HR doesn&apos;t unlock all at once. Your allocation
            unlocks gradually based on the global unlock schedule and your
            stake/tier. The more committed your position, the stronger your
            unlock.
          </p>
        </div>

        {/* Q: Why am I not eligible in the snapshot check? (EN) */}
        <div className="faq-item">
          <h3 className="faq-question">
            Why am I not eligible in the snapshot check?
          </h3>
          <p className="faq-answer">
            If the Airdrop page shows that you are not eligible, it means your
            wallet did not appear in the original campaign snapshot or it
            violated the campaign rules. You can still earn HR points through
            staking, the public presale, and future campaigns.
          </p>
        </div>

        {/* نفس السؤال بالعربي */}
        <div className="faq-item">
          <h3 className="faq-question">
           Q: Why am I not eligible in the snapshot check?

            </h3>
          <p className="faq-answer">
            A: If the Airdrop page shows that you are not eligible, 
            it means your wallet did not appear in the original campaign snapshot or 
            it violated the campaign rules. 
            You can still earn HR point
          </p>
        </div>
      </section>

      {/* SECTION: PRESALE */}
      <section className="faq-section">
        <h2 className="faq-section-title">Presale</h2>

        <div className="faq-item">
          <h3 className="faq-question">How does the public presale work?</h3>
          <p className="faq-answer">
            You send ETH on Base to the presale contract using the Presale page.
            In return, you receive an on-chain HR allocation at a fixed rate.
            Your total allocation and claimable HR are always visible and
            verifiable on-chain.
          </p>
        </div>

        <div className="faq-item">
          <h3 className="faq-question">
            I joined the presale but my quest is still locked. Why?
          </h3>
          <p className="faq-answer">
            Presale quests check your total HR from the presale (totalHrFor).
            If your allocation is below the required threshold (for example 1 HR
            or 50 HR), the quest will stay locked until you reach that minimum.
          </p>
        </div>
      </section>

      {/* SECTION: STAKING & XP */}
      <section className="faq-section">
        <h2 className="faq-section-title">Staking, XP & Tasks</h2>

        <div className="faq-item">
          <h3 className="faq-question">
            What&apos;s the difference between Points and XP?
          </h3>
          <p className="faq-answer">
            Points are your campaign score used for airdrops and internal
            leaderboards. XP measures how deeply you&apos;re engaged with
            HeatRush (staking, tasks, referrals, daily tank, etc.) and is used
            for profile milestones and unlock logic.
          </p>
        </div>

        <div className="faq-item">
          <h3 className="faq-question">What is the Daily Tank?</h3>
          <p className="faq-answer">
            The Daily Tank is a once-per-24-hours claim on the Tasks page. When
            you claim it, you receive off-chain Points and XP, which are stored
            in the XP backend and displayed in your profile.
          </p>
        </div>
      </section>

      {/* SECTION: REFERRALS (محدث بالكامل) */}
      <section className="faq-section">
        <h2 className="faq-section-title">Referrals</h2>

        <div className="faq-item">
          <h3 className="faq-question">How do referrals work?</h3>
          <p className="faq-answer">
            You generate a unique referral code on the Referral page. When
            someone new joins HeatRush using that code, they become your
            referral. Once they meet a qualifying condition (staking, presale,
            or XP), the referral turns into a qualified referral and you earn
            rewards.
          </p>
        </div>

        <div className="faq-item">
          <h3 className="faq-question">What counts as a qualified referral?</h3>
          <p className="faq-answer">
            A referral becomes qualified when the referee:
          </p>
          <ul className="faq-answer-list">
            <li>Stakes enough ETH</li>
            <li>Joins the presale</li>
            <li>Or reaches the required XP threshold (for example 300+ off-chain XP)</li>
          </ul>
          <p className="faq-answer">
            The backend tracks these reasons as <strong>stake</strong>,{" "}
            <strong>presale</strong>, or <strong>xp</strong>.
          </p>
        </div>

        <div className="faq-item">
          <h3 className="faq-question">What rewards do I get from referrals?</h3>
          <p className="faq-answer">You earn:</p>
          <ul className="faq-answer-list">
            <li>Base Points and XP for each qualified referral</li>
            <li>Extra XP from milestone achievements (like 3, 10, 50 qualified referrals)</li>
          </ul>
          <p className="faq-answer">
            All of this is stored in the XP backend and visible in your profile
            &amp; referral stats.
          </p>
        </div>

        <div className="faq-item">
          <h3 className="faq-question">
            Why can&apos;t I refer myself with my own wallets?
          </h3>
          <p className="faq-answer">
            Self-referrals are blocked. The referral system is designed to
            reward real growth and new users, not multi-account farming.
          </p>
        </div>

        <div className="faq-item">
          <h3 className="faq-question">What is the Referral Leaderboard?</h3>
          <p className="faq-answer">
            It&apos;s a global top list of users with the highest number of
            qualified referrals. Only referrals that actually staked, joined the
            presale, or hit XP milestones count.
          </p>
        </div>
      </section>

      {/* SECTION: SECURITY & WALLETS */}
      <section className="faq-section">
        <h2 className="faq-section-title">Security &amp; Wallets</h2>

        <div className="faq-item">
          <h3 className="faq-question">
            Do you ever ask for my seed phrase or private key?
          </h3>
          <p className="faq-answer">
            Never. You should never share your seed phrase or private key with
            anyone. HeatRush only asks you to sign or send transactions directly
            from your wallet (MetaMask, etc.) like any normal dApp.
          </p>
        </div>

        <div className="faq-item">
          <h3 className="faq-question">How can I verify the contracts?</h3>
          <p className="faq-answer">
            You can always look up the staking, presale, and claim contracts on
            BaseScan and verify addresses from the official site and docs. If a
            link looks suspicious, don&apos;t use it.
          </p>
        </div>

        <div className="faq-item">
          <h3 className="faq-question">Can I use multiple wallets?</h3>
          <p className="faq-answer">
            Yes, but each wallet has its own:
          </p>
          <ul className="faq-answer-list">
            <li>Staking position</li>
            <li>Presale allocation</li>
            <li>XP &amp; Points</li>
            <li>Referrals</li>
          </ul>
          <p className="faq-answer">
            Progress is tracked per address.
          </p>
        </div>
      </section>

      {/* SECTION: NODES (COMING SOON) */}
      <section className="faq-section">
        <h2 className="faq-section-title">Nodes (Coming Soon)</h2>

        <div className="faq-item">
          <h3 className="faq-question">What are HeatRush Nodes?</h3>
          <p className="faq-answer">
            Nodes are high-conviction positions linked to your long-term
            ecosystem activity. Different node types (like Flare Node) offer
            stronger XP multipliers, better access to drops, and deeper
            integration with the HR economy.
          </p>
        </div>

        <div className="faq-item">
          <h3 className="faq-question">
            Can I buy or activate a node right now?
          </h3>
          <p className="faq-answer">
            Not yet. Nodes are still in development and the UI is a preview.
            Once the contracts go live, node activation and rewards will be
            fully on-chain and wired into your existing XP system.
          </p>
        </div>

        <div className="faq-item">
          <h3 className="faq-question">
            Will my current XP and staking matter for nodes?
          </h3>
          <p className="faq-answer">
            Yes. Your staking, presale allocation, referral performance, and XP
            history are all designed to feed into node eligibility and
            multipliers once nodes launch.
          </p>
        </div>
      </section>
    </div>
  );
};

export default FaqPage;
