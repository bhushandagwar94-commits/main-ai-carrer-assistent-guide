import React from "react";
import { careerPrompts, quickStarterChips } from "@/utils/careerPrompts";
import GradientWaves from "./GradientWaves";

export default function AICareerAssistantLanding({ sendCommand, children }) {
  return (
    <>
      <style>{`
        .glass-panel {
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 18px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
        }
        .glass-panel:hover {
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(34, 211, 238, 0.50);
          box-shadow: 0 14px 35px rgba(34, 211, 238, 0.18), inset 0 1px 0 rgba(255,255,255,0.08);
          transform: translateY(-3px);
        }
        .glass-input-wrapper {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }
        .glass-input-wrapper:focus-within {
          border-color: rgba(6, 182, 212, 0.5);
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.15), 0 4px 30px rgba(0, 0, 0, 0.3);
        }
        @keyframes titleShine {
          0% { background-position: 0% center; }
          50% { background-position: 100% center; }
          100% { background-position: 0% center; }
        }
        .premium-saas-heading {
          font-weight: 800;
          letter-spacing: -0.015em;
          font-size: clamp(48px, 5vw, 60px);
          line-height: 1.1;
          background: linear-gradient(90deg, #F8FAFC, #38BDF8, #22D3EE);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
      
      {/* Interactive GradientWaves WebGL Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-auto z-0 opacity-85 overflow-hidden">
        <GradientWaves
          horizonColor="#0B0F17"
          waveColor="#0284C7"
          crestColor="#38BDF8"
          speed={0.4}
          amplitude={2.5}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
          zoom={1.0}
          height={5.5}
          fogDepth={15}
          detail="medium"
          brightness={0.95}
          opacity={0.85}
          mouseInteraction={true}
          parallaxStrength={0.5}
          grain={true}
          grainIntensity={0.04}
        />
      </div>

      <div className="flex flex-col h-full w-full items-center justify-center pt-2 pb-4 overflow-hidden relative z-10">
        <div className="flex flex-col w-full max-w-[900px] px-6 h-full justify-between">
          <div className="flex-1 flex flex-col justify-center max-h-[100%] overflow-hidden">
            {/* Hero Section */}
            <div className="flex flex-col items-center justify-center mb-6 gap-2 text-center mt-2 relative z-10">
              <h1 className="premium-saas-heading m-0 drop-shadow-lg">AI Career Assistant</h1>
              <p className="text-[#CBD5E1] text-[15px] max-w-xl leading-snug font-normal m-0 mt-1 drop-shadow">
                Your personal AI mentor for career guidance, skills analysis,
                resume building, roadmap planning, and interview preparation.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 max-w-[950px] mx-auto w-full relative z-10">
              {careerPrompts.map((feature, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    sendCommand({
                      text: feature.prompt,
                      autoSubmit: true,
                    })
                  }
                  className="glass-panel p-4 flex flex-col items-start justify-center text-left group cursor-pointer h-[120px] m-0"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-[42px] h-[42px] rounded-xl flex items-center justify-center transition-all duration-300"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                      }}
                    >
                      <span className="text-[22px] leading-none">
                        {feature.icon}
                      </span>
                    </div>
                    <span className="text-[#F8FAFC] font-semibold text-[16px] group-hover:text-[#22D3EE] transition-colors leading-tight">
                      {feature.title}
                    </span>
                  </div>
                  <span className="text-[#94A3B8] text-[13px] leading-tight line-clamp-2">
                    {feature.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Starters */}
            <div className="flex flex-col items-center mb-0 relative z-10">
              <div className="flex flex-wrap justify-center gap-3">
                {quickStarterChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      sendCommand({
                        text: chip.prompt,
                        autoSubmit: true,
                      })
                    }
                    className="px-4 py-1.5 rounded-full text-[#CBD5E1] hover:text-[#22D3EE] text-[13px] font-medium transition-all duration-200"
                    style={{
                      background: "rgba(15, 23, 42, 0.65)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(148,163,184,0.25)",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.borderColor =
                        "rgba(34,211,238,0.50)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.borderColor =
                        "rgba(148,163,184,0.25)")
                    }
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Children (e.g. PromptInput) */}
          {children}
        </div>
      </div>
    </>
  );
}
