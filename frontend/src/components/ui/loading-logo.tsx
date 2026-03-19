"use client";

import { motion } from "framer-motion";

interface LoadingLogoProps {
    size?: number;
    text?: string;
    fullPage?: boolean;
}

export function LoadingLogo({ size = 80, text = "Loading Flyinco...", fullPage = false }: LoadingLogoProps) {
    const content = (
        <div className="flex flex-col items-center justify-center gap-6">
            <div className="relative flex items-center justify-center">
                {/* Outermost Rotating Ring */}
                <motion.div
                    className="absolute rounded-full border-t-2 border-r-2 border-[#6C2BD9]"
                    style={{ width: size + 20, height: size + 20 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Second Pulsing Ring */}
                <motion.div
                    className="absolute rounded-full border-2 border-[#2E0A57]/10"
                    style={{ width: size + 10, height: size + 10 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Logo Image in Center */}
                <div 
                    className="bg-white rounded-full p-2 shadow-xl border border-gray-50 flex items-center justify-center overflow-hidden"
                    style={{ width: size, height: size }}
                >
                    <motion.img 
                        src="/icon.png" 
                        alt="Flyinco" 
                        className="w-full h-full object-contain"
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
            </div>
            
            {text && (
                <div className="text-center">
                    <p className="text-sm font-black text-[#2E0A57] tracking-widest uppercase animate-pulse">
                        {text}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium tracking-tight">
                        Please wait while we secure your data
                    </p>
                </div>
            )}
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-gray-100/50"
                >
                    {content}
                </motion.div>
            </div>
        );
    }

    return content;
}
