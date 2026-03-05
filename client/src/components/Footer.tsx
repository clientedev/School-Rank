import React from "react";
import { useLocation } from "wouter";

const Footer: React.FC = () => {
    const [location] = useLocation();
    const isStudentPage = location.startsWith("/student/");

    if (isStudentPage) {
        return (
            <footer className="w-full py-4 mt-auto border-t border-emerald-500/20 bg-slate-950 shadow-[0_-4px_20px_rgba(16,185,129,0.1)]">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-[10px] sm:text-[11px] font-bold text-emerald-500/70 tracking-[0.15em] uppercase font-mono">
                        Ranking Escolar — desenvolvido por{" "}
                        <a
                            href="https://br.linkedin.com/in/gabriel-eduardo-almeida"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 transition-all hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] decoration-emerald-500/50 underline-offset-4"
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
