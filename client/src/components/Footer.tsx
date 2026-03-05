import React from "react";
import { useLocation } from "wouter";

const Footer: React.FC = () => {
    const [location] = useLocation();
    const isGamerPage = location.startsWith("/student/") || location.startsWith("/ranking/");

    if (isGamerPage) {
        return (
            <footer className="w-full py-6 mt-auto border-t border-emerald-500/20 bg-[#0a0a0c] relative overflow-hidden">
                {/* Gamer Glow Effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

                <div className="container mx-auto px-4 text-center relative z-10">
                    <p className="text-[10px] sm:text-[11px] font-black text-emerald-500/60 tracking-[0.2em] uppercase font-mono">
                        Ranking Escolar — desenvolvido por{" "}
                        <a
                            href="https://br.linkedin.com/in/gabriel-eduardo-almeida"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-200 transition-all duration-300 hover:drop-shadow-[0_0_10px_rgba(52,211,153,0.7)] hover:tracking-[0.25em]"
                        >
                            Gabriel Eduardo Almeida
                        </a>
                    </p>
                </div>
            </footer>
        );
    }

    return (
        <footer className="w-full py-4 mt-auto border-t border-slate-100/50 bg-white/50 backdrop-blur-sm">
            <div className="container mx-auto px-4 text-center">
                <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 tracking-wide uppercase">
                    Ranking Escolar — desenvolvido pelo{" "}
                    <a
                        href="https://br.linkedin.com/in/gabriel-eduardo-almeida"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary/70 hover:text-primary transition-colors hover:underline decoration-1 underline-offset-2"
                    >
                        Professor Gabriel Eduardo Almeida
                    </a>
                </p>
            </div>
        </footer>
    );
};

export default Footer;
