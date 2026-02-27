import React, { useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { LuArrowRightLeft } from "react-icons/lu";

const Login = () => {
  return (
    <div className="bg-black h-screen p-4 flex items-center">
      <div className="login-card h-full rounded-4xl w-full z-20 flex flex-col items-center justify-center font-poppins p-4">
        <h1 className="text-3xl md:text-4xl font-semibold text-textPrimary mb-2 text-center animate-slideUp">
          Get Started with Us
        </h1>
        <p
          className="text-textSecondary text-center mb-8 animate-slideUp"
          style={{ animationDelay: "0.1s" }}
        >
          Complete these easy steps to register{" "}
          <br className="hidden md:block" />
          your account.
        </p>
      </div>
      <div className="w-full h-full text-white flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-4">
            <span className="font-bold text-2xl bg-linear-to-b from-secondary to-primary bg-clip-text text-transparent">
              Clara
            </span>
            <LuArrowRightLeft />
            <FcGoogle size={40} />
          </div>
        </div>
        <div className="text-center gap-2 flex flex-col">
          <h2 className="text-xl font-semibold">Sign In your Google Account</h2>
          <p className="text-sm text-gray-400 text-wrap w-96">
            By signing in, you can track your projects, tasks, and progress.
            Let's get started!
          </p>
        </div>
        <hr className="border-gray-700 my-6 w-4/5" />
        <button className="px-6 py-2 border rounded-lg font-medium cursor-pointer hover:bg-primary hover:border-primary duration-300 transition-colors">
          <div className="flex items-center gap-2">
            <FcGoogle size={24} />
            Continue with Google
          </div>
        </button>
      </div>
    </div>
  );
};

export default Login;
