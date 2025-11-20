import React, { useState } from "react";

const FAQ_ITEMS = [
  {
    id: 1,
    q: "What is HeatRush Staking?",
    a: `HeatRush Staking is an on-chain Base staking system where users deposit ETH.
Future $HR rewards will be distributed based on staking participation.`,
  },
  {
    id: 2,
    q: "Where do my funds go?",
    a: `All ETH deposits go directly to the official HeatRush contract wallet on Base.
Everything is transparent and verified on-chain.`,
  },
  {
    id: 3,
    q: "When will unstaking be available?",
    a: `Unstaking and claim functions will be activated in later phases as the protocol evolves.`,
  },
  {
    id: 4,
    q: "Is this non-custodial?",
    a: `Yes — HeatRush is fully non-custodial. Users always control their wallets, and smart contracts
manage funds according to on-chain logic only.`,
  },
  {
    id: 5,
    q: "What network is used?",
    a: `HeatRush Staking operates on Base Mainnet. Always ensure your wallet is set to Base
when interacting with the protocol.`,
  },
];

const FaqSection = () => {
  const [openFAQ, setOpenFAQ] = useState(null);
  const toggleFAQ = (id) => setOpenFAQ(openFAQ === id ? null : id);

  return (
    <div className="faq-section">
      <h2>
        <span className="orange">HeatRush FAQ</span>
      </h2>

      {FAQ_ITEMS.map(({ id, q, a }) => (
        <div className="faq-item" key={id}>
          <button className="faq-question" onClick={() => toggleFAQ(id)}>
            {q}
            <span>{openFAQ === id ? "-" : "+"}</span>
          </button>
          <div className={`faq-answer ${openFAQ === id ? "open" : ""}`}>
            {a}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FaqSection;
