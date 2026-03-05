import React from "react";

const Footer: React.FC = () => {
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
