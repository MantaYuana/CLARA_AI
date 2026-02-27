import { useEffect } from "react";
// Pastikan path import HomeHero sesuai jika kamu masih menggunakannya di luar komponen ini
import HomeHero from "../components/ui/HomeHero";

export default function LandingPage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/finisher-header.es5.min.js";
    script.async = true;

    script.onload = () => {
      if (window.FinisherHeader) {
        new window.FinisherHeader({
          count: 6,
          size: {
            min: 1300,
            max: 1500,
            pulse: 0,
          },
          speed: {
            x: { min: 0.6, max: 2 },
            y: { min: 0.6, max: 2 },
          },
          colors: {
            background: "#000000",
            particles: ["#3b004d", "#56076e"],
          },
          blending: "lighten",
          opacity: {
            center: 0.6,
            edge: 0,
          },
          skew: 0,
          shapes: ["c"],
        });
      }
    };

    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector(
        'script[src="/finisher-header.es5.min.js"]',
      );
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-black overflow-hidden font-sans">
      <div className="header relative z-10 finisher-header flex flex-col w-full justify-center items-center min-h-screen px-4 md:px-6 m-0">
        {/* Badge: Welcome to Clara */}
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
          <span className="text-sm font-medium text-gray-300">Welcome to</span>
          <span className="text-sm font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Clara.
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[80px] text-white font-bold max-w-5xl text-center tracking-tight leading-[1.1] md:leading-[1.05]">
          Contract & Legal <br className="hidden md:block" /> AI Reasoning
          Assistant
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-5xl text-center text-gray-400 text-sm md:text-lg leading-relaxed">
          Discover how to create legal contracts with AI. Clara is your
          intelligent assistant for analyzing, drafting, and understanding legal
          documents. Experience the future of legal work with Clara's powerful
          AI capabilities.
        </p>
      </div>

      <div className="bg-black min-h-screen flex justify-between items-center px-8">
        <div className="w-full flex flex-col items-center text-center pt-16 pb-10 px-4 animate-fadeIn">
          <h1 className="text-2xl md:text-5xl text-white font-bold max-w-xl text-start tracking-tight leading-[1.1] md:leading-[1.05]">
            Upload & Analyze{"  "}
            <span className="font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Document
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-left text-textSecondary text-sm md:text-lg leading-relaxed">
            Securely upload your legal documents to our platform for instant
            processing. Our advanced AI instantly scans the text to extract key
            clauses, terms, and critical data points. This allows you to quickly
            grasp the core elements of any contract without spending hours
            reading. Streamline your workflow by letting the system handle the
            initial heavy lifting of document comprehension.
          </p>
        </div>
        <div className="w-full">
          <div className="w-full">
            <img
              src="/src/assets/first-feature.png"
              alt="Document Analysis"
              className="w-full h-auto mt-4 rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="bg-black min-h-screen flex justify-between items-center px-8">
        <div className="w-full">
          <div className="w-full">
            <img
              src="/src/assets/second-feature.png"
              alt="Document Analysis"
              className="w-full h-auto mt-4 rounded-lg shadow-lg"
            />
          </div>
        </div>
        <div className="w-full flex flex-col items-center text-center pt-16 pb-10 px-4 animate-fadeIn">
          <h1 className="text-2xl md:text-5xl text-white font-bold max-w-xl text-start tracking-tight leading-[1.1] md:leading-[1.05]">
            Make a Review from{"  "}
            <span className="font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Document
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-left text-textSecondary text-sm md:text-lg leading-relaxed">
            Transform complex legal text into clear, actionable insights with a
            comprehensive AI-driven review. The system meticulously evaluates
            your uploaded documents to identify potential risks, missing
            clauses, or unfavorable terms. You will receive a detailed summary
            highlighting areas of concern and recommendations for improvement.
            This ensures your agreements are secure, compliant, and perfectly
            aligned with your best interests.
          </p>
        </div>
      </div>

      <div className="bg-black min-h-screen flex justify-between items-center px-8">
        <div className="w-full flex flex-col items-center text-center pt-16 pb-10 px-4 animate-fadeIn">
          <h1 className="text-2xl md:text-5xl text-white font-bold max-w-xl text-start tracking-tight leading-[1.1] md:leading-[1.05]">
            Create Draft Contract with {"  "}
            <span className="font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              AI Asisstant
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-left text-textSecondary text-sm md:text-lg leading-relaxed">
            Instantly generate customized legal contracts tailored to your
            specific needs using our intelligent AI assistant. Simply provide
            your core requirements, and the system will draft a professional,
            well-structured document in minutes. This drastically reduces the
            time and cost associated with traditional contract creation from
            scratch. You can then easily refine and edit the draft to ensure it
            meets all your exact specifications.
          </p>
        </div>
        <div className="w-full">
          <div className="w-full">
            <img
              src="/src/assets/third-feature.png"
              alt="Document Analysis"
              className="w-full h-auto mt-4 rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="header relative z-10 finisher-header flex flex-col w-full justify-center items-center min-h-screen px-4 md:px-6 m-0">
        <div className="flex flex-col items-center text-center px-4 animate-fadeIn">
          <h1 className="text-3xl md:text-4xl font-bold mt-4 dark:text-textPrimary leading-tight">
            Let's Get Started with{" "}
            <span className="bg-linear-to-b from-secondary to-primary bg-clip-text text-transparent">
              Clara.
            </span>
          </h1>
        </div>
        <div className="mt-4 w-full max-w-2xl backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center shadow-2xl transition-all hover:border-white/20">
          {/* Attachment Button */}
          <button className="p-3 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-white/5 cursor-default">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </button>

          {/* Input Field */}
          <input
            type="text"
            placeholder="How to create legal contract with ai..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 px-2 text-sm md:text-base"
            readOnly
          />

          {/* Send Button */}
          <button className="p-3 bg-[#7C3AED] rounded-xl text-white hover:bg-[#6D28D9] transition-colors shadow-[0_0_15px_rgba(124,58,237,0.4)] cursor-default">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
